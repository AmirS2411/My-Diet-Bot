
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Flame, Clock, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ShareOptions from "../social/ShareOptions";

export default React.memo(function MealItem({ meal, onDelete }) {
  const navigate = useNavigate();
  
  const mealTypeMap = {
    breakfast: "ארוחת בוקר",
    lunch: "ארוחת צהריים",
    dinner: "ארוחת ערב"
  };

  const mealTypeColors = {
    breakfast: "bg-blue-100 text-blue-800",
    lunch: "bg-amber-100 text-amber-800",
    dinner: "bg-purple-100 text-purple-800"
  };

  return (
    <Card className="shadow-sm hover:shadow-md transition-all">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <CardTitle className="text-base">{meal.description}</CardTitle>
            <Badge className={`mr-2 text-xs ${mealTypeColors[meal.type] || ""}`}>
              {mealTypeMap[meal.type] || meal.type}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="flex flex-wrap gap-2 mb-1">
          <div className="flex items-center text-sm text-gray-500">
            <Flame className="w-4 h-4 ml-1 text-orange-500" />
            {meal.calories} קלוריות
          </div>
          {meal.protein && (
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-bold text-blue-600 ml-1">P</span>
              {meal.protein}g חלבון
            </div>
          )}
          {meal.time && (
            <div className="flex items-center text-sm text-gray-500">
              <Clock className="w-4 h-4 ml-1 text-gray-400" />
              {meal.time}
            </div>
          )}
        </div>
        {meal.portion_size && (
          <div className="text-sm text-gray-500">גודל מנה: {meal.portion_size}</div>
        )}
      </CardContent>
      <CardFooter className="pt-2 flex justify-between">
        <Button variant="ghost" size="sm" className="text-red-500 h-8 hover:text-red-700 hover:bg-red-50 p-0" onClick={() => onDelete(meal.id)}>
          מחק
        </Button>
        
        <div className="flex gap-2">
          <ShareOptions
            title={meal.description}
            description={`${meal.calories} קלוריות`}
            imageUrl={meal.photo_url}
            achievementType="meal"
          />
          
          <Button variant="ghost" size="sm" className="h-8 p-0" onClick={() => navigate(createPageUrl("MealGallery"))}>
            לגלריה
            <ArrowRight className="w-3 h-3 mr-1" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
});
