
import React, { useState, useEffect } from "react";
import { Weight, UserProfile, User } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format, parseISO, isValid } from "date-fns";
import { he } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Scale, Calendar as CalendarIcon, Target, Trash2, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function WeightTracker() {
  const navigate = useNavigate();
  const [weights, setWeights] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingWeight, setIsAddingWeight] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      
      if (!user.completed_onboarding) {
        navigate(createPageUrl("Onboarding"));
        return;
      }
      
      const profileData = await UserProfile.filter({ user_id: user.id });
      if (profileData.length > 0) {
        setUserProfile(profileData[0]);

        const weightData = await Weight.filter({ created_by: user.email });
        weightData.sort((a, b) => new Date(b.date) - new Date(a.date));
        setWeights(weightData);
        
        if (weightData.length > 0) {
          const latest = weightData[0];
          setLatestWeight(latest);
        }
      } else {
        navigate(createPageUrl("InitialQuestionnaire"));
      }
    } catch (error) {
      console.error("Error loading data:", error);
      navigate(createPageUrl("Login"));
    } finally {
      setIsLoading(false);
    }
  };

  const addWeight = async (e) => {
    if (e) e.preventDefault();
    if (!newWeight || !isValid(selectedDate)) return;

    setIsAddingWeight(true);
    try {
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      await Weight.create({
        weight: parseFloat(newWeight),
        date: formattedDate,
        created_by: (await User.me()).email
      });
      
      setNewWeight("");
      setSelectedDate(new Date());
      await loadData();
    } catch (error) {
      console.error("Error adding weight:", error);
    } finally {
      setIsAddingWeight(false);
    }
  };

  const deleteWeight = async (id) => {
    try {
      setIsDeleting(true);
      await Weight.delete(id);
      await loadData();
    } catch (error) {
      console.error("Error deleting weight:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetAllWeights = async () => {
    try {
      setIsDeleting(true);
      
      for (const weight of weights) {
        try {
          await Weight.delete(weight.id);
        } catch (error) {
          console.error(`Error deleting weight ${weight.id}:`, error);
        }
      }
      
      if (userProfile?.starting_weight) {
        await Weight.create({
          weight: userProfile.starting_weight,
          date: format(new Date(), "yyyy-MM-dd"),
          created_by: (await User.me()).email
        });
      }
      
      await loadData();
    } catch (error) {
      console.error("Error resetting weights:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const chartData = weights.map(w => ({
    date: format(new Date(w.date), "dd/MM", { locale: he }),
    weight: w.weight
  })).reverse();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const mostRecentWeight = weights.length > 0 ? weights[0] : null;
  const previousWeight = weights.length > 1 ? weights[1] : null;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
        <h1 className="text-xl sm:text-2xl font-bold">מעקב משקל</h1>
        <Button 
          onClick={resetAllWeights} 
          variant="outline" 
          className="text-red-500 border-red-200 hover:bg-red-50 text-sm w-auto"
          disabled={isDeleting || weights.length === 0}
        >
          {isDeleting ? (
            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin ml-2"></div>
          ) : (
            <Trash2 className="w-4 h-4 ml-2" />
          )}
          אפס נתוני משקל
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">משקל נוכחי</CardTitle>
            <CardDescription className="text-xs sm:text-sm">מעקב אחר התקדמות המשקל שלך</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <div className="flex flex-col items-center gap-3 sm:gap-4">
              <div className="text-3xl sm:text-5xl font-bold text-blue-600">
                {mostRecentWeight 
                  ? mostRecentWeight.weight.toFixed(2) 
                  : userProfile?.starting_weight 
                    ? userProfile.starting_weight.toFixed(2) 
                    : "0.00"} ק״ג
              </div>
              
              {mostRecentWeight && (
                <div className="text-gray-500 text-xs sm:text-sm">
                  נמדד בתאריך: {format(new Date(mostRecentWeight.date), "EEEE, dd/MM/yyyy", { locale: he })}
                </div>
              )}
              
              {mostRecentWeight && previousWeight && (
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                  <div className={`text-base sm:text-lg font-medium ${
                    mostRecentWeight.weight < previousWeight.weight ? "text-green-600" : 
                    mostRecentWeight.weight > previousWeight.weight ? "text-red-600" : "text-gray-600"
                  }`}>
                    {(mostRecentWeight.weight - previousWeight.weight).toFixed(2)} ק״ג
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm">
                    מאז המדידה הקודמת
                  </div>
                </div>
              )}
              
              {userProfile?.target_weight && mostRecentWeight && (
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                  <div className="text-base sm:text-lg font-medium">
                    {Math.max(0, mostRecentWeight.weight - userProfile.target_weight).toFixed(1)} ק״ג
                  </div>
                  <div className="text-gray-500 text-xs sm:text-sm flex items-center">
                    <Target className="w-4 h-4 ml-1 text-blue-500" />
                    להשגת היעד
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">הוסף משקל חדש</CardTitle>
            <CardDescription className="text-xs sm:text-sm">הכנס את המשקל הנוכחי שלך</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
            <form onSubmit={addWeight} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">משקל (ק״ג)</label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="הכנס משקל"
                  value={newWeight}
                  onChange={(e) => setNewWeight(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">תאריך</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className="w-full justify-start text-right text-sm"
                    >
                      <CalendarIcon className="ml-2 h-4 w-4" />
                      {selectedDate ? (
                        format(selectedDate, "EEEE, dd/MM/yyyy", { locale: he })
                      ) : (
                        <span>בחר תאריך</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      locale={he}
                      disabled={(date) => date > new Date()}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm" 
                disabled={!newWeight || isAddingWeight}
              >
                {isAddingWeight ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                ) : (
                  <Plus className="ml-2 w-4 h-4" />
                )}
                הוסף משקל
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">גרף מעקב משקל</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          <div className="h-[240px] sm:h-[300px]">
            {weights.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={['auto', 'auto']} />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ fill: "#2563eb" }}
                  />
                  {userProfile?.target_weight && (
                    <ReferenceLine 
                      y={userProfile.target_weight} 
                      stroke="#10b981" 
                      strokeDasharray="3 3"
                      label={{ 
                        value: `יעד: ${userProfile.target_weight} ק"ג`, 
                        fill: '#10b981', 
                        position: 'insideBottomLeft' 
                      }}
                    />
                  )}
                </RechartsLineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 text-sm sm:text-base">
                אין נתוני משקל עדיין. הוסף את המשקל הראשון שלך.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">היסטוריית משקל</CardTitle>
        </CardHeader>
        <CardContent className="px-2 sm:px-6 py-4 sm:py-6 pt-0 sm:pt-0">
          {weights.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs sm:text-sm">תאריך</TableHead>
                    <TableHead className="text-xs sm:text-sm">משקל</TableHead>
                    <TableHead className="text-xs sm:text-sm">שינוי</TableHead>
                    <TableHead className="text-xs sm:text-sm text-left">פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {weights.map((weight, index) => (
                    <TableRow key={weight.id}>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {format(new Date(weight.date), "dd/MM/yyyy", { locale: he })}
                      </TableCell>
                      <TableCell className="font-medium text-xs sm:text-sm p-2 sm:p-4">{weight.weight.toFixed(2)} ק"ג</TableCell>
                      <TableCell className="text-xs sm:text-sm p-2 sm:p-4">
                        {index < weights.length - 1 ? (
                          <span className={
                            weight.weight < weights[index + 1].weight ? "text-green-600" : 
                            weight.weight > weights[index + 1].weight ? "text-red-600" : "text-gray-600"
                          }>
                            {(weight.weight - weights[index + 1].weight).toFixed(2)} ק"ג
                          </span>
                        ) : "—"}
                      </TableCell>
                      <TableCell className="p-1 sm:p-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                          onClick={() => deleteWeight(weight.id)}
                          disabled={isDeleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6 sm:py-8 text-gray-500 text-sm sm:text-base">
              לא נמצאו רשומות משקל. הוסף את המשקל הראשון שלך למעלה.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
