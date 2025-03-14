
import React, { useState, useEffect } from "react";
import { Meal, User, MealLike, Achievement } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight, Search, Filter, Trophy } from "lucide-react";
import MealGalleryItem from "../components/social/MealGalleryItem";
import AchievementCard from "../components/social/AchievementCard";
import { format, subDays } from "date-fns";

export default function MealGallery() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("my-meals");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("newest");
  const [userLikes, setUserLikes] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const user = await User.me();
        setCurrentUser(user);

        // Load user meals
        const userMeals = await Meal.list("-date");
        
        // Load likes from all the user's meals
        const allLikes = await MealLike.list();
        
        // Create a map of meal_id to count of likes
        const mealLikesCount = allLikes.reduce((acc, like) => {
          acc[like.meal_id] = (acc[like.meal_id] || 0) + 1;
          return acc;
        }, {});
        
        // Create a map of meal_id to whether current user liked it
        const userLikedMeals = allLikes.reduce((acc, like) => {
          if (like.user_id === user.id) {
            acc[like.meal_id] = true;
          }
          return acc;
        }, {});
        
        // Add likes count and liked status to meals
        const mealsWithLikes = userMeals.map(meal => ({
          ...meal,
          likes: mealLikesCount[meal.id] || 0,
          liked: userLikedMeals[meal.id] || false
        }));
        
        setMeals(mealsWithLikes);
        setUserLikes(userLikedMeals);
        
        // Load achievements
        const userAchievements = await Achievement.filter({ user_id: user.id });
        setAchievements(userAchievements);

        // Check if we should create a streak achievement
        await checkAndCreateStreakAchievement(user.id, userMeals);
      } catch (error) {
        console.error("Error loading data:", error);
        navigate(createPageUrl("Login"));
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // Function to check for streak achievements
  const checkAndCreateStreakAchievement = async (userId, meals) => {
    try {
      // Group meals by date
      const mealsByDate = meals.reduce((acc, meal) => {
        acc[meal.date] = true;
        return acc;
      }, {});
      
      // Check how many consecutive days there are
      const today = new Date();
      let streakDays = 0;
      let foundEmptyDay = false;
      
      for (let i = 0; i < 365; i++) { // Check up to a year back
        const checkDate = subDays(today, i);
        const dateStr = format(checkDate, "yyyy-MM-dd");
        
        if (mealsByDate[dateStr]) {
          if (!foundEmptyDay) {
            streakDays++;
          }
        } else {
          foundEmptyDay = true;
        }
      }
      
      // If streak is 7, 30, 60, 90 days, create an achievement if it doesn't exist
      const streakMilestones = [7, 30, 60, 90];
      
      if (streakMilestones.includes(streakDays)) {
        // Check if this achievement already exists
        const existingAchievement = await Achievement.filter({
          user_id: userId,
          type: "streak",
          title: `רצף של ${streakDays} ימים!`
        });
        
        if (existingAchievement.length === 0) {
          // Create new achievement
          await Achievement.create({
            user_id: userId,
            type: "streak",
            title: `רצף של ${streakDays} ימים!`,
            description: `תיעדת את הארוחות שלך ${streakDays} ימים ברציפות! המשך כך!`,
            date: format(today, "yyyy-MM-dd")
          });
          
          // Reload achievements
          const updatedAchievements = await Achievement.filter({ user_id: userId });
          setAchievements(updatedAchievements);
        }
      }
    } catch (error) {
      console.error("Error creating streak achievement:", error);
    }
  };

  const handleLikeMeal = async (mealId) => {
    try {
      if (!currentUser) return;
      
      const isLiked = userLikes[mealId];
      
      if (isLiked) {
        // Remove like
        const existingLikes = await MealLike.filter({
          meal_id: mealId,
          user_id: currentUser.id
        });
        
        if (existingLikes.length > 0) {
          await MealLike.delete(existingLikes[0].id);
        }
      } else {
        // Add like
        await MealLike.create({
          meal_id: mealId,
          user_id: currentUser.id,
          created_date: new Date().toISOString()
        });
      }
      
      // Update local state
      const updatedLikes = { ...userLikes };
      updatedLikes[mealId] = !isLiked;
      setUserLikes(updatedLikes);
      
      // Update meal like count in UI
      setMeals(prevMeals => prevMeals.map(meal => {
        if (meal.id === mealId) {
          return {
            ...meal,
            liked: !isLiked,
            likes: isLiked ? Math.max(0, meal.likes - 1) : meal.likes + 1
          };
        }
        return meal;
      }));
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };
  
  // Filter meals based on search term and type filter
  const filteredMeals = meals.filter(meal => {
    const matchesSearch = meal.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || meal.type === typeFilter;
    return matchesSearch && matchesType;
  });
  
  // Sort meals
  const sortedMeals = [...filteredMeals].sort((a, b) => {
    if (sortOrder === "newest") {
      return new Date(b.date) - new Date(a.date);
    } else if (sortOrder === "oldest") {
      return new Date(a.date) - new Date(b.date);
    } else if (sortOrder === "most_liked") {
      return b.likes - a.likes;
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="ml-auto text-sm"
        >
          <ArrowRight className="w-4 h-4 ml-2" />
          חזור
        </Button>
      </div>
      
      <h1 className="text-2xl font-bold">גלריית ארוחות והישגים</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-2">
          <TabsTrigger value="my-meals">הארוחות שלי</TabsTrigger>
          <TabsTrigger value="achievements">ההישגים שלי</TabsTrigger>
        </TabsList>
        
        <TabsContent value="my-meals" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">סינון וחיפוש</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="חפש ארוחות..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-3 pr-10"
                />
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Select
                    value={typeFilter}
                    onValueChange={setTypeFilter}
                  >
                    <SelectTrigger className="w-full">
                      <Filter className="h-4 w-4 ml-2 text-muted-foreground" />
                      <SelectValue placeholder="סוג ארוחה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">כל סוגי הארוחות</SelectItem>
                      <SelectItem value="breakfast">ארוחת בוקר</SelectItem>
                      <SelectItem value="lunch">ארוחת צהריים</SelectItem>
                      <SelectItem value="dinner">ארוחת ערב</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Select
                    value={sortOrder}
                    onValueChange={setSortOrder}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="מיון" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">החדש ביותר</SelectItem>
                      <SelectItem value="oldest">הישן ביותר</SelectItem>
                      <SelectItem value="most_liked">הכי אהובים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {sortedMeals.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {sortedMeals.map((meal) => (
                <MealGalleryItem 
                  key={meal.id} 
                  meal={meal}
                  onLike={handleLikeMeal}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">לא נמצאו ארוחות. 
                  {typeFilter !== "all" || searchTerm 
                    ? " נסה לשנות את הסינון או החיפוש." 
                    : " התחל להוסיף ארוחות כדי לראות אותן כאן."}
                </p>
                <Button 
                  className="mt-4 bg-blue-600 hover:bg-blue-700"
                  onClick={() => navigate(createPageUrl("AddMeal"))}
                >
                  הוסף ארוחה חדשה
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-4">
          {achievements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <AchievementCard 
                  key={achievement.id} 
                  achievement={achievement} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">עדיין אין הישגים</h3>
                <p className="text-muted-foreground">המשך לתעד את הארוחות והמשקל שלך כדי לפתוח הישגים.</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
