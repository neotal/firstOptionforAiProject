import { GoogleGenAI, Type } from "@google/genai";
import { Step, Message } from "../types";

const apiKey = process.env.API_KEY || '';

// Safely initialize the client only when needed to prevent crashes if env is missing during load
const getAiClient = () => {
  if (!apiKey) {
    console.error("API Key is missing!");
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

export const generateQuestBreakdown = async (
  taskDescription: string, 
  stepCount: number
): Promise<{ title: string; steps: Omit<Step, 'id' | 'isCompleted' | 'chatHistory'>[] }> => {
  const ai = getAiClient();
  
  const prompt = `
    You are a Gamification Quest Master. 
    Analyze the following task: "${taskDescription}".
    
    Break it down into exactly ${stepCount} distinct, actionable steps (sub-tasks).
    
    IMPORTANT: Detect the language of the task description. 
    If the task description is in Hebrew, the Title, Step Titles, and Descriptions MUST be in Hebrew.
    If it is in English, they must be in English.

    Create a catchy "Quest Title" for the overall project.
    For each step, provide a title, a detailed description of what to do, and a list of recommended tools or resources (just names).
  `;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questTitle: { type: Type.STRING },
          steps: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tools: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING } 
                }
              },
              required: ['title', 'description']
            }
          }
        },
        required: ['questTitle', 'steps']
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("No response from AI");
  
  const data = JSON.parse(text);
  
  return {
    title: data.questTitle,
    steps: data.steps
  };
};

export const getStepChatResponse = async (
  currentStep: Step,
  questContext: string,
  userMessage: string,
  history: Message[]
): Promise<string> => {
  const ai = getAiClient();

  // Convert previous history to prompt context format (simplification for stateless generic chat)
  const conversationContext = history.map(h => `${h.role}: ${h.text}`).join('\n');

  const systemInstruction = `
    You are an AI Quest Companion helping a user complete a specific step of a project.
    
    Overall Quest: ${questContext}
    Current Step: ${currentStep.title}
    Step Description: ${currentStep.description}
    
    Your goal is to provide specific advice, code snippets (if technical), or motivation related ONLY to this current step.
    Keep answers concise and helpful. Be encouraging like an RPG companion.

    IMPORTANT: Always respond in the same language as the User's latest message.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `
      Previous conversation:
      ${conversationContext}
      
      User's new question:
      ${userMessage}
    `,
    config: {
      systemInstruction: systemInstruction,
    }
  });

  return response.text || "I'm having trouble connecting to the ethereal plane right now.";
};