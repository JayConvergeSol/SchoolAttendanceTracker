import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Teachers
export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  role: text("role"),
  avatar: text("avatar"),
});

export const insertTeacherSchema = createInsertSchema(teachers).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  role: true,
  avatar: true,
});

export type InsertTeacher = z.infer<typeof insertTeacherSchema>;
export type Teacher = typeof teachers.$inferSelect;

// Classes
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  grade: text("grade").notNull(),
  room: text("room"),
  teacherId: integer("teacher_id").notNull(),
});

export const insertClassSchema = createInsertSchema(classes).pick({
  name: true,
  grade: true,
  room: true,
  teacherId: true,
});

export type InsertClass = z.infer<typeof insertClassSchema>;
export type Class = typeof classes.$inferSelect;

// Students
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  studentId: text("student_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email"),
  contactPhone: text("contact_phone"),
  address: text("address"),
  classId: integer("class_id").notNull(),
  contactInfo: json("contact_info"),
  avatar: text("avatar"),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  studentId: true,
  name: true,
  email: true,
  contactPhone: true,
  address: true,
  classId: true,
  contactInfo: true,
  avatar: true,
});

export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Student = typeof students.$inferSelect;

// Attendance Records
export const attendanceRecords = pgTable("attendance_records", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  studentId: integer("student_id").notNull(),
  classId: integer("class_id").notNull(),
  status: text("status").notNull(), // "present", "absent", "late"
  notes: text("notes"),
});

export const insertAttendanceRecordSchema = createInsertSchema(attendanceRecords).pick({
  date: true,
  studentId: true,
  classId: true,
  status: true,
  notes: true,
});

export type InsertAttendanceRecord = z.infer<typeof insertAttendanceRecordSchema>;
export type AttendanceRecord = typeof attendanceRecords.$inferSelect;

// Google Sheets Integration
export const sheetsIntegration = pgTable("sheets_integration", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  sheetId: text("sheet_id").notNull(),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
});

export const insertSheetsIntegrationSchema = createInsertSchema(sheetsIntegration).pick({
  teacherId: true,
  sheetId: true,
  accessToken: true,
  refreshToken: true,
});

export type InsertSheetsIntegration = z.infer<typeof insertSheetsIntegrationSchema>;
export type SheetsIntegration = typeof sheetsIntegration.$inferSelect;

// Login Schema
export const loginSchema = z.object({
  username: z.string().min(3, { message: "Username must be at least 3 characters" }),
  password: z.string().min(4, { message: "Password must be at least 4 characters" }),
});

export type LoginCredentials = z.infer<typeof loginSchema>;

// Attendance Status Type
export const attendanceStatusEnum = z.enum(["present", "absent", "late"]);
export type AttendanceStatus = z.infer<typeof attendanceStatusEnum>;

// Stats Type
export type AttendanceStats = {
  totalStudents: number;
  present: number;
  absent: number;
  late: number;
};
