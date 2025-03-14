import { sendChatMessage, sendStructuredChatMessage } from './openaiClient';
import { Message } from './entities';

/**
 * Process a user message using ChatGPT API for nutritional advice
 * @param {string} userMessage - The user's message
 * @param {Array} chatHistory - Previous chat history
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} The processed response
 */
export const processNutritionalMessage = async (userMessage, chatHistory = [], options = {}) => {
  // Format chat history for OpenAI API
  const formattedHistory = chatHistory.map(msg => ({
    role: msg.sender === 'user' ? 'user' : 'assistant',
    content: msg.content
  }));

  const systemPrompt = `As a professional nutritionist specializing in low-carb diets, respond to this user message.
  
  Provide scientifically accurate, helpful advice about nutrition, fitness, and health that aligns with low-carb dietary principles.
  
  Consider the following when crafting your response:
  - Focus on low-carb nutrition science and practical advice
  - Keep responses concise but informative
  - Include relevant nutritional facts when appropriate
  - Maintain a professional, supportive tone
  - If asking for information about specific foods, provide accurate macro breakdowns
  
  If the user's query isn't related to nutrition, fitness, or health, politely redirect them to nutrition-related topics.
  
  Respond in Hebrew with proper formatting.`;

  try {
    const response = await sendChatMessage(
      userMessage,
      formattedHistory,
      {
        systemPrompt,
        temperature: 0.7,
        max_tokens: 1000,
        ...options
      }
    );

    // Create a message object compatible with the app's existing format
    const nutritionistMessage = {
      content: response.content,
      sender: 'nutritionist',
      timestamp: new Date().toISOString()
    };

    // Save the message to the database if needed
    if (options.saveToDatabase !== false) {
      await Message.create(nutritionistMessage);
    }

    return nutritionistMessage;
  } catch (error) {
    console.error('Error processing nutritional message:', error);
    throw error;
  }
};

/**
 * Analyze a meal description or image using ChatGPT API
 * @param {string} mealDescription - Description of the meal
 * @param {string} imageUrl - Optional URL to the meal image
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} The analyzed meal data
 */
export const analyzeMeal = async (mealDescription, imageUrl = null, options = {}) => {
  let prompt = `As a professional nutritionist specializing in low-carb diets, analyze this meal in detail:`;
  
  if (imageUrl) {
    prompt += `\n\nThe image of the meal is available at: ${imageUrl}`;
  }
  
  if (mealDescription) {
    prompt += `\n\nMeal description: "${mealDescription}"`;
  }
  
  prompt += `\n\n1. Identify all food items, including preparations and cooking methods
  2. Estimate portion sizes based on common serving standards
  3. Calculate nutritional values for EACH individual food item:
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

  VERY IMPORTANT: Provide all your analysis in Hebrew, not English. The full response must be in Hebrew.`;

  const jsonSchema = {
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
  };

  try {
    const response = await sendStructuredChatMessage(
      prompt,
      jsonSchema,
      [],
      {
        systemPrompt: "You are a professional nutritionist specializing in analyzing meals for their nutritional content. Respond with accurate nutritional information in the specified JSON format.",
        temperature: 0.5,
        max_tokens: 1500,
        ...options
      }
    );

    return response;
  } catch (error) {
    console.error('Error analyzing meal:', error);
    throw error;
  }
};

export default {
  processNutritionalMessage,
  analyzeMeal
};
