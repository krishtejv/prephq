import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the data directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'prephq.db');
console.log(`[Database] Connecting to SQLite database at: ${dbPath}`);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('[Database] Connection failed:', err.message);
  } else {
    console.log('[Database] Connection established successfully.');
  }
});

// Helper to run sqlite query in promises
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Helper to get single row
export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Helper to get multiple rows
export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Helper to run serialized queries (sequential initialization)
export const dbSerialize = (callback) => {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      callback()
        .then(resolve)
        .catch(reject);
    });
  });
};

export const initializeDatabase = async () => {
  try {
    // Enable Foreign Keys support
    await dbRun('PRAGMA foreign_keys = ON;');

    // Enable WAL journal mode & synchronous NORMAL for concurrent performance
    await dbRun('PRAGMA journal_mode = WAL;');
    await dbRun('PRAGMA synchronous = NORMAL;');

    // 1. Create Users Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);

    // 2. Create Notebook Pages Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS notebook_pages (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        parent_id TEXT,
        title TEXT NOT NULL,
        body TEXT DEFAULT '',
        status TEXT DEFAULT 'todo',
        collapsed INTEGER DEFAULT 0,
        sort_order INTEGER DEFAULT 0,
        type TEXT DEFAULT 'file',
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    // Create index on notebook_pages for parent/user queries
    await dbRun(`
      CREATE INDEX IF NOT EXISTS idx_pages_user_parent ON notebook_pages(user_id, parent_id);
    `);

    // Migration to add 'type' column to existing databases if needed
    try {
      await dbRun('ALTER TABLE notebook_pages ADD COLUMN type TEXT DEFAULT "file";');
      console.log('[Database] Migrated notebook_pages: added type column.');
    } catch (e) {
      // Column already exists or table doesn't exist yet
    }

    // 3. Create Study State Config Table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS study_state (
        user_id TEXT PRIMARY KEY,
        streak INTEGER DEFAULT 0,
        last_studied_date TEXT,
        prep_plan TEXT,
        domains TEXT,
        neetcode TEXT,
        companies TEXT,
        patterns TEXT,
        FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
      );
    `);

    console.log('[Database] All schema tables initialized and verified successfully.');
  } catch (err) {
    console.error('[Database] Failed to initialize schemas:', err);
    throw err;
  }
};

export default db;
