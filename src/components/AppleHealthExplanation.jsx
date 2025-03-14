
import React from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, CloudOff } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AvatarFix() {
  return (
    <div className="flex flex-col items-center">
      <Alert className="w-full bg-gray-50 border-gray-200">
        <CloudOff className="h-4 w-4 text-gray-500" />
        <AlertTitle className="text-gray-800">חלופה מוצעת</AlertTitle>
        <AlertDescription className="text-gray-700">
          לעת עתה, המשך להשתמש באפליקציה לתיעוד הנתונים שלך. אנחנו עובדים על שיפור האינטגרציה בעתיד.
        </AlertDescription>
      </Alert>
      
      <div className="flex justify-between w-full mt-4">
        <Button variant="outline">חזרה לדף הבית</Button>
      </div>
    </div>
  );
}
