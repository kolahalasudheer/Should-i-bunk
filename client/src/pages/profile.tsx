import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/Header";
import BottomNavigation from "@/components/BottomNavigation";
import BadgeSystem from "@/components/BadgeSystem";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, User, Mail, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { useState } from "react";

// Add User type for type safety
interface User {
  profileImageUrl?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  createdAt?: string;
}

export default function Profile() {
  const { user: rawUser, isLoading, isAuthenticated } = useAuth();
  const user = (rawUser || {}) as User;
  const { toast } = useToast();
  const [editFirstName, setEditFirstName] = useState(user?.firstName || "");
  const [editLastName, setEditLastName] = useState(user?.lastName || "");
  const [editProfileImageUrl, setEditProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [localUser, setLocalUser] = useState(user);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const handleLogout = () => {
    window.location.href = "/api/logout";
  };

  // Fetch analytics for number of bunk decisions
  const { data: analytics } = useQuery({
    queryKey: ["/api/analytics"],
    retry: false,
  });
  // Fetch badges for number of badges
  const { data: badges } = useQuery({
    queryKey: ["/api/user-badges"],
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <Header />
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-6 animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
        <BottomNavigation currentPage="profile" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      
      <main className="w-full max-w-2xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto px-2 sm:px-4 md:px-8 py-4 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-2">Profile</h2>
          <p className="text-muted-foreground">Manage your account and achievements</p>
        </div>

        {/* User Info */}
        <Card className="border-none shadow-lg mb-4 sm:mb-6 bg-card text-card-foreground">
          <CardContent className="p-4 sm:p-6">
            <div className="text-center mb-4 sm:mb-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full overflow-hidden">
                {localUser?.profileImageUrl ? (
                  <img 
                    src={localUser.profileImageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-primary to-purple-600 flex items-center justify-center">
                    <User className="w-8 h-8 text-white" />
                  </div>
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {localUser?.firstName || localUser?.lastName 
                  ? `${localUser.firstName || ''} ${localUser.lastName || ''}`.trim()
                  : 'Student'
                }
              </h3>
              <p className="text-muted-foreground">{localUser?.email || 'No email provided'}</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600">{localUser?.email || 'Not provided'}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Member Since</p>
                  <p className="text-sm text-gray-600">
                    {localUser?.createdAt 
                      ? new Date(localUser.createdAt).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>

              {/* Full Name */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Full Name</p>
                  <p className="text-sm text-gray-600">{`${localUser?.firstName || ''} ${localUser?.lastName || ''}`.trim() || 'Not provided'}</p>
                </div>
              </div>

              {/* Last Login (placeholder) */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Last Login</p>
                  <p className="text-sm text-gray-600">(Not tracked)</p>
                </div>
              </div>

              {/* Number of Bunk Decisions */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-5 h-5 flex items-center justify-center bg-primary text-white rounded-full font-bold">{(analytics as any)?.totalBunks ?? '-'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Bunk Decisions</p>
                  <p className="text-sm text-gray-600">Number of times you made a bunk decision</p>
                </div>
              </div>

              {/* Number of Badges */}
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="w-5 h-5 flex items-center justify-center bg-secondary text-white rounded-full font-bold">{Array.isArray(badges) ? badges.length : '-'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-900">Badges Earned</p>
                  <p className="text-sm text-gray-600">Number of achievement badges</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col md:flex-row gap-2 mt-4">
                {/* Wrap Edit Profile in Dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full md:w-auto mb-2">Edit Profile</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>Update your name and profile image.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={async e => {
                      e.preventDefault();
                      const res = await fetch("/api/auth/update-profile", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ firstName: editFirstName, lastName: editLastName, profileImageUrl: editProfileImageUrl }),
                        credentials: "include",
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setLocalUser(data.user);
                        // DialogClose is handled by Dialog component
                      } else {
                        alert("Failed to update profile");
                      }
                    }} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">First Name</label>
                        <input type="text" className="w-full border p-2 rounded" value={editFirstName} onChange={e => setEditFirstName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Last Name</label>
                        <input type="text" className="w-full border p-2 rounded" value={editLastName} onChange={e => setEditLastName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Profile Image URL</label>
                        <input type="text" className="w-full border p-2 rounded" value={editProfileImageUrl} onChange={e => setEditProfileImageUrl(e.target.value)} />
                      </div>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button type="button" variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" variant="default">Save</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" className="w-full md:w-auto">Change Password</Button>
                <Button variant="destructive" className="w-full md:w-auto">Delete Account</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <BadgeSystem />

        {/* Logout Button */}
        <Card className="border-none shadow-lg mt-6">
          <CardContent className="p-6">
            <Button 
              onClick={handleLogout}
              variant="destructive"
              className="w-full"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </CardContent>
        </Card>
      </main>
      
      <BottomNavigation currentPage="profile" />
    </div>
  );
}
