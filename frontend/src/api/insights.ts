import api from './client';

export type InsightCategory =
  | 'recommendation'
  | 'unusual_usage'
  | 'cost_anomaly'
  | 'prompt_opportunity'
  | 'model_switch'
  | 'weekly_trend'
  | 'hidden';

export interface AIInsight {
  id: string;
  category: InsightCategory;
  priority: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  metric?: string;
  metricLabel?: string;
  delta?: number;
  savings?: number;
  action?: string;
  tags?: string[];
}

export const fetchAIInsights = (): Promise<AIInsight[]> =>
  api.get('/analytics/ai-insights').then(r => r.data);
