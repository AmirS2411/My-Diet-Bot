import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon, Utensils, Clock, Flame } from "lucide-react";

export default function MealSuggestions({ meals, userProfile }) {
  const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  
  const calorieTarget = userProfile?.calories_target || 2000;
  const proteinTarget = userProfile?.protein_target || 120;
  
  const caloriesRemaining = Math.max(0, calorieTarget - totalCalories);
  const proteinRemaining = Math.max(0, proteinTarget - totalProtein);
  
  const getRecommendations = () => {
    // Check if patterns suggest issues or areas for improvement
    const suggestions = [];
    
    // Check if any meal data exists
    if (meals.length === 0) {
      return [{
        title: "התחל לתעד את הארוחות שלך",
        description: "רישום כל הארוחות שלך יעזור לך לעקוב אחר צריכת הקלוריות והתזונה שלך ולהגיע ליעדים שלך.",
        icon: <Utensils className="h-5 w-5 text-blue-500" />
      }];
    }
    
    // Breakfast missing
    const hasBreakfast = meals.some(meal => meal.type === 'breakfast');
    if (!hasBreakfast) {
      suggestions.push({
        title: "הוסף ארוחת בוקר",
        description: "אכילת ארוחת בוקר יכולה לעזור להאיץ את חילוף החומרים ולהפחית את הרעב מאוחר יותר ביום.",
        icon: <Clock className="h-5 w-5 text-blue-500" />
      });
    }
    
    // Low protein
    if (totalProtein < (proteinTarget * 0.7)) {
      suggestions.push({
        title: "הגדל את צריכת החלבון",
        description: "חלבון עוזר בשימור מסת שריר בזמן הרזיה. נסה להוסיף מקורות חלבון כמו ביצים, חזה עוף, או קטניות.",
        icon: <LightbulbIcon className="h-5 w-5 text-green-500" />
      });
    }
    
    // High calorie snacks
    const highCalorieSnacks = meals.filter(meal => meal.type === 'snack' && meal.calories > 300);
    if (highCalorieSnacks.length > 0) {
      suggestions.push({
        title: "החלף חטיפים עתירי קלוריות",
        description: "חטיפים שלך מכילים קלוריות רבות. שקול להחליף אותם באפשרויות דלות יותר בקלוריות כמו ירקות, פירות, או יוגורט.",
        icon: <Flame className="h-5 w-5 text-orange-500" />
      });
    }
    
    // Evening eating
    const eveningMeals = meals.filter(m => {
      const time = m.time || "12:00";
      const hour = parseInt(time.split(':')[0]);
      return hour >= 20;
    });
    
    const eveningCalories = eveningMeals.reduce((sum, meal) => sum + meal.calories, 0);
    if (eveningCalories > (totalCalories * 0.4)) {
      suggestions.push({
        title: "הפחת אכילת ערב מאוחרת",
        description: "אתה צורך חלק גדול מהקלוריות שלך בערב. נסה להקדים את הארוחות ולהימנע מאכילה 3 שעות לפני השינה.",
        icon: <Clock className="h-5 w-5 text-purple-500" />
      });
    }
    
    // If user is near/at target, offer a healthy meal suggestion
    if (caloriesRemaining <= 500 && caloriesRemaining > 0) {
      suggestions.push({
        title: "רעיון לארוחה מאוזנת",
        description: `נותרו לך ${caloriesRemaining} קלוריות היום. שקול ${proteinRemaining > 20 ? 'סלט עם חזה עוף צלוי וטחינה' : 'מרק ירקות עם קרוטונים מחיטה מלאה'}.`,
        icon: <Utensils className="h-5 w-5 text-green-500" />
      });
    }
    
    // If no specific issues found
    if (suggestions.length === 0) {
      suggestions.push({
        title: "המשך בעבודה הטובה!",
        description: "נראה שאתה שומר על דפוסי אכילה מאוזנים. המשך לגוון את התזונה שלך עם מגוון מזונות עשירים בנוטריינטים.",
        icon: <LightbulbIcon className="h-5 w-5 text-green-500" />
      });
    }
    
    return suggestions;
  };
  
  const recommendations = getRecommendations();
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">המלצות מותאמות אישית</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recommendations.map((recommendation, index) => (
            <div key={index} className="flex gap-3">
              <div className="flex-shrink-0 mt-1">
                {recommendation.icon}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{recommendation.title}</h3>
                <p className="text-sm text-gray-600">{recommendation.description}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}