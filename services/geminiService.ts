import { GoogleGenAI, Type } from "@google/genai";
import { Step, Message } from "../types";

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
 

// Safely initialize the client only when needed to prevent crashes if env is missing during load
const getAiClient = () => {
  if (!apiKey) {
    console.error("API Key is missing!");
    throw new Error("API Key is missing. Please set process.env.API_KEY.");
  }
  return new GoogleGenAI({ apiKey });
};

async function fileToPart(file: File): Promise<{ inlineData: { data: string; mimeType: string } }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // remove the Data-URL prefix (e.g. "data:image/png;base64,")
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        inlineData: {
          data: base64String,
          mimeType: file.type
        }
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const generateQuestBreakdown = async (
  taskDescription: string, 
  stepCount: number,
  file?: File | null
): Promise<{ title: string; steps: Omit<Step, 'id' | 'isCompleted' | 'chatHistory'>[] }> => {
  const ai = getAiClient();
  
  const prompt = `
    You are an Expert Mentor and Gamification Quest Master. 
    Analyze the following task description ${file ? "and the attached file" : ""}: "${taskDescription}".
    
    The user is a complete beginner who feels overwhelmed and desperate for help. They know nothing about how to start or what to do.
    
    Break the task down into exactly ${stepCount} distinct steps.
    
    IMPORTANT: Detect the language of the task description/file. 
    If the task description is in Hebrew, the Title, Step Titles, and Descriptions MUST be in Hebrew.
    If it is in English, they must be in English.

    Create a catchy "Quest Title".
    
    For each step:
    1. Title: A short, action-oriented title.
    2. Description: This must be EXTENSIVE, DETAILED, and INSTRUCTIONAL. Do not just say "Do X". Explain EXACTLY HOW to do "X". Assume the user needs hand-holding. Break the description down into practical mini-instructions or bullets within the text.
    3. Tools: A list of specific tools or resources.
  `;

  const parts: any[] = [{ text: prompt }];

  if (file) {
    const filePart = await fileToPart(file);
    parts.push(filePart);
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
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