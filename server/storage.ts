import { 
  teachers, Teacher, InsertTeacher,
  classes, Class, InsertClass,
  students, Student, InsertStudent,
  attendanceRecords, AttendanceRecord, InsertAttendanceRecord,
  sheetsIntegration, SheetsIntegration, InsertSheetsIntegration,
  AttendanceStats
} from "@shared/schema";
import { LoginCredentials } from "@shared/schema";

export interface IStorage {
  // Teacher methods
  getTeacher(id: number): Promise<Teacher | undefined>;
  getTeacherByUsername(username: string): Promise<Teacher | undefined>;
  createTeacher(teacher: InsertTeacher): Promise<Teacher>;
  authenticateTeacher(credentials: LoginCredentials): Promise<Teacher | undefined>;
  
  // Class methods
  getClass(id: number): Promise<Class | undefined>;
  getClassesByTeacher(teacherId: number): Promise<Class[]>;
  createClass(classData: InsertClass): Promise<Class>;
  
  // Student methods
  getStudent(id: number): Promise<Student | undefined>;
  getStudentsByClass(classId: number): Promise<Student[]>;
  createStudent(student: InsertStudent): Promise<Student>;
  
  // Attendance methods
  getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined>;
  getAttendanceByClassAndDate(classId: number, date: Date): Promise<AttendanceRecord[]>;
  getAttendanceByStudent(studentId: number): Promise<AttendanceRecord[]>;
  createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord>;
  updateAttendanceRecord(id: number, status: string): Promise<AttendanceRecord | undefined>;
  getAttendanceStats(classId: number, date: Date): Promise<AttendanceStats>;
  
  // Google Sheets methods
  getSheetsIntegration(teacherId: number): Promise<SheetsIntegration | undefined>;
  createSheetsIntegration(integration: InsertSheetsIntegration): Promise<SheetsIntegration>;
  updateSheetsIntegration(id: number, accessToken: string, refreshToken: string): Promise<SheetsIntegration | undefined>;
}

export class MemStorage implements IStorage {
  private teachers: Map<number, Teacher>;
  private classes: Map<number, Class>;
  private students: Map<number, Student>;
  private attendanceRecords: Map<number, AttendanceRecord>;
  private sheetsIntegrations: Map<number, SheetsIntegration>;
  
  private teacherIdCounter: number;
  private classIdCounter: number;
  private studentIdCounter: number;
  private attendanceIdCounter: number;
  private sheetsIntegrationIdCounter: number;

  constructor() {
    this.teachers = new Map();
    this.classes = new Map();
    this.students = new Map();
    this.attendanceRecords = new Map();
    this.sheetsIntegrations = new Map();
    
    this.teacherIdCounter = 1;
    this.classIdCounter = 1;
    this.studentIdCounter = 1;
    this.attendanceIdCounter = 1;
    this.sheetsIntegrationIdCounter = 1;

    // Add a default teacher for testing
    this.createTeacher({
      username: "teacher",
      password: "password",
      name: "Sarah Taylor",
      email: "sarah@example.com",
      role: "Mathematics Teacher",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    // Add some test classes
    const class1Id = this.createClass({
      name: "Mathematics",
      grade: "Grade 10",
      room: "201",
      teacherId: 1
    }).id;

    const class2Id = this.createClass({
      name: "Mathematics",
      grade: "Grade 9",
      room: "105",
      teacherId: 1
    }).id;

    const class3Id = this.createClass({
      name: "Mathematics",
      grade: "Grade 11",
      room: "301",
      teacherId: 1
    }).id;

    // Add some test students
    this.createStudent({
      studentId: "STU1001",
      name: "John Smith",
      email: "johnsmith@email.com",
      contactPhone: "123-456-7890",
      address: "123 Main St",
      classId: class1Id,
      contactInfo: { parent: "Mary Smith", emergency: "555-123-4567" },
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    this.createStudent({
      studentId: "STU1002",
      name: "Emma Johnson",
      email: "emmaj@email.com",
      contactPhone: "123-456-7891",
      address: "456 Elm St",
      classId: class1Id,
      contactInfo: { parent: "James Johnson", emergency: "555-234-5678" },
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    this.createStudent({
      studentId: "STU1003",
      name: "Michael Brown",
      email: "michaelb@email.com",
      contactPhone: "123-456-7892",
      address: "789 Oak St",
      classId: class1Id,
      contactInfo: { parent: "Susan Brown", emergency: "555-345-6789" },
      avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
    });

    // Create some sample attendance records for today and yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Yesterday's attendance
    this.createAttendanceRecord({
      date: yesterday,
      studentId: 1,
      classId: class1Id,
      status: "present",
      notes: ""
    });

    this.createAttendanceRecord({
      date: yesterday,
      studentId: 2,
      classId: class1Id,
      status: "late",
      notes: "10 minutes late"
    });

    this.createAttendanceRecord({
      date: yesterday,
      studentId: 3,
      classId: class1Id,
      status: "absent",
      notes: "No notification received"
    });

    // Today's attendance
    this.createAttendanceRecord({
      date: today,
      studentId: 1,
      classId: class1Id,
      status: "present",
      notes: ""
    });

    this.createAttendanceRecord({
      date: today,
      studentId: 2,
      classId: class1Id,
      status: "late",
      notes: "5 minutes late"
    });

    this.createAttendanceRecord({
      date: today,
      studentId: 3,
      classId: class1Id,
      status: "absent",
      notes: "Parent called"
    });
  }

  // Teacher methods
  async getTeacher(id: number): Promise<Teacher | undefined> {
    return this.teachers.get(id);
  }

  async getTeacherByUsername(username: string): Promise<Teacher | undefined> {
    return Array.from(this.teachers.values()).find(
      (teacher) => teacher.username === username,
    );
  }

  async createTeacher(teacher: InsertTeacher): Promise<Teacher> {
    const id = this.teacherIdCounter++;
    const newTeacher: Teacher = { ...teacher, id };
    this.teachers.set(id, newTeacher);
    return newTeacher;
  }

  async authenticateTeacher(credentials: LoginCredentials): Promise<Teacher | undefined> {
    const teacher = await this.getTeacherByUsername(credentials.username);
    if (teacher && teacher.password === credentials.password) {
      return teacher;
    }
    return undefined;
  }

  // Class methods
  async getClass(id: number): Promise<Class | undefined> {
    return this.classes.get(id);
  }

  async getClassesByTeacher(teacherId: number): Promise<Class[]> {
    return Array.from(this.classes.values()).filter(
      (cls) => cls.teacherId === teacherId,
    );
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const id = this.classIdCounter++;
    const newClass: Class = { ...classData, id };
    this.classes.set(id, newClass);
    return newClass;
  }

  // Student methods
  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentsByClass(classId: number): Promise<Student[]> {
    return Array.from(this.students.values()).filter(
      (student) => student.classId === classId,
    );
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  // Attendance methods
  async getAttendanceRecord(id: number): Promise<AttendanceRecord | undefined> {
    return this.attendanceRecords.get(id);
  }

  async getAttendanceByClassAndDate(classId: number, date: Date): Promise<AttendanceRecord[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => {
        return record.classId === classId && 
               record.date >= startOfDay && 
               record.date <= endOfDay;
      }
    );
  }

  async getAttendanceByStudent(studentId: number): Promise<AttendanceRecord[]> {
    return Array.from(this.attendanceRecords.values()).filter(
      (record) => record.studentId === studentId,
    );
  }

  async createAttendanceRecord(record: InsertAttendanceRecord): Promise<AttendanceRecord> {
    const id = this.attendanceIdCounter++;
    const newRecord: AttendanceRecord = { ...record, id };
    this.attendanceRecords.set(id, newRecord);
    return newRecord;
  }

  async updateAttendanceRecord(id: number, status: string): Promise<AttendanceRecord | undefined> {
    const record = this.attendanceRecords.get(id);
    if (record) {
      const updatedRecord = { ...record, status };
      this.attendanceRecords.set(id, updatedRecord);
      return updatedRecord;
    }
    return undefined;
  }

  async getAttendanceStats(classId: number, date: Date): Promise<AttendanceStats> {
    const records = await this.getAttendanceByClassAndDate(classId, date);
    const students = await this.getStudentsByClass(classId);
    
    const present = records.filter(r => r.status === "present").length;
    const absent = records.filter(r => r.status === "absent").length;
    const late = records.filter(r => r.status === "late").length;
    
    return {
      totalStudents: students.length,
      present,
      absent,
      late
    };
  }

  // Google Sheets methods
  async getSheetsIntegration(teacherId: number): Promise<SheetsIntegration | undefined> {
    return Array.from(this.sheetsIntegrations.values()).find(
      (integration) => integration.teacherId === teacherId,
    );
  }

  async createSheetsIntegration(integration: InsertSheetsIntegration): Promise<SheetsIntegration> {
    const id = this.sheetsIntegrationIdCounter++;
    const newIntegration: SheetsIntegration = { ...integration, id };
    this.sheetsIntegrations.set(id, newIntegration);
    return newIntegration;
  }

  async updateSheetsIntegration(id: number, accessToken: string, refreshToken: string): Promise<SheetsIntegration | undefined> {
    const integration = this.sheetsIntegrations.get(id);
    if (integration) {
      const updatedIntegration = { 
        ...integration, 
        accessToken, 
        refreshToken 
      };
      this.sheetsIntegrations.set(id, updatedIntegration);
      return updatedIntegration;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
