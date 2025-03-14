import React from "react";
import { Progress } from "@/components/ui/progress";

export default function NutrientBreakdown({ meals, userProfile }) {
  if (!meals || meals.length === 0) {
    return <div>אין נתונים זמינים לניתוח</div>;
  }

  // Calculate total nutrition values from all meals
  const analysis = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0
  };

  meals.forEach(meal => {
    analysis.calories += meal.calories || 0;
    analysis.protein += meal.protein || 0;
    analysis.carbs += meal.carbs || 0;
    analysis.fat += meal.fat || 0;
    if (meal.fiber) analysis.fiber += meal.fiber;
  });

  // Calculate net carbs if fiber data is available
  analysis.net_carbs = analysis.carbs - analysis.fiber;

  // Check diet type compatibility
  analysis.low_carb_friendly = analysis.net_carbs < 100;
  analysis.keto_friendly = analysis.net_carbs < 30;

  const calculateMacroPercentage = (macroValue) => {
    const total = analysis.protein * 4 + analysis.carbs * 4 + analysis.fat * 9;
    if (total === 0) return 0;
    return Math.round((macroValue / total) * 100);
  };

  const proteinPercentage = calculateMacroPercentage(analysis.protein * 4);
  const carbsPercentage = calculateMacroPercentage(analysis.carbs * 4);
  const fatPercentage = calculateMacroPercentage(analysis.fat * 9);

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-gray-50 p-4">
        <h3 className="mb-2 font-medium">ניתוח תזונתי של הארוחות</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">קלוריות</span>
            <span className="text-lg font-bold">{Math.round(analysis.calories)}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">חלבון</span>
            <span className="text-lg font-bold">{Math.round(analysis.protein)}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">פחמימות</span>
            <span className="text-lg font-bold">{Math.round(analysis.carbs)}g</span>
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500">שומן</span>
            <span className="text-lg font-bold">{Math.round(analysis.fat)}g</span>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="font-medium">התפלגות מאקרו</h3>
        
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm">
              <span>חלבון ({proteinPercentage}%)</span>
              <span>{Math.round(analysis.protein)}g</span>
            </div>
            <Progress value={proteinPercentage} className="h-2 bg-gray-100" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm">
              <span>פחמימות ({carbsPercentage}%)</span>
              <span>{Math.round(analysis.carbs)}g</span>
            </div>
            <Progress value={carbsPercentage} className="h-2 bg-gray-100" />
          </div>
          
          <div>
            <div className="flex justify-between text-sm">
              <span>שומן ({fatPercentage}%)</span>
              <span>{Math.round(analysis.fat)}g</span>
            </div>
            <Progress value={fatPercentage} className="h-2 bg-gray-100" />
          </div>
        </div>
      </div>

      {analysis.fiber > 0 && (
        <div className="rounded-lg border p-3">
          <div className="flex justify-between">
            <span className="text-sm">סיבים תזונתיים</span>
            <span className="font-medium">{Math.round(analysis.fiber)}g</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">פחמימות נטו</span>
            <span className="font-medium">{Math.round(analysis.net_carbs)}g</span>
          </div>
        </div>
      )}

      <div className="mt-3 text-sm">
        <div className="flex items-center">
          <div className={`mr-2 h-3 w-3 rounded-full ${analysis.low_carb_friendly ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{analysis.low_carb_friendly ? 'מתאים לדיאטה דלת פחמימות' : 'לא מתאים לדיאטה דלת פחמימות'}</span>
        </div>
        <div className="flex items-center mt-1">
          <div className={`mr-2 h-3 w-3 rounded-full ${analysis.keto_friendly ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{analysis.keto_friendly ? 'מתאים לדיאטה קטוגנית' : 'לא מתאים לדיאטה קטוגנית'}</span>
        </div>
      </div>
    </div>
  );
}