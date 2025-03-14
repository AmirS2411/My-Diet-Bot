import { base44 } from './base44Client';
import openaiClient from './openaiClient';
import nutritionalChatGPT from './nutritionalChatGPT';


export const Core = base44.integrations.Core;

export const InvokeLLM = base44.integrations.Core.InvokeLLM;

export const SendEmail = base44.integrations.Core.SendEmail;

export const SendSMS = base44.integrations.Core.SendSMS;

export const UploadFile = base44.integrations.Core.UploadFile;

export const GenerateImage = base44.integrations.Core.GenerateImage;

export const ExtractDataFromUploadedFile = base44.integrations.Core.ExtractDataFromUploadedFile;

// OpenAI ChatGPT Integration
export const OpenAI = {
  initialize: openaiClient.initializeOpenAI,
  sendChatMessage: openaiClient.sendChatMessage,
  sendStructuredChatMessage: openaiClient.sendStructuredChatMessage
};

// Nutritional ChatGPT Integration
export const NutritionalChatGPT = {
  processMessage: nutritionalChatGPT.processNutritionalMessage,
  analyzeMeal: nutritionalChatGPT.analyzeMeal
};
