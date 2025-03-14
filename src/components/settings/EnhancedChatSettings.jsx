import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function EnhancedChatSettings() {
  const [useEnhancedChat, setUseEnhancedChat] = useState(false);
  
  // Load saved settings on component mount
  useEffect(() => {
    const savedSetting = localStorage.getItem("use_enhanced_chat");
    if (savedSetting !== null) {
      setUseEnhancedChat(savedSetting === "true");
    }
  }, []);
  
  // Toggle enhanced chat
  const toggleEnhancedChat = (enabled) => {
    setUseEnhancedChat(enabled);
    localStorage.setItem("use_enhanced_chat", enabled.toString());
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>הגדרות צ'אט מתקדם</CardTitle>
        <CardDescription>
          הפעל או כבה את יכולות הצ'אט המתקדמות לשיפור חוויית השיחה
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Label htmlFor="use-enhanced-chat">השתמש בצ'אט מתקדם</Label>
            <p className="text-sm text-gray-500">
              הפעל כדי לקבל תשובות מפורטות יותר ומותאמות אישית
            </p>
          </div>
          <Switch
            id="use-enhanced-chat"
            checked={useEnhancedChat}
            onCheckedChange={toggleEnhancedChat}
          />
        </div>
      </CardContent>
    </Card>
  );
}
