
import { Quest, Step, Message, AvatarType } from "../types";

const API_URL = 'http://localhost:3000/api';

// Helper to convert file to base64 for transport to server
async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      resolve({
        base64: base64String,
        mimeType: file.type
      });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const fetchQuests = async (userId: string): Promise<Quest[]> => {
  const res = await fetch(`${API_URL}/quests?userId=${userId}`);
  if (!res.ok) throw new Error("Failed to fetch quests");
  return res.json();
};

export const createQuest = async (
  taskDescription: string, 
  stepCount: number,
  userId: string,
  file?: File | null,
  avatar?: AvatarType
): Promise<Quest> => {
  let fileData = null;
  if (file) {
    fileData = await fileToBase64(file);
  }

  const res = await fetch(`${API_URL}/quests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      taskDescription,
      stepCount,
      fileData,
      avatar,
      userId
    })
  });

  if (!res.ok) throw new Error("Failed to create quest");
  return res.json();
};

export const toggleStepCompletion = async (questId: string, stepIndex: number): Promise<Quest> => {
  const res = await fetch(`${API_URL}/quests/${questId}/step/${stepIndex}`, {
    method: 'PATCH'
  });

  if (!res.ok) throw new Error("Failed to update step");
  return res.json();
};

export const sendChatMessage = async (
  questId: string,
  stepIndex: number,
  message: string
): Promise<Message[]> => {
  const res = await fetch(`${API_URL}/quests/${questId}/step/${stepIndex}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message })
  });

  if (!res.ok) throw new Error("Failed to send message");
  return res.json();
};

// Legacy shim not needed anymore as we moved logic to server, 
// keeping exports consistent for App.tsx but redirecting to new logic.
export const generateQuestBreakdown = async () => { throw new Error("Use createQuest"); };
export const getStepChatResponse = async () => { throw new Error("Use sendChatMessage"); };
