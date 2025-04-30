import { Student, AttendanceRecord } from "@shared/schema";
import AttendanceButton from "../AttendanceButton";
import { cn } from "@/lib/utils";

interface StudentRowProps {
  student: Student;
  recentRecord?: AttendanceRecord | null;
  todayRecord?: AttendanceRecord | null;
  attendanceRate: number;
  onAttendanceChange: (studentId: number, status: string) => void;
}

export default function StudentRow({ 
  student, 
  recentRecord, 
  todayRecord, 
  attendanceRate, 
  onAttendanceChange 
}: StudentRowProps) {
  const handleAttendanceChange = (status: string) => {
    onAttendanceChange(student.id, status);
  };

  const getRecentStatusLabel = () => {
    if (!recentRecord) return "No record";
    const status = recentRecord.status;
    const date = new Date(recentRecord.date);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isYesterday = 
      date.getDate() === yesterday.getDate() &&
      date.getMonth() === yesterday.getMonth() &&
      date.getFullYear() === yesterday.getFullYear();
    
    const timeLabel = isYesterday ? "yesterday" : "on " + date.toLocaleDateString();
    
    return `${status.charAt(0).toUpperCase() + status.slice(1)} ${timeLabel}`;
  };

  const getStatusColor = (status?: string) => {
    if (!status) return "bg-gray-400";
    switch (status) {
      case "present": return "bg-[#4caf50]";
      case "absent": return "bg-[#f44336]";
      case "late": return "bg-[#ff9800]";
      default: return "bg-gray-400";
    }
  };

  return (
    <tr>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="flex-shrink-0 h-10 w-10">
            <img 
              className="h-10 w-10 rounded-full" 
              src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} 
              alt={`${student.name} avatar`} 
            />
          </div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{student.name}</div>
            <div className="text-sm text-gray-500">{student.email || "No email"}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{student.studentId}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <span className={cn("h-2 w-2 rounded-full mr-2", getStatusColor(recentRecord?.status))}></span>
          <span className="text-sm text-gray-500">{getRecentStatusLabel()}</span>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">{attendanceRate}%</div>
        <div className="w-24 bg-gray-200 rounded-full h-1 mt-1">
          <div 
            className="bg-[#4caf50] rounded-full h-1" 
            style={{ width: `${attendanceRate}%` }}
          ></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <AttendanceButton 
          status={todayRecord?.status as any || null} 
          onChange={handleAttendanceChange} 
        />
      </td>
    </tr>
  );
}
