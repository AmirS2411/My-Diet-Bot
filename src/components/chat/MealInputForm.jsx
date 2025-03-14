
import React, { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { UploadFile } from "@/api/integrations";
import { Camera, X, Barcode } from "lucide-react";
import BarcodeScanner from "../nutrition/BarcodeScanner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format } from 'date-fns';

const mealTypes = [
  { value: "breakfast", label: "ארוחת בוקר" },
  { value: "lunch", label: "ארוחת צהריים" },
  { value: "dinner", label: "ארוחת ערב" }
];

export default function MealInputForm({ onSubmit, onCancel }) {
  const [mealData, setMealData] = useState({
    type: "",
    description: "",
    calories: "",
    protein: "",
    portion_size: "",
    photo_url: "",
    time: new Date().toTimeString().substring(0, 5)
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const fileInputRef = useRef(null);

  const handleChange = (field, value) => {
    setMealData(prev => ({ ...prev, [field]: value }));
  };

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
      
      const currentTime = format(new Date(), "HH:mm");
      const mealDataToSubmit = {
        ...mealData,
        time: currentTime,
        date: format(new Date(), "yyyy-MM-dd"),
        calories: parseInt(mealData.calories),
        protein: mealData.protein ? parseFloat(mealData.protein) : 0,
        photo_url: photoUrl
      };
      
      console.log("Submitting meal from chat:", mealDataToSubmit);
      
      await onSubmit(mealDataToSubmit);
      
      setMealData({
        type: "",
        description: "",
        calories: "",
        protein: "",
        portion_size: "",
        photo_url: "",
        time: new Date().toTimeString().substring(0, 5)
      });
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Error in meal form submission:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="p-4">
        <CardTitle className="text-lg">הוספת ארוחה חדשה</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {showBarcodeScanner ? (
          <BarcodeScanner 
            onCodeScanned={handleBarcodeScanned} 
            onClose={() => setShowBarcodeScanner(false)}
          />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm">סוג ארוחה</Label>
              <Select
                value={mealData.type}
                onValueChange={(value) => handleChange("type", value)}
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
                <Label className="text-sm">תיאור</Label>
                <Button 
                  type="button" 
                  variant="ghost" 
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
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="פרט מה אכלת..."
                rows={2}
                className="min-h-[60px]"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">גודל מנה (אופציונלי)</Label>
              <Input 
                value={mealData.portion_size}
                onChange={(e) => handleChange("portion_size", e.target.value)}
                placeholder="לדוגמה: 100 גרם / כוס אחת"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm">קלוריות</Label>
                <Input
                  type="number"
                  value={mealData.calories}
                  onChange={(e) => handleChange("calories", e.target.value)}
                  placeholder="הכנס קלוריות"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="text-sm">חלבון (גרם)</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={mealData.protein}
                  onChange={(e) => handleChange("protein", e.target.value)}
                  placeholder="הכנס כמות חלבון"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">שעה</Label>
              <Input
                type="time"
                value={mealData.time}
                onChange={(e) => handleChange("time", e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm">הוסף תמונה (אופציונלי)</Label>
              {imagePreview ? (
                <div className="relative w-full">
                  <img 
                    src={imagePreview} 
                    alt="תצוגה מקדימה" 
                    className="w-full h-36 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-6 w-6 rounded-full"
                    onClick={removeSelectedImage}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full p-4 border-dashed border-2 flex items-center justify-center"
                  onClick={() => fileInputRef.current.click()}
                >
                  <Camera className="h-4 w-4 ml-2" />
                  <span className="text-sm">צלם או בחר תמונה</span>
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
  );
}
