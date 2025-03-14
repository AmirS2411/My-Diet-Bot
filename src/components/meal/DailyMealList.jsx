import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Utensils, Plus, CalendarIcon, Pencil, Trash } from "lucide-react";
import { format, parseISO } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function DailyMealList({ meals = [], onEdit, onDelete, date = new Date() }) {
  // Group meals by type
  const mealTypes = {
    breakfast: { name: "ארוחת בוקר", icon: "🍳", color: "bg-amber-100 text-amber-800" },
    lunch: { name: "ארוחת צהריים", icon: "🥗", color: "bg-green-100 text-green-800" },
    snack: { name: "חטיף/ארוחת ביניים", icon: "🍪", color: "bg-purple-100 text-purple-800" },
    dinner: { name: "ארוחת ערב", icon: "🍽️", color: "bg-blue-100 text-blue-800" },
    night_snack: { name: "נשנושי לילה", icon: "🌙", color: "bg-indigo-100 text-indigo-800" }
  };

  const groupedMeals = {};
  
  Object.keys(mealTypes).forEach(type => {
    groupedMeals[type] = meals.filter(meal => meal.type === type);
  });

  // Calculate total calories and protein
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);

  // Check if there are any meals
  const hasMeals = meals.length > 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3 pt-5">
        <div className="flex items-center">
          <Utensils className="mr-2 h-5 w-5 text-gray-500" />
          <CardTitle className="text-lg">
            ארוחות {date ? `ל${format(typeof date === 'string' ? parseISO(date) : date, "dd/MM/yyyy")}` : "להיום"}
          </CardTitle>
        </div>
        <Link to={createPageUrl("AddMeal")}>
          <Button variant="outline" size="sm" className="flex items-center">
            <Plus className="mr-1 h-4 w-4" /> 
            הוסף ארוחה
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="pb-5">
        {!hasMeals ? (
          <div className="text-center py-6 text-gray-500">
            <Utensils className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p>לא נמצאו ארוחות מתועדות ליום זה</p>
            <p className="text-sm mt-1">התחל לתעד את הארוחות שלך כדי לעקוב אחר צריכת הקלוריות</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              {Object.entries(mealTypes).map(([type, typeInfo]) => {
                const typeMeals = groupedMeals[type] || [];
                if (typeMeals.length === 0) return null;

                return (
                  <div key={type} className="border-b pb-3 last:border-0 last:pb-0">
                    <h3 className="flex items-center font-medium text-gray-700 mb-2">
                      <span className="mr-1">{typeInfo.icon}</span>
                      {typeInfo.name}
                    </h3>
                    <div className="space-y-2">
                      {typeMeals.map(meal => (
                        <div 
                          key={meal.id} 
                          className="flex justify-between items-center p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800">{meal.description}</p>
                              {meal.photo_url && (
                                <span className="text-xs text-blue-500">📷</span>
                              )}
                            </div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {meal.calories} קל׳
                              </Badge>
                              {meal.protein > 0 && (
                                <Badge variant="outline" className="bg-blue-50 text-xs">
                                  {meal.protein}g חלבון
                                </Badge>
                              )}
                              {meal.time && (
                                <span className="text-xs text-gray-500 flex items-center">
                                  <CalendarIcon className="h-3 w-3 mr-1" />
                                  {meal.time}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center">
                            {onEdit && (
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500"
                                onClick={() => onEdit(meal)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            
                            {onDelete && (
                              <Button 
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-gray-500"
                                onClick={() => onDelete(meal)}
                              >
                                <Trash className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 pt-3 border-t flex justify-between">
              <div>
                <span className="text-sm text-gray-600">סה"כ:</span>
                <div className="flex gap-2 mt-1">
                  <Badge className="bg-orange-100 text-orange-800">
                    {totalCalories} קלוריות
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    {totalProtein}g חלבון
                  </Badge>
                </div>
              </div>
              <div className="text-sm text-gray-600">
                {meals.length} ארוחות
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}