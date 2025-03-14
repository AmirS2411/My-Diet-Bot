import OpenAI from 'openai';

// Initialize the OpenAI client
let openaiClient = null;

/**
 * Initialize the OpenAI client with the provided API key
 * @param {string} apiKey - The OpenAI API key
 */
export const initializeOpenAI = (apiKey) => {
  if (!apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  openaiClient = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Note: In production, API calls should be made from the server
  });
  
  return openaiClient;
};

/**
 * Get the OpenAI client instance
 * @returns {OpenAI} The OpenAI client instance
 */
export const getOpenAIClient = () => {
  if (!openaiClient) {
    throw new Error('OpenAI client not initialized. Call initializeOpenAI first.');
  }
  return openaiClient;
};

/**
 * Send a message to the ChatGPT API
 * @param {string} message - The user's message
 * @param {Array} history - Chat history in the format [{role: 'user'|'assistant', content: 'message'}]
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} The API response
 */
export const sendChatMessage = async (message, history = [], options = {}) => {
  const client = getOpenAIClient();
  
  const defaultOptions = {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1000,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Format the messages for the API
  const messages = [
    { role: 'system', content: options.systemPrompt || 'You are a helpful nutritionist assistant specializing in low-carb diets. Provide scientifically accurate, helpful advice about nutrition, fitness, and health that aligns with low-carb dietary principles. Respond in Hebrew.' },
    ...history,
    { role: 'user', content: message }
  ];
  
  try {
    const response = await client.chat.completions.create({
      model: mergedOptions.model,
      messages: messages,
      temperature: mergedOptions.temperature,
      max_tokens: mergedOptions.max_tokens,
      top_p: mergedOptions.top_p || 1,
      frequency_penalty: mergedOptions.frequency_penalty || 0,
      presence_penalty: mergedOptions.presence_penalty || 0,
    });
    
    return {
      content: response.choices[0].message.content,
      usage: response.usage,
      role: 'assistant',
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

/**
 * Send a structured message to the ChatGPT API and get a JSON response
 * @param {string} message - The user's message
 * @param {Object} jsonSchema - The JSON schema for the response
 * @param {Array} history - Chat history in the format [{role: 'user'|'assistant', content: 'message'}]
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} The parsed JSON response
 */
export const sendStructuredChatMessage = async (message, jsonSchema, history = [], options = {}) => {
  const client = getOpenAIClient();
  
  const defaultOptions = {
    model: 'gpt-4o',
    temperature: 0.7,
    max_tokens: 1500,
  };
  
  const mergedOptions = { ...defaultOptions, ...options };
  
  // Format the messages for the API
  const messages = [
    { role: 'system', content: options.systemPrompt || 'You are a helpful nutritionist assistant specializing in low-carb diets. Provide scientifically accurate, helpful advice about nutrition, fitness, and health that aligns with low-carb dietary principles. Your response must strictly follow the provided JSON schema. Respond in Hebrew.' },
    ...history,
    { role: 'user', content: message }
  ];
  
  try {
    const response = await client.chat.completions.create({
      model: mergedOptions.model,
      messages: messages,
      temperature: mergedOptions.temperature,
      max_tokens: mergedOptions.max_tokens,
      top_p: mergedOptions.top_p || 1,
      frequency_penalty: mergedOptions.frequency_penalty || 0,
      presence_penalty: mergedOptions.presence_penalty || 0,
      response_format: { type: "json_object" }
    });
    
    const content = response.choices[0].message.content;
    
    try {
      const parsedContent = JSON.parse(content);
      return {
        ...parsedContent,
        usage: response.usage,
        role: 'assistant',
        timestamp: new Date().toISOString()
      };
    } catch (parseError) {
      console.error('Error parsing JSON response:', parseError);
      throw new Error('Invalid JSON response from API');
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    throw error;
  }
};

export default {
  initializeOpenAI,
  getOpenAIClient,
  sendChatMessage,
  sendStructuredChatMessage
};
