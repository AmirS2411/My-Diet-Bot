import React, { useEffect, useMemo, useState } from "react";
import { format, subDays, startOfWeek, addDays, parseISO } from "date-fns";
import { he } from "date-fns/locale";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { User, Meal } from "@/api/entities"; // Fixed import path from entities

export default function WeeklyCaloriesChart({ userProfile, selectedDate }) {
  const [weeklyData, setWeeklyData] = useState([]);
  const [averageCalories, setAverageCalories] = useState(0);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        const user = await User.me();
        
        const baseDate = selectedDate ? parseISO(selectedDate) : new Date();
        const weekStart = startOfWeek(baseDate, { weekStartsOn: 0 });
        
        const dates = [];
        for (let i = 0; i < 7; i++) {
          const date = addDays(weekStart, i);
          dates.push(format(date, "yyyy-MM-dd"));
        }
        
        const allMeals = await Promise.all(
          dates.map(async (date) => {
            const meals = await Meal.filter({ date, created_by: user.email });
            return { date, meals };
          })
        );
        
        const weekData = allMeals.map(({ date, meals }) => {
          const dayCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
          return {
            date,
            calories: dayCalories,
            meals: meals.length,
            shortDay: format(parseISO(date), "EEE", { locale: he })
          };
        });
        
        setWeeklyData(weekData);
        
        const totalCalories = weekData.reduce((sum, day) => sum + day.calories, 0);
        setAverageCalories(Math.round(totalCalories / 7));
      } catch (error) {
        console.error("Error loading weekly calorie data");
      }
    };
    
    loadWeeklyData();
  }, [selectedDate]);

  const getBarFill = (entry) => {
    const target = userProfile?.calories_target || 2000;
    
    if (entry.calories > target * 1.1) {
      return "#ef4444";
    } else if (entry.calories >= target * 0.9 && entry.calories <= target * 1.1) {
      return "#10b981";
    } else if (entry.calories >= target * 0.7) {
      return "#3b82f6";
    } else {
      return "#9ca3af";
    }
  };
  
  const getTargetCalories = () => {
    if (userProfile?.calories_target) {
      return userProfile.calories_target;
    }
    return 2000;
  };
  
  const maxYAxis = useMemo(() => {
    const target = getTargetCalories();
    const maxData = Math.max(...weeklyData.map(d => d.calories), target);
    return Math.ceil(maxData * 1.1 / 100) * 100;
  }, [weeklyData, userProfile]);
  
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-md shadow-md">
          <p className="font-medium text-gray-800">
            {data.shortDay} ({data.date})
          </p>
          <p className="text-orange-600 font-medium">
            {data.calories} קלוריות
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex justify-between items-center">
          <span>צריכת קלוריות שבועית</span>
          <span className="text-sm font-normal text-gray-500">
            ממוצע: {averageCalories} קל' / יום
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={weeklyData}
              margin={{ top: 20, right: 30, left: 20, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="shortDay" 
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                type="number" 
                domain={[0, maxYAxis]} 
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine
                y={getTargetCalories()}
                stroke="#10b981"
                strokeWidth={2}
                strokeDasharray="3 3"
                label={{ 
                  value: `יעד: ${getTargetCalories()}`, 
                  position: 'right',
                  fill: '#10b981',
                  fontSize: 12
                }}
              />
              <Bar 
                dataKey="calories" 
                barSize={30}
                radius={[4, 4, 0, 0]}
                fill={(entry) => getBarFill(entry)}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
            <span className="text-xs">מעל היעד</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
            <span className="text-xs">בתחום היעד</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
            <span className="text-xs">מעט מתחת ליעד</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-gray-400 rounded-full mr-1"></div>
            <span className="text-xs">מתחת ליעד משמעותית</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
