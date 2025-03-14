
import React, { useState, useEffect, useRef } from "react";
import { Meal, User } from "@/api/entities";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { UploadFile } from "@/api/integrations";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { ArrowRight, Camera, X, Barcode } from "lucide-react";
import BarcodeScanner from "../components/nutrition/BarcodeScanner";

const mealTypes = [
  { value: "breakfast", label: "ארוחת בוקר" },
  { value: "lunch", label: "ארוחת צהריים" },
  { value: "dinner", label: "ארוחת ערב" }
];

export default function AddMeal() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const fileInputRef = useRef(null);
  
  const currentTime = new Date();
  const formattedTime = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime.getMinutes().toString().padStart(2, '0')}`;
  
  const [mealData, setMealData] = useState({
    type: "",
    description: "",
    calories: "",
    protein: "",
    portion_size: "",
    photo_url: "",
    time: formattedTime,
    date: format(new Date(), "yyyy-MM-dd"),
    notes: ""
  });

  useEffect(() => {
    const checkUser = async () => {
      try {
        const user = await User.me();
        
        if (!user.completed_onboarding) {
          navigate(createPageUrl("Onboarding"));
        }
      } catch (error) {
        navigate(createPageUrl("Login"));
      }
    };
    
    checkUser();
  }, [navigate]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleBarcodeScanned = (barcode, foodData) => {
    setShowBarcodeScanner(false);
    
    if (foodData && foodData.product_name) {
      setMealData(prev => ({
        ...prev,
        description: foodData.product_name + (foodData.serving_size ? ` (${foodData.serving_size})` : ''),
        calories: foodData.calories.toString(),
        protein: foodData.protein.toString(),
        portion_size: foodData.serving_size || ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      let photoUrl = "";
      
      if (selectedImage) {
        setUploadingImage(true);
        const { file_url } = await UploadFile({ file: selectedImage });
        photoUrl = file_url;
        setUploadingImage(false);
      }
      
      await Meal.create({
        ...mealData,
        calories: parseInt(mealData.calories),
        protein: mealData.protein ? parseFloat(mealData.protein) : null,
        photo_url: photoUrl
      });
      
      navigate(createPageUrl("Meals"));
    } catch (error) {
      console.error("Error adding meal:", error);
      setIsSubmitting(false);
      setUploadingImage(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Button
        variant="ghost"
        onClick={() => navigate(-1)}
        className="mb-4 sm:mb-6 text-sm"
      >
        <ArrowRight className="w-4 h-4 ml-2" />
        חזור
      </Button>

      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-lg sm:text-xl">הוספת ארוחה חדשה</CardTitle>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0 sm:pt-0">
          {showBarcodeScanner ? (
            <BarcodeScanner 
              onCodeScanned={handleBarcodeScanned} 
              onClose={() => setShowBarcodeScanner(false)}
            />
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
              <div className="space-y-2">
                <Label className="text-sm font-medium">סוג ארוחה</Label>
                <Select
                  value={mealData.type}
                  onValueChange={(value) => setMealData({ ...mealData, type: value })}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="בחר סוג ארוחה" />
                  </SelectTrigger>
                  <SelectContent>
                    {mealTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-medium">תיאור</Label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="h-8 px-2 text-blue-600"
                    onClick={() => setShowBarcodeScanner(true)}
                  >
                    <Barcode className="h-4 w-4 ml-1" />
                    סרוק ברקוד
                  </Button>
                </div>
                <Textarea
                  value={mealData.description}
                  onChange={(e) => setMealData({ ...mealData, description: e.target.value })}
                  placeholder="פרט מה אכלת..."
                  className="min-h-[80px]"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">גודל מנה</Label>
                <Input
                  value={mealData.portion_size}
                  onChange={(e) => setMealData({ ...mealData, portion_size: e.target.value })}
                  placeholder="כגון: 100 גרם / כוס אחת / 2 יחידות"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">קלוריות</Label>
                  <Input
                    type="number"
                    value={mealData.calories}
                    onChange={(e) => setMealData({ ...mealData, calories: e.target.value })}
                    placeholder="הכנס קלוריות"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">חלבון (גרם)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={mealData.protein}
                    onChange={(e) => setMealData({ ...mealData, protein: e.target.value })}
                    placeholder="הכנס כמות חלבון"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">תאריך</Label>
                  <Input
                    type="date"
                    value={mealData.date}
                    onChange={(e) => setMealData({ ...mealData, date: e.target.value })}
                    max={format(new Date(), "yyyy-MM-dd")}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">שעה</Label>
                  <Input
                    type="time"
                    value={mealData.time}
                    onChange={(e) => setMealData({ ...mealData, time: e.target.value })}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">הערות נוספות</Label>
                <Textarea
                  value={mealData.notes}
                  onChange={(e) => setMealData({ ...mealData, notes: e.target.value })}
                  placeholder="הערות אישיות, תחושות אחרי הארוחה וכו'..."
                  className="min-h-[60px]"
                />
              </div>
              
              <div className="space-y-2">
                <Label className="text-sm font-medium">הוסף תמונה (אופציונלי)</Label>
                <div className="flex flex-col items-center">
                  {imagePreview ? (
                    <div className="relative w-full mb-3">
                      <img 
                        src={imagePreview} 
                        alt="תצוגה מקדימה של הארוחה" 
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-2 right-2 h-8 w-8 rounded-full"
                        onClick={removeSelectedImage}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full p-8 border-dashed border-2 flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current.click()}
                    >
                      <Camera className="h-6 w-6 mb-2 text-gray-400" />
                      <span className="text-sm text-gray-500">לחץ להעלאת תמונה</span>
                    </Button>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                disabled={isSubmitting || uploadingImage || !mealData.type || !mealData.description || !mealData.calories}
              >
                {isSubmitting || uploadingImage ? "מוסיף..." : "הוסף ארוחה"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
