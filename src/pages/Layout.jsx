

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Utensils, LineChart, Plus, MessageCircle, LogOut, Scale, BarChart2, Home } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import { User } from "@/api/entities";
import { UserProfile } from "@/api/entities"; 
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const LazyContent = ({ children, loading }) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }
  return children;
};

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profilePicture, setProfilePicture] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        setLoading(true);
        const user = await User.me();
        setCurrentUser(user);
        
        if (user.profile_picture) {
          setProfilePicture(user.profile_picture);
        }
        
        try {
          const profileData = await UserProfile.filter({ user_id: user.id });
          if (profileData.length > 0) {
            setUserProfile(profileData[0]);
            console.log("Layout loaded user profile ID:", profileData[0].id);
            
            if (profileData[0].profile_picture) {
              setProfilePicture(profileData[0].profile_picture);
            }
          }
        } catch (err) {
          console.error("Error loading profile data in layout");
        }
        
        if (!user.completed_onboarding) {
          await User.updateMyUserData({
            display_name: user.display_name || "משתמש",
            completed_onboarding: true
          });
        }
        
        if (window.location.pathname === '/' || window.location.pathname === '') {
          navigate(createPageUrl("Dashboard"));
        }
      } catch (error) {
        console.error("Auth error in layout");
        if (currentPageName !== "Welcome") {
          navigate(createPageUrl("Welcome"));
        } 
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate, currentPageName]);

  const handleLogout = async () => {
    try {
      await User.logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center" dir="rtl">
      <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (currentPageName === "Welcome") {
    return children;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100" dir="rtl">
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="hidden md:flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link
                to={createPageUrl("Dashboard")}
                className="mr-6 text-blue-600 text-xl font-bold flex items-center"
              >
                My Diet Bot
              </Link>
              <nav className="flex items-center space-x-6">
                <Link
                  to={createPageUrl("Dashboard")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPageName === "Dashboard"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Home className="w-5 h-5 inline-block ml-1" />
                  מצב יומי
                </Link>
                <Link
                  to={createPageUrl("NutritionistChat")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPageName === "NutritionistChat"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <MessageCircle className="w-5 h-5 inline-block ml-1" />
                  תזונאי אישי
                </Link>
                <Link
                  to={createPageUrl("Meals")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPageName === "Meals"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Utensils className="w-5 h-5 inline-block ml-1" />
                  היסטוריית ארוחות
                </Link>
                <Link
                  to={createPageUrl("NutritionInsights")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPageName === "NutritionInsights"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <BarChart2 className="w-5 h-5 inline-block ml-1" />
                  תובנות
                </Link>
                <Link
                  to={createPageUrl("WeightTracker")}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    currentPageName === "WeightTracker"
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  }`}
                >
                  <Scale className="w-5 h-5 inline-block ml-1" />
                  מעקב משקל
                </Link>
              </nav>
            </div>
            
            <div className="flex items-center gap-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="p-1 h-auto">
                    <Avatar className="h-8 w-8">
                      <AvatarImage 
                        src={profilePicture} 
                        alt="Profile" 
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                        {currentUser?.display_name?.charAt(0) || "מ"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <div className="px-3 py-2 text-sm font-medium border-b">
                    {currentUser?.display_name || "משתמש"}
                  </div>
                  <DropdownMenuItem onClick={() => navigate(createPageUrl("EditProfile"))} className="cursor-pointer">
                    עריכת פרופיל
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 gap-2 cursor-pointer">
                    <LogOut className="w-4 h-4" />
                    התנתק
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          <div className="md:hidden">
            <div className="flex justify-between items-center h-14 px-1">
              <div className="flex-1 flex justify-center">
                <Link to={createPageUrl("Dashboard")} className="text-lg font-semibold text-blue-600">
                  My Diet Bot
                </Link>
              </div>
              
              <div className="absolute left-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="p-1 h-auto">
                      <Avatar className="h-7 w-7">
                        <AvatarImage 
                          src={profilePicture} 
                          alt="Profile" 
                        />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {currentUser?.display_name?.charAt(0) || "מ"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <div className="px-3 py-2 text-sm font-medium border-b">
                      {currentUser?.display_name || "משתמש"}
                    </div>
                    <DropdownMenuItem onClick={() => navigate(createPageUrl("EditProfile"))} className="cursor-pointer">
                      עריכת פרופיל
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 gap-2 cursor-pointer">
                      <LogOut className="w-4 h-4" />
                      התנתק
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
            <div className="grid grid-cols-5 border-t bg-gray-50 sticky bottom-0">
              <Link
                to={createPageUrl("Dashboard")}
                className={`flex flex-col items-center justify-center py-2 ${
                  currentPageName === "Dashboard" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600"
                }`}
              >
                <Home className="h-5 w-5 mb-1" />
                <span className="text-xs">ראשי</span>
              </Link>
              <Link
                to={createPageUrl("NutritionistChat")}
                className={`flex flex-col items-center justify-center py-2 ${
                  currentPageName === "NutritionistChat" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600"
                }`}
              >
                <MessageCircle className="h-5 w-5 mb-1" />
                <span className="text-xs">תזונאי</span>
              </Link>
              <Link
                to={createPageUrl("WeightTracker")}
                className={`flex flex-col items-center justify-center py-2 ${
                  currentPageName === "WeightTracker" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600"
                }`}
              >
                <Scale className="h-5 w-5 mb-1" />
                <span className="text-xs">משקל</span>
              </Link>
              <Link
                to={createPageUrl("NutritionInsights")}
                className={`flex flex-col items-center justify-center py-2 ${
                  currentPageName === "NutritionInsights" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600"
                }`}
              >
                <BarChart2 className="h-5 w-5 mb-1" />
                <span className="text-xs">תובנות</span>
              </Link>
              <Link
                to={createPageUrl("Meals")}
                className={`flex flex-col items-center justify-center py-2 ${
                  currentPageName === "Meals" 
                    ? "bg-blue-100 text-blue-700" 
                    : "text-gray-600"
                }`}
              >
                <Utensils className="h-5 w-5 mb-1" />
                <span className="text-xs">ארוחות</span>
              </Link>
            </div>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 overflow-y-auto">
        <LazyContent loading={loading}>{children}</LazyContent>
      </main>
      
      <footer className="bg-white shadow-inner py-4 mt-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-center items-center text-center text-gray-500 text-xs sm:text-sm">
            <div className="mb-2">
              <p>My Diet Bot &copy; {new Date().getFullYear()}</p>
              <p className="mt-1 text-xs text-gray-400">Created with 💙 by Amir Shneider</p>
            </div>
            <div className="flex gap-4 mt-2">
              <Link to={createPageUrl("NutritionistChat")} className="hover:text-blue-600">תזונאי אישי</Link>
              <Link to={createPageUrl("Meals")} className="hover:text-blue-600">היסטוריית ארוחות</Link>
              <Link to={createPageUrl("WeightTracker")} className="hover:text-blue-600">מעקב משקל</Link>
              <Link to={createPageUrl("NutritionInsights")} className="hover:text-blue-600">תובנות</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

