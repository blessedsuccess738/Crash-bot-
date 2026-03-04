import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import crypto from 'crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(path.join(dbDir, 'crashes.db'));

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS crashes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    multiplier REAL NOT NULL,
    timestamp INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    role TEXT DEFAULT 'user',
    access_key TEXT,
    access_expires_at INTEGER,
    created_at INTEGER NOT NULL
  );
`);

export const dbManager = {
  addCrash: (multiplier) => {
    const stmt = db.prepare('INSERT INTO crashes (multiplier, timestamp) VALUES (?, ?)');
    const info = stmt.run(multiplier, Date.now());
    return info.lastInsertRowid;
  },
  
  getRecentCrashes: (limit = 50) => {
    const stmt = db.prepare('SELECT * FROM crashes ORDER BY timestamp DESC LIMIT ?');
    return stmt.all(limit);
  },
  
  getStats: () => {
    const stmt = db.prepare('SELECT COUNT(*) as total, AVG(multiplier) as average FROM crashes');
    return stmt.get();
  },

  // User Management
  getUsers: () => {
    const stmt = db.prepare('SELECT * FROM users ORDER BY created_at DESC');
    return stmt.all();
  },

  addUser: (email) => {
    try {
      const stmt = db.prepare('INSERT INTO users (email, created_at) VALUES (?, ?)');
      const info = stmt.run(email, Date.now());
      return { success: true, id: info.lastInsertRowid };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  toggleAdmin: (userId, isAdmin) => {
    const role = isAdmin ? 'admin' : 'user';
    const stmt = db.prepare('UPDATE users SET role = ? WHERE id = ?');
    stmt.run(role, userId);
    return true;
  },

  deleteUser: (userId) => {
    const stmt = db.prepare('DELETE FROM users WHERE id = ?');
    stmt.run(userId);
    return true;
  },

  generateAccessKey: (userId, daysValid) => {
    // Generate 12 digit random number
    const accessKey = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    const expiresAt = Date.now() + (daysValid * 24 * 60 * 60 * 1000);
    
    const stmt = db.prepare('UPDATE users SET access_key = ?, access_expires_at = ? WHERE id = ?');
    stmt.run(accessKey, expiresAt, userId);
    
    return { accessKey, expiresAt };
  }
};
