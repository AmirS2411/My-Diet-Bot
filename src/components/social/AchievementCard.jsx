import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { Trophy, Star, Award, TrendingDown, Calendar } from "lucide-react";
import ShareOptions from "./ShareOptions";

// Helper function to conditionally join classNames
const cn = (...args) => args.filter(Boolean).join(" ");

export default function AchievementCard({ achievement, showShare = true }) {
  const getAchievementIcon = (type) => {
    switch (type) {
      case "weight_goal":
        return <TrendingDown className="h-6 w-6 text-green-600" />;
      case "streak":
        return <Star className="h-6 w-6 text-amber-500" />;
      case "milestone":
        return <Award className="h-6 w-6 text-purple-600" />;
      default:
        return <Trophy className="h-6 w-6 text-blue-600" />;
    }
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "weight_goal":
        return "bg-green-100 text-green-800";
      case "streak":
        return "bg-amber-100 text-amber-800";
      case "milestone":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return format(date, "d בMMMM, yyyy", { locale: he });
  };

  const getAchievementType = (type) => {
    switch (type) {
      case "weight_goal":
        return "יעד משקל";
      case "streak":
        return "רצף";
      case "milestone":
        return "ציון דרך";
      default:
        return "הישג";
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden bg-gradient-to-br",
      achievement.type === "weight_goal" ? "from-green-50 to-green-100" :
      achievement.type === "streak" ? "from-amber-50 to-amber-100" :
      achievement.type === "milestone" ? "from-purple-50 to-purple-100" :
      "from-blue-50 to-blue-100"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-white shadow-sm">
            {getAchievementIcon(achievement.type)}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center">
              <h3 className="font-bold text-lg">{achievement.title}</h3>
              <Badge className={cn("mr-2", getBadgeColor(achievement.type))}>
                {getAchievementType(achievement.type)}
              </Badge>
            </div>
            
            <p className="text-gray-700 mt-1">{achievement.description}</p>
            
            <div className="flex items-center text-sm text-gray-500 mt-3">
              <Calendar className="w-3 h-3 ml-1" />
              {formatDate(achievement.date)}
            </div>
          </div>
        </div>
      </CardContent>
      
      {showShare && (
        <CardFooter className="p-4 pt-0 flex justify-end">
          <ShareOptions
            title={achievement.title}
            description={achievement.description}
            achievementType={achievement.type === "weight_goal" ? "weight" : achievement.type}
          />
        </CardFooter>
      )}
    </Card>
  );
}