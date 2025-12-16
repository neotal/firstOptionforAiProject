
import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import { GoogleGenAI, Type } from "@google/genai";
import path from 'path';
import { fileURLToPath } from 'url';

// Environment setup
const apiKey = process.env.API_KEY;
if (!apiKey) {
  console.error("API Key is missing! Please set process.env.API_KEY.");
  process.exit(1);
}

const app = express();
const PORT = 3000;
const DB_FILE = 'database.json';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));

// AI Client
const ai = new GoogleGenAI({ apiKey });

// --- Persistence Layer (JSON DB) ---

async function loadDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Ensure structure exists
    if (!parsed.users) parsed.users = [];
    if (!parsed.quests) parsed.quests = [];
    return parsed;
  } catch (error) {
    // Return default structure if file missing
    return { users: [], quests: [] };
  }
}

async function saveDb(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}

// --- Auth Endpoints ---

// Register
app.post('/api/register', async (req, res) => {
  try {
    const { username, password, name, birthYear } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const db = await loadDb();

    // Check if user exists
    if (db.users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      password, // Note: In a real production app, you MUST hash passwords.
      name,
      birthYear
    };

    db.users.push(newUser);
    await saveDb(db);

    // Return user without password
    const { password: _, ...userWithoutPass } = newUser;
    res.json(userWithoutPass);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const db = await loadDb();

    const user = db.users.find(u => u.username === username && u.password === password);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPass } = user;
    res.json(userWithoutPass);

  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// --- Quest Endpoints ---

// 1. Get All Quests (Filtered by User ID)
app.get('/api/quests', async (req, res) => {
  try {
    const userId = req.query.userId;
    if (!userId) return res.status(400).json({ error: "User ID required" });

    const db = await loadDb();
    // Filter quests belonging to this user
    const userQuests = db.quests.filter(q => q.ownerId === userId);
    res.json(userQuests);
  } catch (error) {
    res.status(500).json({ error: 'Failed to load quests' });
  }
});

// 2. Create New Quest
app.post('/api/quests', async (req, res) => {
  try {
    const { taskDescription, stepCount, fileData, avatar, userId } = req.body;

    if (!userId) return res.status(401).json({ error: "User not authenticated" });

    const prompt = `
      You are an Expert Mentor and Gamification Quest Master. 
      Analyze the following task description ${fileData ? "and the attached file" : ""}: "${taskDescription}".
      
      The user is a complete beginner who feels overwhelmed.
      Break the task down into exactly ${stepCount} distinct steps.
      
      IMPORTANT: Detect the language of the task description/file. 
      If Hebrew, output Hebrew. If English, output English.

      For each step:
      1. Title: A short, action-oriented title.
      2. Description: Detailed, instructional, bulleted.
      3. Tools: A list of specific tools needed.
    `;

    const parts = [{ text: prompt }];

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
                  tools: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['title', 'description']
              }
            }
          },
          required: ['questTitle', 'steps']
        }
      }
    });

    const generatedData = JSON.parse(response.text);

    const newQuest = {
      id: crypto.randomUUID(),
      ownerId: userId, // Link to user
      title: generatedData.questTitle,
      originalTask: taskDescription || (fileData ? 'File Analysis' : 'New Quest'),
      createdAt: Date.now(),
      difficulty: stepCount === 5 ? '5' : '10',
      avatar: avatar || 'CRYSTAL_BALL',
      currentStepIndex: 0,
      isCompleted: false,
      steps: generatedData.steps.map(s => ({
        ...s,
        id: crypto.randomUUID(),
        isCompleted: false,
        chatHistory: []
      }))
    };

    const db = await loadDb();
    db.quests.unshift(newQuest);
    await saveDb(db);

    res.json(newQuest);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to generate quest' });
  }
});

// 3. Toggle Step Completion
app.patch('/api/quests/:id/step/:stepIndex', async (req, res) => {
  try {
    const { id, stepIndex } = req.params;
    const db = await loadDb();
    const quest = db.quests.find(q => q.id === id);

    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    // Toggle logic
    const idx = parseInt(stepIndex);
    quest.steps[idx].isCompleted = !quest.steps[idx].isCompleted;

    // Recalculate progress
    let newCurrentIndex = quest.steps.findIndex(s => !s.isCompleted);
    if (newCurrentIndex === -1) newCurrentIndex = quest.steps.length;

    quest.currentStepIndex = newCurrentIndex;
    quest.isCompleted = newCurrentIndex === quest.steps.length;

    await saveDb(db);
    res.json(quest);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update step' });
  }
});

// 4. Chat with Step
app.post('/api/quests/:id/step/:stepIndex/chat', async (req, res) => {
  try {
    const { id, stepIndex } = req.params;
    const { message } = req.body;
    
    const db = await loadDb();
    const quest = db.quests.find(q => q.id === id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    const step = quest.steps[parseInt(stepIndex)];

    // Add User Message
    step.chatHistory.push({
      role: 'user',
      text: message,
      timestamp: Date.now()
    });

    // Generate AI Response
    const conversationContext = step.chatHistory.map(h => `${h.role}: ${h.text}`).join('\n');
    const systemInstruction = `
      You are an AI Quest Companion.
      Overall Quest: ${quest.title}
      Current Step: ${step.title}
      Description: ${step.description}
      Provide advice, code, or motivation for this specific step.
      Keep answers concise.
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Previous conversation:\n${conversationContext}\nUser's new input:\n${message}`,
      config: { systemInstruction }
    });

    const aiText = aiResponse.text || "I'm having trouble connecting.";

    // Add AI Message
    step.chatHistory.push({
      role: 'model',
      text: aiText,
      timestamp: Date.now()
    });

    await saveDb(db);
    res.json(step.chatHistory);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Chat failed' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
