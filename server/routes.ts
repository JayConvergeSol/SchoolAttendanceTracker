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
      
      // ALWAYS use the predefined spreadsheet ID for Google Sheets
      // This ensures we're using your specific spreadsheet instead of integration details
      try {
        // Hard-coded spreadsheet ID from your Google Sheet
        const spreadsheetId = "1EaKPNOEagOcKUJ269rahOAmQDihl-lb4ol4fQbLrxvY";
        
        // Try to get integration for OAuth tokens
        const integration = await storage.getSheetsIntegration(teacherId);
        
        // If integration exists, use its tokens
        if (integration && integration.accessToken) {
          // Create a temporary integration object with the hardcoded spreadsheet ID
          const tempIntegration = {
            ...integration,
            sheetId: spreadsheetId
          };
          
          // Format student for Google Sheets
          await appendStudentData(tempIntegration, [{
            id: student.id,
            studentId: student.studentId,
            name: student.name,
            email: student.email,
            contactPhone: student.contactPhone,
            address: student.address,
            classId: student.classId,
            // These fields are added to match the Student schema
            avatar: null,
            contactInfo: {}
          }]);
          console.log('Student data saved to Google Sheets with ID:', spreadsheetId);
        } else {
          console.log('Google integration not set up yet - student saved to local storage only');
          // We need to direct the user to set up Google integration in the Settings
        }
      } catch (sheetErr) {
        console.error('Failed to save student to Google Sheets:', sheetErr);
        // Continue even if Google Sheets fails - we've already saved to local storage
      }
      
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
      
      // ALWAYS use the predefined spreadsheet ID for Google Sheets
      try {
        // Hard-coded spreadsheet ID from your Google Sheet
        const spreadsheetId = "1EaKPNOEagOcKUJ269rahOAmQDihl-lb4ol4fQbLrxvY";
        const teacherId = req.session.teacherId as number;
        
        // Try to get integration for OAuth tokens
        const integration = await storage.getSheetsIntegration(teacherId);
        
        // If integration exists, use its tokens
        if (integration && integration.accessToken) {
          const student = await storage.getStudent(recordData.studentId);
          if (student) {
            // Format date for Google Sheets
            const dateStr = new Date(recordData.date).toISOString().split('T')[0];
            
            // Create a temporary integration object with the hardcoded spreadsheet ID
            const tempIntegration = {
              ...integration,
              sheetId: spreadsheetId
            };
            
            // Append to Google Sheet
            await appendAttendanceData(
              tempIntegration,
              dateStr,
              classData.name,
              [{
                studentId: student.studentId,
                name: student.name,
                status: recordData.status
              }]
            );
            console.log('Attendance data saved to Google Sheets with ID:', spreadsheetId);
          }
        } else {
          console.log('Google integration not set up yet - attendance saved to local storage only');
        }
      } catch (sheetErr) {
        console.error('Failed to save attendance to Google Sheets:', sheetErr);
        // Continue even if Google Sheets fails - we've already saved to local storage
      }
      
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
      
      // Try to update in Google Sheets if integration exists
      const integration = await storage.getSheetsIntegration(teacherId);
      if (integration && integration.accessToken) {
        const student = await storage.getStudent(record.studentId);
        if (student) {
          // Format date for Google Sheets
          const dateStr = new Date(record.date).toISOString().split('T')[0];
          
          // Append to Google Sheet (this actually adds another record rather than updating)
          // Google Sheets doesn't have a simple update API, so we append a new record
          await appendAttendanceData(
            integration,
            dateStr,
            classData.name,
            [{
              studentId: student.studentId,
              name: student.name,
              status: status
            }]
          );
        }
      }
      
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

  // GOOGLE SHEETS INTEGRATION ROUTES
  app.get("/api/google/auth-url", isAuthenticated, (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return res.status(500).json({ message: "Google Client ID not configured" });
    }
    
    // Get all domains from environment variable
    const domains = (process.env.REPLIT_DOMAINS || "").split(",")[0];
    const redirectUri = `https://${domains}/api/google/callback`;
    
    const url = getGoogleAuthUrl(clientId, redirectUri);
    res.json({ url });
  });

  app.get("/api/google/callback", isAuthenticated, async (req, res) => {
    try {
      const { code } = req.query;
      const teacherId = req.session.teacherId as number;
      
      if (!code || typeof code !== "string") {
        return res.status(400).json({ message: "Missing authorization code" });
      }
      
      const clientId = process.env.GOOGLE_CLIENT_ID;
      const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
      
      if (!clientId || !clientSecret) {
        return res.status(500).json({ message: "Google credentials not configured" });
      }
      
      // Get all domains from environment variable
      const domains = (process.env.REPLIT_DOMAINS || "").split(",")[0];
      const redirectUri = `https://${domains}/api/google/callback`;
      
      // Exchange code for tokens
      const tokens = await exchangeCodeForTokens(code, clientId, clientSecret, redirectUri);
      
      if (!tokens) {
        return res.status(500).json({ message: "Failed to exchange code for tokens" });
      }
      
      // Use the predefined spreadsheet for the teacher
      const spreadsheetId = await createAttendanceSpreadsheet(
        tokens.accessToken,
        "School Attendance Tracker"
      );
      
      if (!spreadsheetId) {
        return res.status(500).json({ message: "Failed to access spreadsheet" });
      }
      
      // Save integration details
      const integration = await storage.getSheetsIntegration(teacherId);
      
      if (integration) {
        // Update existing integration
        await storage.updateSheetsIntegration(
          integration.id,
          tokens.accessToken,
          tokens.refreshToken
        );
      } else {
        // Create new integration
        await storage.createSheetsIntegration({
          teacherId,
          sheetId: spreadsheetId,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken
        });
      }
      
      // Redirect to settings page with success message
      res.redirect('/#/settings?integration=success');
    } catch (err) {
      console.error("Google callback error:", err);
      res.redirect('/#/settings?integration=error');
    }
  });

  app.post("/api/google/export-students", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.session.teacherId as number;
      const { classId } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID required" });
      }
      
      // Check if class belongs to teacher
      const classData = await storage.getClass(parseInt(classId));
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get integration info
      const integration = await storage.getSheetsIntegration(teacherId);
      if (!integration) {
        return res.status(404).json({ message: "Google Sheets integration not found" });
      }
      
      // Get students for class
      const students = await storage.getStudentsByClass(parseInt(classId));
      
      // Export to Google Sheets - students array matches our updated interface
      const success = await appendStudentData(integration, students);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to export student data" });
      }
      
      res.json({ message: "Students exported successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/google/export-attendance", isAuthenticated, async (req, res) => {
    try {
      const teacherId = req.session.teacherId as number;
      const { classId, date } = req.body;
      
      if (!classId) {
        return res.status(400).json({ message: "Class ID required" });
      }
      
      // Check if class belongs to teacher
      const classData = await storage.getClass(parseInt(classId));
      if (!classData || classData.teacherId !== teacherId) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Get integration info
      const integration = await storage.getSheetsIntegration(teacherId);
      if (!integration) {
        return res.status(404).json({ message: "Google Sheets integration not found" });
      }
      
      // Parse date or use current date
      const attendanceDate = date ? new Date(date) : new Date();
      const dateStr = attendanceDate.toISOString().split('T')[0];
      
      // Get attendance records
      const records = await storage.getAttendanceByClassAndDate(parseInt(classId), attendanceDate);
      
      // Map attendance records to format needed for Google Sheets
      const attendanceData = await Promise.all(
        records.map(async (record) => {
          const student = await storage.getStudent(record.studentId);
          return {
            studentId: student?.studentId || '',
            name: student?.name || '',
            status: record.status
          };
        })
      );
      
      // Export to Google Sheets
      const success = await appendAttendanceData(
        integration,
        dateStr,
        classData.name,
        attendanceData
      );
      
      if (!success) {
        return res.status(500).json({ message: "Failed to export attendance data" });
      }
      
      res.json({ message: "Attendance exported successfully" });
    } catch (err) {
      res.status(500).json({ message: "Server error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
