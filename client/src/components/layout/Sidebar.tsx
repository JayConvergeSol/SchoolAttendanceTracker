import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
}

export default function Sidebar({ open }: SidebarProps) {
  const [location] = useLocation();
  const { user, logout } = useAuth();

  return (
    <aside className={cn("sidebar fixed inset-y-0 left-0 z-50 flex flex-col bg-white shadow-lg", open && "open")}>
      <div className="flex items-center justify-center h-16 border-b px-4">
        <h1 className="text-xl font-medium text-primary">SchoolTrack</h1>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <div className="px-4 mb-6">
          <div className="flex items-center px-2 py-3">
            <img 
              className="h-8 w-8 rounded-full" 
              src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=3f51b5&color=fff"} 
              alt="User avatar" 
            />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{user?.name || "User"}</p>
              <p className="text-xs text-gray-500">{user?.role || "Teacher"}</p>
            </div>
          </div>
        </div>
        <div className="space-y-1 px-2">
          <Link 
            href="/" 
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/" 
                ? "bg-primary text-white" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </Link>
          <Link 
            href="/take-attendance" 
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/take-attendance"
                ? "bg-primary text-white" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Take Attendance
          </Link>
          <Link 
            href="/students" 
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/students"
                ? "bg-primary text-white" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            Students
          </Link>
          <Link 
            href="/attendance-history" 
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/attendance-history"
                ? "bg-primary text-white" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Attendance History
          </Link>
          <Link 
            href="/reports" 
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/reports"
                ? "bg-primary text-white" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Reports
          </Link>
          <Link 
            href="/settings" 
            className={cn(
              "flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location === "/settings"
                ? "bg-primary text-white" 
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
            )}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </Link>
        </div>
      </nav>
      <div className="p-4 border-t">
        <button 
          onClick={() => logout()}
          className="flex items-center px-2 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-50 hover:text-gray-900 w-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
}
