import { cn } from "@/lib/utils";

interface ActivityItemProps {
  icon: string;
  iconBgColor: string;
  iconColor: string;
  title: string;
  time: string;
  details: string;
}

export default function ActivityItem({ 
  icon, 
  iconBgColor, 
  iconColor, 
  title, 
  time, 
  details 
}: ActivityItemProps) {
  return (
    <li className="px-6 py-4 flex items-center">
      <div className={cn(
        "flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center",
        iconBgColor
      )}>
        <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-5 w-5", iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
        </svg>
      </div>
      <div className="ml-3">
        <p className="text-sm font-medium text-gray-800">{title}</p>
        <p className="text-xs text-gray-500">{time} • {details}</p>
      </div>
    </li>
  );
}
