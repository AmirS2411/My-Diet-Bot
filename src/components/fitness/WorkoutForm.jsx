import React, { useState } from "react";
import { Workout } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from "date-fns";
import { Dumbbell, Flame } from "lucide-react";
// Don't import DialogClose or we'll have circular dependencies

export default function WorkoutForm({ onComplete, date = format(new Date(), "yyyy-MM-dd") }) {
  const [workoutData, setWorkoutData] = useState({
    type: "cardio",
    duration: 30,
    intensity: "medium",
    calories_burned: 0,
    notes: "",
    date: date
  });
  const [calculating, setCalculating] = useState(false);

  const workoutTypes = [
    { value: "cardio", label: "קרדיו (ריצה, הליכה, אופניים)", caloriesPerMin: { low: 5, medium: 7, high: 10 } },
    { value: "strength", label: "אימון כוח", caloriesPerMin: { low: 3, medium: 5, high: 8 } },
    { value: "flexibility", label: "גמישות (יוגה, פילאטיס)", caloriesPerMin: { low: 2, medium: 4, high: 6 } },
    { value: "hiit", label: "אימון אינטרוולים עצים (HIIT)", caloriesPerMin: { low: 8, medium: 12, high: 16 } },
    { value: "other", label: "אחר", caloriesPerMin: { low: 4, medium: 6, high: 8 } }
  ];

  const intensityLevels = [
    { value: "low", label: "קל" },
    { value: "medium", label: "בינוני" },
    { value: "high", label: "אינטנסיבי" }
  ];

  const estimateCaloriesBurned = () => {
    const selectedType = workoutTypes.find(t => t.value === workoutData.type);
    if (!selectedType) return 0;
    
    const caloriesPerMinute = selectedType.caloriesPerMin[workoutData.intensity];
    return Math.round(caloriesPerMinute * workoutData.duration);
  };

  const handleInputChange = (field, value) => {
    setWorkoutData(prev => ({
      ...prev,
      [field]: value
    }));

    if (field === "type" || field === "duration" || field === "intensity") {
      setCalculating(true);
      setTimeout(() => {
        const calories = estimateCaloriesBurned();
        setWorkoutData(prev => ({
          ...prev,
          calories_burned: calories
        }));
        setCalculating(false);
      }, 300);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!workoutData.calories_burned || workoutData.calories_burned === 0) {
        const calories = estimateCaloriesBurned();
        workoutData.calories_burned = calories;
      }
      
      const createdWorkout = await Workout.create(workoutData);
      onComplete(createdWorkout);
    } catch (error) {
      console.error("Error saving workout:", error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="workout-type">סוג האימון</Label>
        <Select 
          value={workoutData.type} 
          onValueChange={(value) => handleInputChange("type", value)}
        >
          <SelectTrigger id="workout-type">
            <SelectValue placeholder="בחר סוג אימון" />
          </SelectTrigger>
          <SelectContent>
            {workoutTypes.map(type => (
              <SelectItem key={type.value} value={type.value}>
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="workout-duration">משך האימון (דקות)</Label>
          <Input
            id="workout-duration"
            type="number"
            min="1"
            value={workoutData.duration}
            onChange={(e) => handleInputChange("duration", parseInt(e.target.value))}
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor="workout-intensity">עצימות</Label>
          <Select 
            value={workoutData.intensity} 
            onValueChange={(value) => handleInputChange("intensity", value)}
          >
            <SelectTrigger id="workout-intensity">
              <SelectValue placeholder="בחר עצימות" />
            </SelectTrigger>
            <SelectContent>
              {intensityLevels.map(level => (
                <SelectItem key={level.value} value={level.value}>
                  {level.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="calories-burned">
          קלוריות שנשרפו 
          {calculating && <span className="text-gray-500 text-xs animate-pulse mr-1">(מחשב...)</span>}
        </Label>
        <div className="relative">
          <Flame className="absolute left-3 top-2.5 h-4 w-4 text-orange-500" />
          <Input
            id="calories-burned"
            type="number"
            min="0"
            className="pl-10"
            value={workoutData.calories_burned}
            onChange={(e) => handleInputChange("calories_burned", parseInt(e.target.value))}
            placeholder="הערכה אוטומטית על סמך סוג האימון"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          הערכה אוטומטית לפי סוג האימון, משך והעצימות. ניתן לעדכן ידנית.
        </p>
      </div>

      <div className="space-y-1">
        <Label htmlFor="workout-notes">הערות (אופציונלי)</Label>
        <Textarea
          id="workout-notes"
          placeholder="פרטים נוספים על האימון"
          value={workoutData.notes}
          onChange={(e) => handleInputChange("notes", e.target.value)}
          className="resize-none h-20"
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => onComplete(null)}>
          ביטול
        </Button>
        <Button type="submit" className="bg-green-600 hover:bg-green-700">
          <Dumbbell className="mr-2 h-4 w-4" />
          שמור אימון
        </Button>
      </div>
    </form>
  );
}