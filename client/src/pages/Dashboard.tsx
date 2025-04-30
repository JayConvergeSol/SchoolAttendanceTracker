import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Class, Student, AttendanceRecord } from "@shared/schema";
import StatCard from "@/components/StatCard";
import ClassCard from "@/components/ClassCard";
import ActivityItem from "@/components/ActivityItem";
import { exportAttendanceToSheets } from "@/lib/googleApi";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const { toast } = useToast();

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Calculate attendance stats for each class
  const calculateClassStats = (classId: number, students: Student[], records: AttendanceRecord[]) => {
    const totalStudents = students.filter(s => s.classId === classId).length;
    const classRecords = records.filter(r => r.classId === classId);
    
    const present = classRecords.filter(r => r.status === "present").length;
    const absent = classRecords.filter(r => r.status === "absent").length;
    const late = classRecords.filter(r => r.status === "late").length;
    
    const attendancePercentage = totalStudents > 0 
      ? Math.round((present / totalStudents) * 100) 
      : 0;
    
    return {
      attendancePercentage,
      present,
      absent,
      late
    };
  };

  // Example stats for the demo
  const overallStats = {
    todayPercentage: "92%",
    weeklyAverage: "89%",
    absentCount: "2",
    lateCount: "3"
  };

  // Handle export button click
  const handleExport = async () => {
    try {
      if (classes.length === 0) {
        toast({
          title: "No classes to export",
          description: "Please add classes and attendance records first.",
          variant: "destructive",
        });
        return;
      }

      await exportAttendanceToSheets(classes[0].id, new Date());
      
      toast({
        title: "Export successful",
        description: "Attendance data has been exported to Google Sheets.",
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export attendance data. Please try again later.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Dashboard</h2>
          <p className="mt-1 text-sm text-gray-500">Overview of attendance and class statistics</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search students..." 
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button 
            onClick={handleExport}
            className="px-4 py-2 bg-primary text-white rounded-lg shadow-sm hover:bg-primary-dark text-sm flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Attendance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard 
          title="Today's Attendance"
          value={overallStats.todayPercentage}
          subtitle="28/30 students present"
          icon="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBgColor="bg-green-100"
          iconColor="text-[#4caf50]"
        />
        <StatCard 
          title="Weekly Average"
          value={overallStats.weeklyAverage}
          subtitle="Decreased by 2% from last week"
          icon="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          iconBgColor="bg-blue-100"
          iconColor="text-primary"
        />
        <StatCard 
          title="Absent Students"
          value={overallStats.absentCount}
          subtitle="View details"
          icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
          iconBgColor="bg-red-100"
          iconColor="text-[#f44336]"
        />
        <StatCard 
          title="Late Students"
          value={overallStats.lateCount}
          subtitle="View details"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          iconBgColor="bg-yellow-100"
          iconColor="text-[#ff9800]"
        />
      </div>

      {/* Classes Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-medium text-gray-800">Your Classes</h3>
        </div>
        <div className="p-6">
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {classes.map(cls => (
                <ClassCard 
                  key={cls.id} 
                  classData={cls} 
                  stats={{
                    attendancePercentage: 93,
                    present: 28,
                    absent: 1,
                    late: 1
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900">No classes found</h3>
              <p className="mt-1 text-sm text-gray-500">You don't have any classes yet. Add a class to get started.</p>
              <div className="mt-6">
                <Link href="/settings">
                  <button type="button" className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Class
                  </button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-800">Recent Attendance Activity</h3>
          <Link href="/attendance-history">
            <a className="text-sm text-primary hover:underline">View All</a>
          </Link>
        </div>
        <div>
          <ul className="divide-y divide-gray-200">
            <ActivityItem 
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              iconBgColor="bg-blue-100"
              iconColor="text-primary"
              title="Attendance completed for Grade 10 - Mathematics"
              time="Today at 10:30 AM"
              details="28 present, 1 absent, 1 late"
            />
            <ActivityItem 
              icon="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              iconBgColor="bg-red-100"
              iconColor="text-[#f44336]"
              title="John Smith marked absent for 3 consecutive days"
              time="Yesterday at 2:15 PM"
              details="Grade 9 - Mathematics"
            />
            <ActivityItem 
              icon="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              iconBgColor="bg-green-100"
              iconColor="text-[#4caf50]"
              title="Attendance report exported for Grade 11"
              time="Yesterday at 1:05 PM"
              details="Weekly report"
            />
            <ActivityItem 
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              iconBgColor="bg-yellow-100"
              iconColor="text-[#ff9800]"
              title="Emma Johnson marked late for the second time this week"
              time="2 days ago at 9:20 AM"
              details="Grade 10 - Mathematics"
            />
          </ul>
        </div>
      </div>
    </div>
  );
}
