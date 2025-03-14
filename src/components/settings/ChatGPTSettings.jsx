import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { OpenAI } from "@/api/integrations";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export default function ChatGPTSettings() {
  const [apiKey, setApiKey] = useState("");
  const [savedApiKey, setSavedApiKey] = useState("");
  const [isApiKeyValid, setIsApiKeyValid] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [useGpt4, setUseGpt4] = useState(true);
  const [useOpenAI, setUseOpenAI] = useState(false);
  
  // Load saved settings on component mount
  useEffect(() => {
    const loadSettings = () => {
      const savedKey = localStorage.getItem("openai_api_key");
      const savedUseGpt4 = localStorage.getItem("openai_use_gpt4");
      const savedUseOpenAI = localStorage.getItem("use_openai_integration");
      
      if (savedKey) {
        setApiKey(savedKey);
        setSavedApiKey(savedKey);
        setIsApiKeyValid(true);
      }
      
      if (savedUseGpt4 !== null) {
        setUseGpt4(savedUseGpt4 === "true");
      }
      
      if (savedUseOpenAI !== null) {
        setUseOpenAI(savedUseOpenAI === "true");
      }
    };
    
    loadSettings();
  }, []);
  
  // Validate the API key
  const validateApiKey = async () => {
    if (!apiKey) {
      setValidationError("API key is required");
      return;
    }
    
    setIsValidating(true);
    setValidationError("");
    
    try {
      // Initialize the OpenAI client with the API key
      OpenAI.initialize(apiKey);
      
      // Test the API key with a simple request
      const response = await OpenAI.sendChatMessage(
        "Hello, this is a test message to validate the API key.",
        [],
        {
          model: useGpt4 ? "gpt-4o" : "gpt-3.5-turbo",
          max_tokens: 50,
          temperature: 0.7,
          saveToDatabase: false
        }
      );
      
      if (response && response.content) {
        setIsApiKeyValid(true);
        setSavedApiKey(apiKey);
        
        // Save settings to localStorage
        localStorage.setItem("openai_api_key", apiKey);
        localStorage.setItem("openai_use_gpt4", useGpt4.toString());
        
        setValidationError("");
      } else {
        setIsApiKeyValid(false);
        setValidationError("Invalid API key or response");
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      setIsApiKeyValid(false);
      setValidationError(error.message || "Failed to validate API key");
    } finally {
      setIsValidating(false);
    }
  };
  
  // Toggle OpenAI integration
  const toggleOpenAIIntegration = (enabled) => {
    setUseOpenAI(enabled);
    localStorage.setItem("use_openai_integration", enabled.toString());
  };
  
  // Toggle GPT-4 usage
  const toggleGpt4 = (enabled) => {
    setUseGpt4(enabled);
    localStorage.setItem("openai_use_gpt4", enabled.toString());
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>הגדרות ChatGPT</CardTitle>
        <CardDescription>
          הגדר את האינטגרציה עם ChatGPT לשיפור חוויית הצ'אט התזונתי
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="api-key" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="api-key">מפתח API</TabsTrigger>
            <TabsTrigger value="settings">הגדרות</TabsTrigger>
          </TabsList>
          
          <TabsContent value="api-key" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key">מפתח API של OpenAI</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <p className="text-sm text-gray-500">
                ניתן להשיג מפתח API באתר{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline"
                >
                  OpenAI
                </a>
              </p>
            </div>
            
            <div className="flex items-center justify-between">
              <Button
                onClick={validateApiKey}
                disabled={isValidating || !apiKey}
              >
                {isValidating ? "בודק..." : "בדוק ושמור מפתח API"}
              </Button>
              
              {isApiKeyValid && savedApiKey === apiKey && (
                <div className="flex items-center text-green-500">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  <span className="text-sm">מפתח API תקין</span>
                </div>
              )}
            </div>
            
            {validationError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError}</AlertDescription>
              </Alert>
            )}
          </TabsContent>
          
          <TabsContent value="settings" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="use-openai">השתמש באינטגרציית ChatGPT</Label>
                  <p className="text-sm text-gray-500">
                    הפעל כדי להשתמש ב-ChatGPT במקום ב-Base44 LLM
                  </p>
                </div>
                <Switch
                  id="use-openai"
                  checked={useOpenAI}
                  onCheckedChange={toggleOpenAIIntegration}
                  disabled={!isApiKeyValid}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="use-gpt4">השתמש ב-GPT-4</Label>
                  <p className="text-sm text-gray-500">
                    GPT-4 מספק תוצאות טובות יותר אך עלול להיות יקר יותר
                  </p>
                </div>
                <Switch
                  id="use-gpt4"
                  checked={useGpt4}
                  onCheckedChange={toggleGpt4}
                  disabled={!isApiKeyValid}
                />
              </div>
            </div>
            
            {!isApiKeyValid && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  יש להגדיר מפתח API תקין לפני הפעלת האינטגרציה
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
