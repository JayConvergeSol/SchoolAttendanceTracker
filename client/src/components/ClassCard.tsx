import { Link } from "wouter";
import { Class } from "@shared/schema";

interface ClassCardProps {
  classData: Class;
  stats: {
    attendancePercentage: number;
    present: number;
    absent: number;
    late: number;
  };
}

export default function ClassCard({ classData, stats }: ClassCardProps) {
  return (
    <div className="border rounded-lg hover:shadow-md transition-shadow cursor-pointer">
      <Link href={`/take-attendance?classId=${classData.id}`}>
        <div className="p-4 border-b bg-gray-50">
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-gray-800">{classData.grade} - {classData.name}</h4>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p className="text-sm text-gray-500">Room {classData.room} • {stats.present + stats.absent + stats.late} students</p>
        </div>
        <div className="p-4">
          <div className="flex justify-between mb-2">
            <span className="text-xs text-gray-500">Today's Attendance:</span>
            <span className="text-xs font-medium text-gray-700">{stats.attendancePercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-[#4caf50] rounded-full h-2" 
              style={{ width: `${stats.attendancePercentage}%` }}
            ></div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-center">
            <div>
              <span className="block text-[#4caf50] font-medium">{stats.present}</span>
              <span className="text-gray-500">Present</span>
            </div>
            <div>
              <span className="block text-[#f44336] font-medium">{stats.absent}</span>
              <span className="text-gray-500">Absent</span>
            </div>
            <div>
              <span className="block text-[#ff9800] font-medium">{stats.late}</span>
              <span className="text-gray-500">Late</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
