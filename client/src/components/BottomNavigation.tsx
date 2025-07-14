import { useLocation } from "wouter";
import { Home, History, BarChart3, User } from "lucide-react";

interface BottomNavigationProps {
  currentPage: string;
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    { id: "home", label: "Home", icon: Home, path: "/" },
    { id: "history", label: "History", icon: History, path: "/history" },
    { id: "stats", label: "Stats", icon: BarChart3, path: "/stats" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-around">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <button 
                key={item.id}
                onClick={() => setLocation(item.path)}
                className={`flex flex-col items-center py-2 ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}
              >
                <Icon className="text-xl mb-1" />
                <span className={`text-xs ${isActive ? 'font-medium' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
