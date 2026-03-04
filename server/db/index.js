import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

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
  )
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
  }
};
