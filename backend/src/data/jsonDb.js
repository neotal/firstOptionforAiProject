import fs from 'fs/promises';
import path from 'path';

// process.cwd() בתוך Docker = /app
const DB_FILE = process.env.NODE_ENV === 'test' 
  ? path.resolve('tests/fixtures/test_db.json') 
  : path.resolve('src/data/database.json');

export async function loadDb() {
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    if (!parsed.users) parsed.users = [];
    if (!parsed.quests) parsed.quests = [];
    return parsed;
  } catch {
    return { users: [], quests: [] };
  }
}

export async function saveDb(data) {
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2));
}
