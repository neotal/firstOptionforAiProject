import { loadDb, saveDb } from '../data/jsonDb.js';
import crypto from 'crypto';

export async function register(req, res) {
  try {
    const { username, password, name, birthYear } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('LOGIN ATTEMPT:', username, password);

    const db = await loadDb();

    console.log('USERS IN DB:', db.users);
    if (db.users.find(u => u.username === username)) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const newUser = {
      id: crypto.randomUUID(),
      username,
      password,
      name,
      birthYear
    };

    db.users.push(newUser);
    await saveDb(db);

    const { password: _, ...userWithoutPass } = newUser;
    res.json(userWithoutPass);

  } catch (error) {
    res.status(500).json({ error: 'Registration failed' });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;
   console.log('REQ BODY:', req.body);

    const db = await loadDb();
    console.log('USERS:', db.users);  
    const user = db.users.find(
      u => u.username === username && u.password === password
    );
    console.log('kkkk',user);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPass } = user;
    res.json(userWithoutPass);

  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
}
