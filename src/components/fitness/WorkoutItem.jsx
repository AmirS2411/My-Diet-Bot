
import React from "react";
import { Dumbbell, Clock, Flame, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";

export default React.memo(function WorkoutItem({ workout, compact = false }) {
  const getWorkoutTypeInfo = (type) => {
    switch (type) {
      case "cardio":
        return { label: "קרדיו", color: "bg-blue-100 text-blue-800" };
      case "strength":
        return { label: "אימון כוח", color: "bg-purple-100 text-purple-800" };
      case "flexibility":
        return { label: "גמישות", color: "bg-green-100 text-green-800" };
      case "hiit":
        return { label: "HIIT", color: "bg-red-100 text-red-800" };
      default:
        return { label: "אחר", color: "bg-gray-100 text-gray-800" };
    }
  };

  const getIntensityInfo = (intensity) => {
    switch (intensity) {
      case "low":
        return { label: "קל", color: "bg-blue-50 text-blue-600" };
      case "high":
        return { label: "אינטנסיבי", color: "bg-red-50 text-red-600" };
      default:
        return { label: "בינוני", color: "bg-yellow-50 text-yellow-600" };
    }
  };

  const typeInfo = getWorkoutTypeInfo(workout.type);
  const intensityInfo = getIntensityInfo(workout.intensity);

  if (compact) {
    return (
      <div className="flex justify-between items-center bg-white rounded-lg p-3 shadow-sm">
        <div className="flex items-center">
          <Dumbbell className="h-4 w-4 text-purple-500 mr-2" />
          <span className="font-medium">{typeInfo.label}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center text-sm">
            <Clock className="h-3 w-3 text-gray-500 mr-1" />
            <span>{workout.duration} דק'</span>
          </div>
          <div className="flex items-center text-sm text-orange-600 font-medium">
            <Flame className="h-3 w-3 mr-1" />
            <span>{workout.calories_burned} קל'</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg p-4 shadow-sm">
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center">
            <Dumbbell className="h-5 w-5 text-purple-600 mr-2" />
            <h3 className="font-medium text-lg">{typeInfo.label}</h3>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className={typeInfo.color}>
              {typeInfo.label}
            </Badge>
            <Badge className={intensityInfo.color}>
              {intensityInfo.label}
            </Badge>
          </div>
        </div>
        <div className="bg-green-50 px-3 py-1 rounded-full text-green-700 flex items-center">
          <Flame className="h-4 w-4 mr-1" />
          <span className="font-bold">{workout.calories_burned}</span>
          <span className="text-xs mr-1">קלוריות</span>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
        <div className="flex items-center">
          <Clock className="h-4 w-4 text-gray-500 mr-1" />
          <span>{workout.duration} דקות</span>
        </div>
        <div className="flex items-center">
          <Calendar className="h-4 w-4 text-gray-500 mr-1" />
          <span>{format(parseISO(workout.date), "EEEE, d בMMMM", { locale: he })}</span>
        </div>
      </div>

      {workout.notes && (
        <div className="mt-3 text-sm text-gray-700 bg-gray-50 p-2 rounded">
          {workout.notes}
        </div>
      )}
    </div>
  );
});
