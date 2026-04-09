import { Database } from "jsr:@db/sqlite";

export const db = new Database("clearhead.db");

// Run once on startup to create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    type TEXT CHECK(type IN ('income','expense')) NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id),
    mood_score INTEGER CHECK(mood_score BETWEEN 1 AND 10) NOT NULL,
    stress_score INTEGER CHECK(stress_score BETWEEN 1 AND 10) NOT NULL,
    note TEXT,
    date TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );
`);
