import { jest } from '@jest/globals';

// 1. הגדרת מוקים (Mocks) לפני טעינת המודולים של האפליקציה
// מוק למסד הנתונים כדי למנוע כתיבה לקבצים אמיתיים
jest.unstable_mockModule('../../src/data/jsonDb.js', () => ({
  loadDb: jest.fn(),
  saveDb: jest.fn(),
}));

// מוק ל-Gemini שמתאים בדיוק למבנה שבו את משתמשת (ai.models.generateContent)
jest.unstable_mockModule('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    models: {
      generateContent: jest.fn().mockResolvedValue({
        text: 'AI Response text'
      })
    }
  })),
  Type: { OBJECT: 'OBJECT', STRING: 'STRING', ARRAY: 'ARRAY' }
}));

// 2. ייבוא הלוגיקה של האפליקציה לאחר שהמוקים הוגדרו
const { toggleStepCompletion } = await import('../../src/controllers/quests.controller.js');
const { register } = await import('../../src/controllers/auth.controller.js');
const { generateChatResponse } = await import('../../src/services/gemini.service.js');
const dbModule = await import('../../src/data/jsonDb.js');

describe('Backend Unit Tests', () => {

  // בדיקת השירות של Gemini
  describe('Gemini Service', () => {
    test('Should define a response from AI', async () => {
      const mockQuest = { title: 'Test Quest' };
      const mockStep = { title: 'Step 1', description: 'Desc', chatHistory: [] };
      
      const response = await generateChatResponse(mockQuest, mockStep);
      
      expect(response).toBeDefined();
      expect(response).toBe('AI Response text');
    });
  });

  // בדיקת בקר המשימות
  describe('Quests Controller', () => {
    test('Should toggle status and move to next step', async () => {
      const mockQuest = {
        id: 'q1',
        steps: [{ isCompleted: false }, { isCompleted: false }],
        currentStepIndex: 0,
        isCompleted: false
      };

      dbModule.loadDb.mockResolvedValue({ quests: [mockQuest] });
      dbModule.saveDb.mockResolvedValue(true);
      
      const req = { params: { id: 'q1', stepIndex: '0' } };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await toggleStepCompletion(req, res);

      expect(mockQuest.steps[0].isCompleted).toBe(true);
      expect(mockQuest.currentStepIndex).toBe(1);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 'q1' }));
    });
  });

  // בדיקת בקר ההרשמה
  describe('Auth Controller', () => {
    test('Should return user without password', async () => {
      dbModule.loadDb.mockResolvedValue({ users: [] });
      dbModule.saveDb.mockResolvedValue(true);
      
      const req = { 
        body: { username: 'testuser', password: 'password123', name: 'Israel' } 
      };
      const res = { json: jest.fn(), status: jest.fn().mockReturnThis() };

      await register(req, res);

      const responseData = res.json.mock.calls[0][0];
      // וידוא שהסיסמה נמחקה מהאובייקט לפני שנשלח ללקוח
      expect(responseData.password).toBeUndefined();
      expect(responseData.username).toBe('testuser');
    });
  });
});