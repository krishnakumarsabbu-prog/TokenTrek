"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analytics_1 = require("../analytics");
const router = (0, express_1.Router)();
router.get('/report', (_req, res) => { res.json((0, analytics_1.computeFullReport)()); });
router.get('/totals', (_req, res) => { res.json((0, analytics_1.computeTotals)()); });
router.get('/daily-usage', (_req, res) => { res.json((0, analytics_1.computeDailyUsage)()); });
router.get('/platform-usage', (_req, res) => { res.json((0, analytics_1.computePlatformUsage)()); });
router.get('/developer-scores', (_req, res) => { res.json((0, analytics_1.computeDeveloperScores)()); });
router.get('/prompt-ranking', (_req, res) => { res.json((0, analytics_1.computePromptRanking)()); });
router.get('/team-ranking', (_req, res) => { res.json((0, analytics_1.computeTeamRanking)()); });
router.get('/model-efficiency', (_req, res) => { res.json((0, analytics_1.computeModelEfficiency)()); });
router.get('/ai-waste', (_req, res) => { res.json((0, analytics_1.computeAIWaste)()); });
router.get('/recommendations', (_req, res) => { res.json((0, analytics_1.computeRecommendations)()); });
router.get('/marketplace', (_req, res) => {
    res.json([
        { id: 1, title: 'Code Review Assistant', description: 'Comprehensive code review with security, performance, and style checks', category: 'Engineering', author: 'TokenTrek Team', rating: 4.9, uses: 18245, tokens: 1200, price: 0, tags: ['code', 'review', 'security'], verified: true },
        { id: 2, title: 'Unit Test Generator', description: 'Automatically generate unit tests for any function with edge cases', category: 'Testing', author: 'QA Automation', rating: 4.8, uses: 15672, tokens: 2100, price: 0, tags: ['testing', 'jest', 'automation'], verified: true },
        { id: 3, title: 'SQL Query Optimizer', description: 'Analyze and optimize slow SQL queries with indexing recommendations', category: 'Database', author: 'Platform Team', rating: 4.7, uses: 12398, tokens: 900, price: 0, tags: ['sql', 'performance', 'database'], verified: true },
        { id: 4, title: 'API Documentation Writer', description: 'Generate OpenAPI-compliant docs from code with examples', category: 'Documentation', author: 'Backend Team', rating: 4.6, uses: 9876, tokens: 1500, price: 0, tags: ['api', 'docs', 'openapi'], verified: true },
        { id: 5, title: 'React Component Builder', description: 'Generate accessible, typed React components with Tailwind styling', category: 'Frontend', author: 'Frontend Team', rating: 4.8, uses: 8923, tokens: 1800, price: 0, tags: ['react', 'typescript', 'tailwind'], verified: true },
        { id: 6, title: 'Security Vulnerability Scanner', description: 'Scan code for OWASP Top 10 vulnerabilities and suggest fixes', category: 'Security', author: 'DevSecOps', rating: 4.9, uses: 7654, tokens: 1100, price: 0, tags: ['security', 'owasp', 'scanning'], verified: true },
        { id: 7, title: 'Performance Profiler', description: 'Identify bottlenecks and provide optimization recommendations', category: 'Performance', author: 'Platform Team', rating: 4.5, uses: 6789, tokens: 950, price: 0, tags: ['performance', 'optimization', 'profiling'], verified: false },
        { id: 8, title: 'Git Commit Message Writer', description: 'Generate descriptive, conventional commit messages from diffs', category: 'DevOps', author: 'DevOps Team', rating: 4.7, uses: 11245, tokens: 400, price: 0, tags: ['git', 'commits', 'workflow'], verified: true },
        { id: 9, title: 'Data Pipeline Builder', description: 'Create ETL pipelines with error handling and monitoring', category: 'Data', author: 'Data Team', rating: 4.6, uses: 4532, tokens: 2400, price: 0, tags: ['etl', 'pipeline', 'data'], verified: false },
        { id: 10, title: 'Infrastructure as Code Generator', description: 'Generate Terraform/Ansible configs from architecture descriptions', category: 'DevOps', author: 'DevOps Team', rating: 4.8, uses: 5678, tokens: 2800, price: 0, tags: ['terraform', 'iac', 'devops'], verified: true },
        { id: 11, title: 'Bug Report Analyzer', description: 'Parse bug reports and suggest root causes with fix approaches', category: 'Engineering', author: 'QA Automation', rating: 4.4, uses: 3456, tokens: 700, price: 0, tags: ['debugging', 'analysis', 'qa'], verified: false },
        { id: 12, title: 'Microservice Scaffolder', description: 'Bootstrap microservices with Docker, health checks, and logging', category: 'Architecture', author: 'Platform Team', rating: 4.7, uses: 2987, tokens: 3200, price: 0, tags: ['microservices', 'docker', 'architecture'], verified: true },
    ]);
});
router.get('/replay', (_req, res) => {
    const now = new Date();
    res.json([
        { id: 1, session_id: 'sess-001', developer: 'Rohit Sharma', avatar: 'RS', model: 'Claude 3.5 Sonnet', prompt: 'Explain this React hook implementation and suggest improvements for performance', tokens_used: 2345, cost: 0.84, success: true, duration_ms: 3200, started_at: new Date(now.getTime() - 3600000).toISOString(), tags: ['react', 'performance'] },
        { id: 2, session_id: 'sess-002', developer: 'Anita Patel', avatar: 'AP', model: 'GPT-4o', prompt: 'Write comprehensive unit tests for the authentication module including edge cases', tokens_used: 4123, cost: 1.32, success: true, duration_ms: 5600, started_at: new Date(now.getTime() - 7200000).toISOString(), tags: ['testing', 'auth'] },
        { id: 3, session_id: 'sess-003', developer: 'Sandeep Yadav', avatar: 'SY', model: 'GPT-4o', prompt: 'Refactor this database query for better performance', tokens_used: 1876, cost: 0.63, success: false, duration_ms: 8900, started_at: new Date(now.getTime() - 10800000).toISOString(), tags: ['database', 'optimization'] },
        { id: 4, session_id: 'sess-004', developer: 'Priya Verma', avatar: 'PV', model: 'Claude 3 Haiku', prompt: 'Generate Kubernetes deployment manifests for the payment service', tokens_used: 987, cost: 0.12, success: true, duration_ms: 2100, started_at: new Date(now.getTime() - 14400000).toISOString(), tags: ['devops', 'kubernetes'] },
        { id: 5, session_id: 'sess-005', developer: 'Karan Singh', avatar: 'KS', model: 'GPT-4 Turbo', prompt: 'Debug this memory leak in the Node.js worker pool implementation', tokens_used: 3456, cost: 1.04, success: true, duration_ms: 6700, started_at: new Date(now.getTime() - 18000000).toISOString(), tags: ['debugging', 'nodejs'] },
        { id: 6, session_id: 'sess-006', developer: 'Rohit Sharma', avatar: 'RS', model: 'Claude 3.5 Sonnet', prompt: 'Create API documentation for the user management endpoints', tokens_used: 1567, cost: 0.56, success: true, duration_ms: 4100, started_at: new Date(now.getTime() - 21600000).toISOString(), tags: ['documentation', 'api'] },
        { id: 7, session_id: 'sess-007', developer: 'Anita Patel', avatar: 'AP', model: 'Gemini 1.5 Pro', prompt: 'Optimize the search indexing pipeline for 10M+ document scale', tokens_used: 5234, cost: 1.57, success: true, duration_ms: 9200, started_at: new Date(now.getTime() - 25200000).toISOString(), tags: ['search', 'scaling'] },
        { id: 8, session_id: 'sess-008', developer: 'Sandeep Yadav', avatar: 'SY', model: 'GPT-4o', prompt: 'Write E2E tests for the checkout flow using Playwright', tokens_used: 2987, cost: 0.95, success: true, duration_ms: 7800, started_at: new Date(now.getTime() - 28800000).toISOString(), tags: ['e2e', 'playwright'] },
        { id: 9, session_id: 'sess-009', developer: 'Priya Verma', avatar: 'PV', model: 'Claude 3.5 Sonnet', prompt: 'Review this Terraform plan for security misconfigurations', tokens_used: 1234, cost: 0.44, success: false, duration_ms: 3400, started_at: new Date(now.getTime() - 32400000).toISOString(), tags: ['security', 'terraform'] },
        { id: 10, session_id: 'sess-010', developer: 'Karan Singh', avatar: 'KS', model: 'Claude 3 Haiku', prompt: 'Explain the circuit breaker pattern with implementation example', tokens_used: 876, cost: 0.11, success: true, duration_ms: 1800, started_at: new Date(now.getTime() - 36000000).toISOString(), tags: ['patterns', 'architecture'] },
    ]);
});
router.get('/reports', (_req, res) => {
    const now = new Date();
    res.json({
        summary: {
            total_cost: 186245,
            total_tokens: 1240000000,
            total_requests: 2450000,
            active_developers: 42,
            cost_change: 21.4,
            token_change: 24.7,
            request_change: 18.6,
            period: 'May 12 - May 18, 2025',
        },
        reports: [
            { id: 1, name: 'Weekly Executive Summary', type: 'executive', schedule: 'weekly', last_run: new Date(now.getTime() - 86400000).toISOString(), status: 'ready', size_kb: 245 },
            { id: 2, name: 'Developer Productivity Report', type: 'productivity', schedule: 'weekly', last_run: new Date(now.getTime() - 172800000).toISOString(), status: 'ready', size_kb: 128 },
            { id: 3, name: 'Cost Breakdown by Team', type: 'cost', schedule: 'monthly', last_run: new Date(now.getTime() - 259200000).toISOString(), status: 'ready', size_kb: 89 },
            { id: 4, name: 'AI Waste Analysis Report', type: 'waste', schedule: 'weekly', last_run: new Date(now.getTime() - 345600000).toISOString(), status: 'outdated', size_kb: 156 },
            { id: 5, name: 'Security & Compliance Audit', type: 'security', schedule: 'monthly', last_run: new Date(now.getTime() - 432000000).toISOString(), status: 'ready', size_kb: 312 },
            { id: 6, name: 'Model Performance Benchmark', type: 'performance', schedule: 'monthly', last_run: new Date(now.getTime() - 518400000).toISOString(), status: 'outdated', size_kb: 198 },
        ],
        daily_breakdown: (0, analytics_1.computeDailyUsage)(),
        platform_breakdown: (0, analytics_1.computePlatformUsage)(),
        team_breakdown: (0, analytics_1.computeTeamRanking)(),
        model_breakdown: (0, analytics_1.computeModelEfficiency)(),
    });
});
exports.default = router;
