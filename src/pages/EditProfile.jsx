
import React, { useState, useEffect } from "react";
import { User, UserProfile, Weight } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowRight,
  Home,
  Save,
  Calculator,
  User as UserIcon,
  Upload
} from "lucide-react";
import { format } from "date-fns";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { UploadFile } from "@/api/integrations";

export default function EditProfile() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("personal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileData, setProfileData] = useState({
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
    display_name: ""
  });
  const [manualTargets, setManualTargets] = useState({
    basal_calories: "",
    protein_target: ""
  });
  const [useManualTargets, setUseManualTargets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [useTdeeMultiplier, setUseTdeeMultiplier] = useState(true);
  const [tdeeCalculationMethod, setTdeeCalculationMethod] = useState("full_activity");
  const [includeWorkoutCalories, setIncludeWorkoutCalories] = useState(true);
  
  const activityLevelOptions = [
    { value: "sedentary", label: "לא פעיל (ללא פעילות גופנית)" },
    { value: "light", label: "פעילות קלה (1-2 פעמים בשבוע)" },
    { value: "moderate", label: "פעילות בינונית (3-4 פעמים בשבוע)" },
    { value: "active", label: "פעילות גבוהה (5-6 פעמים בשבוע)" },
    { value: "very_active", label: "פעילות אינטנסיבית (ספורטאי מקצועי)" }
  ];
  
  const weightLossRateOptions = [
    { value: "slow", label: "איטי (0.25 ק״ג בשבוע)" },
    { value: "moderate", label: "בינוני (0.5 ק״ג בשבוע)" },
    { value: "fast", label: "מהיר (1 ק״ג בשבוע)" }
  ];

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setIsLoading(true);
        
        const user = await User.me();
        setCurrentUser(user);
        
        const profiles = await UserProfile.filter({ user_id: user.id });
        
        if (profiles.length > 0) {
          const profile = profiles[0];
          setProfileData(profile);
          if (profile.profile_picture) {
            setAvatarUrl(profile.profile_picture);
          }
          
          setManualTargets({
            calories_target: profile.calories_target || "",
            protein_target: profile.protein_target || "",
            basal_calories: profile.basal_calories || ""
          });
          
          setUseTdeeMultiplier(profile.use_tdee_multiplier !== false);
          setTdeeCalculationMethod(profile.tdee_calculation_method || "full_activity");
          setIncludeWorkoutCalories(profile.include_workout_calories !== false);
        } else {
          navigate(createPageUrl("InitialQuestionnaire"));
          return;
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        navigate(createPageUrl("Dashboard"));
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserProfile();
  }, [navigate]);
  
  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleManualTargetChange = (field, value) => {
    setManualTargets(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateBMR = () => {
    if (!profileData.gender || !profileData.age || !profileData.height || !profileData.starting_weight) {
      return 0;
    }
    
    if (profileData.gender === "male") {
      return Math.round((10 * profileData.starting_weight) + (6.25 * profileData.height) - (5 * profileData.age) + 5);
    } else {
      return Math.round((10 * profileData.starting_weight) + (6.25 * profileData.height) - (5 * profileData.age) - 161);
    }
  };

  const getActivityMultiplier = () => {
    const activityMultipliers = {
      sedentary: 1.2,
      light: 1.375,
      moderate: 1.55,
      active: 1.725,
      very_active: 1.9
    };
    return activityMultipliers[profileData.activity_level] || 1.55;
  };

  const calculateWorkoutCalories = () => {
    if (!profileData.workout_frequency || profileData.workout_frequency === 0) {
      return 0;
    }

    const weightInLbs = profileData.starting_weight * 2.20462; // kg to lbs
    const avgWorkoutDuration = 60; // minutes
    let workoutMultiplier = 0;

    if (profileData.workout_type === "cardio") {
      workoutMultiplier = 8; // kcal/min for moderate cardio
    } else if (profileData.workout_type === "strength") {
      workoutMultiplier = 6; // kcal/min for moderate strength training
    } else {
      workoutMultiplier = 7; // kcal/min for mixed training
    }

    const caloriesPerWorkout = Math.round((workoutMultiplier * avgWorkoutDuration) / 150 * weightInLbs);
    
    return (caloriesPerWorkout * profileData.workout_frequency) / 7;
  };

  const getCalorieDeficit = () => {
    const deficits = {
      slow: 250,
      moderate: 500,
      fast: 1000
    };
    return deficits[profileData.weight_loss_rate] || 500;
  };

  const calculateTargets = () => {
    const bmr = manualTargets.basal_calories ? parseFloat(manualTargets.basal_calories) : calculateBMR();
    
    let tdee = bmr;
    
    // Calculate TDEE based on selected calculation method
    if (tdeeCalculationMethod === "full_activity") {
      if (useTdeeMultiplier) {
        tdee = bmr * getActivityMultiplier();
      }
    } else if (tdeeCalculationMethod === "sedentary_plus_exercise") {
      // Base sedentary multiplier only
      tdee = bmr * 1.2;
    }
    
    // Add workout calories if enabled
    if (includeWorkoutCalories && 
        (tdeeCalculationMethod === "full_activity" || tdeeCalculationMethod === "sedentary_plus_exercise")) {
      tdee += calculateWorkoutCalories();
    }
    
    // Apply deficit after adding workout calories
    const deficit = getCalorieDeficit();
    const calculatedTarget = Math.round(tdee - deficit);
    const minCalories = profileData.gender === "male" ? 1500 : 1200;
    const calories_target = Math.max(minCalories, calculatedTarget);
    
    let proteinPerKg = 1.6; // Default
    
    if (profileData.workout_type === "strength") {
      proteinPerKg = 2.0; // Higher protein for strength training
    } else if (profileData.workout_frequency >= 5) {
      proteinPerKg = 1.8; // Higher protein for frequent workouts
    }
    
    const protein_target = Math.round(profileData.starting_weight * proteinPerKg);
    
    const weekly_weight_loss = (deficit * 7) / 7700; // 7700 kcal ≈ 1kg of fat
    
    return {
      bmr,
      adjustedBmr: tdee,
      deficit,
      calories_target,
      protein_target,
      weekly_weight_loss
    };
  };

  const handleFileUpload = async (e) => {
    try {
      if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        setIsLoading(true);
        
        const { file_url } = await UploadFile({ file });
        setAvatarUrl(file_url);
        
        await User.updateMyUserData({
          profile_picture: file_url
        });
        
        setUploadSuccess(true);
        
        setTimeout(() => {
          setUploadSuccess(false);
        }, 3000);
      }
    } catch (error) {
      console.error("Error uploading file:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      let updatedProfile = { ...profileData };
      
      const newResults = calculateTargets();
      
      updatedProfile.basal_calories = manualTargets.basal_calories ? 
        parseFloat(manualTargets.basal_calories) : newResults.bmr;
      
      updatedProfile.bmr = newResults.bmr;
      updatedProfile.tdee = newResults.adjustedBmr;
      updatedProfile.calories_target = manualTargets.calories_target ? 
        parseInt(manualTargets.calories_target) : newResults.calories_target;
      updatedProfile.protein_target = manualTargets.protein_target ? 
        parseInt(manualTargets.protein_target) : newResults.protein_target;
      
      updatedProfile.profile_picture = avatarUrl;
      updatedProfile.use_tdee_multiplier = useTdeeMultiplier;
      updatedProfile.tdee_calculation_method = tdeeCalculationMethod;
      updatedProfile.include_workout_calories = includeWorkoutCalories;
      
      await UserProfile.update(profileData.id, updatedProfile);
      
      await User.updateMyUserData({
        profile_picture: avatarUrl
      });
      
      setProfileData(updatedProfile);
      
      if (profileData.starting_weight !== updatedProfile.starting_weight) {
        try {
          const existingWeights = await Weight.filter({ created_by: currentUser.email });
          
          const today = format(new Date(), "yyyy-MM-dd");
          const hasTodayWeight = existingWeights.some(w => w.date === today);
          
          if (!hasTodayWeight) {
            await Weight.create({
              weight: updatedProfile.starting_weight,
              date: today
            });
          }
        } catch (error) {
          console.error("Error updating weights:", error);
        }
      }
      
      navigate(createPageUrl("Dashboard"));
    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const results = calculateTargets();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-xl sm:text-2xl font-bold">עריכת הפרופיל</h1>
        <Button 
          variant="outline" 
          onClick={() => navigate(createPageUrl("Dashboard"))}
          className="flex items-center gap-2"
          size="sm"
        >
          <Home className="w-4 h-4" />
          <span className="hidden sm:inline">חזרה לדף הבית</span>
        </Button>
      </div>
      
      <Card>
        <CardHeader className="pb-2">
          <CardTitle>הפרופיל והיעדים שלך</CardTitle>
          <CardDescription>עדכן את הנתונים שלך כדי להתאים את תוכנית התזונה</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="personal" onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6 grid grid-cols-4">
              <TabsTrigger value="personal" className="text-xs sm:text-sm">
                <UserIcon className="w-3 h-3 md:mr-2 sm:hidden" />
                <span className="hidden sm:inline">נתונים אישיים</span>
                <span className="sm:hidden">אישי</span>
              </TabsTrigger>
              <TabsTrigger value="activity" className="text-xs sm:text-sm">פעילות</TabsTrigger>
              <TabsTrigger value="goals" className="text-xs sm:text-sm">יעדים</TabsTrigger>
              <TabsTrigger value="results" className="text-xs sm:text-sm">
                <Calculator className="w-3 h-3 md:mr-2 sm:hidden" />
                <span className="hidden sm:inline">תוצאות חישוב</span>
                <span className="sm:hidden">תוצאות</span>
              </TabsTrigger>
              <TabsTrigger value="nutrition" className="text-xs sm:text-sm">תזונה</TabsTrigger>
            </TabsList>
            
            <TabsContent value="personal" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="flex flex-col items-center">
                    <Label className="mb-2 self-start">תמונת פרופיל</Label>
                    <div className="flex flex-col items-center gap-4">
                      <Avatar className="h-24 w-24 border-2 border-blue-200">
                        <AvatarImage src={avatarUrl} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                          {currentUser?.display_name?.charAt(0) || "מ"}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex flex-col items-center">
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleFileUpload}
                          />
                          <div className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm transition-colors flex items-center">
                            <Upload className="w-4 h-4 mr-2" />
                            העלה תמונת פרופיל
                          </div>
                        </label>
                        
                        {uploadSuccess && (
                          <span className="text-green-600 text-sm mt-2">
                            התמונה הועלתה בהצלחה!
                          </span>
                        )}
                        {isLoading && (
                          <div className="mt-2 flex items-center">
                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2"></div>
                            <span className="text-sm text-gray-600">מעלה תמונה...</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>גובה (ס״מ)</Label>
                    <Input
                      type="number"
                      value={profileData.height || ""}
                      onChange={(e) => handleInputChange('height', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>משקל נוכחי (ק״ג)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="80.00"
                      value={profileData.starting_weight}
                      onChange={(e) => handleInputChange('starting_weight', parseFloat(e.target.value))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>גיל</Label>
                    <Input
                      type="number"
                      value={profileData.age || ""}
                      onChange={(e) => handleInputChange('age', parseFloat(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>מגדר</Label>
                    <Select
                      value={profileData.gender || ""}
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
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>רמת פעילות יומית</Label>
                    <Select
                      value={profileData.activity_level || "moderate"}
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
                        value={[profileData.workout_frequency || 3]}
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
                      {profileData.workout_frequency} אימונים בשבוע
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>איזה סוג אימון אתה מבצע בעיקר?</Label>
                    <Select
                      value={profileData.workout_type || "mixed"}
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
            </TabsContent>
            
            <TabsContent value="goals" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>משקל יעד (ק״ג)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="70.00"
                    value={profileData.target_weight}
                    onChange={(e) => handleInputChange('target_weight', parseFloat(e.target.value))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>קצב ירידה במשקל</Label>
                  <Select
                    value={profileData.weight_loss_rate || "moderate"}
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

                <div className="space-y-2 col-span-1 md:col-span-2 pt-4 pb-2">
                  <Label htmlFor="basal_calories" className="font-medium">
                    קלוריות במנוחה (BMR)
                    <span className="text-xs text-gray-500 mr-2">
                      כמות הקלוריות שהגוף שורף במנוחה מוחלטת
                    </span>
                  </Label>
                  <Input
                    id="basal_calories"
                    type="number"
                    value={manualTargets.basal_calories || ""}
                    onChange={(e) => handleManualTargetChange("basal_calories", e.target.value)}
                    placeholder={`חישוב אוטומטי: ${calculateBMR()}`}
                  />
                  <p className="text-xs text-gray-500">
                    אם אתה יודע את הערך המדויק של הקלוריות במנוחה (למשל, מבדיקה מקצועית), הזן אותו כאן. אחרת, הערך יחושב אוטומטית.
                  </p>
                </div>

                <div className="space-y-2 col-span-1 md:col-span-2">
                  <Label htmlFor="protein_target">
                    יעד חלבון יומי (גרם)
                    <span className="text-xs text-gray-500 mr-2">
                      כמות החלבון המומלצת ליום
                    </span>
                  </Label>
                  <Input
                    id="protein_target"
                    type="number"
                    value={manualTargets.protein_target || ""}
                    onChange={(e) => handleManualTargetChange("protein_target", e.target.value)}
                    placeholder={`חישוב אוטומטי: ${calculateTargets().protein_target}`}
                  />
                  <p className="text-xs text-gray-500">
                    אם ברצונך להגדיר יעד חלבון מותאם אישית, הזן אותו כאן. אחרת, הערך יחושב אוטומטית לפי משקלך ורמת הפעילות.
                  </p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="results" className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">קצב מטבולי בסיסי (BMR)</CardTitle>
                    <CardDescription>הקלוריות שגופך שורף במנוחה</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">{manualTargets.basal_calories || results.bmr} קלוריות</div>
                    <p className="text-sm text-gray-500 mt-2">
                      {manualTargets.basal_calories ? "ערך שהוזן ידנית" : "חישוב אוטומטי לפי נתוני גוף"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">צריכת קלוריות כוללת (TDEE)</CardTitle>
                    <CardDescription>הקלוריות היומיות כולל פעילות</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {useTdeeMultiplier ? Math.round(results.adjustedBmr) : results.bmr} קלוריות
                    </div>
                    <div className="flex items-center mt-3">
                      <input
                        type="checkbox"
                        id="useTdeeMultiplier"
                        checked={useTdeeMultiplier}
                        onChange={(e) => setUseTdeeMultiplier(e.target.checked)}
                        className="ml-2 h-4 w-4 rounded border-gray-300 text-blue-600"
                      />
                      <label htmlFor="useTdeeMultiplier" className="text-sm">
                        השתמש במכפיל TDEE לפי רמת פעילות
                      </label>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      מכפיל פעילות: {useTdeeMultiplier ? (getActivityMultiplier().toFixed(2) + "x") : "לא בשימוש"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">גרעון קלורי יומי</CardTitle>
                    <CardDescription>הגרעון הדרוש להשגת יעד הירידה במשקל</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600">
                      {results.deficit} קלוריות
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      נקבע לפי קצב הירידה במשקל: {profileData.weight_loss_rate || "moderate"}
                    </p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">יעד צריכה קלורית</CardTitle>
                    <CardDescription>כמות הקלוריות המומלצת לצריכה יומית</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {results.calories_target} קלוריות
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      {useTdeeMultiplier ? "TDEE" : "BMR"} {useTdeeMultiplier ? Math.round(results.adjustedBmr) : results.bmr} - גרעון ({results.deficit})
                    </p>
                    <div className="mt-3 text-sm text-blue-600">
                      * אימונים יוסיפו קלוריות ליעד הצריכה היומי
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">יעד חלבון יומי</CardTitle>
                    <CardDescription>כמות החלבון המומלצת עבורך</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600">
                      {manualTargets.protein_target || results.protein_target} גרם
                    </div>
                    <p className="text-sm text-gray-500 mt-2">
                      כ-{Math.round((manualTargets.protein_target || results.protein_target) / profileData.starting_weight * 10) / 10} גרם לכל ק״ג ממשקל גופך
                    </p>
                  </CardContent>
                </Card>
              </div>
              
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <h3 className="font-semibold text-blue-800">תחזית ירידה במשקל</h3>
                <p className="mt-1">
                  בהתבסס על התוכנית שלך, אתה צפוי לרדת כ-{results.weekly_weight_loss.toFixed(2)} ק״ג בשבוע.
                  זה אומר שתוכל להגיע למשקל היעד שלך תוך כ-
                  {Math.ceil((profileData.starting_weight - profileData.target_weight) / results.weekly_weight_loss)} שבועות
                  (כ-{Math.ceil((profileData.starting_weight - profileData.target_weight) / results.weekly_weight_loss / 4)} חודשים).
                </p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter>
          <div className="flex w-full justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate(createPageUrl("Dashboard"))}
            >
              <ArrowRight className="ml-2 w-4 h-4" />
              ביטול
            </Button>
            
            <Button 
              onClick={handleSave} 
              disabled={isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save className="ml-2 w-4 h-4" />
                  שמור שינויים
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
      
      <Card className="bg-blue-50">
        <CardHeader>
          <CardTitle>קלוריות ותזונה</CardTitle>
          <CardDescription>
            שינוי הגדרות חישוב הקלוריות ויעדי התזונה
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-1">
            <h3 className="font-medium text-gray-900">שיטת חישוב הוצאת הקלוריות היומית</h3>
            <p className="text-sm text-gray-600">
              בחר את השיטה המועדפת עליך לחישוב כמות הקלוריות שאתה שורף ביום
            </p>
            
            <div className="space-y-3 mt-2">
              <div className="flex items-start gap-2">
                <RadioGroup 
                  value={tdeeCalculationMethod} 
                  onValueChange={setTdeeCalculationMethod}
                  className="space-y-3"
                >
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="full_activity" id="full_activity" />
                    <Label 
                      htmlFor="full_activity" 
                      className="font-normal cursor-pointer leading-tight"
                    >
                      <span className="font-medium">שיטת מכפיל הפעילות המלא</span>
                      <p className="text-sm text-gray-600 mt-1">
                        BMR * מכפיל פעילות יומית (1.2-1.9) על בסיס Rמת הפעילות הכללית שלך. 
                        מכפיל זה מחשב את כל הפעילויות שלך בממוצע על פני זמן.
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="sedentary_plus_exercise" id="sedentary_plus_exercise" />
                    <Label 
                      htmlFor="sedentary_plus_exercise" 
                      className="font-normal cursor-pointer leading-tight"
                    >
                      <span className="font-medium">שיטת בסיס יושבני + אימונים</span>
                      <p className="text-sm text-gray-600 mt-1">
                        BMR * 1.2 (מכפיל יושבני) + קלוריות מאימונים ספציפיים. שיטה זו מדויקת יותר אם 
                        אתה מקפיד לתעד את כל האימונים שלך.
                      </p>
                    </Label>
                  </div>
                  
                  <div className="flex items-start gap-2">
                    <RadioGroupItem value="custom" id="custom" />
                    <Label 
                      htmlFor="custom" 
                      className="font-normal cursor-pointer leading-tight"
                    >
                      <span className="font-medium">הגדרה ידנית מותאמת אישית</span>
                      <p className="text-sm text-gray-600 mt-1">
                        הגדר ידנית את הקלוריות הבסיסיות והיעד היומי שלך. 
                        מומלץ אם אתה עובד עם תזונאי או מאמן.
                      </p>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
              
              {tdeeCalculationMethod !== "custom" && (
                <div className="mt-4 flex items-center gap-2">
                  <Checkbox 
                    id="include_workout_calories" 
                    checked={includeWorkoutCalories}
                    onCheckedChange={setIncludeWorkoutCalories}
                  />
                  <Label 
                    htmlFor="include_workout_calories" 
                    className="text-sm font-normal cursor-pointer"
                  >
                    כלול קלוריות מאימונים ביעד הקלוריות היומי
                    <span className="text-xs block text-gray-600 mt-1">
                      כאשר מסומן, יעד הקלוריות היומי יעלה בימים שבהם אתה מתאמן
                    </span>
                  </Label>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
