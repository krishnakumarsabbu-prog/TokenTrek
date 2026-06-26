"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const analyticsEngine_1 = require("../analyticsEngine");
const sqliteDb_1 = require("../sqliteDb");
let _idSeq = 1;
function newId() { return `devin-${Date.now()}-${_idSeq++}`; }
const router = (0, express_1.Router)();
function recomputeDevinStats() {
    // Aggregate per developer
    const devMap = new Map();
    for (const s of db_1.store.devin_sessions) {
        let stat = devMap.get(s.user_email);
        if (!stat) {
            stat = {
                user_email: s.user_email,
                user_name: s.user_name,
                team_name: s.team_id || s.org_name || 'Unknown',
                sessions: 0,
                acu_used: 0,
                total_prs: 0,
                merged_prs: 0,
                open_prs: 0,
                failed_prs: 0,
                categories: [],
                ai_score: 0,
            };
            devMap.set(s.user_email, stat);
        }
        stat.sessions += 1;
        stat.acu_used += s.acu_used;
        for (const pr of s.pull_requests) {
            stat.total_prs += 1;
            if (pr.pr_status === 'merged')
                stat.merged_prs += 1;
            else if (pr.pr_status === 'open')
                stat.open_prs += 1;
            else
                stat.failed_prs += 1;
        }
        if (s.category && !stat.categories.includes(s.category)) {
            stat.categories.push(s.category);
        }
    }
    // Compute AI score per developer
    for (const stat of devMap.values()) {
        const mergedWeight = stat.merged_prs * 40;
        const sessionWeight = Math.min(stat.sessions * 30, 300);
        const acuEfficiency = stat.acu_used > 0 ? Math.min((stat.merged_prs / stat.acu_used) * 100, 100) * 20 : 0;
        const diversityWeight = Math.min(stat.categories.length * 10, 100) * 10;
        stat.ai_score = Math.round((mergedWeight + sessionWeight + acuEfficiency + diversityWeight) / 10);
    }
    db_1.store.devin_developer_stats = Array.from(devMap.values());
    // Aggregate per team
    const teamMap = new Map();
    for (const stat of db_1.store.devin_developer_stats) {
        const teamName = stat.team_name;
        let ts = teamMap.get(teamName);
        if (!ts) {
            ts = { team_name: teamName, sessions: 0, acu_used: 0, total_prs: 0, merged_prs: 0, developers: 0, ai_score: 0 };
            teamMap.set(teamName, ts);
        }
        ts.sessions += stat.sessions;
        ts.acu_used += stat.acu_used;
        ts.total_prs += stat.total_prs;
        ts.merged_prs += stat.merged_prs;
        ts.developers += 1;
        ts.ai_score += stat.ai_score;
    }
    for (const ts of teamMap.values()) {
        if (ts.developers > 0)
            ts.ai_score = Math.round(ts.ai_score / ts.developers);
    }
    db_1.store.devin_team_stats = Array.from(teamMap.values());
}
// GET /api/devin/stats
router.get('/stats', (_req, res) => {
    const sessions = db_1.store.devin_sessions;
    const total_prs = sessions.reduce((s, x) => s + x.pull_requests.length, 0);
    const merged_prs = sessions.reduce((s, x) => s + x.pull_requests.filter(p => p.pr_status === 'merged').length, 0);
    const unique_devs = new Set(sessions.map(s => s.user_email)).size;
    const total_acu = sessions.reduce((s, x) => s + x.acu_used, 0);
    res.json({
        total_sessions: sessions.length,
        active_developers: unique_devs,
        total_acu: Math.round(total_acu * 100) / 100,
        total_prs,
        merged_prs,
        ai_delivery_rate: total_prs > 0 ? Math.round((merged_prs / total_prs) * 100) : 0,
    });
});
// GET /api/devin/developer/:email/sessions — sessions + PR links for a developer
router.get('/developer/:email/sessions', (req, res) => {
    const email = decodeURIComponent(req.params.email).toLowerCase();
    const devSessions = db_1.store.devin_sessions
        .filter(s => s.user_email.toLowerCase() === email)
        .sort((a, b) => b.created_at.localeCompare(a.created_at))
        .map(s => ({
        id: s.id,
        session_name: s.session_name,
        date: s.created_at.slice(0, 10),
        acu_used: s.acu_used,
        category: s.category,
        session_url: s.session_url,
        pull_requests: s.pull_requests.map(pr => ({
            pr_url: pr.pr_url,
            pr_status: pr.pr_status,
        })),
    }));
    res.json(devSessions);
});
// GET /api/devin/sessions
router.get('/sessions', (_req, res) => {
    try {
        const sessions = (0, sqliteDb_1.getAllSessions)();
        res.json(sessions);
    }
    catch (err) {
        console.error('[devin/sessions]', err);
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});
// GET /api/devin/developers
router.get('/developers', (_req, res) => {
    const sorted = [...db_1.store.devin_developer_stats].sort((a, b) => b.ai_score - a.ai_score);
    res.json(sorted.map((d, i) => ({ ...d, rank: i + 1 })));
});
// GET /api/devin/teams
router.get('/teams', (_req, res) => {
    const sorted = [...db_1.store.devin_team_stats].sort((a, b) => b.ai_score - a.ai_score);
    res.json(sorted.map((t, i) => ({ ...t, rank: i + 1 })));
});
// GET /api/devin/trends
router.get('/trends', (_req, res) => {
    const byDate = new Map();
    for (const s of db_1.store.devin_sessions) {
        const date = s.created_at.slice(0, 10);
        byDate.set(date, (byDate.get(date) || 0) + 1);
    }
    const sorted = Array.from(byDate.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, sessions]) => ({ date, sessions }));
    res.json(sorted);
});
// GET /api/devin/categories
router.get('/categories', (_req, res) => {
    const catMap = new Map();
    for (const s of db_1.store.devin_sessions) {
        const key = s.category ?? 'uncategorized';
        let c = catMap.get(key);
        if (!c) {
            c = { category: key, subcategory: s.subcategory, sessions: 0, merged_prs: 0, developers: new Set() };
            catMap.set(key, c);
        }
        c.sessions += 1;
        c.developers.add(s.user_email);
        for (const pr of s.pull_requests) {
            if (pr.pr_status === 'merged')
                c.merged_prs += 1;
        }
    }
    res.json(Array.from(catMap.values()).map(c => ({ ...c, developers: c.developers.size })));
});
// POST /api/devin/upload
router.post('/upload', (req, res) => {
    const { team_name, sessions: rawSessions } = req.body;
    if (!Array.isArray(rawSessions) || rawSessions.length === 0) {
        return res.status(400).json({ error: 'sessions array is required and must not be empty' });
    }
    try {
        // 1. Resolve or create team in SQLite
        const teamId = (0, sqliteDb_1.upsertTeam)(team_name || rawSessions[0]?.org_name || 'Unknown');
        // 2. Resolve or create developers in SQLite
        const devEmailToDbId = new Map();
        for (const s of rawSessions) {
            const email = (s.user_email || '').toLowerCase();
            if (!email || devEmailToDbId.has(email))
                continue;
            const dbDevId = (0, sqliteDb_1.upsertDeveloper)(s.user_name || email, email, teamId);
            devEmailToDbId.set(email, dbDevId);
        }
        // 3. Build session records for SQLite insertion
        const toInsert = rawSessions.map((s) => ({
            id: newId(),
            team_id: teamId,
            user_name: s.user_name || '',
            user_email: s.user_email || '',
            session_name: s.session_name || '',
            created_at: s.created_at || new Date().toISOString(),
            acu_used: Number(s.acu_used) || 0,
            session_url: s.url || s.session_url || '',
            org_id: s.org_id || null,
            org_name: s.org_name || null,
            category: s.category || null,
            subcategory: s.subcategory || null,
            pull_requests: Array.isArray(s.pull_requests) ? s.pull_requests : [],
        }));
        // 4. Persist to SQLite (idempotent — skips existing session_urls)
        const inserted = (0, sqliteDb_1.insertSessionsBatch)(toInsert);
        // 5. Reload all sessions from DB into in-memory store, resolving team names
        const allDbTeams = (0, sqliteDb_1.getAllTeams)();
        const teamNameById = new Map(allDbTeams.map(t => [t.id, t.team_name]));
        const allDbSessions = (0, sqliteDb_1.getAllSessions)();
        db_1.store.devin_sessions = allDbSessions.map(s => ({
            id: s.id,
            // Resolve numeric DB team_id → human-readable team name
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
        }));
        // 6. Recompute in-memory derived stats
        recomputeDevinStats();
        (0, analyticsEngine_1.recalculateFromDevin)();
        // 7. Persist aggregate metrics to SQLite
        persistMetricsToDb();
        res.json({
            imported: inserted,
            skipped: rawSessions.length - inserted,
            total_sessions: db_1.store.devin_sessions.length,
        });
    }
    catch (err) {
        console.error('[devin/upload]', err);
        res.status(500).json({ error: 'Upload failed', detail: String(err) });
    }
});
/**
 * After recomputeDevinStats() and recalculateFromDevin(), persist the
 * freshly computed aggregate metrics to SQLite so they can be queried
 * independently if needed.
 */
function persistMetricsToDb() {
    try {
        // Developer metrics
        for (const stat of db_1.store.devin_developer_stats) {
            // Find developer db id via email
            const dbDevs = db_1.store.developers;
            const dev = dbDevs.find(d => d.email && d.email.toLowerCase() === stat.user_email.toLowerCase());
            if (!dev)
                continue;
            (0, sqliteDb_1.upsertDeveloperMetrics)(dev.id, {
                total_sessions: stat.sessions,
                total_acu: stat.acu_used,
                total_prs: stat.total_prs,
                merged_prs: stat.merged_prs,
                success_rate: stat.total_prs > 0 ? Math.round((stat.merged_prs / stat.total_prs) * 100) : 0,
                ai_score: stat.ai_score,
            });
        }
        // Team metrics
        for (const ts of db_1.store.devin_team_stats) {
            // Find team id in memory store
            const t = db_1.store.teams.find(t => t.name === ts.team_name);
            if (!t)
                continue;
            (0, sqliteDb_1.upsertTeamMetrics)(t.id, {
                developer_count: ts.developers,
                total_sessions: ts.sessions,
                total_acu: ts.acu_used,
                total_prs: ts.total_prs,
                merged_prs: ts.merged_prs,
                ai_score: ts.ai_score,
            });
        }
    }
    catch (err) {
        // Non-fatal: metrics are always recomputed from sessions on startup
        console.warn('[devin] persistMetricsToDb warning:', err);
    }
}
exports.default = router;
