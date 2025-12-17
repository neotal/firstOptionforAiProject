import { GoogleGenAI, Type } from '@google/genai';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function generateQuestFromGemini(taskDescription, stepCount, fileData) {
  const prompt = `
    You are an Expert Mentor.
    Break the task into exactly ${stepCount} steps.
    Detect language and respond accordingly.
  `;

  const parts = [{ text: `${prompt}\nTask: ${taskDescription}` }];

  if (fileData) {
    parts.push({
      inlineData: {
        data: fileData.base64,
        mimeType: fileData.mimeType
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts },
    config: {
      responseMimeType: 'application/json',
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
                tools: { type: Type.ARRAY, items: { type: Type.STRING } }
              }
            }
          }
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateChatResponse(quest, step) {
  const conversation = step.chatHistory
    .map(h => `${h.role}: ${h.text}`)
    .join('\n');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `
      Quest: ${quest.title}
      Step: ${step.title}
      Description: ${step.description}

      Conversation:
      ${conversation}
    `
  });

  return response.text || 'Unable to respond';
}
