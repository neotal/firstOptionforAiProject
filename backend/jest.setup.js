import fs from 'fs';
import path from 'path';

// הגדרת סביבת עבודה כ"בדיקה" - רץ פעם אחת
beforeAll(() => {
  process.env.NODE_ENV = 'test';
  
  const testDir = path.resolve('tests/fixtures');
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
  }
});

// ניקוי מסד הנתונים לפני *כל* טסט בנפרד (זה יפתור את ה-409)
beforeEach(() => {
  const testDbPath = path.resolve('tests/fixtures/test_db.json');
  const initialData = { users: [], quests: [] };
  
  // דריסת הקובץ בנתונים ריקים
  fs.writeFileSync(testDbPath, JSON.stringify(initialData, null, 2));
});