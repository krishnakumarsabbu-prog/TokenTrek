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
        {
            id: 1, title: 'Code Review Assistant',
            description: 'Comprehensive code review covering security vulnerabilities, performance anti-patterns, and style consistency across any language.',
            prompt: 'You are a senior software engineer. Review the following code for: 1) Security vulnerabilities (XSS, SQLi, SSRF) 2) Performance issues and N+1 queries 3) Code style and readability 4) Missing error handling 5) Test coverage gaps. Provide actionable suggestions with code examples.\n\nCode:\n{{code}}',
            category: 'Engineering', author: 'TokenTrek Team', rating: 4.9, uses: 18245, tokens: 1200, successRate: 94, tags: ['code', 'review', 'security'], verified: true,
        },
        {
            id: 2, title: 'Unit Test Generator',
            description: 'Automatically generate comprehensive unit tests with edge cases, mocks, and assertions for any function or class.',
            prompt: 'Generate complete unit tests for the following function using {{framework}}. Include: happy path, edge cases (null, empty, boundary values), error scenarios, and mock any external dependencies. Use descriptive test names following "should_when_given" pattern.\n\nFunction:\n{{function}}',
            category: 'Testing', author: 'QA Automation', rating: 4.8, uses: 15672, tokens: 2100, successRate: 91, tags: ['testing', 'jest', 'automation'], verified: true,
        },
        {
            id: 3, title: 'SQL Query Optimizer',
            description: 'Analyze slow SQL queries and return optimized versions with indexing recommendations and execution plan insights.',
            prompt: 'Analyze this SQL query for performance issues. Provide: 1) Identified bottlenecks 2) Optimized query with explanation 3) Recommended indexes with CREATE INDEX statements 4) Estimated improvement percentage. Database: {{database}}\n\nQuery:\n{{query}}',
            category: 'Database', author: 'Platform Team', rating: 4.7, uses: 12398, tokens: 900, successRate: 89, tags: ['sql', 'performance', 'database'], verified: true,
        },
        {
            id: 4, title: 'API Documentation Writer',
            description: 'Generate OpenAPI 3.0-compliant documentation from endpoint code with request/response examples and error schemas.',
            prompt: 'Generate OpenAPI 3.0 documentation for the following API endpoint. Include: summary, description, request body schema with examples, all response schemas (200, 400, 401, 404, 500), and curl example. Output valid YAML.\n\nEndpoint code:\n{{code}}',
            category: 'Documentation', author: 'Backend Team', rating: 4.6, uses: 9876, tokens: 1500, successRate: 96, tags: ['api', 'docs', 'openapi'], verified: true,
        },
        {
            id: 5, title: 'React Component Builder',
            description: 'Generate accessible, fully-typed React components with Tailwind styling, props interface, and Storybook story.',
            prompt: 'Create a production-ready React component for {{component_description}}. Requirements: TypeScript with explicit prop types, Tailwind CSS styling, accessibility (ARIA labels, keyboard nav), responsive design, and a Storybook story with multiple variants. Export the component and its types.',
            category: 'Frontend', author: 'Frontend Team', rating: 4.8, uses: 8923, tokens: 1800, successRate: 88, tags: ['react', 'typescript', 'tailwind'], verified: true,
        },
        {
            id: 6, title: 'Security Vulnerability Scanner',
            description: 'Scan code for OWASP Top 10 vulnerabilities and get prioritized remediation steps with secure code alternatives.',
            prompt: 'Perform a security audit of this code against OWASP Top 10. For each vulnerability found: 1) Severity (Critical/High/Medium/Low) 2) Vulnerability type and CVE if applicable 3) Affected line numbers 4) Secure code replacement. Output as structured JSON.\n\nCode:\n{{code}}',
            category: 'Security', author: 'DevSecOps', rating: 4.9, uses: 7654, tokens: 1100, successRate: 97, tags: ['security', 'owasp', 'scanning'], verified: true,
        },
        {
            id: 7, title: 'Performance Profiler',
            description: 'Identify application bottlenecks and receive prioritized optimization recommendations with expected impact metrics.',
            prompt: 'Analyze this performance profile/code for bottlenecks. Identify the top 5 performance issues ranked by impact. For each: describe the issue, root cause, recommended fix with code example, and estimated % improvement. Focus on: algorithmic complexity, memory allocations, I/O blocking, and cache misses.\n\nProfile data:\n{{profile}}',
            category: 'Performance', author: 'Platform Team', rating: 4.5, uses: 6789, tokens: 950, successRate: 85, tags: ['performance', 'optimization', 'profiling'], verified: false,
        },
        {
            id: 8, title: 'Git Commit Message Writer',
            description: 'Generate semantic, conventional commit messages from git diffs with scope detection and breaking change flagging.',
            prompt: 'Write a conventional commit message for this git diff. Follow the format: <type>(<scope>): <description>. Types: feat, fix, docs, style, refactor, perf, test, chore. Add body explaining WHY if non-obvious. Flag BREAKING CHANGE if applicable. Keep subject under 72 chars.\n\nDiff:\n{{diff}}',
            category: 'DevOps', author: 'DevOps Team', rating: 4.7, uses: 11245, tokens: 400, successRate: 98, tags: ['git', 'commits', 'workflow'], verified: true,
        },
        {
            id: 9, title: 'Data Pipeline Builder',
            description: 'Design and implement ETL pipelines with retry logic, dead-letter queues, monitoring hooks, and schema validation.',
            prompt: 'Design an ETL pipeline for: Source: {{source}}, Destination: {{destination}}, Volume: {{volume}} records/day. Include: extraction with pagination, transformation with data validation rules, loading with upsert logic, error handling with DLQ, retry with exponential backoff, and monitoring metrics. Provide Python code using {{framework}}.',
            category: 'Data', author: 'Data Team', rating: 4.6, uses: 4532, tokens: 2400, successRate: 82, tags: ['etl', 'pipeline', 'data'], verified: false,
        },
        {
            id: 10, title: 'Infrastructure as Code Generator',
            description: 'Generate production-ready Terraform modules from architecture descriptions with security best practices and tagging.',
            prompt: 'Generate Terraform HCL for: {{infrastructure_description}}. Requirements: use modules where possible, enable encryption at rest and in transit, add security groups with least-privilege rules, configure CloudWatch alarms, use remote state with S3 backend, and add standard resource tags. Include variables.tf and outputs.tf.',
            category: 'DevOps', author: 'DevOps Team', rating: 4.8, uses: 5678, tokens: 2800, successRate: 90, tags: ['terraform', 'iac', 'devops'], verified: true,
        },
        {
            id: 11, title: 'Bug Report Analyzer',
            description: 'Parse bug reports and stack traces to identify root causes, suggest fixes, and generate reproduction steps.',
            prompt: 'Analyze this bug report and provide: 1) Most likely root cause with confidence % 2) Step-by-step reproduction path 3) Suggested fix with code changes 4) Regression test to prevent recurrence 5) Related areas that might be affected. Format as a structured engineering report.\n\nBug report:\n{{bug_report}}',
            category: 'Engineering', author: 'QA Automation', rating: 4.4, uses: 3456, tokens: 700, successRate: 79, tags: ['debugging', 'analysis', 'qa'], verified: false,
        },
        {
            id: 12, title: 'Microservice Scaffolder',
            description: 'Bootstrap production microservices with Docker, health checks, distributed tracing, graceful shutdown, and logging.',
            prompt: 'Scaffold a {{language}} microservice for {{service_description}}. Include: REST API with OpenAPI spec, Dockerfile with multi-stage build, health/readiness endpoints, structured JSON logging with correlation IDs, Prometheus metrics endpoint, graceful shutdown handler, and docker-compose.yml for local development.',
            category: 'Architecture', author: 'Platform Team', rating: 4.7, uses: 2987, tokens: 3200, successRate: 87, tags: ['microservices', 'docker', 'architecture'], verified: true,
        },
        {
            id: 13, title: 'Code Migration Assistant',
            description: 'Migrate codebases between frameworks, languages, or API versions with automated transformation and validation.',
            prompt: 'Migrate this {{source_framework}} code to {{target_framework}}. For each migrated file: show the complete transformed code, list all breaking changes, highlight any functionality that needs manual review, and provide a migration checklist. Preserve all existing behavior.\n\nSource code:\n{{code}}',
            category: 'Engineering', author: 'Platform Team', rating: 4.6, uses: 4123, tokens: 2600, successRate: 83, tags: ['migration', 'refactor', 'modernization'], verified: true,
        },
        {
            id: 14, title: 'Database Schema Designer',
            description: 'Design normalized database schemas with relationships, indexes, constraints, and migration scripts from requirements.',
            prompt: 'Design a PostgreSQL database schema for: {{requirements}}. Provide: normalized tables (3NF minimum), primary and foreign keys, indexes for expected query patterns, check constraints and defaults, Row Level Security policies, and Flyway/Liquibase migration scripts. Explain key design decisions.',
            category: 'Database', author: 'Backend Team', rating: 4.8, uses: 6234, tokens: 1700, successRate: 93, tags: ['postgresql', 'schema', 'design'], verified: true,
        },
        {
            id: 15, title: 'Load Testing Script Generator',
            description: 'Generate k6 or Locust load testing scripts with realistic user flows, ramp-up curves, and pass/fail thresholds.',
            prompt: 'Write a {{tool}} load test for {{endpoint_description}}. Include: realistic user flows with think time, gradual ramp-up to {{target_vus}} VUs, p95 latency threshold of {{threshold_ms}}ms, error rate threshold < 1%, and a summary report format. Add data parameterization to avoid cache hits.',
            category: 'Testing', author: 'QA Automation', rating: 4.5, uses: 3890, tokens: 1300, successRate: 88, tags: ['load-testing', 'k6', 'performance'], verified: false,
        },
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
