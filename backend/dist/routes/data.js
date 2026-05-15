"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const seed_1 = require("../seed");
const router = (0, express_1.Router)();
// Schema definition for validation
const SCHEMAS = {
    daily_stats: { required: ['date', 'platform_id', 'requests', 'tokens', 'cost'], optional: [] },
    developers: { required: ['name', 'avatar', 'team_id'], optional: ['id'] },
    teams: { required: ['name'], optional: ['id'] },
    prompts: { required: ['prompt_text', 'uses', 'success_rate', 'avg_tokens'], optional: ['id'] },
    model_costs: { required: ['model_name', 'cost', 'pct'], optional: ['id', 'period'] },
};
function nextId(arr) {
    return arr.length > 0 ? Math.max(...arr.map(r => r.id)) + 1 : 1;
}
function validateRows(sheetName, rows) {
    const schema = SCHEMAS[sheetName];
    if (!schema)
        return [`Unknown sheet: "${sheetName}". Valid sheets: ${Object.keys(SCHEMAS).join(', ')}`];
    const errors = [];
    rows.forEach((row, i) => {
        schema.required.forEach(col => {
            if (row[col] === undefined || row[col] === null || row[col] === '') {
                errors.push(`Row ${i + 2}: missing required column "${col}"`);
            }
        });
    });
    return errors;
}
function importRows(sheetName, rows) {
    if (sheetName === 'daily_stats') {
        rows.forEach(r => {
            db_1.store.daily_stats.push({
                id: nextId(db_1.store.daily_stats),
                date: String(r.date),
                platform_id: Number(r.platform_id),
                requests: Number(r.requests),
                tokens: Number(r.tokens),
                cost: Number(r.cost),
            });
        });
    }
    else if (sheetName === 'developers') {
        rows.forEach(r => {
            const name = String(r.name);
            db_1.store.developers.push({
                id: nextId(db_1.store.developers),
                name,
                avatar: r.avatar ? String(r.avatar) : name.split(' ').map((w) => w[0]).join('').toUpperCase(),
                team_id: Number(r.team_id),
            });
        });
    }
    else if (sheetName === 'teams') {
        rows.forEach(r => {
            db_1.store.teams.push({ id: nextId(db_1.store.teams), name: String(r.name) });
        });
    }
    else if (sheetName === 'prompts') {
        rows.forEach(r => {
            db_1.store.prompts.push({
                id: nextId(db_1.store.prompts),
                prompt_text: String(r.prompt_text),
                uses: Number(r.uses),
                success_rate: Number(r.success_rate),
                avg_tokens: Number(r.avg_tokens),
            });
        });
    }
    else if (sheetName === 'model_costs') {
        rows.forEach(r => {
            db_1.store.model_costs.push({
                id: nextId(db_1.store.model_costs),
                model_name: String(r.model_name),
                cost: Number(r.cost),
                pct: Number(r.pct),
                period: r.period ? String(r.period) : 'Imported',
            });
        });
    }
}
// POST /api/data/import — body: { filename, sheets: { sheetName: rows[] }[] }
router.post('/import', (req, res) => {
    const { filename, sheets } = req.body;
    if (!filename || !sheets || typeof sheets !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    const allErrors = [];
    let totalRows = 0;
    Object.entries(sheets).forEach(([sheetName, rows]) => {
        const errors = validateRows(sheetName, rows);
        if (errors.length > 0) {
            allErrors.push(...errors.map(e => `[${sheetName}] ${e}`));
        }
        else {
            importRows(sheetName, rows);
            totalRows += rows.length;
        }
    });
    const record = {
        id: nextId(db_1.store.import_history),
        filename,
        rows: totalRows,
        status: allErrors.length > 0 ? 'error' : 'success',
        errors: allErrors,
        imported_at: new Date().toISOString(),
    };
    db_1.store.import_history.unshift(record);
    res.json({ success: allErrors.length === 0, rows: totalRows, errors: allErrors });
});
// POST /api/data/reset — clears all in-memory data
router.post('/reset', (_req, res) => {
    db_1.store.platforms.length = 0;
    db_1.store.teams.length = 0;
    db_1.store.developers.length = 0;
    db_1.store.daily_stats.length = 0;
    db_1.store.prompts.length = 0;
    db_1.store.developer_scores.length = 0;
    db_1.store.team_costs.length = 0;
    db_1.store.model_costs.length = 0;
    db_1.store.live_activity.length = 0;
    db_1.store.waste_items.length = 0;
    db_1.store.insights.length = 0;
    res.json({ success: true });
});
// POST /api/data/generate-demo — re-seeds demo data
router.post('/generate-demo', (_req, res) => {
    db_1.store.platforms.length = 0;
    db_1.store.teams.length = 0;
    db_1.store.developers.length = 0;
    db_1.store.daily_stats.length = 0;
    db_1.store.prompts.length = 0;
    db_1.store.developer_scores.length = 0;
    db_1.store.team_costs.length = 0;
    db_1.store.model_costs.length = 0;
    db_1.store.live_activity.length = 0;
    db_1.store.waste_items.length = 0;
    db_1.store.insights.length = 0;
    (0, seed_1.seed)();
    res.json({ success: true });
});
// GET /api/data/import-history
router.get('/import-history', (_req, res) => {
    res.json(db_1.store.import_history);
});
// GET /api/data/schema — returns validation schema
router.get('/schema', (_req, res) => {
    res.json(SCHEMAS);
});
// GET /api/data/template — returns CSV template content per sheet
router.get('/template/:sheet', (req, res) => {
    const { sheet } = req.params;
    const schema = SCHEMAS[sheet];
    if (!schema)
        return res.status(404).json({ error: 'Unknown sheet' });
    const cols = [...schema.required, ...schema.optional];
    const header = cols.join(',');
    const examples = {
        daily_stats: '2026-01-15,1,50000,800000,1200',
        developers: 'Jane Doe,JD,1',
        teams: 'Engineering',
        prompts: 'Explain this code,1000,90,1200',
        model_costs: 'GPT-4o,5000,25.5,Q1 2026',
    };
    const example = examples[sheet] || '';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${sheet}_template.csv"`);
    res.send(`${header}\n${example}\n`);
});
exports.default = router;
