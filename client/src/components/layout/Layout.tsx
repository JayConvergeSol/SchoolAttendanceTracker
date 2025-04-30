import { useState, useEffect, ReactNode } from "react";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import MobileNavigation from "./MobileNavigation";
import { syncOfflineAttendance, isOnline } from "@/lib/googleApi";
import { useToast } from "@/hooks/use-toast";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [online, setOnline] = useState(isOnline());
  const { toast } = useToast();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      toast({
        title: "You're back online",
        description: "Syncing offline attendance data...",
        duration: 3000,
      });
      
      // Sync offline attendance data
      const success = await syncOfflineAttendance();
      
      if (success) {
        toast({
          title: "Sync completed",
          description: "All offline attendance data has been synchronized.",
          duration: 3000,
        });
      } else {
        toast({
          title: "Sync failed",
          description: "Failed to sync some offline attendance data. Please try again later.",
          variant: "destructive",
          duration: 5000,
        });
      }
    };

    const handleOffline = () => {
      setOnline(false);
      toast({
        title: "You're offline",
        description: "Attendance will be saved locally and synced when you're back online.",
        variant: "destructive",
        duration: 5000,
      });
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [toast]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      <Sidebar open={sidebarOpen} />
      <MobileHeader toggleSidebar={toggleSidebar} />
      <main className="content flex-1 overflow-y-auto md:ml-60 pt-16 md:pt-0">
        {children}
      </main>
      <MobileNavigation />
    </div>
  );
}
