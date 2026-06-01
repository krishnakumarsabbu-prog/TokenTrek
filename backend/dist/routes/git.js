"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const db_1 = require("../db");
const router = (0, express_1.Router)();
router.get('/stats', (_req, res) => {
    const scrum = db_1.store.scrum_records || [];
    const kanban = db_1.store.kanban_records || [];
    // --- Scrum aggregations ---
    const scrumSummary = {
        totalSprints: scrum.length,
        totalIssues: scrum.reduce((sum, r) => sum + r.issue_count, 0),
        totalDelivered: scrum.reduce((sum, r) => sum + r.issue_delivered, 0),
        averageVelocity: scrum.length > 0 ? parseFloat((scrum.reduce((sum, r) => sum + r.velocity, 0) / scrum.length).toFixed(1)) : 0,
        averageCycleTimeDays: scrum.length > 0 ? parseFloat((scrum.reduce((sum, r) => sum + r.cycle_time_days, 0) / scrum.length).toFixed(1)) : 0,
        averageCycleTimeHrs: scrum.length > 0 ? parseFloat((scrum.reduce((sum, r) => sum + r.cycle_time_hrs, 0) / scrum.length).toFixed(1)) : 0,
        averagePredictability: scrum.length > 0 ? parseFloat((scrum.reduce((sum, r) => {
            const val = parseFloat(r.predictability.replace('%', ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0) / scrum.length).toFixed(1)) : 0,
        averageChurn: scrum.length > 0 ? parseFloat((scrum.reduce((sum, r) => {
            const val = parseFloat(r.percent_churn.replace('%', ''));
            return sum + (isNaN(val) ? 0 : val);
        }, 0) / scrum.length).toFixed(1)) : 0,
        stableVelocitySprintsPct: scrum.length > 0
            ? Math.round((scrum.filter(r => r.sprints_has_stable_velocity_range.toLowerCase() === 'yes').length / scrum.length) * 100)
            : 0,
        lowChurnSprintsPct: scrum.length > 0
            ? Math.round((scrum.filter(r => r.sprints_has_low_churn.toLowerCase() === 'yes').length / scrum.length) * 100)
            : 0,
    };
    // Group scrum by team
    const teamsScrumMap = {};
    scrum.forEach(r => {
        if (!teamsScrumMap[r.team_name])
            teamsScrumMap[r.team_name] = [];
        teamsScrumMap[r.team_name].push(r);
    });
    const scrumByTeam = Object.entries(teamsScrumMap).map(([teamName, records]) => {
        const totalIssues = records.reduce((sum, r) => sum + r.issue_count, 0);
        const totalDelivered = records.reduce((sum, r) => sum + r.issue_delivered, 0);
        return {
            teamName,
            sprintsCount: records.length,
            averageVelocity: parseFloat((records.reduce((sum, r) => sum + r.velocity, 0) / records.length).toFixed(1)),
            averagePredictability: parseFloat((records.reduce((sum, r) => {
                const val = parseFloat(r.predictability.replace('%', ''));
                return sum + (isNaN(val) ? 0 : val);
            }, 0) / records.length).toFixed(1)),
            averageChurn: parseFloat((records.reduce((sum, r) => {
                const val = parseFloat(r.percent_churn.replace('%', ''));
                return sum + (isNaN(val) ? 0 : val);
            }, 0) / records.length).toFixed(1)),
            deliveryRate: totalIssues > 0 ? parseFloat(((totalDelivered / totalIssues) * 100).toFixed(1)) : 0,
            averageCycleTimeDays: parseFloat((records.reduce((sum, r) => sum + r.cycle_time_days, 0) / records.length).toFixed(1))
        };
    });
    // Scrum trend over sprints (sorted chronologically or by sprint_report)
    const sortedScrum = [...scrum].sort((a, b) => a.sprint_report.localeCompare(b.sprint_report));
    const scrumTrend = sortedScrum.map(r => ({
        sprint: r.sprint_report,
        team: r.team_name,
        velocity: r.velocity,
        predictability: parseFloat(r.predictability.replace('%', '')) || 0,
        churn: parseFloat(r.percent_churn.replace('%', '')) || 0,
        cycleTime: r.cycle_time_days,
    }));
    // --- Kanban aggregations ---
    const kanbanSummary = {
        totalRecords: kanban.length,
        averageCycleTime: kanban.length > 0 ? parseFloat((kanban.reduce((sum, r) => sum + r.cycle_time, 0) / kanban.length).toFixed(2)) : 0,
        averageLeadTime: kanban.length > 0 ? parseFloat((kanban.reduce((sum, r) => sum + r.lead_time, 0) / kanban.length).toFixed(2)) : 0,
        averageFlowEfficiency: kanban.length > 0 ? parseFloat((kanban.reduce((sum, r) => sum + r.flow_efficiency, 0) / kanban.length).toFixed(2)) : 0,
        averageStability: kanban.length > 0 ? parseFloat((kanban.reduce((sum, r) => sum + r.stability, 0) / kanban.length).toFixed(2)) : 0,
        averageThroughput: kanban.length > 0 ? parseFloat((kanban.reduce((sum, r) => sum + r.average_throughput, 0) / kanban.length).toFixed(1)) : 0,
        averageArrivalRate: kanban.length > 0 ? parseFloat((kanban.reduce((sum, r) => sum + r.average_arrival_rate, 0) / kanban.length).toFixed(1)) : 0,
    };
    // Group kanban by team
    const teamsKanbanMap = {};
    kanban.forEach(r => {
        if (!teamsKanbanMap[r.team])
            teamsKanbanMap[r.team] = [];
        teamsKanbanMap[r.team].push(r);
    });
    const kanbanByTeam = Object.entries(teamsKanbanMap).map(([team, records]) => {
        return {
            team,
            monthsCount: records.length,
            averageCycleTime: parseFloat((records.reduce((sum, r) => sum + r.cycle_time, 0) / records.length).toFixed(2)),
            averageLeadTime: parseFloat((records.reduce((sum, r) => sum + r.lead_time, 0) / records.length).toFixed(2)),
            averageFlowEfficiency: parseFloat((records.reduce((sum, r) => sum + r.flow_efficiency, 0) / records.length).toFixed(2)),
            averageStability: parseFloat((records.reduce((sum, r) => sum + r.stability, 0) / records.length).toFixed(2)),
            averageThroughput: parseFloat((records.reduce((sum, r) => sum + r.average_throughput, 0) / records.length).toFixed(1)),
            averageArrivalRate: parseFloat((records.reduce((sum, r) => sum + r.average_arrival_rate, 0) / records.length).toFixed(1)),
        };
    });
    // Kanban trend over months (e.g. sorted by month_year)
    const sortedKanban = [...kanban].sort((a, b) => a.month_year.localeCompare(b.month_year));
    const kanbanTrend = sortedKanban.map(r => ({
        month: r.month_year,
        team: r.team,
        cycleTime: r.cycle_time,
        leadTime: r.lead_time,
        throughput: r.average_throughput,
        arrivalRate: r.average_arrival_rate,
        flowEfficiency: r.flow_efficiency
    }));
    res.json({
        scrumSummary,
        scrumByTeam,
        scrumTrend,
        kanbanSummary,
        kanbanByTeam,
        kanbanTrend,
        rawScrum: scrum,
        rawKanban: kanban,
    });
});
exports.default = router;
