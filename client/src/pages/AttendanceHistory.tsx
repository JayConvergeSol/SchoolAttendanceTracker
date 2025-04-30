import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Class, AttendanceRecord, Student } from "@shared/schema";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format, parseISO, subDays } from "date-fns";
import { CalendarIcon, FilterIcon, DownloadIcon, SearchIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export default function AttendanceHistory() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch students for selected class
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: [`/api/classes/${selectedClassId}/students`],
    enabled: !!selectedClassId,
  });

  // Fetch attendance records
  const { data: attendanceRecords = [], isLoading } = useQuery<AttendanceRecord[]>({
    queryKey: [`/api/classes/${selectedClassId}/attendance`, selectedDate.toISOString()],
    enabled: !!selectedClassId,
  });

  // Filter attendance records by student and search term
  const filteredRecords = attendanceRecords.filter(record => {
    if (selectedStudent && record.studentId.toString() !== selectedStudent) {
      return false;
    }
    return true;
  });

  // Get student name by id
  const getStudentName = (studentId: number) => {
    const student = students.find(s => s.id === studentId);
    return student ? student.name : "Unknown";
  };

  // Format date for display
  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return format(dateObj, "PPP");
  };

  // Generate sample attendance history for the demo
  const generateSampleHistory = () => {
    const history = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      const isWeekend = date.getDay() === 0 || date.getDay() === 6;
      
      if (!isWeekend) {
        history.push({
          date,
          presentCount: Math.floor(Math.random() * 5) + 25, // 25-29 students present
          absentCount: Math.floor(Math.random() * 3), // 0-2 absent
          lateCount: Math.floor(Math.random() * 3), // 0-2 late
        });
      }
    }
    
    return history;
  };
  
  const attendanceHistory = generateSampleHistory();

  return (
    <div className="p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Attendance History</h2>
          <p className="mt-1 text-sm text-gray-500">View and analyze attendance records</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="flex items-center">
                <FilterIcon className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Class</h3>
                  <Select
                    value={selectedClassId}
                    onValueChange={setSelectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a class" />
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
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Student</h3>
                  <Select
                    value={selectedStudent}
                    onValueChange={setSelectedStudent}
                    disabled={!selectedClassId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All students" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All students</SelectItem>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Date</h3>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={(date) => date && setSelectedDate(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Attendance Timeline */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Attendance Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto pb-2">
            <div className="min-w-max">
              <div className="flex items-center space-x-2 mb-2">
                {attendanceHistory.slice(0, 14).map((day, index) => (
                  <div 
                    key={index} 
                    className="flex flex-col items-center"
                    onClick={() => setSelectedDate(day.date)}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium cursor-pointer hover:bg-gray-100",
                      format(day.date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd") 
                        ? "bg-primary text-white hover:bg-primary"
                        : "bg-white text-gray-700"
                    )}>
                      {format(day.date, "d")}
                    </div>
                    <span className="text-xs text-gray-500 mt-1">
                      {format(day.date, "EEE")}
                    </span>
                    <div className="flex space-x-0.5 mt-2">
                      <div className="w-2 h-2 rounded-full bg-[#4caf50]" title={`${day.presentCount} present`}></div>
                      {day.absentCount > 0 && (
                        <div className="w-2 h-2 rounded-full bg-[#f44336]" title={`${day.absentCount} absent`}></div>
                      )}
                      {day.lateCount > 0 && (
                        <div className="w-2 h-2 rounded-full bg-[#ff9800]" title={`${day.lateCount} late`}></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Records Table */}
      <Card>
        <CardHeader className="pb-2 flex flex-col md:flex-row justify-between items-start md:items-center space-y-2 md:space-y-0">
          <div>
            <CardTitle className="text-lg">
              Attendance Records for {formatDate(selectedDate)}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {selectedClassId ? classes.find(c => c.id.toString() === selectedClassId)?.grade + " - " + classes.find(c => c.id.toString() === selectedClassId)?.name : "Please select a class"}
            </p>
          </div>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full md:w-auto"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!selectedClassId ? (
            <div className="text-center py-8 text-gray-500">
              <FilterIcon className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-2">Please select a class to view attendance records</p>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
              <p className="mt-2 text-gray-500">Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CalendarIcon className="w-12 h-12 mx-auto text-gray-300" />
              <p className="mt-2">No attendance records found for this date</p>
              <p className="text-sm text-gray-400">Try selecting a different date or class</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Student</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">ID</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Time</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => {
                    const studentName = getStudentName(record.studentId);
                    const student = students.find(s => s.id === record.studentId);
                    
                    return (
                      <tr key={record.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full overflow-hidden mr-3">
                              <img 
                                src={student?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(studentName)}&background=random`} 
                                alt={studentName} 
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <span className="font-medium text-gray-800">{studentName}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {student?.studentId || "N/A"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            record.status === "present" ? "bg-green-100 text-green-800" :
                            record.status === "absent" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          )}>
                            {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {format(new Date(record.date), "h:mm a")}
                        </td>
                        <td className="px-4 py-3 text-gray-600">
                          {record.notes || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
