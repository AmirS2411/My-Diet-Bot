
import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Utensils, Calendar, Clock, Flame, Heart } from "lucide-react";
import ShareOptions from "./ShareOptions";

export default function MealGalleryItem({ meal, onLike }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, "d בMMMM", { locale: he });
  };

  const getTypeLabel = (type) => {
    switch (type) {
      case "breakfast": return "ארוחת בוקר";
      case "lunch": return "ארוחת צהריים";
      case "dinner": return "ארוחת ערב";
      default: return "ארוחה";
    }
  };

  const getImagePlaceholder = (mealType) => {
    switch (mealType) {
      case "breakfast":
        return "https://images.unsplash.com/photo-1533089860892-a9b385b26c7a?w=500&q=80";
      case "lunch":
        return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80";
      case "dinner":
        return "https://images.unsplash.com/photo-1576402187878-974f70c890a5?w=500&q=80";
      default:
        return "https://images.unsplash.com/photo-1606787366850-de6330128bfc?w=500&q=80";
    }
  };

  return (
    <Card className="overflow-hidden bg-white hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden">
        <img
          src={meal.photo_url || getImagePlaceholder(meal.type)}
          alt={meal.description}
          className="object-cover w-full h-full"
        />
        <div className="absolute top-2 right-2">
          <Badge className="bg-blue-500 hover:bg-blue-600">
            {getTypeLabel(meal.type)}
          </Badge>
        </div>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-medium text-lg line-clamp-1 mb-1">{meal.description}</h3>
        
        <div className="flex flex-wrap gap-2 mt-2">
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
        </div>
        
        <div className="flex justify-between items-center mt-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <div className="flex items-center">
              <Calendar className="w-3 h-3 ml-1" />
              {formatDate(meal.date)}
            </div>
            
            {meal.time && (
              <div className="flex items-center">
                <Clock className="w-3 h-3 ml-1" />
                {meal.time}
              </div>
            )}
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0 flex justify-between">
        <button 
          onClick={() => onLike(meal.id)}
          className="flex items-center text-gray-500 hover:text-red-500"
        >
          <Heart className={`w-4 h-4 mr-1 ${meal.liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="text-sm">{meal.likes || 0}</span>
        </button>
        
        <ShareOptions 
          title={meal.description}
          description={`${meal.calories} קלוריות`}
          imageUrl={meal.photo_url}
          achievementType="meal"
        />
      </CardFooter>
    </Card>
  );
}
