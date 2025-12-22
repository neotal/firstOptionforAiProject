import { jest } from '@jest/globals';

// 1. הגדרת המוק חייבת לקרות לפני כל ייבוא אחר
jest.unstable_mockModule('../../src/services/gemini.service.js', () => ({
  // ייצוא הפונקציה ליצירת משימה
  generateQuestFromGemini: jest.fn().mockResolvedValue({
    questTitle: 'משימת בדיקה אינטגרטיבית',
    steps: [{ title: 'צעד 1', description: 'תיאור צעד' }]
  }),
  // ייצוא הפונקציה לצ'אט (השורה הזו פותרת את השגיאה שלך)
  generateChatResponse: jest.fn().mockResolvedValue('תגובת מוק מה-AI')
}));

// 2. ייבוא האפליקציה והסופר-טסט אחרי שהמוק הוגדר
const { app } = await import('../../src/app.js');
const request = (await import('supertest')).default;

describe('Quests API Integration', () => {
  
  test('POST /api/quests - Should create a new quest and save to test DB', async () => {
    const payload = {
      taskDescription: 'ללמוד לנגן בגיטרה',
      stepCount: 1,
      userId: 'user-123'
    };

    const response = await request(app)
      .post('/api/quests')
      .send(payload);

    // בדיקה שהסטטוס תקין
    expect(response.status).toBe(200);
    
    // בדיקה שהנתונים חזרו מהמוק שהגדרנו למעלה
    expect(response.body).toHaveProperty('title', 'משימת בדיקה אינטגרטיבית');
    expect(response.body.steps).toHaveLength(1);
    expect(response.body.ownerId).toBe('user-123');
  });
});