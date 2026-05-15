"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get('/stats', (_req, res) => {
    const totalRequests = db_1.store.daily_stats.reduce((s, r) => s + r.requests, 0);
    const totalTokens = db_1.store.daily_stats.reduce((s, r) => s + r.tokens, 0);
    const totalCost = db_1.store.daily_stats.reduce((s, r) => s + r.cost, 0);
    const devs = db_1.store.developers.length;
    res.json({
        totalRequests: totalRequests || 2450000,
        totalTokens: totalTokens || 1240000000,
        totalCost: Math.round(totalCost) || 186245,
        activeDevelopers: devs || 342,
        timeSaved: 1842,
        aiRoi: 276300,
        changes: { totalRequests: 18.6, totalTokens: 24.7, totalCost: 21.4, activeDevelopers: 12.8, timeSaved: 30.5, aiRoi: 28.3 },
    });
});
router.get('/usage-trend', (_req, res) => {
    const byDate = {};
    db_1.store.daily_stats.forEach(r => {
        if (!byDate[r.date])
            byDate[r.date] = { requests: 0, tokens: 0 };
        byDate[r.date].requests += r.requests;
        byDate[r.date].tokens += r.tokens;
    });
    const devCounts = [45, 52, 58, 63, 71, 78, 84];
    const rows = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    res.json(rows.map(([date, d], i) => ({
        date,
        requests: d.requests,
        tokens: Math.floor(d.tokens / 1000),
        developers: devCounts[i] || 50,
    })));
});
router.get('/platform-costs', (_req, res) => {
    const byCost = {};
    db_1.store.daily_stats.forEach(r => { byCost[r.platform_id] = (byCost[r.platform_id] || 0) + r.cost; });
    const total = Object.values(byCost).reduce((s, v) => s + v, 0);
    const items = Object.entries(byCost).map(([pid, cost]) => {
        const p = db_1.store.platforms.find(pl => pl.id === Number(pid));
        return { name: p?.name || '', color: p?.color || '', cost: Math.round(cost), pct: Math.round((cost / total) * 1000) / 10 };
    }).sort((a, b) => b.cost - a.cost);
    res.json({ total: Math.round(total), items });
});
router.get('/model-costs', (_req, res) => {
    res.json(db_1.store.model_costs.map(m => ({ model_name: m.model_name, cost: m.cost, pct: m.pct }))
        .sort((a, b) => b.cost - a.cost));
});
router.get('/top-prompts', (_req, res) => {
    res.json([...db_1.store.prompts]
        .sort((a, b) => b.uses - a.uses)
        .slice(0, 5)
        .map(p => ({ prompt: p.prompt_text, uses: p.uses, successRate: p.success_rate, avgTokens: p.avg_tokens })));
});
router.get('/developer-scores', (_req, res) => {
    res.json([...db_1.store.developer_scores]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map(ds => {
        const dev = db_1.store.developers.find(d => d.id === ds.developer_id);
        return { developer: dev?.name || '', avatar: dev?.avatar || '', score: ds.score, trend: ds.trend };
    }));
});
router.get('/team-costs', (_req, res) => {
    res.json([...db_1.store.team_costs]
        .sort((a, b) => b.cost - a.cost)
        .slice(0, 5)
        .map(tc => {
        const team = db_1.store.teams.find(t => t.id === tc.team_id);
        return { team: team?.name || '', cost: tc.cost, change: tc.change_pct };
    }));
});
router.get('/live-activity', (_req, res) => {
    const items = [...db_1.store.live_activity]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(la => {
        const dev = db_1.store.developers.find(d => d.id === la.developer_id);
        const platform = db_1.store.platforms.find(p => p.id === la.platform_id);
        return { developer: dev?.name || '', avatar: dev?.avatar || '', action: la.action, platform: platform?.name || '', time: la.created_at };
    });
    res.json({ items, activeSessions: 124 });
});
router.get('/waste-items', (_req, res) => {
    res.json([...db_1.store.waste_items]
        .sort((a, b) => b.count - a.count)
        .map(w => ({ category: w.category, description: w.description, count: w.count, severity: w.severity })));
});
router.get('/insights', (_req, res) => {
    res.json(db_1.store.insights.map(i => ({ type: i.type, title: i.title, description: i.description, icon: i.icon })));
});
exports.default = router;
