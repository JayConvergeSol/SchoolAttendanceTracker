import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { getGoogleAuthUrl } from "@/lib/googleApi";
import { Class, insertClassSchema } from "@shared/schema";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { AlertCircle, CheckCircle2, Search, Settings2, UserCircle, BookOpen, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Extended schema with validation
const classFormSchema = insertClassSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  grade: z.string().min(1, "Grade is required"),
  room: z.string().optional(),
});

type ClassFormValues = z.infer<typeof classFormSchema>;

export default function Settings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const queryParams = new URLSearchParams(window.location.search);
  const integrationStatus = queryParams.get("integration");
  const [googleAuthUrl, setGoogleAuthUrl] = useState("");
  
  // Account form state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");

  // Load user data to form
  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setAvatar(user.avatar || "");
    }
  }, [user]);

  // Fetch Search auth URL
  useEffect(() => {
    const fetchGoogleAuthUrl = async () => {
      try {
        const url = await getGoogleAuthUrl();
        setGoogleAuthUrl(url);
      } catch (error) {
        console.error("Failed to get Search auth URL:", error);
      }
    };

    fetchGoogleAuthUrl();
  }, []);

  // Fetch classes
  const { data: classes = [] } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  // Create class mutation
  const createClass = useMutation({
    mutationFn: async (classData: ClassFormValues) => {
      const response = await apiRequest("POST", "/api/classes", classData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Class added successfully",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/classes"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to add class: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Setup form with validation
  const form = useForm<ClassFormValues>({
    resolver: zodResolver(classFormSchema),
    defaultValues: {
      name: "",
      grade: "",
      room: "",
    },
  });

  // Form submission handler
  const onSubmit = (data: ClassFormValues) => {
    createClass.mutate(data);
  };

  // Remove integration status from URL after showing toast
  useEffect(() => {
    if (integrationStatus) {
      if (integrationStatus === "success") {
        toast({
          title: "Integration Successful",
          description: "Your Search Sheets integration is now set up.",
        });
      } else if (integrationStatus === "error") {
        toast({
          title: "Integration Failed",
          description: "There was an error setting up Search Sheets integration. Please try again.",
          variant: "destructive",
        });
      }
      
      // Remove the query parameter
      setLocation("/settings", { replace: true });
    }
  }, [integrationStatus, toast, setLocation]);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-800">Settings</h2>
        <p className="mt-1 text-sm text-gray-500">Manage your account and application settings</p>
      </div>

      <Tabs defaultValue="account" className="space-y-6">
        <TabsList>
          <TabsTrigger value="account" className="flex items-center">
            <UserCircle className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="classes" className="flex items-center">
            <BookOpen className="h-4 w-4 mr-2" />
            Classes
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center">
            <Search className="h-4 w-4 mr-2" />
            CSV Export
          </TabsTrigger>
          <TabsTrigger value="preferences" className="flex items-center">
            <Settings2 className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
        </TabsList>

        {/* Account Settings */}
        <TabsContent value="account">
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
              <CardDescription>
                Manage your personal information and credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="md:w-1/3 flex flex-col items-center">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-100 shadow-md">
                    <img 
                      src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "User")}&background=3f51b5&color=fff&size=128`} 
                      alt="User avatar" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="mt-4 text-center text-sm text-gray-500">
                    {isEditingProfile ? (
                      <Button variant="ghost" size="sm" className="text-primary" onClick={() => setIsEditingProfile(false)}>
                        Cancel Editing
                      </Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="text-primary" onClick={() => setIsEditingProfile(true)}>
                        Edit Profile
                      </Button>
                    )}
                  </p>
                </div>
                
                <div className="md:w-2/3 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Name</label>
                      {isEditingProfile ? (
                        <Input value={name} onChange={(e) => setName(e.target.value)} />
                      ) : (
                        <div className="p-2 border rounded-md bg-gray-50">{name}</div>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Username</label>
                      <div className="p-2 border rounded-md bg-gray-50">{user?.username}</div>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                      {isEditingProfile ? (
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} />
                      ) : (
                        <div className="p-2 border rounded-md bg-gray-50">{email}</div>
                      )}
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Role</label>
                      <div className="p-2 border rounded-md bg-gray-50">{user?.role || "Teacher"}</div>
                    </div>
                    
                    {isEditingProfile && (
                      <div>
                        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Avatar URL</label>
                        <Input value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                      </div>
                    )}
                  </div>
                  
                  {isEditingProfile && (
                    <div className="flex justify-end">
                      <Button className="bg-primary">
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium mb-4">Security Settings</h3>
                <div className="space-y-4">
                  <div>
                    <Button variant="outline">Change Password</Button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Two-Factor Authentication</p>
                      <p className="text-sm text-gray-500">Add an extra layer of security to your account</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Classes Settings */}
        <TabsContent value="classes">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Add New Class</CardTitle>
                <CardDescription>
                  Create a new class for attendance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Mathematics" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="grade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Grade/Year</FormLabel>
                          <FormControl>
                            <Input placeholder="Grade 10" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="room"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Room Number</FormLabel>
                          <FormControl>
                            <Input placeholder="201" {...field} />
                          </FormControl>
                          <FormDescription>Optional room assignment</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary"
                      disabled={createClass.isPending}
                    >
                      {createClass.isPending ? "Adding..." : "Add Class"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Your Classes</CardTitle>
                <CardDescription>
                  Manage your existing classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {classes.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 mx-auto text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">No classes found</h3>
                    <p className="mt-1 text-sm text-gray-500">Add your first class using the form on the left.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {classes.map((cls) => (
                      <div key={cls.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div>
                          <h4 className="font-medium">{cls.grade} - {cls.name}</h4>
                          <p className="text-sm text-gray-500">Room: {cls.room || "Not assigned"}</p>
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm">
                            Manage Students
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* CSV Export Settings */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>CSV Export for Google Sheets</CardTitle>
              <CardDescription>
                Export your data as CSV files that can be imported into Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>How to use CSV export with Google Sheets</AlertTitle>
                <AlertDescription>
                  <ol className="list-decimal pl-4 space-y-2 mt-2">
                    <li>Export your data using the buttons below</li>
                    <li>Open your Google Sheet (ID: 1EaKPNOEagOcKUJ269rahOAmQDihl-lb4ol4fQbLrxvY)</li>
                    <li>Go to File &gt; Import &gt; Upload</li>
                    <li>Upload the CSV file you downloaded</li>
                    <li>Select "Replace data at selected cell" or "Append to current sheet"</li>
                    <li>Click "Import data"</li>
                  </ol>
                </AlertDescription>
              </Alert>
              
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-start">
                  <div className="mr-4">
                    <Search className="h-8 w-8 text-[#4285F4]" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium mb-1">Google Sheets Export</h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Export your data as CSV files and manually import them into your Google Sheet
                    </p>
                    
                    <Button asChild className="bg-[#4285F4] hover:bg-[#3367D6]">
                      <a href="https://docs.google.com/spreadsheets/d/1EaKPNOEagOcKUJ269rahOAmQDihl-lb4ol4fQbLrxvY" target="_blank" className="flex items-center">
                        <Search className="h-4 w-4 mr-2" />
                        Open Your Google Sheet
                      </a>
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border rounded-lg">
                <h3 className="text-lg font-medium mb-4">Export Data</h3>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <h4 className="font-medium">Export Student Data by Class</h4>
                    <p className="text-sm text-gray-500">Select a class to export its students as CSV</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {classes.map((cls) => (
                        <Button 
                          key={cls.id} 
                          variant="outline"
                          asChild
                        >
                          <a href={`/api/export/students/${cls.id}`} download className="flex items-center justify-center">
                            <span className="truncate">{cls.name}</span>
                          </a>
                        </Button>
                      ))}
                      {classes.length === 0 && (
                        <p className="text-sm text-gray-500 col-span-3 py-2">No classes available. Add classes first.</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium">Export Attendance Records by Class</h4>
                    <p className="text-sm text-gray-500">Select a class to export today's attendance as CSV</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                      {classes.map((cls) => (
                        <Button 
                          key={cls.id} 
                          variant="outline"
                          asChild
                        >
                          <a href={`/api/export/attendance/${cls.id}`} download className="flex items-center justify-center">
                            <span className="truncate">{cls.name}</span>
                          </a>
                        </Button>
                      ))}
                      {classes.length === 0 && (
                        <p className="text-sm text-gray-500 col-span-3 py-2">No classes available. Add classes first.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Settings */}
        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Application Preferences</CardTitle>
              <CardDescription>
                Customize your experience with SchoolTrack
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Appearance</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Dark Mode</p>
                    <p className="text-sm text-gray-500">Use dark theme for the application</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Compact View</p>
                    <p className="text-sm text-gray-500">Show more items per page with reduced spacing</p>
                  </div>
                  <Switch />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Notifications</h3>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Email Notifications</p>
                    <p className="text-sm text-gray-500">Receive daily attendance summaries via email</p>
                  </div>
                  <Switch />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Absence Alerts</p>
                    <p className="text-sm text-gray-500">Alert when a student has been absent for multiple days</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
              
              <div className="space-y-4 pt-4 border-t">
                <h3 className="text-lg font-medium">Default Settings</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Class</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="">Select default class...</option>
                      {classes.map((cls) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.grade} - {cls.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Default Attendance Status</label>
                    <select className="w-full p-2 border rounded-md">
                      <option value="present">Present</option>
                      <option value="absent">Absent</option>
                      <option value="none">None (manual entry)</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end">
                <Button className="bg-primary">
                  Save Preferences
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
