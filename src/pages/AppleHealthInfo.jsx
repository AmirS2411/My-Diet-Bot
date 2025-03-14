import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Apple, InfoIcon } from "lucide-react";

export default function AppleHealthInfo() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">אינטגרציה עם Apple Health</h1>
      <p className="text-gray-600">
        מידע על אפשרויות החיבור למערכת הבריאות של אפל
      </p>
      
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Apple className="h-6 w-6 text-gray-800" />
            <CardTitle>אינטגרציה עם Apple Health</CardTitle>
          </div>
          <CardDescription>
            מידע על האפשרויות לחיבור נתונים מאפליקציית הבריאות של אפל
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start bg-amber-50 border border-amber-200 rounded-md p-4">
            <InfoIcon className="h-5 w-5 text-amber-600 mr-2 mt-0.5 shrink-0" />
            <div>
              <h3 className="text-amber-800 font-medium">מגבלת אינטגרציה</h3>
              <p className="text-amber-700 text-sm mt-1">
                כרגע לא ניתן לחבר ישירות את האפליקציה לנתוני Apple Health בגלל מגבלות של פלטפורמת הווב.
              </p>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-base font-medium">למה קיימת מגבלה זו?</h3>
            <p className="text-sm text-gray-600">
              אפל מאפשרת גישה לנתוני Apple Health רק לאפליקציות מקומיות שמותקנות על המכשיר (native apps) 
              באמצעות HealthKit API. אפליקציות ווב, כמו My Diet Bot הפועלת בדפדפן, אינן יכולות לגשת ישירות לנתונים אלה.
            </p>
          </div>
          
          <div className="mt-4">
            <Button onClick={() => window.history.back()} variant="outline">
              חזרה לדף הקודם
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}