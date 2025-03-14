import React, { useState, useEffect } from "react";
import { Meal, UserProfile, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, subDays, isToday, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { ArrowRight, BarChart2, Calendar, AlertTriangle } from "lucide-react";
import NutrientBreakdown from "../components/nutrition/NutrientBreakdown";
import MealSuggestions from "../components/nutrition/MealSuggestions";
import WeeklyCaloriesChart from "../components/nutrition/WeeklyCaloriesChart";

export default function NutritionInsights() {
  const navigate = useNavigate();
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [dateRange, setDateRange] = useState("day");

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterMealsByDate();
  }, [selectedDate, dateRange, meals]);

  const loadData = async () => {
    try {
      setLoading(true);
      const user = await User.me();
      
      if (!user.completed_onboarding) {
        navigate(createPageUrl("Onboarding"));
        return;
      }
      
      const mealData = await Meal.list("-date");
      setMeals(mealData);
      
      const profileData = await UserProfile.filter({ user_id: user.id });
      if (profileData.length > 0) {
        setUserProfile(profileData[0]);
      } else {
        navigate(createPageUrl("InitialQuestionnaire"));
        return;
      }
      
      filterMealsByDate();
    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl("Login"));
    } finally {
      setLoading(false);
    }
  };

  const filterMealsByDate = () => {
    if (!meals || !meals.length) {
      setFilteredMeals([]);
      return;
    }
    
    let filtered;
    
    if (dateRange === "day") {
      filtered = meals.filter(meal => meal.date === selectedDate);
    } else if (dateRange === "week") {
      const selectedDateObj = new Date(selectedDate);
      const weekAgo = subDays(selectedDateObj, 7);
      
      filtered = meals.filter(meal => {
        const mealDate = new Date(meal.date);
        return mealDate >= weekAgo && mealDate <= selectedDateObj;
      });
    } else if (dateRange === "month") {
      const selectedMonth = selectedDate.substring(0, 7); // YYYY-MM
      filtered = meals.filter(meal => meal.date.startsWith(selectedMonth));
    }
    
    setFilteredMeals(filtered || []);
  };

  const uniqueDates = Array.from(new Set(meals.map(m => m.date))).sort().reverse();
  
  const getCalorieAverage = () => {
    if (!filteredMeals || !filteredMeals.length) return 0;
    
    const total = filteredMeals.reduce((sum, meal) => sum + meal.calories, 0);
    
    if (dateRange === "day") {
      return total;
    } else if (dateRange === "week") {
      return Math.round(total / 7);
    } else if (dateRange === "month") {
      return Math.round(total / 30);
    }
    
    return total;
  };
  
  const getProteinAverage = () => {
    if (!filteredMeals || !filteredMeals.length) return 0;
    
    const total = filteredMeals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
    
    if (dateRange === "day") {
      return total;
    } else if (dateRange === "week") {
      return Math.round(total / 7);
    } else if (dateRange === "month") {
      return Math.round(total / 30);
    }
    
    return total;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold">תובנות תזונתיות</h1>
        
        <div className="flex gap-2 w-full sm:w-auto">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="טווח זמן" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">יום</SelectItem>
              <SelectItem value="week">שבוע</SelectItem>
              <SelectItem value="month">חודש</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedDate} onValueChange={setSelectedDate}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {uniqueDates.length > 0 ? (
                uniqueDates.map(date => (
                  <SelectItem key={date} value={date}>
                    {format(new Date(date), dateRange === "month" ? "MMMM yyyy" : "dd/MM/yyyy", { locale: he })}
                    {isToday(parseISO(date)) && " (היום)"}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value={format(new Date(), "yyyy-MM-dd")}>
                  {format(new Date(), "dd/MM/yyyy", { locale: he })} (היום)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Hide chart only if there are no meals at all */}
      {meals.length > 0 && (
        <WeeklyCaloriesChart meals={meals} userProfile={userProfile} />
      )}
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">קלוריות {dateRange === "day" ? "היום" : dateRange === "week" ? "ממוצע שבועי" : "ממוצע חודשי"}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{getCalorieAverage()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {userProfile?.calories_target && `יעד: ${userProfile.calories_target}`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">חלבון {dateRange === "day" ? "היום" : dateRange === "week" ? "ממוצע שבועי" : "ממוצע חודשי"}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{getProteinAverage()}g</div>
            <p className="text-xs text-gray-500 mt-1">
              {userProfile?.protein_target && `יעד: ${userProfile.protein_target}g`}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">מספר ארוחות</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{filteredMeals.length}</div>
            <p className="text-xs text-gray-500 mt-1">
              {dateRange === "day" ? "ביום זה" : dateRange === "week" ? "בשבוע זה" : "בחודש זה"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">ארוחה עיקרית</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {filteredMeals.length > 0 ? (
              <>
                <div className="text-lg font-bold truncate">
                  {filteredMeals.reduce((prev, current) => {
                    return (prev.calories > current.calories) ? prev : current;
                  }).description}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {filteredMeals.reduce((prev, current) => {
                    return (prev.calories > current.calories) ? prev : current;
                  }).calories} קלוריות
                </p>
              </>
            ) : (
              <div className="text-sm text-gray-500">אין נתונים</div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {filteredMeals.length === 0 ? (
        <Card className="bg-blue-50 border-blue-100">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-blue-800 mb-2">אין נתוני ארוחות לתאריך זה</h3>
            <p className="text-blue-600 mb-4">
              כדי לקבל תובנות מפורטות, אנא הוסף ארוחות למעקב שלך.
            </p>
            <Link to={createPageUrl("AddMeal")}>
              <Button className="bg-blue-600 hover:bg-blue-700">הוסף ארוחה חדשה</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <NutrientBreakdown meals={filteredMeals} userProfile={userProfile} />
          
          <MealSuggestions meals={filteredMeals} userProfile={userProfile} />
        </>
      )}
    </div>
  );
}