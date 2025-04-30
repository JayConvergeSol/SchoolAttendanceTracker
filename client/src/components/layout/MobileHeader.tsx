import { useAuth } from "@/hooks/useAuth";

interface MobileHeaderProps {
  toggleSidebar: () => void;
}

export default function MobileHeader({ toggleSidebar }: MobileHeaderProps) {
  const { user } = useAuth();
  
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        <button 
          className="p-2 rounded-md text-gray-600 focus:outline-none"
          onClick={toggleSidebar}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <h1 className="text-xl font-medium text-primary">SchoolTrack</h1>
        <div className="p-2">
          <img 
            className="h-8 w-8 rounded-full" 
            src={user?.avatar || "https://ui-avatars.com/api/?name=User&background=3f51b5&color=fff"} 
            alt="User avatar" 
          />
        </div>
      </div>
    </div>
  );
}
