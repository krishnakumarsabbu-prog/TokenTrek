/*
  # TokenTrek Schema

  Creates all tables needed for the AI platform usage analytics dashboard.

  1. New Tables
    - `platforms` - AI platforms (GitHub Copilot, Cursor, Claude, etc.)
    - `teams` - Engineering teams
    - `developers` - Individual developers
    - `daily_stats` - Daily aggregated usage stats per platform
    - `prompts` - Prompt usage metrics
    - `developer_scores` - Developer productivity scores
    - `team_costs` - Monthly cost per team
    - `model_costs` - Cost breakdown per AI model
    - `live_activity` - Recent AI activity events
    - `waste_items` - Detected AI usage waste
    - `insights` - AI-generated insights and recommendations

  2. Security
    - RLS enabled on all tables
    - Public read access (analytics dashboard, no auth required for demo)
*/

CREATE TABLE IF NOT EXISTS platforms (
  id serial PRIMARY KEY,
  name text NOT NULL,
  icon text DEFAULT '',
  color text DEFAULT '#000000',
  monthly_cost numeric DEFAULT 0,
  active_users integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS teams (
  id serial PRIMARY KEY,
  name text NOT NULL,
  member_count integer DEFAULT 0,
  monthly_budget numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS developers (
  id serial PRIMARY KEY,
  name text NOT NULL,
  team_id integer REFERENCES teams(id),
  role text DEFAULT 'Engineer',
  avatar text DEFAULT ''
);

CREATE TABLE IF NOT EXISTS daily_stats (
  id serial PRIMARY KEY,
  date date NOT NULL,
  platform_id integer REFERENCES platforms(id),
  requests integer DEFAULT 0,
  tokens bigint DEFAULT 0,
  cost numeric DEFAULT 0,
  active_users integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS prompts (
  id serial PRIMARY KEY,
  content text NOT NULL,
  platform_id integer REFERENCES platforms(id),
  usage_count integer DEFAULT 0,
  avg_tokens integer DEFAULT 0,
  avg_latency_ms integer DEFAULT 0,
  success_rate numeric DEFAULT 100
);

CREATE TABLE IF NOT EXISTS developer_scores (
  id serial PRIMARY KEY,
  developer_id integer REFERENCES developers(id),
  score integer DEFAULT 0,
  requests integer DEFAULT 0,
  tokens_used bigint DEFAULT 0,
  cost numeric DEFAULT 0,
  time_saved_hrs numeric DEFAULT 0
);

CREATE TABLE IF NOT EXISTS team_costs (
  id serial PRIMARY KEY,
  team_id integer REFERENCES teams(id),
  month text NOT NULL,
  cost numeric DEFAULT 0,
  budget numeric DEFAULT 0,
  requests integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS model_costs (
  id serial PRIMARY KEY,
  model_name text NOT NULL,
  provider text DEFAULT '',
  requests integer DEFAULT 0,
  tokens bigint DEFAULT 0,
  cost numeric DEFAULT 0,
  avg_latency_ms integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS live_activity (
  id serial PRIMARY KEY,
  developer_id integer REFERENCES developers(id),
  platform_id integer REFERENCES platforms(id),
  action text NOT NULL,
  tokens integer DEFAULT 0,
  latency_ms integer DEFAULT 0,
  occurred_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS waste_items (
  id serial PRIMARY KEY,
  category text NOT NULL,
  description text NOT NULL,
  estimated_cost numeric DEFAULT 0,
  occurrences integer DEFAULT 0,
  severity text DEFAULT 'low'
);

CREATE TABLE IF NOT EXISTS insights (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  category text DEFAULT 'general',
  impact text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE developers ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE waste_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;

-- Public read policies for analytics dashboard
CREATE POLICY "Public read platforms" ON platforms FOR SELECT TO anon USING (true);
CREATE POLICY "Public read teams" ON teams FOR SELECT TO anon USING (true);
CREATE POLICY "Public read developers" ON developers FOR SELECT TO anon USING (true);
CREATE POLICY "Public read daily_stats" ON daily_stats FOR SELECT TO anon USING (true);
CREATE POLICY "Public read prompts" ON prompts FOR SELECT TO anon USING (true);
CREATE POLICY "Public read developer_scores" ON developer_scores FOR SELECT TO anon USING (true);
CREATE POLICY "Public read team_costs" ON team_costs FOR SELECT TO anon USING (true);
CREATE POLICY "Public read model_costs" ON model_costs FOR SELECT TO anon USING (true);
CREATE POLICY "Public read live_activity" ON live_activity FOR SELECT TO anon USING (true);
CREATE POLICY "Public read waste_items" ON waste_items FOR SELECT TO anon USING (true);
CREATE POLICY "Public read insights" ON insights FOR SELECT TO anon USING (true);

-- Service role insert policies for seeding
CREATE POLICY "Service insert platforms" ON platforms FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert teams" ON teams FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert developers" ON developers FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert daily_stats" ON daily_stats FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert prompts" ON prompts FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert developer_scores" ON developer_scores FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert team_costs" ON team_costs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert model_costs" ON model_costs FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert live_activity" ON live_activity FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert waste_items" ON waste_items FOR INSERT TO service_role WITH CHECK (true);
CREATE POLICY "Service insert insights" ON insights FOR INSERT TO service_role WITH CHECK (true);
