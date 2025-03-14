
import React, { useState, useEffect } from "react";
import { Meal, User, UserProfile } from "@/api/entities";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Clock, Flame, Trash2, Plus, Scale, Search, FileDown, Dumbbell } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Workout } from "@/api/entities";
import WorkoutForm from "../components/fitness/WorkoutForm";
import WorkoutItem from "../components/fitness/WorkoutItem";

export default function MealsPage() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [allMeals, setAllMeals] = useState([]);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeView, setActiveView] = useState("daily");
  const [viewingMeal, setViewingMeal] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [showMealDetailModal, setShowMealDetailModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [dateString, setDateString] = useState(selectedDate);
  const [availableDates, setAvailableDates] = useState([]);
  const [searchResults, setSearchResults] = useState([]);

  const mealTypeToHebrew = (type) => {
    const types = {
      breakfast: "ארוחת בוקר",
      lunch: "ארוחת צהריים",
      dinner: "ארוחת ערב",
      snack: "חטיף ביניים",
      night_snack: "נשנוש לילה"
    };
    return types[type] || type;
  };

  const deleteMeal = async (mealId) => {
    if (window.confirm("האם אתה בטוח שברצונך למחוק ארוחה זו?")) {
      try {
        setIsDeleting(true);
        await Meal.delete(mealId);
        setMeals(meals.filter(meal => meal.id !== mealId));
        if (showMealDetailModal) {
          setShowMealDetailModal(false);
        }
        setSuccessMessage({
          title: "ארוחה נמחקה",
          description: "הארוחה נמחקה בהצלחה."
        });
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } catch (error) {
        console.error("Error deleting meal:", error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const openMealDetail = (meal) => {
    setViewingMeal(meal);
    setShowMealDetailModal(true);
  };

  const handleWorkoutAdded = async (workout) => {
    if (!workout) {
      setShowWorkoutModal(false);
      return;
    }
    console.log("Workout added:", workout);
    setWorkouts(prev => [...prev, workout]);
    setShowWorkoutModal(false);
    try {
      const workoutData = await Workout.filter({
        created_by: currentUser.email,
        date: dateString
      });
      setWorkouts(workoutData);
      setSuccessMessage({
        title: "אימון נוסף",
        description: "האימון נוסף בהצלחה."
      });

      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error("Error reloading workouts:", error);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadMealsForDate();
  }, [dateString, currentUser]);

  const loadInitialData = async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      setCurrentUser(user);
      const profilePromise = UserProfile.filter({ user_id: user.id });
      const today = new Date();
      const todayString = format(today, "yyyy-MM-dd");
      setDateString(todayString);
      const allMealData = await Meal.filter({ created_by: user.email }, "-created_date", 100);
      setAllMeals(allMealData);
      const dates = Array.from(new Set(allMealData.map(m => m.date))).sort().reverse();
      setAvailableDates(dates);
      const profileData = await profilePromise;
      if (profileData.length > 0) {
        setUserProfile(profileData[0]);
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      navigate(createPageUrl("Login"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMealsForDate = async () => {
    if (!currentUser) return;
    try {
      setIsLoading(true);
      const [mealData, workoutData] = await Promise.all([
        Meal.filter({
          created_by: currentUser.email,
          date: dateString
        }, "-created_date"),
        Workout.filter({
          created_by: currentUser.email,
          date: dateString
        })
      ]);
      setMeals(mealData);
      setWorkouts(workoutData);
    } catch (error) {
      console.error("Error loading meals for date:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDateOptions = () => {
    const today = new Date();
    const pastDates = [];
    for (let i = 0; i < 30; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, "yyyy-MM-dd");
      pastDates.push(dateStr);
    }
    const allDates = [...pastDates, ...availableDates];
    return Array.from(new Set(allDates)).sort().reverse();
  };

  const dateOptions = generateDateOptions();

  return (
    <div className="space-y-6">
      {successMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded shadow-md">
          <div className="font-bold">{successMessage.title}</div>
          <div className="text-sm">{successMessage.description}</div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">יומן ארוחות</h1>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link to={createPageUrl("AddMeal")} className="sm:mr-auto">
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 ml-1" />
              הוסף ארוחה
            </Button>
          </Link>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {}}
            title="ייצא נתונים כקובץ CSV"
          >
            <FileDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Tabs defaultValue="daily" onValueChange={setActiveView} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="daily">יומי</TabsTrigger>
          <TabsTrigger value="search">חיפוש ארוחות</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="space-y-4">
          <Select value={dateString} onValueChange={setDateString}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="בחר תאריך" />
            </SelectTrigger>
            <SelectContent>
              {dateOptions.map(date => (
                <SelectItem key={date} value={date}>
                  {format(new Date(date), "EEEE, dd/MM/yyyy", { locale: he })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid gap-3 sm:gap-4">
              {meals.length > 0 ? (
                meals.sort((a, b) => {
                  if (a.time && b.time) {
                    return a.time.localeCompare(b.time);
                  }
                  return new Date(a.created_date) - new Date(b.created_date);
                }).map((meal) => (
                  <Card 
                    key={meal.id} 
                    className="relative group hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => openMealDetail(meal)}
                  >
                    <CardContent className="p-4 sm:p-6">
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                        <div className="col-span-1 sm:col-span-2">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-blue-600">
                              {mealTypeToHebrew(meal.type)}
                            </span>
                            <p className="text-base sm:text-lg font-medium">{meal.description}</p>
                            {meal.portion_size && (
                              <span className="text-xs text-gray-500 mt-1">
                                כמות: {meal.portion_size}
                              </span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center text-orange-600 gap-1 mb-1">
                            <Flame className="w-4 h-4" />
                            <span className="text-xs sm:text-sm text-gray-500">קלוריות</span>
                          </div>
                          <p className="font-medium">{meal.calories}</p>
                        </div>
                        <div>
                          <div className="flex items-center text-gray-600 gap-1 mb-1">
                            <Clock className="w-4 h-4" />
                            <span className="text-xs sm:text-sm text-gray-500">שעה</span>
                          </div>
                          <p className="font-medium">
                            {meal.time || format(new Date(meal.created_date), "HH:mm")}
                          </p>
                        </div>
                      </div>

                      {meal.photo_url && (
                        <div className="mt-2 sm:mt-3">
                          <div className="w-full h-20 bg-gray-100 rounded-md overflow-hidden relative">
                            <img 
                              src={meal.photo_url} 
                              alt={meal.description} 
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteMeal(meal.id);
                        }}
                        disabled={isDeleting}
                        className="absolute top-3 sm:top-4 left-3 sm:left-4 p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 sm:py-12 text-gray-500 text-sm sm:text-base">
                  לא נמצאו ארוחות בתאריך זה
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="search" className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="חפש ארוחות לפי תיאור..."
              className="flex-1"
            />
            <Button variant="outline" className="shrink-0">
              <Search className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="grid gap-3 sm:gap-4">
            {searchTerm && searchResults.length > 0 ? (
              searchResults.map((meal) => (
                <Card 
                  key={meal.id} 
                  className="relative group hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => openMealDetail(meal)}
                >
                  <CardContent className="p-4 sm:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 sm:gap-4">
                      <div className="col-span-1 sm:col-span-2">
                        <div className="flex flex-col">
                          <span className="text-xs text-gray-500">
                            {format(new Date(meal.date), "dd/MM/yyyy")}
                          </span>
                          <span className="text-sm font-medium text-blue-600">
                            {mealTypeToHebrew(meal.type)}
                          </span>
                          <p className="text-base font-medium">{meal.description}</p>
                        </div>
                      </div>
                      <div>
                        <div className="flex items-center text-orange-600 gap-1 mb-1">
                          <Flame className="w-4 h-4" />
                          <span className="text-xs sm:text-sm text-gray-500">קלוריות</span>
                        </div>
                        <p className="font-medium">{meal.calories}</p>
                      </div>
                      <div>
                        <div className="flex items-center text-blue-600 gap-1 mb-1">
                          <span className="font-bold text-xs">P</span>
                          <span className="text-xs sm:text-sm text-gray-500">חלבון</span>
                        </div>
                        <p className="font-medium">{meal.protein || 0}g</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : searchTerm ? (
              <div className="text-center py-8 text-gray-500">
                לא נמצאו ארוחות התואמות לחיפוש
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                הקלד מילת חיפוש כדי למצוא ארוחות
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800 flex items-center">
            <Dumbbell className="mr-2 h-5 w-5 text-purple-600" />
            אימונים ביום {format(parseISO(dateString), "dd/MM/yyyy")}
          </h2>
          <Button 
            onClick={() => setShowWorkoutModal(true)}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            הוסף אימון
          </Button>
        </div>

        {workouts.length > 0 ? (
          <div className="space-y-4">
            {workouts.map(workout => (
              <WorkoutItem key={workout.id} workout={workout} />
            ))}
            <div className="bg-purple-50 p-4 rounded-lg text-center">
              <p className="text-purple-800 font-medium">
                סה"כ קלוריות שנשרפו: {workouts.reduce((sum, w) => sum + w.calories_burned, 0)} קל'
              </p>
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="p-6 text-center">
              <p className="text-gray-500 mb-4">לא נמצאו אימונים לתאריך זה</p>
              <Button 
                variant="outline" 
                onClick={() => setShowWorkoutModal(true)}
              >
                <Dumbbell className="mr-2 h-4 w-4" />
                הוסף אימון חדש
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {showWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWorkoutModal(false)}
          />
          
          <div className="fixed z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-bold">תיעוד אימון חדש</h2>
              <p className="text-sm text-gray-500">תעד את האימון שלך לחישוב הקלוריות שנשרפו</p>
            </div>
            
            <button
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
              onClick={() => setShowWorkoutModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <WorkoutForm onComplete={handleWorkoutAdded} date={dateString} />
          </div>
        </div>
      )}
      
      {showMealDetailModal && viewingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowMealDetailModal(false)}
          />
          
          <div className="fixed z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-bold">פרטי ארוחה</h2>
            </div>
            
            <button
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
              onClick={() => setShowMealDetailModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <div className="space-y-4">
              {viewingMeal.photo_url && (
                <div className="w-full h-48 bg-gray-100 rounded-md overflow-hidden">
                  <img 
                    src={viewingMeal.photo_url} 
                    alt={viewingMeal.description} 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{viewingMeal.description}</h3>
                  <span className="text-blue-600 font-medium">
                    {mealTypeToHebrew(viewingMeal.type)}
                  </span>
                </div>
                
                <div className="mt-1 text-sm text-gray-500">
                  {format(new Date(viewingMeal.date), "EEEE, dd/MM/yyyy", { locale: he })}
                  {viewingMeal.time && ` · ${viewingMeal.time}`}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 bg-blue-50 p-3 rounded-lg">
                <div>
                  <div className="flex items-center text-orange-600 gap-1">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs text-gray-700">קלוריות</span>
                  </div>
                  <p className="font-bold text-lg">{viewingMeal.calories}</p>
                </div>
                
                <div>
                  <div className="flex items-center text-blue-600 gap-1">
                    <span className="font-bold text-xs">P</span>
                    <span className="text-xs text-gray-700">חלבון</span>
                  </div>
                  <p className="font-bold text-lg">{viewingMeal.protein || 0}g</p>
                </div>
              </div>
              
              {viewingMeal.portion_size && (
                <div>
                  <h4 className="text-sm font-medium">גודל מנה</h4>
                  <p>{viewingMeal.portion_size}</p>
                </div>
              )}
              
              {viewingMeal.notes && (
                <div>
                  <h4 className="text-sm font-medium">הערות</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{viewingMeal.notes}</p>
                </div>
              )}
              
              <div className="pt-2 flex justify-between">
                <Button variant="outline" onClick={() => setShowMealDetailModal(false)}>
                  סגור
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    deleteMeal(viewingMeal.id);
                    setShowMealDetailModal(false);
                  }}
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 ml-2" />
                  מחק ארוחה
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
