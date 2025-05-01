import express, { type Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import {
  loginSchema,
  insertTeacherSchema,
  insertClassSchema,
  insertStudentSchema,
  insertAttendanceRecordSchema,
  insertSheetsIntegrationSchema
} from "@shared/schema";
import session from 'express-session';
import memorystore from 'memorystore';
import { z } from "zod";
import {
  getGoogleAuthUrl,
  exchangeCodeForTokens,
  createAttendanceSpreadsheet,
  directSaveStudentToSheet,
  directSaveAttendanceToSheet,
  appendAttendanceData,
  appendStudentData,
  refreshAccessToken
} from "./googleApi";

const MemoryStore = memorystore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(
    session({
      cookie: { maxAge: 86400000 }, // 1 day
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
      resave: false,
      secret: process.env.SESSION_SECRET || "school-attendance-secret",
      saveUninitialized: false,
    })
  );

  // Middleware to check if user is authenticated
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.session && req.session.teacherId) {
      return next();
    }
    return res.status(401).json({ message: "Unauthorized" });
  };

  // AUTH ROUTES
  app.post("/api/auth/login", async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      const teacher = await storage.authenticateTeacher(credentials);
      
      if (!teacher) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store teacher in session
      req.session.teacherId = teacher.id;
      
      // Return teacher without password
      const { password, ...teacherWithoutPassword } = teacher;
      res.json(teacherWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", isAuthenticated, async (req, res) => {
    try {
      const teacher = await storage.getTeacher(req.session.teacherId as number);
      
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      
      // Return teacher without password
      const { password, ...teacherWithoutPassword } = teacher;
      res.json(teacherWithoutPassword);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // TEACHER ROUTES
  app.post("/api/teachers", async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const teacher = await storage.createTeacher(teacherData);
      
      // Return teacher without password
      const { password, ...teacherWithoutPassword } = teacher;
      res.status(201).json(teacherWithoutPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // CLASS ROUTES
  app.get("/api/classes", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.session.teacherId as number;
      const classes = await storage.getClassesByTeacher(teacherId);
      res.json(classes);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/classes", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.session.teacherId as number;
      const classData = insertClassSchema.parse({
        ...req.body,
        teacherId
      });
      
      const newClass = await storage.createClass(classData);
      res.status(201).json(newClass);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/classes/:id", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if the class belongs to the authenticated teacher
      if (classData.teacherId !== req.session.teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      res.json(classData);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // STUDENT ROUTES
  app.get("/api/classes/:id/students", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const classData = await storage.getClass(classId);
      
      if (!classData) {
        return res.status(404).json({ message: "Class not found" });
      }
      
      // Check if the class belongs to the authenticated teacher
      if (classData.teacherId !== req.session.teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const students = await storage.getStudentsByClass(classId);
      res.json(students);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const teacherId = req.session.teacherId as number;
      
      // Check if the class belongs to the authenticated teacher
      const classData = await storage.getClass(studentData.classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Create student in local storage
      const student = await storage.createStudent(studentData);
      
      // Using Google Sheets API requires authentication and API keys, which you mentioned you want to avoid
      // Student data is saved locally and will be available for CSV export
      
      res.status(201).json(student);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  // ATTENDANCE ROUTES
  app.get("/api/classes/:id/attendance", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const dateParam = req.query.date as string;
      
      // Validate class exists and belongs to teacher
      const classData = await storage.getClass(classId);
      if (!classData || classData.teacherId !== req.session.teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Parse date parameter or use current date
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const records = await storage.getAttendanceByClassAndDate(classId, date);
      res.json(records);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/attendance", isAuthenticated, async (req, res) => {
    try {
      const recordData = insertAttendanceRecordSchema.parse(req.body);
      
      // Check if the class belongs to the authenticated teacher
      const classData = await storage.getClass(recordData.classId);
      if (!classData || classData.teacherId !== req.session.teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const record = await storage.createAttendanceRecord(recordData);
      
      // Using Google Sheets API requires authentication and API keys, which you mentioned you want to avoid
      // Attendance data is saved locally and will be available for CSV export
      
      res.status(201).json(record);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: err.errors 
        });
      }
      res.status(500).json({ message: "Server error" });
    }
  });

  app.put("/api/attendance/:id", isAuthenticated, async (req, res) => {
    try {
      const recordId = parseInt(req.params.id);
      const { status } = req.body;
      const teacherId = req.session.teacherId as number;
      
      if (!status || !["present", "absent", "late"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get the record to verify ownership
      const record = await storage.getAttendanceRecord(recordId);
      if (!record) {
        return res.status(404).json({ message: "Record not found" });
      }
      
      // Check if the class belongs to the authenticated teacher
      const classData = await storage.getClass(record.classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      const updatedRecord = await storage.updateAttendanceRecord(recordId, status);
      
      // Using Google Sheets API requires authentication and API keys, which you mentioned you want to avoid
      // Updated attendance data is saved locally and will be available for CSV export
      
      res.json(updatedRecord);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.get("/api/classes/:id/stats", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const dateParam = req.query.date as string;
      
      // Validate class exists and belongs to teacher
      const classData = await storage.getClass(classId);
      if (!classData || classData.teacherId !== req.session.teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Parse date parameter or use current date
      const date = dateParam ? new Date(dateParam) : new Date();
      
      const stats = await storage.getAttendanceStats(classId, date);
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  // CSV EXPORT ROUTES
  app.get("/api/export/students/:classId", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const teacherId = req.session.teacherId as number;
      
      // Validate class exists and belongs to teacher
      const classData = await storage.getClass(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get students for class
      const students = await storage.getStudentsByClass(classId);
      
      // Generate CSV content
      let csvContent = "Student ID,Name,Email,Phone,Address,Class ID\n";
      
      students.forEach(student => {
        // Escape fields that might contain commas
        const escapedName = student.name.includes(',') ? `"${student.name}"` : student.name;
        const escapedEmail = student.email?.includes(',') ? `"${student.email}"` : student.email || '';
        const escapedPhone = student.contactPhone?.includes(',') ? `"${student.contactPhone}"` : student.contactPhone || '';
        const escapedAddress = student.address?.includes(',') ? `"${student.address}"` : student.address || '';
        
        csvContent += `${student.studentId},${escapedName},${escapedEmail},${escapedPhone},${escapedAddress},${student.classId}\n`;
      });
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=students_class_${classId}.csv`);
      
      res.send(csvContent);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });
  
  app.get("/api/export/attendance/:classId", isAuthenticated, async (req, res) => {
    try {
      const classId = parseInt(req.params.classId);
      const dateParam = req.query.date as string;
      const teacherId = req.session.teacherId as number;
      
      // Validate class exists and belongs to teacher
      const classData = await storage.getClass(classId);
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Parse date parameter or use current date
      const date = dateParam ? new Date(dateParam) : new Date();
      const dateStr = date.toISOString().split('T')[0];
      
      // Get attendance records
      const records = await storage.getAttendanceByClassAndDate(classId, date);
      
      // Generate CSV content
      let csvContent = "Date,Class,Student ID,Name,Status\n";
      
      // Collect all student info for the records
      for (const record of records) {
        const student = await storage.getStudent(record.studentId);
        if (student) {
          // Escape name if it contains commas
          const escapedName = student.name.includes(',') ? `"${student.name}"` : student.name;
          
          csvContent += `${dateStr},${classData.name},${student.studentId},${escapedName},${record.status}\n`;
        }
      }
      
      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=attendance_class_${classId}_${dateStr}.csv`);
      
      res.send(csvContent);
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
