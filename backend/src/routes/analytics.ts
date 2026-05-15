import { Router } from 'express';
import {
  computeTotals,
  computeDailyUsage,
  computePlatformUsage,
  computeDeveloperScores,
  computePromptRanking,
  computeTeamRanking,
  computeModelEfficiency,
  computeAIWaste,
  computeRecommendations,
  computeFullReport,
} from '../analytics';

const router = Router();

router.get('/report', (_req, res) => { res.json(computeFullReport()); });
router.get('/totals', (_req, res) => { res.json(computeTotals()); });
router.get('/daily-usage', (_req, res) => { res.json(computeDailyUsage()); });
router.get('/platform-usage', (_req, res) => { res.json(computePlatformUsage()); });
router.get('/developer-scores', (_req, res) => { res.json(computeDeveloperScores()); });
router.get('/prompt-ranking', (_req, res) => { res.json(computePromptRanking()); });
router.get('/team-ranking', (_req, res) => { res.json(computeTeamRanking()); });
router.get('/model-efficiency', (_req, res) => { res.json(computeModelEfficiency()); });
router.get('/ai-waste', (_req, res) => { res.json(computeAIWaste()); });
router.get('/recommendations', (_req, res) => { res.json(computeRecommendations()); });

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
    {
      id: 1, session_id: 'sess-001', developer: 'Rohit Sharma', avatar: 'RS',
      model: 'Claude 3.5 Sonnet', platform: 'Claude', project: 'Frontend Platform',
      prompt: 'Explain this React hook implementation and suggest improvements for performance',
      response: 'The `useCallback` hook you\'ve implemented has a dependency array issue. The `fetchData` function captures `userId` in its closure but it\'s not listed as a dependency, causing stale closures on re-renders.\n\n**Improvements:**\n1. Add `userId` to the dependency array\n2. Consider using `useReducer` instead of multiple `useState` calls to batch state updates\n3. Extract the fetch logic into a custom hook `useFetchUser` for reusability\n4. Add a cleanup function to cancel in-flight requests using `AbortController`\n\n```ts\nconst fetchData = useCallback(async () => {\n  const controller = new AbortController();\n  try {\n    const data = await fetchUser(userId, controller.signal);\n    setUser(data);\n  } catch (e) {\n    if (e.name !== \'AbortError\') setError(e);\n  }\n  return () => controller.abort();\n}, [userId]);\n```',
      tokens_used: 2345, prompt_tokens: 842, completion_tokens: 1503,
      cost: 0.84, success: true, duration_ms: 3200,
      started_at: new Date(now.getTime() - 3600000).toISOString(),
      tags: ['react', 'performance'],
      acceptance: 'accepted',
      generated_code: { lines: 24, functions: 2, files_modified: 1, language: 'TypeScript' },
    },
    {
      id: 2, session_id: 'sess-002', developer: 'Anita Patel', avatar: 'AP',
      model: 'GPT-4o', platform: 'GitHub Copilot', project: 'Auth Service',
      prompt: 'Write comprehensive unit tests for the authentication module including edge cases',
      response: 'Here are comprehensive unit tests for the authentication module covering all edge cases:\n\n```ts\ndescribe(\'AuthService\', () => {\n  describe(\'login\', () => {\n    it(\'should return token on valid credentials\', async () => {\n      const result = await authService.login(\'user@test.com\', \'password123\');\n      expect(result.token).toBeDefined();\n      expect(result.expiresIn).toBe(3600);\n    });\n\n    it(\'should throw on invalid password\', async () => {\n      await expect(authService.login(\'user@test.com\', \'wrong\')).rejects.toThrow(\'InvalidCredentials\');\n    });\n\n    it(\'should handle locked accounts\', async () => {\n      mockUser.locked = true;\n      await expect(authService.login(\'user@test.com\', \'password123\')).rejects.toThrow(\'AccountLocked\');\n    });\n\n    it(\'should increment failed attempt counter\', async () => {\n      await authService.login(\'user@test.com\', \'wrong\').catch(() => {});\n      expect(mockUser.failedAttempts).toBe(1);\n    });\n  });\n});\n```',
      tokens_used: 4123, prompt_tokens: 1245, completion_tokens: 2878,
      cost: 1.32, success: true, duration_ms: 5600,
      started_at: new Date(now.getTime() - 7200000).toISOString(),
      tags: ['testing', 'auth'],
      acceptance: 'accepted',
      generated_code: { lines: 87, functions: 12, files_modified: 2, language: 'TypeScript' },
    },
    {
      id: 3, session_id: 'sess-003', developer: 'Sandeep Yadav', avatar: 'SY',
      model: 'GPT-4o', platform: 'Cursor', project: 'Data Pipeline',
      prompt: 'Refactor this database query for better performance',
      response: 'The query failed to complete within the timeout limit. The query involves a full table scan on `orders` (12M rows) without utilizing any index. Attempted to generate an optimized version but the context was insufficient to determine the full schema relationships.\n\n**Partial analysis:**\n- Missing index on `(customer_id, created_at)` column pair\n- The subquery in the WHERE clause is not correlated properly\n- Consider rewriting with a CTE for better readability\n\nPlease provide the full schema and sample query execution plan.',
      tokens_used: 1876, prompt_tokens: 934, completion_tokens: 942,
      cost: 0.63, success: false, duration_ms: 8900,
      started_at: new Date(now.getTime() - 10800000).toISOString(),
      tags: ['database', 'optimization'],
      acceptance: 'rejected',
      generated_code: { lines: 0, functions: 0, files_modified: 0, language: 'SQL' },
    },
    {
      id: 4, session_id: 'sess-004', developer: 'Priya Verma', avatar: 'PV',
      model: 'Claude 3 Haiku', platform: 'Claude', project: 'Payments Infra',
      prompt: 'Generate Kubernetes deployment manifests for the payment service',
      response: 'Here are production-ready Kubernetes manifests for the payment service:\n\n```yaml\napiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: payment-service\n  namespace: payments\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: payment-service\n  template:\n    spec:\n      containers:\n      - name: payment-service\n        image: registry.io/payment-service:latest\n        resources:\n          requests:\n            memory: "256Mi"\n            cpu: "250m"\n          limits:\n            memory: "512Mi"\n            cpu: "500m"\n        readinessProbe:\n          httpGet:\n            path: /health\n            port: 8080\n```',
      tokens_used: 987, prompt_tokens: 312, completion_tokens: 675,
      cost: 0.12, success: true, duration_ms: 2100,
      started_at: new Date(now.getTime() - 14400000).toISOString(),
      tags: ['devops', 'kubernetes'],
      acceptance: 'accepted',
      generated_code: { lines: 52, functions: 0, files_modified: 3, language: 'YAML' },
    },
    {
      id: 5, session_id: 'sess-005', developer: 'Karan Singh', avatar: 'KS',
      model: 'GPT-4 Turbo', platform: 'Cursor', project: 'Core Backend',
      prompt: 'Debug this memory leak in the Node.js worker pool implementation',
      response: 'Found the memory leak — the `EventEmitter` listeners inside `WorkerPool` are never removed when workers complete tasks. Each `worker.on(\'message\', handler)` call adds a new listener but `removeListener` is never called.\n\n**Root cause:** The handler closure captures `resolve` and `reject` from each task, preventing GC.\n\n**Fix:**\n```js\nclass WorkerPool {\n  runTask(task) {\n    return new Promise((resolve, reject) => {\n      const worker = this._getWorker();\n      const handler = (result) => {\n        worker.removeListener(\'message\', handler); // fix\n        worker.removeListener(\'error\', errorHandler); // fix\n        resolve(result);\n      };\n      const errorHandler = (err) => {\n        worker.removeListener(\'message\', handler);\n        worker.removeListener(\'error\', errorHandler);\n        reject(err);\n      };\n      worker.on(\'message\', handler);\n      worker.on(\'error\', errorHandler);\n      worker.postMessage(task);\n    });\n  }\n}\n```',
      tokens_used: 3456, prompt_tokens: 1123, completion_tokens: 2333,
      cost: 1.04, success: true, duration_ms: 6700,
      started_at: new Date(now.getTime() - 18000000).toISOString(),
      tags: ['debugging', 'nodejs'],
      acceptance: 'accepted',
      generated_code: { lines: 31, functions: 3, files_modified: 1, language: 'JavaScript' },
    },
    {
      id: 6, session_id: 'sess-006', developer: 'Rohit Sharma', avatar: 'RS',
      model: 'Claude 3.5 Sonnet', platform: 'Claude', project: 'API Gateway',
      prompt: 'Create API documentation for the user management endpoints',
      response: '# User Management API\n\n## Endpoints\n\n### GET /users/{id}\nReturns a single user by ID.\n\n**Parameters:**\n- `id` (path, required): UUID of the user\n\n**Response 200:**\n```json\n{\n  "id": "uuid",\n  "email": "user@example.com",\n  "name": "John Doe",\n  "role": "admin",\n  "createdAt": "2025-01-01T00:00:00Z"\n}\n```\n\n**Response 404:**\n```json\n{ "error": "User not found", "code": "USER_NOT_FOUND" }\n```\n\n### POST /users\nCreates a new user. Requires `admin` role.\n\n**Request Body:**\n```json\n{\n  "email": "string (required)",\n  "name": "string (required)",\n  "role": "user | admin | viewer"\n}\n```',
      tokens_used: 1567, prompt_tokens: 423, completion_tokens: 1144,
      cost: 0.56, success: true, duration_ms: 4100,
      started_at: new Date(now.getTime() - 21600000).toISOString(),
      tags: ['documentation', 'api'],
      acceptance: 'accepted',
      generated_code: { lines: 45, functions: 0, files_modified: 1, language: 'Markdown' },
    },
    {
      id: 7, session_id: 'sess-007', developer: 'Anita Patel', avatar: 'AP',
      model: 'Gemini 1.5 Pro', platform: 'Custom Tools', project: 'Search Platform',
      prompt: 'Optimize the search indexing pipeline for 10M+ document scale',
      response: 'For 10M+ documents, the current pipeline\'s bottleneck is single-threaded document parsing. Here\'s a distributed architecture:\n\n**Architecture changes:**\n1. **Shard the index** by document hash into 16 shards\n2. **Parallel ingestion** using worker threads with a queue (BullMQ)\n3. **Incremental indexing** — only re-index changed documents using content hashing\n4. **Bloom filters** to skip already-indexed documents cheaply\n\n**Throughput estimate:** ~50K docs/min → ~500K docs/min\n\n```python\nfrom multiprocessing import Pool\n\ndef index_shard(shard_id, docs):\n    index = ShardedIndex(shard_id)\n    for doc in docs:\n        if not bloom_filter.check(doc.hash):\n            index.add(doc)\n            bloom_filter.add(doc.hash)\n    index.flush()\n\nwith Pool(16) as pool:\n    pool.starmap(index_shard, enumerate(sharded_docs))\n```',
      tokens_used: 5234, prompt_tokens: 1876, completion_tokens: 3358,
      cost: 1.57, success: true, duration_ms: 9200,
      started_at: new Date(now.getTime() - 25200000).toISOString(),
      tags: ['search', 'scaling'],
      acceptance: 'partially_accepted',
      generated_code: { lines: 63, functions: 4, files_modified: 2, language: 'Python' },
    },
    {
      id: 8, session_id: 'sess-008', developer: 'Sandeep Yadav', avatar: 'SY',
      model: 'GPT-4o', platform: 'GitHub Copilot', project: 'E-Commerce',
      prompt: 'Write E2E tests for the checkout flow using Playwright',
      response: 'Here are comprehensive Playwright E2E tests for the checkout flow:\n\n```ts\nimport { test, expect } from \'@playwright/test\';\n\ntest.describe(\'Checkout Flow\', () => {\n  test.beforeEach(async ({ page }) => {\n    await page.goto(\'/products\');\n    await page.click(\'[data-testid="add-to-cart"]\');\n    await page.goto(\'/cart\');\n  });\n\n  test(\'complete purchase with credit card\', async ({ page }) => {\n    await page.click(\'[data-testid="checkout-btn"]\');\n    await page.fill(\'#card-number\', \'4242424242424242\');\n    await page.fill(\'#expiry\', \'12/28\');\n    await page.fill(\'#cvv\', \'123\');\n    await page.click(\'[data-testid="pay-btn"]\');\n    await expect(page.locator(\'.order-confirmation\')).toBeVisible();\n    await expect(page.locator(\'.order-id\')).toHaveText(/ORD-\\d{6}/);\n  });\n\n  test(\'shows error for declined card\', async ({ page }) => {\n    await page.fill(\'#card-number\', \'4000000000000002\');\n    await page.click(\'[data-testid="pay-btn"]\');\n    await expect(page.locator(\'.error-message\')).toContainText(\'Card declined\');\n  });\n});\n```',
      tokens_used: 2987, prompt_tokens: 834, completion_tokens: 2153,
      cost: 0.95, success: true, duration_ms: 7800,
      started_at: new Date(now.getTime() - 28800000).toISOString(),
      tags: ['e2e', 'playwright'],
      acceptance: 'accepted',
      generated_code: { lines: 78, functions: 6, files_modified: 1, language: 'TypeScript' },
    },
    {
      id: 9, session_id: 'sess-009', developer: 'Priya Verma', avatar: 'PV',
      model: 'Claude 3.5 Sonnet', platform: 'Claude', project: 'Cloud Infra',
      prompt: 'Review this Terraform plan for security misconfigurations',
      response: 'Security review incomplete — the Terraform plan exceeded the context limit. Partial findings:\n\n**Critical issues found:**\n- S3 bucket `app-data-prod` has `acl = "public-read"` — immediate risk\n- Security group `sg-web` allows `0.0.0.0/0` on port 22 (SSH)\n\n**Unable to review:** IAM policies (context truncated)\n\nPlease split the plan into smaller sections for complete analysis.',
      tokens_used: 1234, prompt_tokens: 678, completion_tokens: 556,
      cost: 0.44, success: false, duration_ms: 3400,
      started_at: new Date(now.getTime() - 32400000).toISOString(),
      tags: ['security', 'terraform'],
      acceptance: 'rejected',
      generated_code: { lines: 0, functions: 0, files_modified: 0, language: 'HCL' },
    },
    {
      id: 10, session_id: 'sess-010', developer: 'Karan Singh', avatar: 'KS',
      model: 'Claude 3 Haiku', platform: 'Claude', project: 'Core Backend',
      prompt: 'Explain the circuit breaker pattern with implementation example',
      response: 'The **Circuit Breaker** pattern prevents cascading failures by stopping requests to a failing service and allowing time for recovery.\n\n**States:**\n- **Closed** — requests flow normally, failure count tracked\n- **Open** — requests blocked, error returned immediately\n- **Half-Open** — trial requests sent; if success → Closed, if fail → Open\n\n```ts\nclass CircuitBreaker {\n  private failures = 0;\n  private state: \'closed\' | \'open\' | \'half-open\' = \'closed\';\n  private nextAttempt = Date.now();\n\n  async call<T>(fn: () => Promise<T>): Promise<T> {\n    if (this.state === \'open\') {\n      if (Date.now() < this.nextAttempt) throw new Error(\'Circuit open\');\n      this.state = \'half-open\';\n    }\n    try {\n      const result = await fn();\n      this.onSuccess();\n      return result;\n    } catch (e) {\n      this.onFailure();\n      throw e;\n    }\n  }\n\n  private onSuccess() { this.failures = 0; this.state = \'closed\'; }\n  private onFailure() {\n    this.failures++;\n    if (this.failures >= 5) {\n      this.state = \'open\';\n      this.nextAttempt = Date.now() + 30000;\n    }\n  }\n}\n```',
      tokens_used: 876, prompt_tokens: 234, completion_tokens: 642,
      cost: 0.11, success: true, duration_ms: 1800,
      started_at: new Date(now.getTime() - 36000000).toISOString(),
      tags: ['patterns', 'architecture'],
      acceptance: 'accepted',
      generated_code: { lines: 29, functions: 4, files_modified: 0, language: 'TypeScript' },
    },
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
    daily_breakdown: computeDailyUsage(),
    platform_breakdown: computePlatformUsage(),
    team_breakdown: computeTeamRanking(),
    model_breakdown: computeModelEfficiency(),
  });
});

export default router;
