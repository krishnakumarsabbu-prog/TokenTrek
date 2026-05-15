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
};
