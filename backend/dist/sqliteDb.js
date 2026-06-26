"use strict";
/**
 * SQLite persistence layer for Devin telemetry data.
 * Replaces the in-memory store for all Devin-related data so that
 * uploads survive backend restarts.
 *
 * Migration: 001_add_devin_tables
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDb = getDb;
exports.upsertTeam = upsertTeam;
exports.getAllTeams = getAllTeams;
exports.upsertDeveloper = upsertDeveloper;
exports.getAllDevelopers = getAllDevelopers;
exports.insertSessionsBatch = insertSessionsBatch;
exports.getAllSessions = getAllSessions;
exports.upsertDeveloperMetrics = upsertDeveloperMetrics;
exports.upsertTeamMetrics = upsertTeamMetrics;
exports.loadDevinFromDb = loadDevinFromDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
// Store the database file next to the dist/src folder, one level up from src
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR))
    fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_PATH = path.join(DATA_DIR, 'tokentrek.db');
let _db = null;
function getDb() {
    if (!_db) {
        _db = new better_sqlite3_1.default(DB_PATH);
        _db.pragma('journal_mode = WAL');
        _db.pragma('foreign_keys = ON');
        runMigrations(_db);
    }
    return _db;
}
// ── Migration 001: create Devin tables ────────────────────────────────────────
function runMigrations(db) {
    db.exec(`
    CREATE TABLE IF NOT EXISTS teams (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      team_name   TEXT    NOT NULL UNIQUE,
      description TEXT,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS developers (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      name       TEXT NOT NULL,
      email      TEXT NOT NULL UNIQUE,
      team_id    INTEGER REFERENCES teams(id),
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS devin_sessions (
      id          TEXT    PRIMARY KEY,
      team_id     INTEGER NOT NULL REFERENCES teams(id),
      user_name   TEXT    NOT NULL,
      user_email  TEXT    NOT NULL,
      session_name TEXT   NOT NULL,
      created_at  TEXT    NOT NULL,
      acu_used    REAL    NOT NULL DEFAULT 0,
      session_url TEXT    NOT NULL UNIQUE,
      org_id      TEXT,
      org_name    TEXT,
      category    TEXT,
      subcategory TEXT,
      uploaded_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS devin_pull_requests (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT    NOT NULL REFERENCES devin_sessions(id) ON DELETE CASCADE,
      pr_url     TEXT    NOT NULL,
      pr_status  TEXT    NOT NULL
    );

    CREATE TABLE IF NOT EXISTS developer_devin_metrics (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      developer_id  INTEGER NOT NULL UNIQUE REFERENCES developers(id),
      total_sessions INTEGER NOT NULL DEFAULT 0,
      total_acu      REAL    NOT NULL DEFAULT 0,
      total_prs      INTEGER NOT NULL DEFAULT 0,
      merged_prs     INTEGER NOT NULL DEFAULT 0,
      success_rate   REAL    NOT NULL DEFAULT 0,
      ai_score       INTEGER NOT NULL DEFAULT 0,
      updated_at     TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS team_devin_metrics (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      team_id         INTEGER NOT NULL UNIQUE REFERENCES teams(id),
      developer_count INTEGER NOT NULL DEFAULT 0,
      total_sessions  INTEGER NOT NULL DEFAULT 0,
      total_acu       REAL    NOT NULL DEFAULT 0,
      total_prs       INTEGER NOT NULL DEFAULT 0,
      merged_prs      INTEGER NOT NULL DEFAULT 0,
      ai_score        INTEGER NOT NULL DEFAULT 0,
      updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );
  `);
}
/** Find or create team by name. Returns team id. */
function upsertTeam(teamName) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM teams WHERE team_name = ?').get(teamName);
    if (existing)
        return existing.id;
    const result = db.prepare('INSERT INTO teams (team_name) VALUES (?) RETURNING id').get(teamName);
    return result.id;
}
function getAllTeams() {
    return getDb().prepare('SELECT * FROM teams ORDER BY team_name').all();
}
/** Find or create developer by email. Returns developer id. */
function upsertDeveloper(name, email, teamId) {
    const db = getDb();
    const existing = db.prepare('SELECT id FROM developers WHERE email = ?').get(email);
    if (existing) {
        db.prepare('UPDATE developers SET name = ?, team_id = ? WHERE id = ?').run(name, teamId, existing.id);
        return existing.id;
    }
    const result = db.prepare('INSERT INTO developers (name, email, team_id) VALUES (?, ?, ?) RETURNING id').get(name, email, teamId);
    return result.id;
}
function getAllDevelopers() {
    return getDb().prepare('SELECT * FROM developers ORDER BY name').all();
}
/**
 * Insert sessions idempotently (skip duplicates by session_url).
 * Returns number of newly inserted sessions.
 */
function insertSessionsBatch(sessions) {
    const db = getDb();
    const insertSession = db.prepare(`
    INSERT OR IGNORE INTO devin_sessions
      (id, team_id, user_name, user_email, session_name, created_at, acu_used, session_url, org_id, org_name, category, subcategory)
    VALUES
      (@id, @team_id, @user_name, @user_email, @session_name, @created_at, @acu_used, @session_url, @org_id, @org_name, @category, @subcategory)
  `);
    const insertPR = db.prepare(`
    INSERT INTO devin_pull_requests (session_id, pr_url, pr_status)
    VALUES (?, ?, ?)
  `);
    const checkExists = db.prepare('SELECT id FROM devin_sessions WHERE session_url = ?');
    let inserted = 0;
    const runBatch = db.transaction(() => {
        for (const s of sessions) {
            const existing = checkExists.get(s.session_url);
            if (existing)
                continue;
            insertSession.run({
                id: s.id ?? `devin-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                team_id: s.team_id,
                user_name: s.user_name,
                user_email: s.user_email,
                session_name: s.session_name,
                created_at: s.created_at,
                acu_used: s.acu_used,
                session_url: s.session_url,
                org_id: s.org_id ?? null,
                org_name: s.org_name ?? null,
                category: s.category ?? null,
                subcategory: s.subcategory ?? null,
            });
            for (const pr of s.pull_requests) {
                insertPR.run(s.id ?? s.session_url, pr.pr_url, pr.pr_status);
            }
            inserted++;
        }
    });
    runBatch();
    return inserted;
}
function getAllSessions() {
    const db = getDb();
    const sessions = db.prepare('SELECT * FROM devin_sessions ORDER BY created_at DESC').all();
    const getPRs = db.prepare('SELECT pr_url, pr_status FROM devin_pull_requests WHERE session_id = ?');
    return sessions.map(s => ({
        ...s,
        pull_requests: getPRs.all(s.id),
    }));
}
function upsertDeveloperMetrics(developerId, metrics) {
    getDb().prepare(`
    INSERT INTO developer_devin_metrics (developer_id, total_sessions, total_acu, total_prs, merged_prs, success_rate, ai_score, updated_at)
    VALUES (@developer_id, @total_sessions, @total_acu, @total_prs, @merged_prs, @success_rate, @ai_score, datetime('now'))
    ON CONFLICT(developer_id) DO UPDATE SET
      total_sessions = excluded.total_sessions,
      total_acu      = excluded.total_acu,
      total_prs      = excluded.total_prs,
      merged_prs     = excluded.merged_prs,
      success_rate   = excluded.success_rate,
      ai_score       = excluded.ai_score,
      updated_at     = excluded.updated_at
  `).run({ developer_id: developerId, ...metrics });
}
function upsertTeamMetrics(teamId, metrics) {
    getDb().prepare(`
    INSERT INTO team_devin_metrics (team_id, developer_count, total_sessions, total_acu, total_prs, merged_prs, ai_score, updated_at)
    VALUES (@team_id, @developer_count, @total_sessions, @total_acu, @total_prs, @merged_prs, @ai_score, datetime('now'))
    ON CONFLICT(team_id) DO UPDATE SET
      developer_count = excluded.developer_count,
      total_sessions  = excluded.total_sessions,
      total_acu       = excluded.total_acu,
      total_prs       = excluded.total_prs,
      merged_prs      = excluded.merged_prs,
      ai_score        = excluded.ai_score,
      updated_at      = excluded.updated_at
  `).run({ team_id: teamId, ...metrics });
}
// ── Bulk reload into in-memory store ─────────────────────────────────────────
const db_1 = require("./db");
const analyticsEngine_1 = require("./analyticsEngine");
/**
 * Load all persisted Devin sessions from SQLite into the in-memory store,
 * then recalculate all analytics. Called on startup.
 */
function loadDevinFromDb() {
    const sessions = getAllSessions();
    if (sessions.length === 0)
        return;
    db_1.store.devin_sessions = sessions.map(s => ({
        id: s.id,
        team_id: String(s.team_id),
        user_name: s.user_name,
        user_email: s.user_email,
        session_name: s.session_name,
        created_at: s.created_at,
        acu_used: s.acu_used,
        session_url: s.session_url,
        org_id: s.org_id ?? '',
        org_name: s.org_name ?? '',
        category: s.category,
        subcategory: s.subcategory,
        pull_requests: s.pull_requests,
    }));
    console.log(`[TokenTrek] Loaded ${db_1.store.devin_sessions.length} Devin sessions from SQLite`);
    (0, analyticsEngine_1.recalculateFromDevin)();
}
