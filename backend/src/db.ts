// In-memory data store replacing better-sqlite3

export interface Platform { id: number; name: string; color: string; icon: string }
export interface Team { id: number; name: string }
export interface Developer { id: number; name: string; avatar: string; team_id: number }
export interface DailyStat { id: number; date: string; platform_id: number; requests: number; tokens: number; cost: number }
export interface Prompt { id: number; prompt_text: string; uses: number; success_rate: number; avg_tokens: number }
export interface DeveloperScore { id: number; developer_id: number; score: number; trend: number; period: string }
export interface TeamCost { id: number; team_id: number; cost: number; change_pct: number; period: string }
export interface ModelCost { id: number; model_name: string; cost: number; pct: number; period: string }
export interface LiveActivity { id: number; developer_id: number; action: string; platform_id: number; created_at: string }
export interface WasteItem { id: number; category: string; description: string; count: number; severity: string }
export interface Insight { id: number; type: string; title: string; description: string; icon: string }
export interface ImportRecord { id: number; filename: string; rows: number; status: 'success' | 'error'; errors: string[]; imported_at: string }

export interface ScrumRecord {
  id: number;
  team_name: string;
  sprint_report: string;
  sprint_start: string;
  sprint_end: string;
  sprint_month: string;
  issue_count: number;
  issue_delivered: number;
  points_comm: number;
  cycle_time_days: number;
  cycle_time_hrs: number;
  velocity: number;
  velocity_rolling_avg: number;
  stable_velocity: string;
  sprints_has_stable_velocity_range: string;
  percent_churn: string;
  sprints_has_low_churn: string;
  predictability: string;
  predictability_rolling_avg: string;
  sprints_in_optimal_predictability_range: string;
  team_delivery_type: string;
  l4: string;
  l3: string;
}

export interface KanbanRecord {
  id: number;
  team: string;
  month_year: string;
  cycle_time: number;
  lead_time: number;
  flow_efficiency: number;
  stability: number;
  average_throughput: number;
  average_arrival_rate: number;
  team_deliver_l4: string;
  l3: string;
  l2: string;
}

export interface DevinSession {
  id: string;
  team_id: string;
  user_name: string;
  user_email: string;
  session_name: string;
  created_at: string;
  acu_used: number;
  session_url: string;
  org_id: string;
  org_name: string;
  category: string | null;
  subcategory: string | null;
  pull_requests: { pr_url: string; pr_status: string }[];
}

export interface DevinDeveloperStat {
  user_email: string;
  user_name: string;
  team_name: string;
  sessions: number;
  acu_used: number;
  total_prs: number;
  merged_prs: number;
  open_prs: number;
  failed_prs: number;
  categories: string[];
  ai_score: number;
}

export interface DevinTeamStat {
  team_name: string;
  sessions: number;
  acu_used: number;
  total_prs: number;
  merged_prs: number;
  developers: number;
  ai_score: number;
}

export const store: {
  platforms: Platform[];
  teams: Team[];
  developers: Developer[];
  daily_stats: DailyStat[];
  prompts: Prompt[];
  developer_scores: DeveloperScore[];
  team_costs: TeamCost[];
  model_costs: ModelCost[];
  live_activity: LiveActivity[];
  waste_items: WasteItem[];
  insights: Insight[];
  import_history: ImportRecord[];
  scrum_records: ScrumRecord[];
  kanban_records: KanbanRecord[];
  devin_sessions: DevinSession[];
  devin_developer_stats: DevinDeveloperStat[];
  devin_team_stats: DevinTeamStat[];
} = {
  platforms: [],
  teams: [],
  developers: [],
  daily_stats: [],
  prompts: [],
  developer_scores: [],
  team_costs: [],
  model_costs: [],
  live_activity: [],
  waste_items: [],
  insights: [],
  import_history: [],
  scrum_records: [],
  kanban_records: [],
  devin_sessions: [],
  devin_developer_stats: [],
  devin_team_stats: [],
};
