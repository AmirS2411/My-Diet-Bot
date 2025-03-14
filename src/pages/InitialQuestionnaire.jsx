
import React, { useState, useEffect } from "react";
import { UserProfile, User, Weight, Meal } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Scale, 
  Ruler, 
  Calendar, 
  Users, 
  Activity, 
  Dumbbell,
  Flame,
  Target 
} from "lucide-react";
import { format } from "date-fns";

export default function InitialQuestionnaire() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileExists, setProfileExists] = useState(false);
  const [userName, setUserName] = useState("");
  const [isNewUser, setIsNewUser] = useState(true);
  
  const [formData, setFormData] = useState({
    height: "",
    starting_weight: "",
    target_weight: "",
    age: "",
    gender: "",
    activity_level: "moderate",
    workout_frequency: 3,
    workout_type: "mixed",
    weight_loss_rate: "moderate",
    bmr: 0,
    tdee: 0,
    calories_target: 0,
    protein_target: 0,
    completed_questionnaire: false,
    user_id: ""
  });

  const [results, setResults] = useState({
    bmr: 0,
    dailyCalories: 0,
    workoutCaloriesPerDay: 0,
    calories_target: 0,
    protein_target: 0,
    weekly_weight_loss: 0,
    deficit: 0
  });

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        setIsLoading(true);
        const user = await User.me();
        setCurrentUser(user);
        
        if (user.display_name) {
          setUserName(user.display_name);
          setIsNewUser(false);
        } else {
          setIsNewUser(true);
        }
        
        setFormData(prev => ({
          ...prev,
          user_id: user.id
        }));
        
        const profiles = await UserProfile.filter({ user_id: user.id });
        
        if (profiles.length > 0) {
          setProfileExists(true);
          setFormData(profiles[0]);
          
          console.log("Found existing profile for user, profile ID:", profiles[0].id);
          
          if (profiles[0].completed_questionnaire) {
            navigate(createPageUrl("Dashboard"));
          }
        } else {
          console.log("No existing profile found, creating new profile");
        }
      } catch (error) {
        console.error("Error checking user profile:", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };
    
    checkUserProfile();
  }, [navigate]);

  const calculateBMR = () => {
    let bmr = 0;
    if (formData.gender === "male") {
      bmr = 10 * formData.starting_weight + 6.25 * formData.height - 5 * formData.age + 5;
    } else {
      bmr = 10 * formData.starting_weight + 6.25 * formData.height - 5 * formData.age - 161;
    }
    return Math.round(bmr);
  };

  const calculateTargets = () => {
    const bmr = calculateBMR();
    
    let deficit = 0;
    let weeklyLoss = 0;
    
    switch(formData.weight_loss_rate) {
      case "slow":
        deficit = 250;
        weeklyLoss = 0.25;
        break;
      case "moderate":
        deficit = 500;
        weeklyLoss = 0.5;
        break;
      case "fast":
        deficit = 750;
        weeklyLoss = 0.75;
        break;
      default:
        deficit = 500;
        weeklyLoss = 0.5;
    }
    
    let caloriesPerWorkout = 0;
    
    switch(formData.workout_type) {
      case "cardio":
        caloriesPerWorkout = 450;
        break;
      case "strength":
        caloriesPerWorkout = 250;
        break;
      case "mixed":
      default:
        caloriesPerWorkout = 350;
    }
    
    const workoutCaloriesPerDay = (formData.workout_frequency * caloriesPerWorkout) / 7;
    
    const dailyCalories = bmr + workoutCaloriesPerDay;
    
    const caloriesTarget = Math.max(1200, dailyCalories - deficit);
    
    let proteinMultiplier = 1.8;
    
    if (formData.workout_type === "strength") {
      proteinMultiplier = 2.0;
    }
    
    const proteinTarget = Math.round(formData.starting_weight * proteinMultiplier);
    
    return {
      bmr,
      dailyCalories,
      workoutCaloriesPerDay,
      calories_target: Math.round(caloriesTarget),
      protein_target: proteinTarget,
      weekly_weight_loss: weeklyLoss,
      deficit: deficit
    };
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = () => {
    if (step === 5) {
      const targets = calculateTargets();
      setResults(targets);
      setFormData(prev => ({
        ...prev,
        bmr: targets.bmr,
        dailyCalories: targets.dailyCalories,
        calories_target: targets.calories_target,
        protein_target: targets.protein_target
      }));
    }
    setStep(step + 1);
  };

  const handlePrevious = () => {
    setStep(step - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      if (isNewUser && userName.trim()) {
        await User.updateMyUserData({
          display_name: userName,
          completed_onboarding: true
        });
      }
      
      const finalData = {
        ...formData,
        user_id: currentUser.id,
        completed_questionnaire: true
      };
      
      if (profileExists) {
        await UserProfile.update(formData.id, finalData);
      } else {
        await UserProfile.create(finalData);
      }
      
      try {
        const existingWeights = await Weight.list();
        for (const weight of existingWeights) {
          try {
            await Weight.delete(weight.id);
          } catch (error) {
            console.error("Error deleting weight:", error);
          }
        }
        
        await Weight.create({
          weight: finalData.starting_weight,
          date: format(new Date(), "yyyy-MM-dd")
        });
      } catch (error) {
        console.error("Error resetting weights:", error);
      }
      
      try {
        const existingMeals = await Meal.list();
        for (const meal of existingMeals) {
          try {
            await Meal.delete(meal.id);
          } catch (error) {
            console.error("Error deleting meal:", error);
          }
        }
      } catch (error) {
        console.error("Error resetting meals:", error);
      }
      
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving profile:", error);
      setIsSubmitting(false);
    }
  };

  const activityLevelOptions = [
    { value: "sedentary", label: "יושבני (כמעט לא זז)" },
    { value: "light", label: "פעילות קלה (1-2 פעמים בשבוע)" },
    { value: "moderate", label: "פעילות בינונית (3-4 פעמים בשבוע)" },
    { value: "active", label: "פעילות גבוהה (5-6 פעמים בשבוע)" },
    { value: "very_active", label: "פעילות אינטנסיבית (פעמיים ביום/ספורטאי)" }
  ];

  const weightLossRateOptions = [
    { value: "slow", label: "איטי (0.25 ק״ג בשבוע)" },
    { value: "moderate", label: "בינוני (0.5 ק״ג בשבוע)" },
    { value: "fast", label: "מהיר (0.75 ק״ג בשבוע)" }
  ];

  const renderStep = () => {
    switch(step) {
      case 0:
        return (
          <div className="text-center">
            {isNewUser ? (
              <>
                <h1 className="text-2xl font-bold mb-2">ברוך הבא למעקב התזונה שלך!</h1>
                <p className="mb-6">כדי להתחיל, נשאל אותך כמה שאלות קצרות כדי להתאים לך תוכנית אישית</p>
                
                <div className="mb-8">
                  <Label className="block text-sm font-medium mb-2">איך נוכל לפנות אליך?</Label>
                  <Input
                    placeholder="השם שלך"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="text-lg text-center max-w-xs mx-auto"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    השם יופיע בשיחות עם התזונאי האישי שלך
                  </p>
                </div>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold mb-2">ברוך השב, {userName}!</h1>
                <p className="mb-6">בוא נמלא כמה פרטים כדי להתאים לך תוכנית אישית</p>
              </>
            )}
          </div>
        );

      case 1:
        return (
          <div>
            <div className="mb-8 flex items-center">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-full mr-4">
                <Scale className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">מהו המשקל הנוכחי והיעד שלך?</h2>
                <p className="text-gray-500">נשתמש במידע זה לחישוב תוכנית האכילה שלך</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>משקל נוכחי (ק״ג)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="80.00"
                  value={formData.starting_weight}
                  onChange={(e) => handleInputChange('starting_weight', parseFloat(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>משקל יעד (ק״ג)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="70.00"
                  value={formData.target_weight}
                  onChange={(e) => handleInputChange('target_weight', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div>
            <div className="mb-8 flex items-center">
              <div className="bg-green-100 text-green-600 p-3 rounded-full mr-4">
                <Ruler className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">מהו הגובה שלך?</h2>
                <p className="text-gray-500">נדרש לחישוב קצב המטבוליזם הבסיסי שלך</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>גובה (ס״מ)</Label>
                <Input
                  type="number"
                  placeholder="175"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                  required
                />
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div>
            <div className="mb-8 flex items-center">
              <div className="bg-purple-100 text-purple-600 p-3 rounded-full mr-4">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">מהו הגיל והמגדר שלך?</h2>
                <p className="text-gray-500">נדרש לחישוב מדויק של צרכי הקלוריות שלך</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>גיל</Label>
                <Input
                  type="number"
                  placeholder="35"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', parseFloat(e.target.value))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label>מגדר</Label>
                <Select
                  value={formData.gender}
                  onValueChange={(value) => handleInputChange('gender', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר מגדר" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">זכר</SelectItem>
                    <SelectItem value="female">נקבה</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div>
            <div className="mb-8 flex items-center">
              <div className="bg-orange-100 text-orange-600 p-3 rounded-full mr-4">
                <Activity className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">כמה פעיל אתה ביומיום?</h2>
                <p className="text-gray-500">זה יעזור לנו להעריך כמה קלוריות אתה שורף מדי יום</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>רמת פעילות יומית</Label>
                <Select
                  value={formData.activity_level}
                  onValueChange={(value) => handleInputChange('activity_level', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר רמת פעילות" />
                  </SelectTrigger>
                  <SelectContent>
                    {activityLevelOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>כמה אימונים בשבוע אתה מבצע?</Label>
                <div className="py-4">
                  <Slider
                    value={[formData.workout_frequency]}
                    min={0}
                    max={7}
                    step={1}
                    onValueChange={(value) => handleInputChange('workout_frequency', value[0])}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-500">
                  <span>7</span>
                  <span>6</span>
                  <span>5</span>
                  <span>4</span>
                  <span>3</span>
                  <span>2</span>
                  <span>1</span>
                  <span>0</span>
                </div>
                <p className="text-center mt-2 font-medium">
                  {formData.workout_frequency} אימונים בשבוע
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>איזה סוג אימון אתה מבצע בעיקר?</Label>
                <Select
                  value={formData.workout_type}
                  onValueChange={(value) => handleInputChange('workout_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג אימון" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cardio">אימוני קרדיו (ריצה, שחייה, אופניים)</SelectItem>
                    <SelectItem value="strength">אימוני כוח (משקולות, כושר)</SelectItem>
                    <SelectItem value="mixed">אימון משולב (קרדיו וכוח)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  אימוני קרדיו שורפים יותר קלוריות במהלך האימון, בעוד אימוני כוח מגבירים את חילוף החומרים לאורך זמן
                </p>
              </div>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div>
            <div className="mb-8 flex items-center">
              <div className="bg-red-100 text-red-600 p-3 rounded-full mr-4">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">באיזה קצב תרצה לרדת במשקל?</h2>
                <p className="text-gray-500">בחר את הקצב שמתאים לסגנון החיים ולמטרות שלך</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>קצב ירידה במשקל</Label>
                <Select
                  value={formData.weight_loss_rate}
                  onValueChange={(value) => handleInputChange('weight_loss_rate', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קצב ירידה במשקל" />
                  </SelectTrigger>
                  <SelectContent>
                    {weightLossRateOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  ירידה במשקל בקצב של 0.5-1 ק״ג בשבוע נחשבת בריאה ובת-קיימא לטווח ארוך
                </p>
              </div>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div>
            <div className="mb-8 text-center">
              <div className="bg-green-100 text-green-600 p-3 rounded-full mx-auto mb-4 w-16 h-16 flex items-center justify-center">
                <Check className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-semibold">התוכנית שלך מוכנה!</h2>
              <p className="text-gray-500">בהתבסס על המידע שסיפקת, יצרנו עבורך תוכנית מותאמת אישית</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">קצב מטבולי בסיסי (BMR)</CardTitle>
                  <CardDescription>הקלוריות שגופך שורף במנוחה</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{results.bmr} קלוריות</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">קלוריות מפעילות גופנית</CardTitle>
                  <CardDescription>קלוריות נוספות שנשרפות מאימונים</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-600">{Math.round(results.workoutCaloriesPerDay)} קלוריות</div>
                  <p className="text-sm text-gray-500 mt-2">
                    בממוצע ליום (לפי {formData.workout_frequency} אימונים בשבוע)
                  </p>
                  {formData.workout_type === "cardio" && (
                    <div className="text-xs text-green-600 mt-1">
                      * אימוני קרדיו שורפים יותר קלוריות במהלך האימון
                    </div>
                  )}
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">יעד קלוריות יומי</CardTitle>
                  <CardDescription>כמות הקלוריות המומלצת עבורך</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{results.calories_target} קלוריות</div>
                  <p className="text-sm text-gray-500 mt-2">
                    גירעון של {results.deficit} קלוריות ליום
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">יעד חלבון יומי</CardTitle>
                  <CardDescription>כמות החלבון המומלצת עבורך</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600">{results.protein_target} גרם</div>
                  <p className="text-sm text-gray-500 mt-2">
                    כ-{Math.round(results.protein_target / formData.starting_weight * 10) / 10} גרם לכל ק״ג ממשקל גופך
                  </p>
                  {formData.workout_type === "strength" && (
                    <div className="text-xs text-green-600 mt-1">
                      * הוגדל עקב אימוני כוח שדורשים יותר חלבון
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <h3 className="font-semibold text-blue-800">תחזית ירידה במשקל</h3>
              <p className="mt-1">
                בהתבסס על התוכנית שלך, אתה צפוי לרדת כ-{results.weekly_weight_loss} ק״ג בשבוע.
                זה אומר שתוכל להגיע למשקל היעד שלך תוך כ-
                {Math.ceil((formData.starting_weight - formData.target_weight) / results.weekly_weight_loss)} שבועות
                (כ-{Math.ceil((formData.starting_weight - formData.target_weight) / results.weekly_weight_loss / 4)} חודשים).
              </p>
              <p className="mt-2 px-4 py-3 bg-white rounded-md border border-blue-100">
                <span className="font-semibold">הסבר על תוכנית הקלוריות:</span><br/>
                בהתבסס על הנתונים שלך, גופך שורף כ-{results.bmr} קלוריות במנוחה + כ-{Math.round(results.workoutCaloriesPerDay)} קלוריות מפעילות גופנית = {Math.round(results.bmr + results.workoutCaloriesPerDay)} סה״כ.<br/>
                יעד הצריכה היומי שלך הוא {results.calories_target} קלוריות, מה שיוצר גירעון של {results.deficit} קלוריות ביום.<br/>
                <span className="text-sm text-gray-500 block mt-1">* במידה ותבצע אימון נוסף ביום מסוים, תוכל להגדיל את צריכת הקלוריות באותו היום בהתאם לקלוריות שנזרקו באימון.</span>
              </p>
            </div>
          </div>
        );
        
      default:
        return <div>שלב לא ידוע</div>;
    }
  };

  const isNextDisabled = () => {
    switch(step) {
      case 0:
        return isNewUser && !userName.trim();
      case 1:
        return !formData.starting_weight || !formData.target_weight;
      case 2:
        return !formData.height;
      case 3:
        return !formData.age || !formData.gender;
      case 4:
      case 5:
        return false;
      case 6:
        return false;
      default:
        return false;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100" dir="rtl">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 p-4 md:p-8" dir="rtl">
      <div className="max-w-3xl mx-auto flex-1">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-blue-600">
            {userName ? `התזונאי האישי של ${userName}` : "התזונאי האישי שלי"}
          </h1>
        </div>
        
        <Card className="shadow-lg">
          <CardContent className="pt-6">
            {step > 0 && step < 7 && (
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-500">התקדמות</span>
                  <span className="text-sm font-medium">{Math.round((step / 6) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(step / 6) * 100}%` }}
                  ></div>
                </div>
              </div>
            )}
            
            {renderStep()}
          </CardContent>
          
          <CardFooter className="flex justify-center pt-4 pb-6">
            {step === 0 && (
              <Button 
                onClick={async () => {
                  if (isNewUser) {
                    if (userName.trim()) {
                      await User.updateMyUserData({
                        display_name: userName,
                        completed_onboarding: true
                      });
                      setStep(1);
                    }
                  } else {
                    setStep(1);
                  }
                }} 
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isNewUser && !userName.trim()}
              >
                בוא נתחיל
                <ArrowLeft className="mr-2 w-4 h-4" />
              </Button>
            )}
            
            {step > 0 && (
              <div className="flex justify-between w-full">
                <Button variant="outline" onClick={handlePrevious}>
                  <ArrowRight className="ml-2 w-4 h-4" />
                  חזרה
                </Button>
                
                {step === 6 ? (
                  <Button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {isSubmitting ? "שומר..." : "סיים והתחל לעקוב"}
                    <Check className="mr-2 w-4 h-4" />
                  </Button>
                ) : (
                  <Button 
                    onClick={handleNext} 
                    disabled={isNextDisabled()}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    המשך
                    <ArrowLeft className="mr-2 w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
