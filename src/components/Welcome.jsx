import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Welcome({ userName, onStart }) {
  const navigate = useNavigate();
  
  return (
    <Card className="shadow-lg text-center">
      <CardContent className="pt-8 pb-6 px-6">
        <h2 className="text-2xl font-bold mb-4">ברוך השב, {userName}!</h2>
        <p className="mb-6">בוא נמלא כמה פרטים כדי להתאים לך תוכנית אישית</p>
        
        <Button 
          onClick={onStart}
          className="bg-blue-600 hover:bg-blue-700 w-full max-w-xs mx-auto"
        >
          בוא נתחיל
          <ArrowLeft className="mr-2 w-4 h-4" />
        </Button>
      </CardContent>
    </Card>
  );
}