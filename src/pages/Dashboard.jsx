
import React, { useState, useEffect } from "react";
import { Weight, Meal, UserProfile, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Scale, Utensils, Flame, Quote, LightbulbIcon, Coffee, Sun, Moon } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import MealSuggestions from "../components/nutrition/MealSuggestions";
import { Workout } from "@/api/entities";
import { Plus, Dumbbell } from "lucide-react";
import WorkoutItem from "../components/fitness/WorkoutItem";
import WorkoutForm from "../components/fitness/WorkoutForm";

export default function Dashboard() {
  const navigate = useNavigate();
  const [weights, setWeights] = useState([]);
  const [meals, setMeals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [todayStr, setTodayStr] = useState(format(new Date(), "yyyy-MM-dd"));
  const [motivationalQuote, setMotivationalQuote] = useState("");
  const [workouts, setWorkouts] = useState([]);
  const [dailyWorkoutCalories, setDailyWorkoutCalories] = useState(0);
  const [showAddWorkoutModal, setShowAddWorkoutModal] = useState(false);

  const quotes = [
    "הצעד הקטן שאתה עושה היום, הוא המרחק הגדול שתעבור מחר.",
    "תזונה נכונה היא השקעה טובה לגוף שלך.",
    "הבחירות שלך היום יעצבו את הבריאות שלך מחר.",
    "אל תוותר על מה שאתה באמת רוצה למען מה שאתה רוצה כרגע.",
    "התמדה משתלמת. המשך לעבוד על היעדים שלך.",
    "שיפור של 1% כל יום מצטבר ל-37 פי יותר טוב בסוף השנה.",
    "עצור כשאתה שבע, לא כשאתה מלא.",
    "לבחור בריא זה לאהוב את עצמך.",
    "האתגר הכי גדול הוא לא לשנות את הגוף, אלא את המחשבה.",
    "אוכל הוא דלק, לא נחמה. בחר חכם."
  ];

  useEffect(() => {
    loadData();
    setMotivationalQuote(quotes[Math.floor(Math.random() * quotes.length)]);
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      const userPromise = User.me();
      const user = await userPromise;
      if (!user.completed_onboarding) {
        navigate(createPageUrl("Onboarding"));
        return;
      }

      setCurrentUser(user);

      const profilePromise = UserProfile.filter({ user_id: user.id });
      const todayStr = format(new Date(), "yyyy-MM-dd");
      setTodayStr(todayStr);
      
      const profileData = await profilePromise;
      
      if (profileData.length > 0) {
        setUserProfile(profileData[0]);
        console.log("Dashboard loaded profile:", { 
          ...profileData[0],
          height: "REDACTED", 
          weight: "REDACTED", 
          age: "REDACTED"
        });

        const [weightData, mealData, workoutData] = await Promise.all([
          Weight.filter({ created_by: user.email }),
          Meal.filter({
            created_by: user.email,
            date: todayStr
          }),
          Workout.filter({
            created_by: user.email,
            date: todayStr
          })
        ]);
        
        console.log("Fetched meals for today:", mealData);
        
        setWeights(weightData);
        setMeals(mealData);
        setWorkouts(workoutData);

        const totalWorkoutCalories = workoutData.reduce((sum, workout) => sum + workout.calories_burned, 0);
        setDailyWorkoutCalories(totalWorkoutCalories);
      } else {
        navigate(createPageUrl("InitialQuestionnaire"));
        return;
      }
    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl("Login"));
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalCalories = () => {
    const todayMeals = meals.filter(meal => meal.date === todayStr);
    return todayMeals.reduce((sum, meal) => sum + meal.calories, 0);
  };

  const getTotalProtein = () => {
    const todayMeals = meals.filter(meal => meal.date === todayStr);
    const total = todayMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    return parseFloat(Number(total).toFixed(2));
  };

  const getBasalCalories = () => {
    return userProfile?.basal_calories || userProfile?.bmr || 0;
  };

  const getTargetDeficit = () => {
    if (!userProfile?.weight_loss_rate) return 500;

    const deficits = {
      slow: 250,
      moderate: 500,
      fast: 1000
    };

    return deficits[userProfile.weight_loss_rate] || 500;
  };

  const getAdjustedCalorieTarget = () => {
    const basalCalories = getBasalCalories();
    
    const calculationMethod = userProfile?.tdee_calculation_method || "full_activity";
    const shouldIncludeWorkouts = userProfile?.include_workout_calories !== false;
    
    let adjustedCalories = basalCalories;
    
    if (calculationMethod === "full_activity") {
      if (userProfile?.use_tdee_multiplier !== false) {
        const activityMultiplier = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9
        }[userProfile?.activity_level || 'moderate'];
        
        adjustedCalories = Math.round(basalCalories * activityMultiplier);
      }
      
      // Apply deficit based on weight loss goal
      if (userProfile?.weight_loss_rate) {
        const deficits = {
          slow: 250,
          moderate: 500,
          fast: 1000
        };
        adjustedCalories -= deficits[userProfile.weight_loss_rate] || 500;
      }
      
      return shouldIncludeWorkouts ? adjustedCalories + dailyWorkoutCalories : adjustedCalories;
    } 
    else if (calculationMethod === "sedentary_plus_exercise") {
      // Base sedentary multiplier
      adjustedCalories = Math.round(basalCalories * 1.2);
      
      // First add workout calories if enabled
      if (shouldIncludeWorkouts) {
        adjustedCalories += dailyWorkoutCalories;
      }
      
      // Then apply deficit based on weight loss goal
      if (userProfile?.weight_loss_rate) {
        const deficits = {
          slow: 250,
          moderate: 500,
          fast: 1000
        };
        adjustedCalories -= deficits[userProfile.weight_loss_rate] || 500;
      }
      
      return adjustedCalories;
    }
    else if (calculationMethod === "custom") {
      return userProfile?.calories_target || adjustedCalories;
    }
    
    return adjustedCalories;
  };

  const getCaloriesRemaining = () => {
    const target = getAdjustedCalorieTarget();
    const consumed = getTotalCalories();
    return Math.max(0, target - consumed);
  };

  const getCaloriesPercentage = () => {
    const target = getAdjustedCalorieTarget();
    if (!target) return 0;
    return Math.min(100, Math.round((getTotalCalories() / target) * 100));
  };

  const getProteinRemaining = () => {
    if (!userProfile?.protein_target) return 0;
    const remaining = Math.max(0, userProfile.protein_target - getTotalProtein());
    return parseFloat(Number(remaining).toFixed(2));
  };

  const getProteinPercentage = () => {
    if (!userProfile?.protein_target) return 0;
    return Math.min(100, Math.round((getTotalProtein() / userProfile.protein_target) * 100));
  };

  const getActivityCalories = () => {
    const calculationMethod = userProfile?.tdee_calculation_method || "full_activity";
    const basalCalories = getBasalCalories();
    
    if (!basalCalories) return 0;
    
    if (calculationMethod === "full_activity") {
      if (userProfile?.use_tdee_multiplier === false) {
        return 0;
      }
      
      const activityMultiplier = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      }[userProfile?.activity_level || 'moderate'];

      return Math.round((basalCalories * activityMultiplier) - basalCalories);
    } 
    else if (calculationMethod === "sedentary_plus_exercise") {
      return Math.round((basalCalories * 1.2) - basalCalories);
    }
    
    return 0;
  };

  const getCaloriesDeficit = () => {
    const calculationMethod = userProfile?.tdee_calculation_method || "full_activity";
    const shouldIncludeWorkouts = userProfile?.include_workout_calories !== false;
    const basalCalories = getBasalCalories();
    
    let totalCaloriesOut = basalCalories;
    
    if (calculationMethod === "full_activity") {
      if (userProfile?.use_tdee_multiplier !== false) {
        const activityMultiplier = {
          sedentary: 1.2,
          light: 1.375,
          moderate: 1.55,
          active: 1.725,
          very_active: 1.9
        }[userProfile?.activity_level || 'moderate'];
        
        totalCaloriesOut = Math.round(basalCalories * activityMultiplier);
      }
      
      if (shouldIncludeWorkouts) {
        totalCaloriesOut += dailyWorkoutCalories;
      }
    } 
    else if (calculationMethod === "sedentary_plus_exercise") {
      totalCaloriesOut = Math.round(basalCalories * 1.2);
      
      if (shouldIncludeWorkouts) {
        totalCaloriesOut += dailyWorkoutCalories;
      }
    }
    else if (calculationMethod === "custom") {
      totalCaloriesOut = userProfile?.calories_target || basalCalories;
      
      if (userProfile?.weight_loss_rate) {
        const deficits = {
          slow: 250,
          moderate: 500,
          fast: 1000
        };
        totalCaloriesOut += deficits[userProfile.weight_loss_rate] || 500;
      }
    }
    
    const totalCaloriesIn = getTotalCalories();

    return Math.max(0, totalCaloriesOut - totalCaloriesIn);
  };

  const getWeeklyWeightLossEstimate = () => {
    const dailyDeficit = getCaloriesDeficit();
    return (dailyDeficit * 7) / 7700;
  };

  const handleWorkoutAdded = async (workout) => {
    if (!workout) {
      setShowAddWorkoutModal(false);
      return;
    }
    
    console.log("Dashboard - Workout added:", workout);
    setWorkouts(prev => [...prev, workout]);
    setDailyWorkoutCalories(prev => prev + workout.calories_burned);
    setShowAddWorkoutModal(false);
    
    await loadData();
  };

  const getActualCalorieDeficit = () => {
    const basalCalories = getBasalCalories();
    const workoutCalories = dailyWorkoutCalories;
    const consumedCalories = getTotalCalories();

    const totalCaloriesOut = basalCalories + workoutCalories;

    return Math.max(0, totalCaloriesOut - consumedCalories);
  };

  const getProjectedWeightLoss = () => {
    const dailyDeficit = getActualCalorieDeficit();
    return (dailyDeficit * 7) / 7700;
  };

  const getTodayMeals = () => {
    return meals.filter(meal => meal.date === todayStr);
  };
  
  const getMealsByType = (type) => {
    const todayMeals = getTodayMeals();
    return todayMeals.filter(meal => meal.type === type);
  };
  
  const getMealTypeCalories = (type) => {
    const typeMeals = getMealsByType(type);
    return typeMeals.reduce((sum, meal) => sum + meal.calories, 0);
  };
  
  const hasMealOfType = (type) => {
    return getMealsByType(type).length > 0;
  };

  const getBaseActivityCalories = () => {
    return Math.round(getBasalCalories() * 0.2);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {userProfile && (
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-none shadow-md">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                  <AvatarImage 
                    src={currentUser?.profile_picture || userProfile.profile_picture} 
                    alt="Profile" 
                  />
                  <AvatarFallback className="bg-blue-100 text-blue-600">
                    {currentUser?.display_name?.charAt(0) || "מ"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-blue-800">
                    שלום {currentUser?.display_name || ""}!
                  </h2>
                  <p className="text-sm sm:text-base text-blue-600">
                    {format(new Date(), "EEEE, d בMMMM", { locale: he })}
                  </p>
                </div>
              </div>

              <div className="mt-3 md:mt-0 flex flex-col items-start md:items-end">
                {userProfile.starting_weight && userProfile.target_weight && (
                  <div className="text-sm text-indigo-700 font-medium mb-1">
                    {userProfile.starting_weight > userProfile.target_weight ? (
                      <>נותרו {(userProfile.starting_weight - userProfile.target_weight).toFixed(1)} ק״ג ליעד</>
                    ) : (
                      <>הגעת ליעד! כל הכבוד!</>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-blue-600 italic">
                  {[
                    "כל צעד קטן מקרב אותך ליעד!",
                    "התמדה היא המפתח להצלחה",
                    "אתה עושה עבודה נהדרת, המשך כך!",
                    "השינוי קורה מחוץ לאזור הנוחות",
                    "הדרך לניצחון מתחילה בצעד הראשון"
                  ][Math.floor(Math.random() * 5)]}
                </div>
                
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm mt-1">
                  <div className="px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-700 flex items-center">
                    <Flame className="w-3 h-3 ml-1" />
                    יעד קלוריות: {getAdjustedCalorieTarget()}
                  </div>
                  <div className="px-2 sm:px-3 py-1 rounded-full bg-green-100 text-green-700 flex items-center">
                    <span className="font-bold text-xs ml-1">P</span>
                    יעד חלבון: {userProfile.protein_target}g
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">קלוריות היום</CardTitle>
            <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className={`text-lg sm:text-2xl font-bold ${getTotalCalories() > getAdjustedCalorieTarget() ? "text-red-600" : ""}`}>
              {getTotalCalories()}
              {getTotalCalories() > getAdjustedCalorieTarget() && (
                <span className="text-xs font-normal text-red-600 ml-2">
                  (חריגה של {getTotalCalories() - getAdjustedCalorieTarget()} קל׳! ⚠️)
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              יעד: {getAdjustedCalorieTarget()} קלוריות
            </p>
            <p className={`text-xs mt-1 ${getCaloriesRemaining() <= 0 ? "text-red-600 font-medium" : "text-gray-500"}`}>
              {getCaloriesRemaining() > 0 ? (
                <>נותרו: {getCaloriesRemaining()} קלוריות</>
              ) : (
                <>⚠️ חריגה של {Math.abs(getCaloriesRemaining())} קלוריות!</>
              )}
            </p>
            <div className="mt-2">
              <Progress 
                value={getCaloriesPercentage()} 
                className="h-2 bg-gray-200" 
                indicatorClassName={getTotalCalories() > getAdjustedCalorieTarget() ? "bg-red-500" : undefined}
              />
              <p className={`text-xs mt-1 text-left ${getCaloriesPercentage() >= 100 ? "text-red-600 font-medium" : "text-gray-500"}`}>
                {getCaloriesPercentage()}%
                {getCaloriesPercentage() >= 100 && ` (${getTotalCalories() - getAdjustedCalorieTarget()} קל׳ מעל היעד ⚠️)`}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">יעד מותאם אימונים</CardTitle>
            <Dumbbell className="w-3 h-3 sm:w-4 sm:h-4 text-purple-600" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">
              {getAdjustedCalorieTarget()} קל׳
            </div>
            <div className="flex flex-col gap-1 mt-1">
              <p className="text-xs text-gray-500 flex justify-between">
                <span>קלוריות מנוחה:</span> <span>{getBasalCalories()} קל׳</span>
              </p>
              
              {userProfile?.tdee_calculation_method === "sedentary_plus_exercise" && (
                <p className="text-xs text-gray-500 flex justify-between">
                  <span>מכפיל תנועה (×1.2):</span> <span>+{getBaseActivityCalories()} קל׳</span>
                </p>
              )}
              
              {userProfile?.tdee_calculation_method === "full_activity" && userProfile?.use_tdee_multiplier !== false && (
                <p className="text-xs text-gray-500 flex justify-between">
                  <span>תוספת פעילות יומית:</span> <span>+{getActivityCalories()} קל׳</span>
                </p>
              )}
              
              {userProfile?.include_workout_calories !== false && (
                <p className="text-xs text-gray-500 flex justify-between">
                  <span>קלוריות מאימונים:</span> <span>+{dailyWorkoutCalories} קל׳</span>
                </p>
              )}
              
              {userProfile?.weight_loss_rate && userProfile?.tdee_calculation_method !== "custom" && (
                <p className="text-xs text-gray-500 flex justify-between">
                  <span>גרעון לפי קצב ירידה:</span> <span>-{getTargetDeficit()} קל׳</span>
                </p>
              )}
              
              {userProfile?.tdee_calculation_method === "custom" && (
                <p className="text-xs text-gray-500 flex justify-between italic">
                  <span>יעד מותאם אישית</span>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">חלבון היום</CardTitle>
            <span className="w-4 h-4 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold text-xs">P</span>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="text-lg sm:text-2xl font-bold">{getTotalProtein()}g</div>
            <p className="text-xs text-gray-500 mt-1">
              נותרו: {getProteinRemaining()}g
            </p>
            <div className="mt-2">
              <Progress value={getProteinPercentage()} className="h-2 bg-gray-200" />
              <p className="text-xs text-gray-500 mt-1 text-left">{getProteinPercentage()}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-500">גרעון קלורי יומי</CardTitle>
            <div className="group relative">
              <Scale className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 cursor-help" />
              
              <div className="absolute left-0 w-64 p-2 mt-2 bg-white rounded-md shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-opacity z-50 text-xs text-right">
                <p className="font-medium">איך מחושב הגרעון הקלורי:</p>
                <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600">
                  <li>קלוריות בסיס (BMR): {getBasalCalories()} קל'</li>
                  <li>קלוריות מאימונים: {dailyWorkoutCalories} קל'</li>
                  <li>סה"כ הוצאת קלוריות: {getBasalCalories() + dailyWorkoutCalories} קל'</li>
                  {meals.length > 0 && <li>צריכת קלוריות: {getTotalCalories()} קל'</li>}
                  {meals.length > 0 && <li className="font-medium">= גרעון של {getActualCalorieDeficit()} קל'</li>}
                </ul>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            {meals.length > 0 ? (
              <React.Fragment>
                <div className={`text-lg sm:text-2xl font-bold ${getActualCalorieDeficit() <= 0 ? "text-red-600" : "text-green-600"}`}>
                  {getActualCalorieDeficit() > 0 ? (
                    <>{getActualCalorieDeficit()} קל׳</>
                  ) : (
                    <>⚠️ עודף של {Math.abs(getActualCalorieDeficit())} קל׳</>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-xs text-gray-600">תחזית שבועית:</p>
                  <p className={`text-sm font-medium ${getProjectedWeightLoss() > 0 ? "text-green-600" : "text-red-600"}`}>
                    {getProjectedWeightLoss() > 0 ? (
                      <>{getProjectedWeightLoss().toFixed(2)} ק״ג בשבוע ⬇️</>
                    ) : (
                      <>⚠️ עלייה של {Math.abs(getProjectedWeightLoss()).toFixed(2)} ק״ג בשבוע ({Math.abs(getActualCalorieDeficit())} קל׳ עודף) ⬆️</>
                    )}
                  </p>
                </div>
                
                {getActualCalorieDeficit() <= 0 && (
                  <div className="mt-2 bg-red-50 p-2 rounded-md text-xs text-red-700">
                    <span className="font-bold">⚠️ אזהרה:</span> אתה בעודף קלורי של {Math.abs(getActualCalorieDeficit())} קל׳! זה יוביל לעלייה במשקל אם תמשיך כך.
                  </div>
                )}
              </React.Fragment>
            ) : (
              <div>
                <div className="bg-blue-50 p-3 rounded-md text-center">
                  <p className="text-blue-800">טרם הוזנו ארוחות להיום</p>
                  <p className="text-sm text-blue-600 mt-1">הוסף ארוחות כדי לראות את הגרעון הקלורי שלך</p>
                  <Link to={createPageUrl("AddMeal")} className="mt-2 inline-block">
                    <Button 
                      size="sm" 
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      הוסף ארוחה
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Dumbbell className="mr-2 w-5 h-5 text-purple-600" />
            אימונים היום
          </h2>
          <Button 
            size="sm" 
            className="bg-purple-600 hover:bg-purple-700" 
            onClick={() => setShowAddWorkoutModal(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            הוסף אימון
          </Button>
        </div>

        {workouts.length > 0 ? (
          <div className="space-y-3">
            {workouts.map(workout => (
              <WorkoutItem key={workout.id} workout={workout} compact={true} />
            ))}
            <div className="bg-purple-50 p-3 rounded-lg text-center">
              <p className="text-purple-800 font-medium">סה"כ קלוריות מאימונים: {dailyWorkoutCalories}</p>
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-gray-600 mb-2">לא תיעדת אימונים היום</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowAddWorkoutModal(true)}
            >
              <Plus className="w-4 h-4 mr-1" />
              הוסף אימון
            </Button>
          </div>
        )}
      </div>

      <div className="mt-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800 flex items-center">
            <Utensils className="mr-2 w-5 h-5 text-blue-600" />
            ארוחות היום
          </h2>
          <Link to={createPageUrl("AddMeal")}>
            <Button 
              size="sm" 
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              הוסף ארוחה
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Card className={`hover:shadow-md transition-all ${hasMealOfType('breakfast') ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-yellow-100 p-2 rounded-full mr-3">
                  <Coffee className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <h3 className="font-medium">ארוחת בוקר</h3>
                  <p className="text-sm text-gray-500">
                    {hasMealOfType('breakfast') ? 
                      `${getMealTypeCalories('breakfast')} קל'` : 
                      'לא תועדה'}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("AddMeal")}>
                <Button 
                  size="sm" 
                  variant={hasMealOfType('breakfast') ? "outline" : "default"}
                  className={!hasMealOfType('breakfast') ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {hasMealOfType('breakfast') ? 'פרטים' : 'הוסף'}
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-all ${hasMealOfType('lunch') ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-orange-100 p-2 rounded-full mr-3">
                  <Sun className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">ארוחת צהריים</h3>
                  <p className="text-sm text-gray-500">
                    {hasMealOfType('lunch') ? 
                      `${getMealTypeCalories('lunch')} קל'` : 
                      'לא תועדה'}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("AddMeal")}>
                <Button 
                  size="sm" 
                  variant={hasMealOfType('lunch') ? "outline" : "default"}
                  className={!hasMealOfType('lunch') ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {hasMealOfType('lunch') ? 'פרטים' : 'הוסף'}
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className={`hover:shadow-md transition-all ${hasMealOfType('snack') ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-green-100 p-2 rounded-full mr-3">
                  <Utensils className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-medium">חטיפי ביניים</h3>
                  <p className="text-sm text-gray-500">
                    {hasMealOfType('snack') ? 
                      `${getMealTypeCalories('snack')} קל'` : 
                      'לא תועדו'}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("AddMeal")}>
                <Button 
                  size="sm" 
                  variant={hasMealOfType('snack') ? "outline" : "default"}
                  className={!hasMealOfType('snack') ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {hasMealOfType('snack') ? 'פרטים' : 'הוסף'}
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className={`hover:shadow-md transition-all ${hasMealOfType('dinner') ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-full mr-3">
                  <Moon className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-medium">ארוחת ערב</h3>
                  <p className="text-sm text-gray-500">
                    {hasMealOfType('dinner') ? 
                      `${getMealTypeCalories('dinner')} קל'` : 
                      'לא תועדה'}
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("AddMeal")}>
                <Button 
                  size="sm" 
                  variant={hasMealOfType('dinner') ? "outline" : "default"}
                  className={!hasMealOfType('dinner') ? "bg-blue-600 hover:bg-blue-700" : ""}
                >
                  {hasMealOfType('dinner') ? 'פרטים' : 'הוסף'}
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card className="col-span-1 sm:col-span-2 md:col-span-4 bg-blue-50 hover:shadow-md transition-all">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-full mr-3">
                  <Flame className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-medium">סה"כ קלוריות מארוחות</h3>
                  <p className="text-sm text-gray-500">
                    {getTotalCalories()} קל' ({getTotalProtein()}g חלבון)
                  </p>
                </div>
              </div>
              <Link to={createPageUrl("Meals")}>
                <Button variant="outline" size="sm">
                  לכל הארוחות
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {showAddWorkoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowAddWorkoutModal(false)}
          />
          
          <div className="fixed z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4">
              <h2 className="text-lg font-bold">תיעוד אימון חדש</h2>
              <p className="text-sm text-gray-500">תעד את האימון שלך לחישוב הקלוריות שנשרפו</p>
            </div>
            
            <button
              className="absolute right-4 top-4 rounded-full p-1 text-gray-500 hover:bg-gray-100"
              onClick={() => setShowAddWorkoutModal(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            
            <WorkoutForm onComplete={handleWorkoutAdded} date={todayStr} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <Quote className="w-4 h-4 text-blue-600" />
              <CardTitle className="text-md sm:text-lg">ציטוט יומי</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <blockquote className="border-r-4 border-blue-200 pr-4 py-2 italic text-gray-700">
              "{motivationalQuote}"
            </blockquote>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-5">
            <div className="flex items-center gap-2">
              <LightbulbIcon className="w-4 h-4 text-yellow-500" />
              <CardTitle className="text-md sm:text-lg">תובנות מהיום</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 pt-0 sm:pt-0">
            <MealSuggestions meals={meals.filter(m => m.date === todayStr)} userProfile={userProfile} />
          </CardContent>
        </Card>
      </div>

      <div className="mt-4 sm:mt-6 text-center">
        <Link to={createPageUrl("EditProfile")}>
          <Button variant="outline" className="mx-auto text-sm">
            עריכת פרופיל ונתונים
          </Button>
        </Link>
        <p className="text-xs text-gray-500 mt-2">
          לשינוי יעדים, מידות גוף, או רמת פעילות
        </p>
      </div>
    </div>
  );
}
