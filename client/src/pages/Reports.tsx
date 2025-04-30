import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Class, AttendanceStats } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { format, startOfWeek, startOfMonth, subDays, eachDayOfInterval, isWeekend } from "date-fns";
import { CalendarIcon, DownloadIcon, BarChart2Icon, PieChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export default function Reports() {
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [reportType, setReportType] = useState<"daily" | "weekly" | "monthly">("weekly");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch attendance stats for selected class
  const { data: stats, isLoading } = useQuery<AttendanceStats>({
    queryKey: [`/api/classes/${selectedClassId}/stats`, selectedDate.toISOString()],
    enabled: !!selectedClassId,
  });

  // Get date range based on report type
  const getDateRange = () => {
    const today = new Date();
    
    switch (reportType) {
      case "daily":
        return `${format(selectedDate, "MMMM d, yyyy")}`;
      case "weekly":
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 }); // Monday
        return `${format(weekStart, "MMM d")} - ${format(selectedDate, "MMM d, yyyy")}`;
      case "monthly":
        const monthStart = startOfMonth(selectedDate);
        return `${format(monthStart, "MMMM yyyy")}`;
      default:
        return "";
    }
  };

  // Generate sample data for demonstrations
  const generateAttendanceData = () => {
    // Daily data
    const dailyData = [
      { name: "Present", value: stats?.present || 28, color: "#4caf50" },
      { name: "Absent", value: stats?.absent || 1, color: "#f44336" },
      { name: "Late", value: stats?.late || 1, color: "#ff9800" },
    ];

    // Weekly data
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: subDays(new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000), 1)
    }).filter(date => !isWeekend(date)); // Exclude weekends
    
    const weeklyData = weekDays.map(day => {
      const present = Math.floor(Math.random() * 3) + 27; // 27-29 present
      const absent = Math.floor(Math.random() * 2); // 0-1 absent
      const late = 30 - present - absent; // The rest are late
      
      return {
        name: format(day, "EEE"),
        present,
        absent,
        late,
        total: present + absent + late,
      };
    });

    // Monthly data
    const monthlyData = [];
    
    for (let i = 1; i <= 4; i++) {
      const weekLabel = `Week ${i}`;
      const present = Math.floor(Math.random() * 5) + 25; // 25-29 present per day
      const absent = Math.floor(Math.random() * 3); // 0-2 absent per day
      const late = 30 - present - absent; // The rest are late
      
      monthlyData.push({
        name: weekLabel,
        present: present * 5, // 5 days in a week
        absent: absent * 5,
        late: late * 5,
        total: 30 * 5, // 30 students × 5 days
      });
    }

    return {
      dailyData,
      weeklyData,
      monthlyData,
    };
  };

  const { dailyData, weeklyData, monthlyData } = generateAttendanceData();

  // Get data based on report type
  const getChartData = () => {
    switch (reportType) {
      case "daily":
        return dailyData;
      case "weekly":
        return weeklyData;
      case "monthly":
        return monthlyData;
      default:
        return [];
    }
  };

  const chartData = getChartData();
  
  // Attendance rate calculation
  const attendanceRate = stats 
    ? Math.round((stats.present / stats.totalStudents) * 100) 
    : 93; // Default value

  // Trend data for line chart
  const trendData = [];
  for (let i = 29; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const isWeekendDay = isWeekend(date);
    
    if (!isWeekendDay) {
      // Generate a trend that has some variation but averages around 93%
      const baseRate = 93;
      const variation = Math.floor(Math.random() * 7) - 3; // -3 to +3
      trendData.push({
        date: format(date, "MMM d"),
        rate: baseRate + variation,
      });
    }
  }

  return (
    <div className="p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Attendance Reports</h2>
          <p className="mt-1 text-sm text-gray-500">Analyze attendance trends and patterns</p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <Select
            value={selectedClassId}
            onValueChange={setSelectedClassId}
          >
            <SelectTrigger className="w-[180px]">
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
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-[180px]">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PP") : "Select date"}
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
          
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6">
        <Tabs defaultValue="weekly" onValueChange={(value) => setReportType(value as any)}>
          <TabsList className="grid w-full grid-cols-3 max-w-md">
            <TabsTrigger value="daily">Daily</TabsTrigger>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {!selectedClassId ? (
        <div className="bg-white rounded-lg shadow p-10 text-center">
          <BarChart2Icon className="h-16 w-16 mx-auto text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">No Class Selected</h3>
          <p className="mt-2 text-gray-500">Please select a class to view attendance reports</p>
        </div>
      ) : (
        <>
          {/* Report Header */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>
                    {classes.find(c => c.id.toString() === selectedClassId)?.grade} - {classes.find(c => c.id.toString() === selectedClassId)?.name}
                  </CardTitle>
                  <p className="text-sm text-gray-500">
                    {getDateRange()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-sm text-gray-500">Attendance Rate</span>
                  <p className="text-2xl font-bold text-primary">{attendanceRate}%</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-3 rounded-lg bg-green-50">
                  <p className="text-2xl font-bold text-[#4caf50]">{stats?.present || 28}</p>
                  <p className="text-sm text-gray-600">Present</p>
                </div>
                <div className="p-3 rounded-lg bg-red-50">
                  <p className="text-2xl font-bold text-[#f44336]">{stats?.absent || 1}</p>
                  <p className="text-sm text-gray-600">Absent</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-50">
                  <p className="text-2xl font-bold text-[#ff9800]">{stats?.late || 1}</p>
                  <p className="text-sm text-gray-600">Late</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Chart 1: Bar or Pie Chart */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  {reportType === "daily" ? "Daily Attendance Breakdown" : 
                   reportType === "weekly" ? "Weekly Attendance Distribution" : 
                   "Monthly Attendance Summary"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {reportType === "daily" ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={dailyData}
                          cx="50%"
                          cy="50%"
                          innerRadius={80}
                          outerRadius={120}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {dailyData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="present" name="Present" stackId="a" fill="#4caf50" />
                        <Bar dataKey="absent" name="Absent" stackId="a" fill="#f44336" />
                        <Bar dataKey="late" name="Late" stackId="a" fill="#ff9800" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: Trend Line */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Attendance Rate Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={trendData.slice(-14)} // Show last 14 days only
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis domain={[70, 100]} />
                      <Tooltip />
                      <Bar dataKey="rate" name="Attendance Rate (%)" fill="#3f51b5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Additional Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <PieChartIcon className="h-5 w-5 mr-2 text-primary" />
                  Perfect Attendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">24</div>
                <p className="text-sm text-gray-500">Students with 100% attendance</p>
                <div className="mt-2 text-xs text-green-600">
                  <span className="font-medium">+2</span> from last week
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Chronic Absences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">1</div>
                <p className="text-sm text-gray-500">Students missing {'>'} 10% of classes</p>
                <div className="mt-2 text-xs text-red-600">
                  Requires attention
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Frequent Tardiness
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-800 mb-1">2</div>
                <p className="text-sm text-gray-500">Students late more than 5 times</p>
                <div className="mt-2 text-xs text-yellow-600">
                  Monitoring required
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
