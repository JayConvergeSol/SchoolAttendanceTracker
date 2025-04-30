import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: string;
  iconBgColor: string;
  iconColor: string;
}

export default function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  iconBgColor, 
  iconColor 
}: StatCardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-5">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <h3 className="text-2xl font-medium text-gray-800 my-1">{value}</h3>
          <p className="text-gray-400 text-xs">{subtitle}</p>
        </div>
        <div className={cn("p-2 rounded-full", iconBgColor)}>
          <svg xmlns="http://www.w3.org/2000/svg" className={cn("h-5 w-5", iconColor)} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        </div>
      </div>
    </div>
  );
}
