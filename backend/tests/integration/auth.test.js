import request from 'supertest';
import { app } from '../../src/app.js';
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';

describe('Auth Integration Tests', () => {

  // איפוס בסיס הנתונים לפני כל בדיקה כדי למנוע התנגשויות (כמו שגיאת 409)
  beforeEach(() => {
    const testDbPath = path.resolve('tests/fixtures/test_db.json');
    const initialData = { users: [], quests: [] };
    
    const testDir = path.dirname(testDbPath);
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    fs.writeFileSync(testDbPath, JSON.stringify(initialData, null, 2));
  });

  // בדיקה 1: הרשמה מוצלחת
  test('POST /api/register - success', async () => {
    const newUser = {
      username: 'integration_user',
      password: 'password123',
      name: 'Integration Test'
    };

    const response = await request(app)
      .post('/api/register')
      .send(newUser);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', 'integration_user');
    expect(response.body).not.toHaveProperty('password');
  });

  // בדיקה 2: כישלון התחברות עם פרטים שגויים
  test('POST /api/login - failure with wrong credentials', async () => {
    const loginData = {
      username: 'non_existent_user',
      password: 'wrong_password'
    };

    const response = await request(app)
      .post('/api/login')
      .send(loginData);

    expect(response.status).toBe(401);
  });

  // בדיקה 3: התחברות מוצלחת לאחר הרשמה (זרימה מלאה)
  test('POST /api/login - success after registration', async () => {
    const userCredentials = {
      username: 'login_test_user',
      password: 'securePassword123',
      name: 'Login Tester'
    };

    // שלב א': הרשמה
    await request(app)
      .post('/api/register')
      .send(userCredentials);

    // שלב ב': התחברות עם אותם הפרטים
    const response = await request(app)
      .post('/api/login')
      .send({
        username: userCredentials.username,
        password: userCredentials.password
      });

    // אימות שההתחברות עברה בהצלחה והחזירה את פרטי המשתמש
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('username', userCredentials.username);
    expect(response.body).toHaveProperty('id');
  });
});