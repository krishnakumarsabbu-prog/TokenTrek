"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path_1 = __importDefault(require("path"));
const DB_PATH = path_1.default.join(__dirname, '..', 'tokentrek.db');
let db;
function getDb() {
    if (!db) {
        db = new better_sqlite3_1.default(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');
        initSchema();
    }
    return db;
}
function initSchema() {
    db.exec(`
    CREATE TABLE IF NOT EXISTS platforms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      icon TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS teams (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS developers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      avatar TEXT,
      team_id INTEGER REFERENCES teams(id)
    );

    CREATE TABLE IF NOT EXISTS daily_stats (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      platform_id INTEGER REFERENCES platforms(id),
      requests INTEGER DEFAULT 0,
      tokens INTEGER DEFAULT 0,
      cost REAL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      prompt_text TEXT NOT NULL,
      uses INTEGER DEFAULT 0,
      success_rate REAL DEFAULT 0,
      avg_tokens INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS developer_scores (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      developer_id INTEGER REFERENCES developers(id),
      score INTEGER DEFAULT 0,
      trend INTEGER DEFAULT 0,
      period TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS team_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id INTEGER REFERENCES teams(id),
      cost REAL DEFAULT 0,
      change_pct REAL DEFAULT 0,
      period TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS model_costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      model_name TEXT NOT NULL,
      cost REAL DEFAULT 0,
      pct REAL DEFAULT 0,
      period TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS live_activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      developer_id INTEGER REFERENCES developers(id),
      action TEXT NOT NULL,
      platform_id INTEGER REFERENCES platforms(id),
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS waste_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      description TEXT NOT NULL,
      count INTEGER DEFAULT 0,
      severity TEXT DEFAULT 'medium'
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      icon TEXT NOT NULL
    );
  `);
}
