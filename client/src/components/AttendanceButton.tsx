import { useState } from "react";
import { cn } from "@/lib/utils";
import { AttendanceStatus } from "@shared/schema";

interface AttendanceButtonProps {
  status: AttendanceStatus | null;
  onChange: (status: AttendanceStatus) => void;
}

export default function AttendanceButton({ status, onChange }: AttendanceButtonProps) {
  const handleStatusChange = (newStatus: AttendanceStatus) => {
    onChange(newStatus);
  };

  return (
    <div className="flex space-x-2">
      <button
        className={cn(
          "attendance-btn px-2 py-1 rounded-md text-xs font-medium flex items-center",
          status === "present" ? "present" : "text-gray-500 border border-gray-300 hover:bg-gray-50"
        )}
        onClick={() => handleStatusChange("present")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Present
      </button>
      <button
        className={cn(
          "attendance-btn px-2 py-1 rounded-md text-xs font-medium flex items-center",
          status === "absent" ? "absent" : "text-gray-500 border border-gray-300 hover:bg-gray-50"
        )}
        onClick={() => handleStatusChange("absent")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
        Absent
      </button>
      <button
        className={cn(
          "attendance-btn px-2 py-1 rounded-md text-xs font-medium flex items-center",
          status === "late" ? "late" : "text-gray-500 border border-gray-300 hover:bg-gray-50"
        )}
        onClick={() => handleStatusChange("late")}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        Late
      </button>
    </div>
  );
}
