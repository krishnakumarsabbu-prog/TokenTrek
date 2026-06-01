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
    scrum_records: {
        required: [
            'Team Name', 'Sprint Report', 'SprintStart', 'SprintEnd', 'Sprint Month',
            'Issue Count', 'Issue Delivered', 'Points Comm', 'Cycle Time (Days)',
            'Cycle Time (Hrs)', 'Velocity', 'Velocity (Rolling Avg.)', 'Stable Velocity',
            'Sprints Has Stable Velocity Range (Between 80% to 120%)', 'Percent Churn',
            'Sprints Has Low Churn', 'Predictability', 'Predictability (Rolling Avg.)',
            'Sprints In Optimal Predictability Range (Between 80% to 110%)',
            'Team Delivery Type', 'L4', 'L3'
        ],
        optional: []
    },
    kanban_records: {
        required: [
            'Team', 'Month Year', 'Cycle Time', 'Lead Time', 'Flow Efficiency',
            'Stability', 'Average Throughput', 'Average Arrival Rate',
            'Team Deliver L4', 'L3', 'L2'
        ],
        optional: []
    }
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
    else if (sheetName === 'scrum_records') {
        db_1.store.scrum_records = [];
        rows.forEach((r, idx) => {
            db_1.store.scrum_records.push({
                id: idx + 1,
                team_name: String(r['Team Name'] || r['team_name'] || ''),
                sprint_report: String(r['Sprint Report'] || r['sprint_report'] || ''),
                sprint_start: String(r['SprintStart'] || r['sprint_start'] || ''),
                sprint_end: String(r['SprintEnd'] || r['sprint_end'] || ''),
                sprint_month: String(r['Sprint Month'] || r['sprint_month'] || ''),
                issue_count: Number(r['Issue Count'] || r['issue_count']) || 0,
                issue_delivered: Number(r['Issue Delivered'] || r['issue_delivered']) || 0,
                points_comm: Number(r['Points Comm'] || r['points_comm']) || 0,
                cycle_time_days: Number(r['Cycle Time (Days)'] || r['cycle_time_days']) || 0,
                cycle_time_hrs: Number(r['Cycle Time (Hrs)'] || r['cycle_time_hrs']) || 0,
                velocity: Number(r['Velocity'] || r['velocity']) || 0,
                velocity_rolling_avg: Number(r['Velocity (Rolling Avg.)'] || r['velocity_rolling_avg']) || 0,
                stable_velocity: String(r['Stable Velocity'] || r['stable_velocity'] || ''),
                sprints_has_stable_velocity_range: String(r['Sprints Has Stable Velocity Range (Between 80% to 120%)'] || r['sprints_has_stable_velocity_range'] || ''),
                percent_churn: String(r['Percent Churn'] || r['percent_churn'] || ''),
                sprints_has_low_churn: String(r['Sprints Has Low Churn'] || r['sprints_has_low_churn'] || ''),
                predictability: String(r['Predictability'] || r['predictability'] || ''),
                predictability_rolling_avg: String(r['Predictability (Rolling Avg.)'] || r['predictability_rolling_avg'] || ''),
                sprints_in_optimal_predictability_range: String(r['Sprints In Optimal Predictability Range (Between 80% to 110%)'] || r['sprints_in_optimal_predictability_range'] || ''),
                team_delivery_type: String(r['Team Delivery Type'] || r['team_delivery_type'] || ''),
                l4: String(r['L4'] || r['l4'] || ''),
                l3: String(r['L3'] || r['l3'] || '')
            });
        });
    }
    else if (sheetName === 'kanban_records') {
        db_1.store.kanban_records = [];
        rows.forEach((r, idx) => {
            db_1.store.kanban_records.push({
                id: idx + 1,
                team: String(r['Team'] || r['team'] || ''),
                month_year: String(r['Month Year'] || r['month_year'] || ''),
                cycle_time: Number(r['Cycle Time'] || r['cycle_time']) || 0,
                lead_time: Number(r['Lead Time'] || r['lead_time']) || 0,
                flow_efficiency: Number(r['Flow Efficiency'] || r['flow_efficiency']) || 0,
                stability: Number(r['Stability'] || r['stability']) || 0,
                average_throughput: Number(r['Average Throughput'] || r['average_throughput']) || 0,
                average_arrival_rate: Number(r['Average Arrival Rate'] || r['average_arrival_rate']) || 0,
                team_deliver_l4: String(r['Team Deliver L4'] || r['team_deliver_l4'] || ''),
                l3: String(r['L3'] || r['l3'] || ''),
                l2: String(r['L2'] || r['l2'] || '')
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
    db_1.store.scrum_records.length = 0;
    db_1.store.kanban_records.length = 0;
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
    db_1.store.scrum_records.length = 0;
    db_1.store.kanban_records.length = 0;
    (0, seed_1.seed)();
    res.json({ success: true });
});
// POST /api/data/generate-large — seeds ~10 000 records
router.post('/generate-large', (_req, res) => {
    (0, seed_1.seedLarge)();
    const total = db_1.store.daily_stats.length + db_1.store.prompts.length + db_1.store.live_activity.length +
        db_1.store.developers.length + db_1.store.developer_scores.length + db_1.store.team_costs.length +
        db_1.store.model_costs.length + db_1.store.waste_items.length + db_1.store.insights.length;
    res.json({ success: true, total });
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
        scrum_records: 'Agentic AI L1,BQTZ 2025-01,4/9/25,4/22/25,2025-04,21,5,15,3,9,9,9,100%,Yes,80%,No,60%,60%,No,Software Delivery,Innovation Capability,Artificial Intel Techyon Forge',
        kanban_records: 'CMS Platform CD,05/24,4.8,33.8,0.14,1.1,17,15,Software Del Virtual Capabilities,Content,Content Management System',
    };
    const example = examples[sheet] || '';
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${sheet}_template.csv"`);
    res.send(`${header}\n${example}\n`);
});
exports.default = router;
