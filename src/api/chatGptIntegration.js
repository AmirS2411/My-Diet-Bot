import { InvokeLLM } from './integrations';

/**
 * Enhanced nutritional chat integration using the existing InvokeLLM function
 * with improved prompts for ChatGPT-like responses
 */

/**
 * Process a user message for nutritional advice
 * @param {string} userMessage - The user's message
 * @param {Array} chatHistory - Previous chat history (optional)
 * @returns {Promise<string>} The response text
 */
export const processNutritionalMessage = async (userMessage, chatHistory = []) => {
  // Format the chat history for context
  let historyContext = '';
  if (chatHistory && chatHistory.length > 0) {
    // Take the last 5 messages for context
    const recentHistory = chatHistory.slice(-5);
    historyContext = '\nRecent conversation history:\n';
    recentHistory.forEach(msg => {
      historyContext += `${msg.sender === 'user' ? 'User' : 'Nutritionist'}: ${msg.content}\n`;
    });
  }

  // Create an enhanced prompt that mimics ChatGPT capabilities
  const enhancedPrompt = `As a professional nutritionist specializing in low-carb diets, respond to this user message: "${userMessage}"
  
  ${historyContext}
  
  Provide scientifically accurate, helpful advice about nutrition, fitness, and health that aligns with low-carb dietary principles.
  
  Consider the following when crafting your response:
  - Focus on low-carb nutrition science and practical advice
  - Keep responses concise but informative (about 150-200 words)
  - Include relevant nutritional facts when appropriate
  - Maintain a professional, supportive tone
  - If asking for information about specific foods, provide accurate macro breakdowns
  - Personalize the response based on the conversation history when relevant
  - Use natural language that sounds like a real nutritionist, not an AI
  
  If the user's query isn't related to nutrition, fitness, or health, politely redirect them to nutrition-related topics.
  
  Respond in Hebrew with proper formatting.`;

  try {
    // Use the existing InvokeLLM function with our enhanced prompt
    const response = await InvokeLLM({
      prompt: enhancedPrompt,
      add_context_from_internet: true,
      temperature: 0.7 // Adding temperature for more natural responses
    });

    return response;
  } catch (error) {
    console.error('Error processing nutritional message:', error);
    throw error;
  }
};

/**
 * Analyze a meal description with enhanced detail
 * @param {string} mealDescription - Description of the meal
 * @param {string} imageUrl - Optional URL to the meal image
 * @returns {Promise<Object>} The analyzed meal data
 */
export const analyzeMealEnhanced = async (mealDescription, imageUrl = null) => {
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

  VERY IMPORTANT: Provide all your analysis in Hebrew, not English. The full response must be in Hebrew.
  
  Make your analysis extremely accurate and detailed, as if you were a professional nutritionist with access to a comprehensive database of nutritional information.`;

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
    // Use the existing InvokeLLM function with our enhanced prompt and JSON schema
    const response = await InvokeLLM({
      prompt: prompt,
      add_context_from_internet: true,
      temperature: 0.5, // Lower temperature for more factual responses
      response_json_schema: jsonSchema
    });

    return response;
  } catch (error) {
    console.error('Error analyzing meal:', error);
    throw error;
  }
};

export default {
  processNutritionalMessage,
  analyzeMealEnhanced
};
