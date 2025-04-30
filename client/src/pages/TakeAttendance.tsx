import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Student, AttendanceRecord, Class, AttendanceStatus } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { isOnline, saveOfflineAttendance } from "@/lib/googleApi";
import { useToast } from "@/hooks/use-toast";
import StudentRow from "@/components/student/StudentRow";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";

export default function TakeAttendance() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(window.location.search);
  const urlClassId = queryParams.get("classId");
  
  const [selectedClassId, setSelectedClassId] = useState<string>(urlClassId || "");
  const [searchTerm, setSearchTerm] = useState("");
  const [attendanceDate, setAttendanceDate] = useState(new Date());
  const [isOffline, setIsOffline] = useState(!isOnline());

  // Format date strings
  const formattedDate = format(attendanceDate, "EEEE, MMMM d, yyyy");
  const formattedTime = format(attendanceDate, "h:mm a");

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Set first class as default if none selected
  useEffect(() => {
    if (!selectedClassId && classes.length > 0) {
      setSelectedClassId(classes[0].id.toString());
    }
  }, [classes, selectedClassId]);

  // Fetch students for selected class
  const { data: students = [], isLoading: isLoadingStudents } = useQuery<Student[]>({
    queryKey: [`/api/classes/${selectedClassId}/students`],
    enabled: !!selectedClassId,
  });

  // Fetch attendance records for selected class and date
  const { data: attendanceRecords = [], isLoading: isLoadingAttendance } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/classes/${selectedClassId}/attendance`, attendanceDate.toISOString()],
    enabled: !!selectedClassId,
  });

  // Create or update attendance record
  const attendanceMutation = useMutation({
    mutationFn: async ({ 
      studentId, 
      status, 
      recordId 
    }: { 
      studentId: number; 
      status: string; 
      recordId?: number 
    }) => {
      // If offline, save locally
      if (!isOnline()) {
        setIsOffline(true);
        saveOfflineAttendance({
          date: attendanceDate,
          studentId,
          classId: parseInt(selectedClassId),
          status,
          notes: ""
        });
        
        return { offline: true };
      }
      
      setIsOffline(false);
      
      // If record exists, update it
      if (recordId) {
        const response = await apiRequest("PUT", `/api/attendance/${recordId}`, { status });
        return response.json();
      } 
      // Otherwise create new record
      else {
        const response = await apiRequest("POST", "/api/attendance", {
          date: attendanceDate,
          studentId,
          classId: parseInt(selectedClassId),
          status,
          notes: ""
        });
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: [`/api/classes/${selectedClassId}/attendance`] 
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to update attendance: ${error}`,
        variant: "destructive",
      });
    }
  });

  // Bulk save all attendance records
  const saveAllAttendance = async () => {
    toast({
      title: "Saving attendance",
      description: "Processing attendance records...",
    });
    
    // Check if all students have attendance records
    const unrecordedStudents = students.filter(student => 
      !attendanceRecords.some(record => record.studentId === student.id)
    );
    
    // Create attendance records for students without them (mark as present by default)
    if (unrecordedStudents.length > 0) {
      try {
        for (const student of unrecordedStudents) {
          await attendanceMutation.mutateAsync({
            studentId: student.id,
            status: "present"
          });
        }
        
        toast({
          title: "Success",
          description: `Created default attendance records for ${unrecordedStudents.length} students.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create default attendance records.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Success",
        description: "All attendance records are up to date.",
      });
    }
  };

  // Handle attendance status change
  const handleAttendanceChange = (studentId: number, status: string) => {
    // Find existing record for this student
    const existingRecord = attendanceRecords.find(
      record => record.studentId === studentId
    );
    
    attendanceMutation.mutate({
      studentId,
      status,
      recordId: existingRecord?.id
    });
  };

  // Filter students by search term
  const filteredStudents = students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get selected class
  const selectedClass = classes.find(c => c.id.toString() === selectedClassId);

  // Get class student attendance rate for each student
  const getStudentAttendanceRate = (studentId: number) => {
    // This would normally come from an API call with historical data
    // For demo purposes, generating random values between 75 and 100
    return Math.floor(Math.random() * 25) + 75;
  };

  // Get recent attendance record for a student
  const getRecentRecord = (studentId: number) => {
    // This would normally come from an API call
    // Using yesterday's record from the existing data if available
    
    // Today's record
    const todayRecord = attendanceRecords.find(
      record => record.studentId === studentId
    );
    
    if (todayRecord) {
      // Simulating a yesterday record with the same status
      const yesterday = new Date(attendanceDate);
      yesterday.setDate(yesterday.getDate() - 1);
      
      return {
        id: -1, // Fake ID
        date: yesterday,
        studentId,
        classId: parseInt(selectedClassId),
        status: todayRecord.status,
        notes: ""
      };
    }
    
    // Default random status
    const statuses: AttendanceStatus[] = ["present", "absent", "late"];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    const yesterday = new Date(attendanceDate);
    yesterday.setDate(yesterday.getDate() - 1);
    
    return {
      id: -1, // Fake ID
      date: yesterday,
      studentId,
      classId: parseInt(selectedClassId),
      status: randomStatus,
      notes: ""
    };
  };

  // Get today's record for a student
  const getTodayRecord = (studentId: number) => {
    return attendanceRecords.find(
      record => record.studentId === studentId
    );
  };

  return (
    <div className="p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Take Attendance</h2>
          <p className="mt-1 text-sm text-gray-500">Mark attendance for your classes</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <div className="relative w-40">
            <Select 
              value={selectedClassId} 
              onValueChange={(value) => {
                setSelectedClassId(value);
                setLocation(`/take-attendance?classId=${value}`);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id.toString()}>
                    {cls.grade} - {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={saveAllAttendance}
            className="bg-primary text-white"
            disabled={attendanceMutation.isPending || !selectedClassId}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Save All
          </Button>
        </div>
      </div>

      {/* Date and Time Information */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between">
          <div className="flex items-center mb-2 md:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-gray-700 font-medium">
              Date: <span className="text-gray-500 font-normal">{formattedDate}</span>
            </span>
          </div>
          <div className="flex items-center mb-2 md:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-gray-700 font-medium">
              Time: <span className="text-gray-500 font-normal">{formattedTime}</span>
            </span>
          </div>
          <div className="flex items-center mb-2 md:mb-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-gray-700 font-medium">
              Total Students: <span className="text-gray-500 font-normal">{students.length}</span>
            </span>
          </div>
          <div className="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span className="text-gray-700 font-medium">
              Room: <span className="text-gray-500 font-normal">{selectedClass?.room || "N/A"}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
        <div className="border-b px-6 py-4 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-medium text-gray-800">Student Attendance</h3>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoadingStudents || isLoadingAttendance ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-gray-600">Loading students...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="p-8 text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No students found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? `No results for "${searchTerm}"` : "Add students to this class to take attendance."}
              </p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance Rate</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Today's Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <StudentRow 
                    key={student.id}
                    student={student}
                    recentRecord={getRecentRecord(student.id)}
                    todayRecord={getTodayRecord(student.id)}
                    attendanceRate={getStudentAttendanceRate(student.id)}
                    onAttendanceChange={handleAttendanceChange}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex justify-between items-center">
            <div>
              <span className="text-sm text-gray-700">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredStudents.length}</span> of <span className="font-medium">{students.length}</span> students
              </span>
            </div>
            {/* Pagination would go here */}
          </div>
        </div>
      </div>

      {/* Offline Mode Warning */}
      {isOffline && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                You are currently in offline mode. Attendance will be saved locally and synced when you're back online.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
