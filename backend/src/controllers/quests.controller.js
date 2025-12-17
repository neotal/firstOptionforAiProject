import { loadDb, saveDb } from '../data/jsonDb.js';
import crypto from 'crypto';
import {
  generateQuestFromGemini,
  generateChatResponse
} from '../services/gemini.service.js';

export async function getQuests(req, res) {
  try {
    const { userId } = req.query;
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    const db = await loadDb();
    res.json(db.quests.filter(q => q.ownerId === userId));

  } catch {
    res.status(500).json({ error: 'Failed to load quests' });
  }
}

export async function createQuest(req, res) {
  try {
    const { taskDescription, stepCount, fileData, avatar, userId } = req.body;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const generatedData = await generateQuestFromGemini(
      taskDescription,
      stepCount,
      fileData
    );

    const newQuest = {
      id: crypto.randomUUID(),
      ownerId: userId,
      title: generatedData.questTitle,
      originalTask: taskDescription,
      createdAt: Date.now(),
      avatar,
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
}

export async function toggleStepCompletion(req, res) {
  try {
    const { id, stepIndex } = req.params;
    const db = await loadDb();
    const quest = db.quests.find(q => q.id === id);

    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    const idx = Number(stepIndex);
    quest.steps[idx].isCompleted = !quest.steps[idx].isCompleted;

    let newIndex = quest.steps.findIndex(s => !s.isCompleted);
    if (newIndex === -1) newIndex = quest.steps.length;

    quest.currentStepIndex = newIndex;
    quest.isCompleted = newIndex === quest.steps.length;

    await saveDb(db);
    res.json(quest);

  } catch {
    res.status(500).json({ error: 'Failed to update step' });
  }
}

export async function chatWithStep(req, res) {
  try {
    const { id, stepIndex } = req.params;
    const { message } = req.body;

    const db = await loadDb();
    const quest = db.quests.find(q => q.id === id);
    if (!quest) return res.status(404).json({ error: 'Quest not found' });

    const step = quest.steps[Number(stepIndex)];

    step.chatHistory.push({
      role: 'user',
      text: message,
      timestamp: Date.now()
    });

    const aiText = await generateChatResponse(quest, step);

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
}
