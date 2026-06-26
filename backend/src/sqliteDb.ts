/**
 * SQLite persistence layer for Devin telemetry data.
 * Replaces the in-memory store for all Devin-related data so that
 * uploads survive backend restarts.
 *
 * Migration: 001_add_devin_tables
 */

import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

// Store the database file next to the dist/src folder, one level up from src
const DATA_DIR = path.resolve(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'tokentrek.db');

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
    runMigrations(_db);
  }
  return _db;
}

// ── Migration 001: create Devin tables ────────────────────────────────────────

function runMigrations(db: Database.Database): void {
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

// ── Team helpers ──────────────────────────────────────────────────────────────

export interface DbTeam {
  id: number;
  team_name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

/** Find or create team by name. Returns team id. */
export function upsertTeam(teamName: string): number {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM teams WHERE team_name = ?').get(teamName) as { id: number } | undefined;
  if (existing) return existing.id;
  const result = db.prepare(
    'INSERT INTO teams (team_name) VALUES (?) RETURNING id'
  ).get(teamName) as { id: number };
  return result.id;
}

export function getAllTeams(): DbTeam[] {
  return getDb().prepare('SELECT * FROM teams ORDER BY team_name').all() as DbTeam[];
}

// ── Developer helpers ─────────────────────────────────────────────────────────

export interface DbDeveloper {
  id: number;
  name: string;
  email: string;
  team_id: number | null;
  created_at: string;
}

/** Find or create developer by email. Returns developer id. */
export function upsertDeveloper(name: string, email: string, teamId: number): number {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM developers WHERE email = ?').get(email) as { id: number } | undefined;
  if (existing) {
    db.prepare('UPDATE developers SET name = ?, team_id = ? WHERE id = ?').run(name, teamId, existing.id);
    return existing.id;
  }
  const result = db.prepare(
    'INSERT INTO developers (name, email, team_id) VALUES (?, ?, ?) RETURNING id'
  ).get(name, email, teamId) as { id: number };
  return result.id;
}

export function getAllDevelopers(): DbDeveloper[] {
  return getDb().prepare('SELECT * FROM developers ORDER BY name').all() as DbDeveloper[];
}

// ── Devin Session helpers ─────────────────────────────────────────────────────

export interface DbDevinSession {
  id: string;
  team_id: number;
  user_name: string;
  user_email: string;
  session_name: string;
  created_at: string;
  acu_used: number;
  session_url: string;
  org_id: string | null;
  org_name: string | null;
  category: string | null;
  subcategory: string | null;
  uploaded_at: string;
}

export interface DbDevinPR {
  id: number;
  session_id: string;
  pr_url: string;
  pr_status: string;
}

export interface RawSessionInput {
  id?: string;
  team_id: number;
  user_name: string;
  user_email: string;
  session_name: string;
  created_at: string;
  acu_used: number;
  session_url: string;
  org_id?: string;
  org_name?: string;
  category?: string | null;
  subcategory?: string | null;
  pull_requests: { pr_url: string; pr_status: string }[];
}

/**
 * Insert sessions idempotently (skip duplicates by session_url).
 * Returns number of newly inserted sessions.
 */
export function insertSessionsBatch(sessions: RawSessionInput[]): number {
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
      if (existing) continue;

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
        insertPR.run(
          s.id ?? s.session_url,
          pr.pr_url,
          pr.pr_status
        );
      }

      inserted++;
    }
  });

  runBatch();
  return inserted;
}

export function getAllSessions(): (DbDevinSession & { pull_requests: { pr_url: string; pr_status: string }[] })[] {
  const db = getDb();
  const sessions = db.prepare('SELECT * FROM devin_sessions ORDER BY created_at DESC').all() as DbDevinSession[];
  const getPRs = db.prepare('SELECT pr_url, pr_status FROM devin_pull_requests WHERE session_id = ?');
  return sessions.map(s => ({
    ...s,
    pull_requests: getPRs.all(s.id) as { pr_url: string; pr_status: string }[],
  }));
}

// ── Developer devin metrics ────────────────────────────────────────────────────

export interface DbDeveloperDevinMetrics {
  id: number;
  developer_id: number;
  total_sessions: number;
  total_acu: number;
  total_prs: number;
  merged_prs: number;
  success_rate: number;
  ai_score: number;
  updated_at: string;
}

export function upsertDeveloperMetrics(
  developerId: number,
  metrics: Omit<DbDeveloperDevinMetrics, 'id' | 'developer_id' | 'updated_at'>
): void {
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

// ── Team devin metrics ─────────────────────────────────────────────────────────

export interface DbTeamDevinMetrics {
  id: number;
  team_id: number;
  developer_count: number;
  total_sessions: number;
  total_acu: number;
  total_prs: number;
  merged_prs: number;
  ai_score: number;
  updated_at: string;
}

export function upsertTeamMetrics(
  teamId: number,
  metrics: Omit<DbTeamDevinMetrics, 'id' | 'team_id' | 'updated_at'>
): void {
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

import { store, DevinSession } from './db';
import { recalculateFromDevin } from './analyticsEngine';

/**
 * Load all persisted Devin sessions from SQLite into the in-memory store,
 * then recalculate all analytics. Called on startup.
 * team_id in the store is the TEAM NAME (string), not the numeric DB id.
 */
export function loadDevinFromDb(): void {
  const db = getDb();
  const sessions = getAllSessions();
  if (sessions.length === 0) return;

  // Build id→name lookup for teams
  const teamRows = db.prepare('SELECT id, team_name FROM teams').all() as { id: number; team_name: string }[];
  const teamNameById = new Map(teamRows.map(t => [t.id, t.team_name]));

  store.devin_sessions = sessions.map(s => ({
    id: s.id,
    // Resolve numeric DB team_id to the human-readable team name
    team_id: teamNameById.get(s.team_id) ?? s.org_name ?? 'Unknown',
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
  } as DevinSession));

  console.log(`[TokenTrek] Loaded ${store.devin_sessions.length} Devin sessions from SQLite`);
  recalculateFromDevin();
}
