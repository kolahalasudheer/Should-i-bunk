import { useAuth } from "@/hooks/useAuth";
import { Bell, GraduationCap, User, Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/themeContext";

export default function Header() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Add User type for type safety
  interface User {
    profileImageUrl?: string;
    // add other fields as needed
  }
  const typedUser = user as User;

  return (
    <header className="bg-background text-foreground shadow-sm border-b border-border">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-primary to-purple-600 rounded-full flex items-center justify-center">
            <GraduationCap className="text-white text-sm" />
          </div>
          <h1 className="text-xl font-bold">Should I Bunk?</h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle light/dark mode"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-gray-800" />}
          </button>
          <button className="relative">
            <Bell className="text-foreground text-lg" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-danger rounded-full"></span>
          </button>
          <div className="w-8 h-8 rounded-full overflow-hidden">
            {typedUser?.profileImageUrl ? (
              <img 
                src={typedUser.profileImageUrl} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
