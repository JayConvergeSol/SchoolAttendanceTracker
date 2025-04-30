import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Student, Class, insertStudentSchema } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SearchIcon, UserPlusIcon, DownloadIcon, PlusIcon } from "lucide-react";

// Extended schema with validation
const studentFormSchema = insertStudentSchema.extend({
  studentId: z.string().min(3, "Student ID must be at least 3 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Must be a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  classId: z.number({
    required_error: "Please select a class",
    invalid_type_error: "Class is required",
  }),
  avatar: z.string().optional().or(z.literal("")),
});

type StudentFormValues = z.infer<typeof studentFormSchema>;

export default function Students() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClassId, setSelectedClassId] = useState<string>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Fetch all students
  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ["/api/classes/all/students"],
    queryFn: async () => {
      const allStudents: Student[] = [];
      
      // Fetch students for each class
      for (const cls of classes) {
        const response = await fetch(`/api/classes/${cls.id}/students`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const students: Student[] = await response.json();
          allStudents.push(...students);
        }
      }
      
      return allStudents;
    },
    enabled: classes.length > 0,
  });

  // Create student mutation
  const createStudent = useMutation({
    mutationFn: async (student: StudentFormValues) => {
      const response = await apiRequest("POST", "/api/students", student);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Student added successfully",
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/classes/all/students"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add student: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Setup form with validation
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentId: "",
      name: "",
      email: "",
      contactPhone: "",
      address: "",
      classId: 0,
      avatar: "",
      contactInfo: {},
    },
  });

  // Form submission handler
  const onSubmit = (data: StudentFormValues) => {
    createStudent.mutate(data);
  };

  // Filter students by search term and class
  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesClass = selectedClassId === "all" || student.classId.toString() === selectedClassId;
    
    return matchesSearch && matchesClass;
  });

  // Get class name by id
  const getClassName = (classId: number) => {
    const cls = classes.find(c => c.id === classId);
    return cls ? `${cls.grade} - ${cls.name}` : "Unknown";
  };

  return (
    <div className="p-6">
      <div className="md:flex md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Students</h2>
          <p className="mt-1 text-sm text-gray-500">Manage your student records</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary text-white">
                <UserPlusIcon className="h-4 w-4 mr-2" />
                Add Student
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Enter the student details below to add them to your class.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student ID</FormLabel>
                        <FormControl>
                          <Input placeholder="STU1001" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="John Smith" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="john@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="contactPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Contact Phone</FormLabel>
                        <FormControl>
                          <Input placeholder="123-456-7890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select 
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          defaultValue={field.value.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.grade} - {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://example.com/avatar.jpg" {...field} />
                        </FormControl>
                        <FormDescription>Optional profile picture URL</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      type="submit" 
                      className="bg-primary"
                      disabled={createStudent.isPending}
                    >
                      {createStudent.isPending ? "Adding..." : "Add Student"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <DownloadIcon className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:flex md:items-center md:space-x-4">
        <div className="relative flex-1">
          <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by name, ID, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="w-full md:w-64">
          <Select
            value={selectedClassId}
            onValueChange={setSelectedClassId}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id.toString()}>
                  {cls.grade} - {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Student grid */}
      {isLoading ? (
        <div className="p-8 text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-primary border-t-transparent"></div>
          <p className="mt-2 text-gray-600">Loading students...</p>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <UserPlusIcon className="h-12 w-12 mx-auto text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || selectedClassId !== "all" 
              ? "Try adjusting your search or filter criteria." 
              : "Add your first student to get started."}
          </p>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="mt-4 bg-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Student
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStudents.map((student) => (
            <Card key={student.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={student.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=random`} alt={student.name} />
                      <AvatarFallback>{student.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-base">{student.name}</CardTitle>
                      <p className="text-sm text-gray-500">{student.studentId}</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                    {getClassName(student.classId)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <Tabs defaultValue="contact">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="contact">Contact</TabsTrigger>
                    <TabsTrigger value="attendance">Attendance</TabsTrigger>
                  </TabsList>
                  <TabsContent value="contact" className="space-y-2 mt-2">
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-gray-500">Email:</span>
                      <span className="col-span-2 truncate">{student.email || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-gray-500">Phone:</span>
                      <span className="col-span-2">{student.contactPhone || "N/A"}</span>
                    </div>
                    <div className="grid grid-cols-3 text-sm">
                      <span className="text-gray-500">Address:</span>
                      <span className="col-span-2 truncate">{student.address || "N/A"}</span>
                    </div>
                  </TabsContent>
                  <TabsContent value="attendance" className="mt-2">
                    <div className="text-sm space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Attendance Rate:</span>
                        <span className="font-medium">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-[#4caf50] rounded-full h-2" style={{ width: "92%" }}></div>
                      </div>
                      <div className="grid grid-cols-3 text-center mt-2">
                        <div>
                          <p className="text-[#4caf50] font-medium">24</p>
                          <p className="text-xs text-gray-500">Present</p>
                        </div>
                        <div>
                          <p className="text-[#f44336] font-medium">2</p>
                          <p className="text-xs text-gray-500">Absent</p>
                        </div>
                        <div>
                          <p className="text-[#ff9800] font-medium">1</p>
                          <p className="text-xs text-gray-500">Late</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
