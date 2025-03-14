import React, { useState, useEffect, useRef } from "react";
import { Message, Meal, UserProfile, User, NutritionAnalysis } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";
import chatGptIntegration from "../api/chatGptIntegration";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Camera, X, Image as ImageIcon, Calendar, Flame, Trash2, Plus } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import ChatBubble from "../components/chat/ChatBubble";
import { format, parseISO } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";

export default function NutritionistChat() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const messagesEndRef = useRef(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [processingImage, setProcessingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef(null);
  const [dailyMeals, setDailyMeals] = useState([]);
  const [dailyCalories, setDailyCalories] = useState(0);
  const [dailyProtein, setDailyProtein] = useState(0);
  const [editingNutrition, setEditingNutrition] = useState(null);
  const [showNutritionEditor, setShowNutritionEditor] = useState(false);
  const chatContainerRef = useRef(null);

  const logError = (error, context = "") => {
    console.error(`--- Chat Error Log ---`);
    console.error(`Context: ${context}`);
    console.error(`Time: ${new Date().toISOString()}`);
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    console.error(`-----------------------`);
    
    try {
      const chatLogs = JSON.parse(localStorage.getItem('chatErrorLogs') || '[]');
      chatLogs.push({
        context,
        time: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });

      if (chatLogs.length > 10) {
        chatLogs.shift();
      }

      localStorage.setItem('chatErrorLogs', JSON.stringify(chatLogs));
    } catch (storageError) {
      console.error("Failed to store error log:", storageError);
    }
  };

  const backupCurrentChatState = () => {
    try {
      localStorage.setItem('chatMessagesBackup', JSON.stringify(messages));
      localStorage.setItem('chatBackupTime', new Date().toISOString());
      console.log("Chat state backed up at:", new Date().toISOString());
    } catch (error) {
      console.error("Failed to backup chat state:", error);
    }
  };

  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);

        const userPromise = User.me();
        const today = new Date();
        const todayString = format(today, "yyyy-MM-dd");
        setSelectedDate(todayString);
        
        const user = await userPromise;
        setCurrentUser(user);
        
        // Initialize OpenAI if API key is available
        const openaiApiKey = localStorage.getItem("openai_api_key");
        if (openaiApiKey) {
          try {
            // OpenAI.initialize(openaiApiKey);
            console.log("OpenAI client initialized");
          } catch (error) {
            console.error("Failed to initialize OpenAI client:", error);
          }
        }
        
        const [profileData, allMessages, mealsData] = await Promise.all([
          UserProfile.filter({ user_id: user.id }),
          Message.list("-timestamp", 100),
          Meal.filter({ created_by: user.email, date: todayString })
        ]);
        
        if (profileData.length > 0) {
          setUserProfile(profileData[0]);
        }
        
        if (allMessages && allMessages.length > 0) {
          const sortedMessages = allMessages
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .reverse();
          
          setMessages(sortedMessages);
        } else {
          const initialGreeting = {
            content: `שלום ${user.display_name || ""}! אני התזונאי האישי שלך. איך אוכל לעזור לך היום?`,
            sender: "nutritionist",
            timestamp: new Date().toISOString()
          };
          
          try {
            await Message.create(initialGreeting);
            setMessages([initialGreeting]);
          } catch (error) {
            console.error("Error sending initial greeting:", error);
          }
        }
        
        if (mealsData.length > 0) {
          setDailyMeals(mealsData);
          const totalCalories = mealsData.reduce((sum, meal) => sum + meal.calories, 0);
          const totalProtein = mealsData.reduce((sum, meal) => sum + (meal.protein || 0), 0);
          setDailyCalories(totalCalories);
          setDailyProtein(totalProtein);
        }
      } catch (error) {
        console.error("Error initializing chat:", error);
        logError(error, "initChat");
        
        if (error.message?.includes("not authenticated")) {
          navigate(createPageUrl("Welcome"));
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    initChat();
  }, [navigate]);

  useEffect(() => {
    if (selectedDate && currentUser) {
      loadMealsForDate(selectedDate);
    }
  }, [selectedDate, currentUser]);

  const loadMealsForDate = async (date) => {
    try {
      const mealsData = await Meal.filter({
        created_by: currentUser.email,
        date: date
      });

      if (mealsData.length > 0) {
        setDailyMeals(mealsData);
        const totalCalories = mealsData.reduce((sum, meal) => sum + meal.calories, 0);
        const totalProtein = mealsData.reduce((sum, meal) => sum + (meal.protein || 0), 0);
        setDailyCalories(totalCalories);
        setDailyProtein(totalProtein);
      } else {
        setDailyMeals([]);
        setDailyCalories(0);
        setDailyProtein(0);
      }
    } catch (error) {
      console.error(`Error loading meals for date ${date}:`, error);
    }
  };

  const loadChatMessages = async (limit = 100) => {
    try {
      const allMessages = await Message.list("-timestamp", limit);
      
      if (allMessages && allMessages.length > 0) {
        const sortedMessages = allMessages
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
          .reverse();
        
        setMessages(sortedMessages);
      }
    } catch (error) {
      console.error("Error loading chat messages:", error);
      logError(error, "loadChatMessages");
    }
  };

  useEffect(() => {
    const backupInterval = setInterval(() => {
      if (messages.length > 0) {
        backupCurrentChatState();
      }
    }, 5 * 60 * 1000);
    
    return () => clearInterval(backupInterval);
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollChatToBottom();
      backupCurrentChatState();
    }
  }, [messages.length]);

  const safeHandleUserMessage = async () => {
    try {
      await handleUserMessage();
    } catch (error) {
      logError(error, "handleUserMessage");
      setIsTyping(false);
      alert("קרתה שגיאה בשליחת ההודעה. המערכת שמרה את פרטי השגיאה ליומן האירועים.");
    }
  };

  const safeProcessImage = async () => {
    try {
      await processImage();
    } catch (error) {
      logError(error, "processImage");
      setProcessingImage(false);
      setUploadingImage(false);
      setIsTyping(false);
      alert("קרתה שגיאה בעיבוד התמונה. המערכת שמרה את פרטי השגיאה ליומן האירועים.");
    }
  };

  const handleMealInput = (suggestion) => {
    setNewMessage(suggestion);
    setTimeout(() => {
      safeHandleUserMessage();
    }, 100);
  };

  const emergencyRestoreChat = () => {
    try {
      const backupMessages = localStorage.getItem('chatMessagesBackup');
      if (backupMessages) {
        setMessages(JSON.parse(backupMessages));
        const backupTime = localStorage.getItem('chatBackupTime');
        alert(`הצ'אט שוחזר מגיבוי מתאריך: ${backupTime || 'לא ידוע'}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to restore chat:", error);
      return false;
    }
  };

  const loadUserData = async () => {
    try {
      setIsLoading(true);
      const user = await User.me();
      setCurrentUser(user);

      const profileData = await UserProfile.filter({ user_id: user.id });
      if (profileData.length > 0) {
        setUserProfile(profileData[0]);
      } else {
        navigate(createPageUrl("InitialQuestionnaire"));
      }
    } catch (error) {
      console.error("Error loading user data:", error);
      navigate(createPageUrl("Login"));
    } finally {
      setIsLoading(false);
    }
  };

  const loadMeals = async (date) => {
    try {
      const dateStr = format(date, "yyyy-MM-dd");
      const mealsData = await Meal.filter({ date: dateStr });
      
      setDailyMeals(mealsData);
      
      let totalCalories = 0;
      let totalProtein = 0;
      
      mealsData.forEach(meal => {
        totalCalories += meal.calories || 0;
        totalProtein += meal.protein || 0;
      });
      
      setDailyCalories(totalCalories);
      setDailyProtein(totalProtein);
      
      return mealsData;
    } catch (error) {
      console.error("Error loading meals:", error);
      return [];
    }
  };

  const scrollChatToBottom = () => {
    setTimeout(() => {
      if (chatContainerRef.current) {
        const chatContainer = chatContainerRef.current;
        chatContainer.scrollTop = chatContainer.scrollHeight;
      }
    }, 100);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const determineMealType = (description) => {
    const lowerDesc = description.toLowerCase();

    if (lowerDesc.includes('ארוחת בוקר') || lowerDesc.includes('בוקר')) {
      return 'breakfast';
    } else if (lowerDesc.includes('ארוחת צהריים') || lowerDesc.includes('צהריים')) {
      return 'lunch';
    } else if (lowerDesc.includes('ארוחת ביניים') || lowerDesc.includes('חטיף')) {
      return 'snack';
    } else if (lowerDesc.includes('ארוחת ערב') || lowerDesc.includes('ערב')) {
      return 'dinner';
    } else if (lowerDesc.includes('לילה') || lowerDesc.includes('נשנוש')) {
      return 'night_snack';
    }

    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      return 'lunch';
    } else if (hour >= 16 && hour < 19) {
      return 'snack';
    } else if (hour >= 19 && hour < 23) {
      return 'dinner';
    } else {
      return 'night_snack';
    }
  };

  const processImage = async () => {
    if (!selectedImage) return;

    setProcessingImage(true);
    try {
      setUploadingImage(true);
      const { file_url } = await UploadFile({ file: selectedImage });
      setUploadingImage(false);

      const userMessage = {
        content: newMessage || "הנה תמונה של הארוחה שלי",
        sender: "user",
        timestamp: new Date().toISOString(),
        image_url: file_url
      };

      await Message.create(userMessage);
      setMessages(prev => [...prev, userMessage]);
      setNewMessage("");
      removeSelectedImage();

      setIsTyping(true);
      scrollChatToBottom();

      // Check if enhanced chat is enabled
      const useEnhancedChat = localStorage.getItem("use_enhanced_chat") === "true";
      
      let response;
      
      if (useEnhancedChat) {
        try {
          // Use the enhanced meal analysis with image
          response = await chatGptIntegration.analyzeMealEnhanced(
            userMessage.content, 
            file_url
          );
        } catch (error) {
          console.error("Error using enhanced meal analysis with image:", error);
          logError(error, "enhancedMealAnalysisWithImage");
          
          // Fallback to regular LLM
          response = await InvokeLLM({
            prompt: `I'm sending you a photo of a meal. The image is available at: ${file_url}`,
            add_context_from_internet: false
          });
        }
      } else {
        // Use regular LLM as before
        response = await InvokeLLM({
          prompt: `I'm sending you a photo of a meal. The image is available at: ${file_url}`,
          add_context_from_internet: false
        });
      }

      const nutritionAnalysis = {
        calories: response.nutrition.calories,
        protein: response.nutrition.protein,
        carbs: response.nutrition.carbs,
        fiber: response.nutrition.fiber || 0,
        net_carbs: response.nutrition.net_carbs || (response.nutrition.carbs - (response.nutrition.fiber || 0)),
        fat: response.nutrition.fat,
        keto_friendly: response.is_keto_friendly,
        low_carb_friendly: response.is_low_carb_friendly,
        food_items: response.identified_foods,
        analysis_date: new Date().toISOString()
      };

      setEditingNutrition({
        calories: response.nutrition.calories,
        protein: response.nutrition.protein,
        carbs: response.nutrition.carbs,
        fat: response.nutrition.fat
      });

      let responseContent = `**ניתוח הארוחה בתמונה**\n\n`;
      responseContent += `${response.meal_description}\n\n`;
      
      if (response.identified_foods && response.identified_foods.length > 0) {
        responseContent += `**פירוט רכיבי הארוחה:**\n`;
        response.identified_foods.forEach(food => {
          responseContent += `• ${food.name} (${food.portion})\n`;
          responseContent += `  - קלוריות: ${food.calories || 0}\n`;
          responseContent += `  - חלבון: ${food.protein || 0}g\n`;
          responseContent += `  - פחמימות: ${food.carbs || 0}g\n`;
          responseContent += `  - שומן: ${food.fat || 0}g\n`;
        });
        responseContent += `\n`;
      }
      
      responseContent += `**סיכום תזונתי כולל:**\n`;
      responseContent += `• קלוריות: ${response.nutrition.calories}\n`;
      responseContent += `• חלבון: ${response.nutrition.protein}g\n`;
      responseContent += `• פחמימות: ${response.nutrition.carbs}g`;
      
      if (response.nutrition.fiber) {
        responseContent += ` (מתוכן ${response.nutrition.fiber}g סיבים תזונתיים)\n`;
        responseContent += `• פחמימות נטו: ${response.nutrition.net_carbs}g\n`;
      } else {
        responseContent += `\n`;
      }
      
      responseContent += `• שומן: ${response.nutrition.fat}g\n\n`;
      
      responseContent += response.is_low_carb_friendly ? 
        `✅ **ארוחה זו מתאימה לדיאטה דלת-פחמימות**\n\n` : 
        `⚠️ **ארוחה זו אינה אידיאלית לדיאטה דלת-פחמימות**\n\n`;
      
      responseContent += `**הערכה תזונתית:**\n${response.nutrition_assessment}\n\n`;
      responseContent += `**טיפים לאופטימיזציה:**\n${response.low_carb_optimization}\n\n`;
      
      if (response.alternative_suggestions && response.alternative_suggestions.length > 0) {
        responseContent += `**המלצות לחלופות דלות פחמימות:**\n`;
        response.alternative_suggestions.forEach(alt => {
          responseContent += `• ${alt}\n`;
        });
      }

      responseContent += `\n\nהאם הערכים התזונתיים נכונים? אם לא, הקלד "ערוך ערכים תזונתיים" כדי לעדכן אותם.`;

      const nutritionistMessage = {
        content: responseContent,
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };

      await Message.create(nutritionistMessage);
      setMessages(prev => [...prev, nutritionistMessage]);

      const mealType = determineMealType(response.meal_description);

      const newMeal = {
        type: mealType,
        description: response.meal_description,
        calories: response.nutrition.calories,
        protein: response.nutrition.protein,
        carbs: response.nutrition.carbs,
        fat: response.nutrition.fat,
        date: selectedDate,
        photo_url: file_url,
        time: format(new Date(), "HH:mm")
      };

      const createdMeal = await Meal.create(newMeal);
      localStorage.setItem('lastMealId', createdMeal.id);

      const analysisData = {
        ...nutritionAnalysis,
        meal_id: createdMeal.id
      };

      await NutritionAnalysis.create(analysisData);
      await loadMeals(selectedDate);

    } catch (error) {
      console.error("Error processing image:", error);
      logError(error, "processImage");
      const errorMessage = {
        content: "מצטער, התרחשה שגיאה בעת עיבוד התמונה. אנא נסה שוב או תאר את הארוחה בהודעת טקסט.",
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };
      await Message.create(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setProcessingImage(false);
      setIsTyping(false);
    }
  };

  const handleUserMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    if (selectedImage) {
      await safeProcessImage();
      return;
    }

    const messageText = newMessage;
    setNewMessage("");
    setIsTyping(true);

    const userMessage = {
      content: messageText,
      sender: "user",
      timestamp: new Date().toISOString()
    };

    await Message.create(userMessage);
    setMessages(prev => [...prev, userMessage]);
    scrollChatToBottom();

    try {
      if (messageText.toLowerCase().includes("ערוך ערכים") || 
          messageText.toLowerCase().includes("עדכן ערכים") ||
          messageText.toLowerCase().includes("תקן ערכים")) {
        
        if (editingNutrition) {
          setShowNutritionEditor(true);
          const editPromptMessage = {
            content: "אתה יכול לערוך את הערכים התזונתיים בחלון שנפתח. לאחר העריכה, הערכים יעודכנו בארוחה האחרונה שתיעדת.",
            sender: "nutritionist",
            timestamp: new Date().toISOString()
          };
          await Message.create(editPromptMessage);
          setMessages(prev => [...prev, editPromptMessage]);
        } else {
          const noEditableMessage = {
            content: "אין ערכים תזונתיים זמינים לעריכה. אנא תעד ארוחה תחילה.",
            sender: "nutritionist",
            timestamp: new Date().toISOString()
          };
          await Message.create(noEditableMessage);
          setMessages(prev => [...prev, noEditableMessage]);
        }
        setIsTyping(false);
        return;
      }

      const isMealLog = /ארוחת|חטיף|ארוחה|יוגורט|סלט|לחם|פרי|ביצה|עוף|בשר|דג|ארוחת בוקר|צהריים|ערב/i.test(messageText);
      
      if (isMealLog) {
        await handleAdvancedMealAnalysis(messageText);
        return;
      }

      // Check if enhanced chat is enabled
      const useEnhancedChat = localStorage.getItem("use_enhanced_chat") === "true";
      
      let response;
      
      if (useEnhancedChat) {
        try {
          // Use the enhanced chat integration
          response = await chatGptIntegration.processNutritionalMessage(messageText, messages.slice(-5));
        } catch (error) {
          console.error("Error using enhanced chat:", error);
          logError(error, "enhancedChatIntegration");
          
          // Fallback to regular LLM if enhanced chat fails
          response = await InvokeLLM({
            prompt: `As a professional nutritionist specializing in low-carb diets, respond to this user message: "${messageText}"
            
            Provide scientifically accurate, helpful advice about nutrition, fitness, and health that aligns with low-carb dietary principles.
            
            Consider the following when crafting your response:
            - Focus on low-carb nutrition science and practical advice
            - Keep responses concise but informative
            - Include relevant nutritional facts when appropriate
            - Maintain a professional, supportive tone
            - If asking for information about specific foods, provide accurate macro breakdowns
            
            If the user's query isn't related to nutrition, fitness, or health, politely redirect them to nutrition-related topics.
            
            Respond in Hebrew with proper formatting.`,
            add_context_from_internet: true
          });
        }
      } else {
        // Use regular LLM as before
        response = await InvokeLLM({
          prompt: `As a professional nutritionist specializing in low-carb diets, respond to this user message: "${messageText}"
          
          Provide scientifically accurate, helpful advice about nutrition, fitness, and health that aligns with low-carb dietary principles.
          
          Consider the following when crafting your response:
          - Focus on low-carb nutrition science and practical advice
          - Keep responses concise but informative
          - Include relevant nutritional facts when appropriate
          - Maintain a professional, supportive tone
          - If asking for information about specific foods, provide accurate macro breakdowns
          
          If the user's query isn't related to nutrition, fitness, or health, politely redirect them to nutrition-related topics.
          
          Respond in Hebrew with proper formatting.`,
          add_context_from_internet: true
        });
      }

      const nutritionistMessage = {
        content: response,
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };

      await Message.create(nutritionistMessage);
      setMessages(prev => [...prev, nutritionistMessage]);
    } catch (error) {
      logError(error, "getResponse");
      console.error("Error getting response:", error);
      const errorMessage = {
        content: "מצטער, התרחשה שגיאה בעת קבלת תגובה. אנא נסה שוב מאוחר יותר.",
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };
      await Message.create(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleAdvancedMealAnalysis = async (mealDescription) => {
    try {
      // Check if enhanced chat is enabled
      const useEnhancedChat = localStorage.getItem("use_enhanced_chat") === "true";
      
      let response;
      
      if (useEnhancedChat) {
        try {
          // Use the enhanced meal analysis
          response = await chatGptIntegration.analyzeMealEnhanced(mealDescription);
        } catch (error) {
          console.error("Error using enhanced meal analysis:", error);
          logError(error, "enhancedMealAnalysis");
          
          // Fallback to regular LLM if enhanced analysis fails
          response = await InvokeLLM({
            prompt: `As a professional nutritionist specializing in low-carb diets, analyze this meal description in detail: "${mealDescription}"

            1. Identify all food items mentioned, including preparations and cooking methods
            2. Estimate portion sizes based on common serving standards
            3. Calculate nutritional values for EACH individual food item mentioned:
               - Item name
               - Estimated portion
               - Calories
               - Protein (g)
               - Carbohydrates (g)
               - Fat (g)
            4. Also calculate a comprehensive nutritional profile for the entire meal:
               - Total calories
               - Total protein (g)
               - Total carbohydrates (g)
               - Dietary fiber (g) 
               - Net carbs (total carbs minus fiber)
               - Total fat (g)
            5. Determine if this meal is keto-friendly and/or low-carb friendly
            6. Provide professional advice for optimizing this meal for a low-carb diet
            7. Suggest 2-3 specific alternative ingredients to reduce carbs while maintaining nutritional value

            VERY IMPORTANT: Provide all your analysis in Hebrew, not English. The full response must be in Hebrew.`,
            add_context_from_internet: true,
            response_json_schema: {
              type: "object",
              properties: {
                meal_description: { type: "string" },
                identified_foods: { 
                  type: "array", 
                  items: { 
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      portion: { type: "string" },
                      calories: { type: "number" },
                      protein: { type: "number" },
                      carbs: { type: "number" },
                      fat: { type: "number" }
                    }
                  }
                },
                nutrition: {
                  type: "object",
                  properties: {
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fiber: { type: "number" },
                    net_carbs: { type: "number" },
                    fat: { type: "number" }
                  }
                },
                is_keto_friendly: { type: "boolean" },
                is_low_carb_friendly: { type: "boolean" },
                nutrition_assessment: { type: "string" },
                low_carb_optimization: { type: "string" },
                alternative_suggestions: { 
                  type: "array", 
                  items: { type: "string" } 
                }
              }
            }
          });
        }
      } else {
        // Use regular LLM as before
        response = await InvokeLLM({
          prompt: `As a professional nutritionist specializing in low-carb diets, analyze this meal description in detail: "${mealDescription}"

          1. Identify all food items mentioned, including preparations and cooking methods
          2. Estimate portion sizes based on common serving standards
          3. Calculate nutritional values for EACH individual food item mentioned:
             - Item name
             - Estimated portion
             - Calories
             - Protein (g)
             - Carbohydrates (g)
             - Fat (g)
          4. Also calculate a comprehensive nutritional profile for the entire meal:
             - Total calories
             - Total protein (g)
             - Total carbohydrates (g)
             - Dietary fiber (g) 
             - Net carbs (total carbs minus fiber)
             - Total fat (g)
          5. Determine if this meal is keto-friendly and/or low-carb friendly
          6. Provide professional advice for optimizing this meal for a low-carb diet
          7. Suggest 2-3 specific alternative ingredients to reduce carbs while maintaining nutritional value

          VERY IMPORTANT: Provide all your analysis in Hebrew, not English. The full response must be in Hebrew.`,
          add_context_from_internet: true,
          response_json_schema: {
            type: "object",
            properties: {
              meal_description: { type: "string" },
              identified_foods: { 
                type: "array", 
                items: { 
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    portion: { type: "string" },
                    calories: { type: "number" },
                    protein: { type: "number" },
                    carbs: { type: "number" },
                    fat: { type: "number" }
                  }
                }
              },
              nutrition: {
                type: "object",
                properties: {
                  calories: { type: "number" },
                  protein: { type: "number" },
                  carbs: { type: "number" },
                  fiber: { type: "number" },
                  net_carbs: { type: "number" },
                  fat: { type: "number" }
                }
              },
              is_keto_friendly: { type: "boolean" },
              is_low_carb_friendly: { type: "boolean" },
              nutrition_assessment: { type: "string" },
              low_carb_optimization: { type: "string" },
              alternative_suggestions: { 
                type: "array", 
                items: { type: "string" } 
              }
            }
          }
        });
      }
      const nutritionAnalysis = {
        calories: response.nutrition.calories,
        protein: response.nutrition.protein,
        carbs: response.nutrition.carbs,
        fiber: response.nutrition.fiber || 0,
        net_carbs: response.nutrition.net_carbs || (response.nutrition.carbs - (response.nutrition.fiber || 0)),
        fat: response.nutrition.fat,
        keto_friendly: response.is_keto_friendly,
        low_carb_friendly: response.is_low_carb_friendly,
        food_items: response.identified_foods || [],
        analysis_date: new Date().toISOString()
      };

      setEditingNutrition({
        calories: response.nutrition.calories,
        protein: response.nutrition.protein,
        carbs: response.nutrition.carbs,
        fat: response.nutrition.fat
      });

      let responseContent = `**ניתוח הארוחה שלך**\n\n`;

      if (response.identified_foods && response.identified_foods.length > 0) {
        responseContent += `**פירוט רכיבי הארוחה:**\n`;
        response.identified_foods.forEach(food => {
          responseContent += `• ${food.name} (${food.portion})\n`;
          responseContent += `  - קלוריות: ${food.calories || 0}\n`;
          responseContent += `  - חלבון: ${food.protein || 0}g\n`;
          responseContent += `  - פחמימות: ${food.carbs || 0}g\n`;
          responseContent += `  - שומן: ${food.fat || 0}g\n`;
        });
        responseContent += `\n`;
      }

      responseContent += `**סיכום תזונתי כולל:**\n`;
      responseContent += `• קלוריות: ${response.nutrition.calories}\n`;
      responseContent += `• חלבון: ${response.nutrition.protein}g\n`;
      responseContent += `• פחמימות: ${response.nutrition.carbs}g`;

      if (response.nutrition.fiber) {
        responseContent += ` (מתוכן ${response.nutrition.fiber}g סיבים תזונתיים)\n`;
        responseContent += `• פחמימות נטו: ${response.nutrition.net_carbs}g\n`;
      } else {
        responseContent += `\n`;
      }

      responseContent += `• שומן: ${response.nutrition.fat}g\n\n`;

      responseContent += response.is_low_carb_friendly ? 
        `✅ **ארוחה זו מתאימה לדיאטה דלת-פחמימות**\n\n` : 
        `⚠️ **ארוחה זו אינה אידיאלית לדיאטה דלת-פחמימות**\n\n`;

      responseContent += `**הערכה תזונתית:**\n${response.nutrition_assessment}\n\n`;
      responseContent += `**טיפים לאופטימיזציה:**\n${response.low_carb_optimization}\n\n`;

      if (response.alternative_suggestions && response.alternative_suggestions.length > 0) {
        responseContent += `**המלצות לחלופות דלות פחמימות:**\n`;
        response.alternative_suggestions.forEach(alt => {
          responseContent += `• ${alt}\n`;
        });
      }

      responseContent += `\n\nהאם הערכים התזונתיים נכונים? אם לא, הקלד "ערוך ערכים תזונתיים" כדי לעדכן אותם.`;

      const nutritionistMessage = {
        content: responseContent,
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };

      await Message.create(nutritionistMessage);
      setMessages(prev => [...prev, nutritionistMessage]);

      const mealType = determineMealType(mealDescription);

      const newMeal = {
        type: mealType,
        description: response.meal_description || mealDescription,
        calories: response.nutrition.calories,
        protein: response.nutrition.protein,
        carbs: response.nutrition.carbs,
        fat: response.nutrition.fat,
        date: selectedDate,
        time: format(new Date(), "HH:mm")
      };

      const createdMeal = await Meal.create(newMeal);
      localStorage.setItem('lastMealId', createdMeal.id);

      const analysisData = {
        ...nutritionAnalysis,
        meal_id: createdMeal.id
      };

      await NutritionAnalysis.create(analysisData);
      await loadMeals(parseISO(selectedDate));
      scrollChatToBottom();

    } catch (error) {
      logError(error, "analyzeMeal");
      console.error("Error analyzing meal:", error);
      const errorMessage = {
        content: "מצטער, התרחשה שגיאה בניתוח הארוחה. אנא נסה שוב עם תיאור מפורט יותר של הארוחה.",
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };
      await Message.create(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleNutritionUpdate = async (updatedValues) => {
    try {
      setIsTyping(true);
      setShowNutritionEditor(false);
      
      const lastMealId = localStorage.getItem('lastMealId');
      
      if (!lastMealId) {
        const errorMessage = {
          content: "לא ניתן למצוא את הארוחה האחרונה. אנא נסה לתעד את הארוחה מחדש.",
          sender: "nutritionist",
          timestamp: new Date().toISOString()
        };
        await Message.create(errorMessage);
        setMessages(prev => [...prev, errorMessage]);
        setIsTyping(false);
        return;
      }
      
      await Meal.update(lastMealId, updatedValues);
      
      await loadMeals(parseISO(selectedDate));
      
      const confirmationMessage = {
        content: `✅ הערכים התזונתיים עודכנו בהצלחה:\n\n` +
                `• קלוריות: ${updatedValues.calories}\n` +
                `• חלבון: ${updatedValues.protein}g\n` +
                `• פחמימות: ${updatedValues.carbs}g\n` +
                `• שומן: ${updatedValues.fat}g`,
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };
      
      await Message.create(confirmationMessage);
      setMessages(prev => [...prev, confirmationMessage]);
      
    } catch (error) {
      logError(error, "updateNutritionValues");
      console.error("Error updating nutrition values:", error);
      const errorMessage = {
        content: "אירעה שגיאה בעדכון הערכים התזונתיים. אנא נסה שוב.",
        sender: "nutritionist",
        timestamp: new Date().toISOString()
      };
      await Message.create(errorMessage);
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearChat = async () => {
    if (window.confirm("האם אתה בטוח שברצונך לנקות את הצ'אט? פעולה זו לא תמחק ארוחות שכבר נשמרו.")) {
      try {
        backupCurrentChatState();
        setMessages([]);
        
        const systemMessage = {
          content: "הצ'אט נקה. אפשר להתחיל שיחה חדשה.",
          sender: "nutritionist",
          timestamp: new Date().toISOString()
        };
        
        await Message.create(systemMessage);
        setMessages([systemMessage]);
        
        console.log("Chat cleared successfully");
      } catch (error) {
        logError(error, "clearChat");
        console.error("Error clearing chat:", error);
        alert("אירעה שגיאה בניקוי הצ'אט.");
      }
    }
  };

  const getTimeBasedGreeting = () => {
    const currentHour = new Date().getHours();
    
    if (currentHour >= 5 && currentHour < 12) {
      return "בוקר טוב,";
    } else if (currentHour >= 12 && currentHour < 17) {
      return "צהריים טובים,";
    } else if (currentHour >= 17 && currentHour < 21) {
      return "ערב טוב,";
    } else {
      return "לילה טוב,";
    }
  };

  const renderStatusMessage = () => {
    return (
      <div className="flex flex-wrap justify-center gap-4 mt-3">
        <div className="flex items-center gap-1 bg-green-100 rounded-full px-4 py-2 text-green-800">
          <span className="font-bold text-sm mr-1">P</span>
          יעד חלבון: {userProfile.protein_target}g
        </div>
        <div className="flex items-center gap-1 bg-blue-100 rounded-full px-4 py-2 text-blue-800">
          <Flame className="w-4 h-4 mr-1" />
          יעד קלוריות: {userProfile.calories_target}
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-11.5rem)] pb-4">
      <Card className="h-full flex flex-col overflow-hidden">
        <CardContent className="p-4 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-col mb-4">
            <div className="flex justify-between items-center">
              <Link to={createPageUrl("Dashboard")}>
                <h2 className="text-xl font-semibold cursor-pointer">
                  {getTimeBasedGreeting()} {currentUser?.display_name || "משתמש"}
                </h2>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearChat}
                className="text-gray-500 hover:text-red-600 transition-colors"
              >
                <Trash2 className="w-4 h-4 mr-1" />
                נקה צ'אט
              </Button>
            </div>

            {userProfile && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-gray-600">
                <div className="flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-full">
                  <Flame className="w-3 h-3 text-orange-500" />
                  <span>{dailyCalories}/{userProfile.calories_target} קל׳</span>
                </div>
                <div className="flex items-center gap-1 bg-green-50 px-2 py-1 rounded-full">
                  <span className="font-bold text-xs text-blue-700">P</span>
                  <span>{dailyProtein}/{userProfile.protein_target}g</span>
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-1 flex-col overflow-hidden">
            <div 
              ref={chatContainerRef}
              className="flex-1 overflow-y-auto px-2 pb-2 mb-4 h-0"
            >
              {messages.map((message, index) => (
                <ChatBubble
                  key={index}
                  message={message}
                  isLastMessage={index === messages.length - 1}
                />
              ))}
              {isTyping && (
                <div className="flex justify-start mb-4">
                  <div className="flex items-start">
                    <div className="mr-2 flex-shrink-0">
                      <Avatar className="h-8 w-8 sm:h-10 sm:w-10">
                        <AvatarImage src={currentUser?.profile_picture || "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/744145_av1.jpg"} />
                        <AvatarFallback className="bg-green-100 text-green-600 text-xs">תז</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="bg-white text-gray-800 px-4 py-3 rounded-lg rounded-tl-none shadow-sm max-w-[75%]">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="pt-2 border-t mt-auto">
              {selectedImage && (
                <div className="mb-2 p-2 bg-blue-50 rounded-md flex justify-between items-center">
                  <div className="flex items-center">
                    <ImageIcon size={16} className="text-blue-600 mr-2" />
                    <span className="text-sm truncate">
                      {selectedImage.name}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeSelectedImage}
                    className="h-6 w-6 p-0 rounded-full"
                  >
                    <X size={14} />
                  </Button>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); safeHandleUserMessage(); }} className="flex gap-2">
                <div className="flex-1 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="flex-shrink-0"
                    onClick={() => fileInputRef.current.click()}
                    disabled={uploadingImage || isTyping}
                  >
                    <Camera className="h-4 w-4" />
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </Button>

                  <Input
                    placeholder="שלח הודעה לתזונאי..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                    disabled={isTyping || processingImage}
                  />
                </div>

                {selectedImage ? (
                  <Button
                    type="button"
                    onClick={safeProcessImage}
                    disabled={isTyping || processingImage}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {processingImage ?
                      "מעבד..." :
                      "שלח תמונה"
                    }
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    disabled={(!newMessage.trim() && !selectedImage) || isTyping}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                )}
              </form>
            </div>
          </div>
        </CardContent>
      </Card>

      {showNutritionEditor && editingNutrition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowNutritionEditor(false)}
          />

          <div className="fixed z-50 w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">עריכת ערכים תזונתיים</h2>
              <button
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100"
                onClick={() => setShowNutritionEditor(false)}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              handleNutritionUpdate(editingNutrition);
            }}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="calories">קלוריות</label>
                  <Input
                    id="calories"
                    type="number"
                    min="0"
                    value={editingNutrition.calories}
                    onChange={(e) => setEditingNutrition({
                      ...editingNutrition,
                      calories: parseInt(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <label htmlFor="protein">חלבון (גרם)</label>
                  <Input
                    id="protein"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingNutrition.protein}
                    onChange={(e) => setEditingNutrition({
                      ...editingNutrition,
                      protein: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <label htmlFor="carbs">פחמימות (גרם)</label>
                  <Input
                    id="carbs"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingNutrition.carbs}
                    onChange={(e) => setEditingNutrition({
                      ...editingNutrition,
                      carbs: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
                
                <div>
                  <label htmlFor="fat">שומן (גרם)</label>
                  <Input
                    id="fat"
                    type="number"
                    min="0"
                    step="0.1"
                    value={editingNutrition.fat}
                    onChange={(e) => setEditingNutrition({
                      ...editingNutrition,
                      fat: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
              
              <div className="mt-6 flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNutritionEditor(false)}
                >
                  ביטול
                </Button>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  שמור שינויים
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mb-4 mt-4">
        <h3 className="font-medium text-blue-800 flex items-center mb-2">
          <Flame className="w-4 h-4 ml-1" />
          סיכום יומי
        </h3>
        <div className="grid grid-cols-2 gap-2 sm:gap-4">
          <div>
            <div className="text-sm text-gray-600">קלוריות</div>
            <div className="flex items-center justify-between">
              <span>{dailyCalories}/{userProfile?.calories_target || 0} קל׳</span>
              <span className="text-sm text-gray-500">
                {userProfile?.calories_target 
                  ? `${Math.max(0, userProfile.calories_target - dailyCalories)} נותרו`
                  : ''}
              </span>
            </div>
            <Progress 
              value={userProfile?.calories_target 
                ? Math.min(100, (dailyCalories / userProfile.calories_target) * 100) 
                : 0} 
              className="h-2 mt-1"
            />
          </div>
          <div>
            <div className="text-sm text-gray-600">חלבון</div>
            <div className="flex items-center justify-between">
              <span>{dailyProtein}/{userProfile?.protein_target || 0}g</span>
              <span className="text-sm text-gray-500">
                {userProfile?.protein_target 
                  ? `${Math.max(0, userProfile.protein_target - dailyProtein)}g נותרו`
                  : ''}
              </span>
            </div>
            <Progress 
              value={userProfile?.protein_target 
                ? Math.min(100, (dailyProtein / userProfile.protein_target) * 100) 
                : 0} 
              className="h-2 mt-1"
            />
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-500 flex justify-between items-center">
          <span>
            {dailyMeals.length} ארוחות היום
          </span>
          <Link to={createPageUrl("AddMeal")}>
            <Button size="sm" variant="ghost" className="text-blue-600 h-auto py-1 px-2">
              <Plus className="w-3.5 h-3.5 ml-1" />
              הוסף ארוחה
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
