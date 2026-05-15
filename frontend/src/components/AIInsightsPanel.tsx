import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, ChevronDown, ChevronUp, TrendingUp, TrendingDown, DollarSign, Zap, AlertTriangle, BarChart2, Repeat2, ArrowRightLeft, Eye, Lightbulb, RefreshCw } from 'lucide-react';
import { fetchAIInsights, type AIInsight, type InsightCategory } from '../api/insights';
import { LivePulse } from './ui';

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORY_META: Record<InsightCategory, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  recommendation:    { label: 'Recommendations',       icon: <Lightbulb size={13} />,      color: '#0078d4', bg: '#eff6ff' },
  unusual_usage:     { label: 'Unusual Usage',          icon: <AlertTriangle size={13} />,   color: '#d97706', bg: '#fffbeb' },
  cost_anomaly:      { label: 'Cost Anomalies',         icon: <DollarSign size={13} />,      color: '#dc2626', bg: '#fef2f2' },
  prompt_opportunity:{ label: 'Prompt Opportunities',   icon: <Zap size={13} />,             color: '#059669', bg: '#ecfdf5' },
  model_switch:      { label: 'Model Switch',           icon: <ArrowRightLeft size={13} />,  color: '#7c3aed', bg: '#f5f3ff' },
  weekly_trend:      { label: 'Weekly Trends',          icon: <BarChart2 size={13} />,       color: '#0891b2', bg: '#ecfeff' },
  hidden:            { label: 'Hidden Insights',        icon: <Eye size={13} />,             color: '#6b7280', bg: '#f9fafb' },
};

const PRIORITY_COLOR: Record<string, string> = {
  critical: '#dc2626',
  high:     '#d97706',
  medium:   '#0078d4',
  low:      '#8ba3be',
};

const ALL_CATEGORIES: InsightCategory[] = [
  'recommendation', 'unusual_usage', 'cost_anomaly',
  'prompt_opportunity', 'model_switch', 'weekly_trend', 'hidden',
];

// ─── InsightCard ──────────────────────────────────────────────────────────────

function InsightCard({ insight, index }: { insight: AIInsight; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const meta = CATEGORY_META[insight.category];
  const prioColor = PRIORITY_COLOR[insight.priority];

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1], delay: index * 0.04 }}
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: '#e5eaf0', background: 'white', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
    >
      {/* Header */}
      <button
        className="w-full flex items-start gap-3 p-3.5 text-left"
        onClick={() => setExpanded(v => !v)}
      >
        {/* Category icon */}
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>

        {/* Title + priority dot */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: prioColor }}
            />
            <span className="text-xs font-semibold leading-tight" style={{ color: '#0d1f30' }}>
              {insight.title}
            </span>
          </div>
          {insight.metric && (
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold" style={{ color: meta.color }}>{insight.metric}</span>
              {insight.metricLabel && (
                <span className="text-xs" style={{ color: '#8ba3be' }}>{insight.metricLabel}</span>
              )}
              {insight.delta !== undefined && (
                <span
                  className="inline-flex items-center gap-0.5 text-xs font-semibold"
                  style={{ color: insight.delta < 0 ? '#059669' : insight.delta > 20 ? '#dc2626' : '#d97706' }}
                >
                  {insight.delta < 0 ? <TrendingDown size={10} /> : <TrendingUp size={10} />}
                  {insight.delta > 0 ? '+' : ''}{insight.delta}%
                </span>
              )}
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <div className="flex-shrink-0 mt-0.5" style={{ color: '#c5d4e0' }}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-3.5 pb-3.5 border-t" style={{ borderColor: '#f0f4f8' }}>
              <p className="text-xs mt-2.5 leading-relaxed" style={{ color: '#4a6480' }}>
                {insight.description}
              </p>

              {/* Savings badge */}
              {insight.savings !== undefined && insight.savings > 0 && (
                <div
                  className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-1 rounded-lg text-xs font-semibold"
                  style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' }}
                >
                  <DollarSign size={11} />
                  Save up to ${insight.savings.toLocaleString()}
                </div>
              )}

              {/* Tags */}
              {insight.tags && insight.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {insight.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-xs"
                      style={{ background: '#f0f4f8', color: '#8ba3be' }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action */}
              {insight.action && (
                <button
                  className="mt-2.5 text-xs font-semibold flex items-center gap-1 transition-opacity hover:opacity-70"
                  style={{ color: meta.color }}
                >
                  {insight.action} →
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Category Section ─────────────────────────────────────────────────────────

function CategorySection({
  category,
  insights,
}: {
  category: InsightCategory;
  insights: AIInsight[];
}) {
  const [collapsed, setCollapsed] = useState(false);
  const meta = CATEGORY_META[category];
  if (insights.length === 0) return null;

  return (
    <div className="mb-4">
      <button
        className="w-full flex items-center gap-2 mb-2 group"
        onClick={() => setCollapsed(v => !v)}
      >
        <div
          className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ background: meta.bg, color: meta.color }}
        >
          {meta.icon}
        </div>
        <span className="text-xs font-semibold flex-1 text-left" style={{ color: '#4a6480' }}>
          {meta.label}
        </span>
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded-md"
          style={{ background: meta.bg, color: meta.color }}
        >
          {insights.length}
        </span>
        <span style={{ color: '#c5d4e0' }}>
          {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
        </span>
      </button>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            style={{ overflow: 'hidden' }}
          >
            <div className="flex flex-col gap-2">
              {insights.map((ins, i) => (
                <InsightCard key={ins.id} insight={ins} index={i} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Summary Strip ────────────────────────────────────────────────────────────

function SummaryStrip({ insights }: { insights: AIInsight[] }) {
  const critical = insights.filter(i => i.priority === 'critical').length;
  const high = insights.filter(i => i.priority === 'high').length;
  const totalSavings = insights.reduce((s, i) => s + (i.savings || 0), 0);

  return (
    <div
      className="grid grid-cols-3 gap-2 p-3 mb-4 rounded-xl border"
      style={{ borderColor: '#e5eaf0', background: '#f7fafd' }}
    >
      <div className="text-center">
        <div className="text-base font-bold" style={{ color: critical > 0 ? '#dc2626' : '#0d1f30' }}>
          {critical + high}
        </div>
        <div className="text-xs" style={{ color: '#8ba3be' }}>Action Items</div>
      </div>
      <div className="text-center border-x" style={{ borderColor: '#e5eaf0' }}>
        <div className="text-base font-bold" style={{ color: '#059669' }}>
          ${totalSavings > 0 ? (totalSavings >= 1000 ? `${(totalSavings / 1000).toFixed(1)}K` : totalSavings) : '—'}
        </div>
        <div className="text-xs" style={{ color: '#8ba3be' }}>Est. Savings</div>
      </div>
      <div className="text-center">
        <div className="text-base font-bold" style={{ color: '#0d1f30' }}>{insights.length}</div>
        <div className="text-xs" style={{ color: '#8ba3be' }}>Insights</div>
      </div>
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AIInsightsPanel({ open, onClose }: Props) {
  const [activeFilter, setActiveFilter] = useState<InsightCategory | 'all'>('all');

  const { data: insights = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: fetchAIInsights,
    staleTime: 60_000,
  });

  const filtered = activeFilter === 'all'
    ? insights
    : insights.filter(i => i.category === activeFilter);

  const byCategory = ALL_CATEGORIES.reduce<Record<InsightCategory, AIInsight[]>>(
    (acc, cat) => {
      acc[cat] = filtered.filter(i => i.category === cat);
      return acc;
    },
    {} as Record<InsightCategory, AIInsight[]>
  );

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,15,30,0.3)', backdropFilter: 'blur(1px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 h-full z-50 flex flex-col"
            style={{
              width: 380,
              background: '#f7fafd',
              borderLeft: '1px solid #e5eaf0',
              boxShadow: '-8px 0 40px rgba(0,30,60,0.12)',
            }}
            initial={{ x: 380 }}
            animate={{ x: 0 }}
            exit={{ x: 380 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Header */}
            <div
              className="flex-shrink-0 px-4 py-3.5 border-b flex items-center gap-2.5"
              style={{ borderColor: '#e5eaf0', background: 'white' }}
            >
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: '#eff6ff', color: '#0078d4' }}
              >
                <Sparkles size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-semibold" style={{ color: '#0d1f30' }}>AI Insights</span>
                  <LivePulse color="#10b981" size={7} />
                </div>
                <p className="text-xs" style={{ color: '#8ba3be' }}>Generated from your data</p>
              </div>
              <button
                onClick={() => refetch()}
                className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all"
                style={{ borderColor: '#e5eaf0', color: '#8ba3be', background: 'white' }}
                title="Refresh insights"
              >
                <RefreshCw size={12} className={isFetching ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-lg border transition-all"
                style={{ borderColor: '#e5eaf0', color: '#8ba3be', background: 'white' }}
              >
                <X size={13} />
              </button>
            </div>

            {/* Filter chips */}
            <div
              className="flex-shrink-0 px-4 py-2.5 border-b overflow-x-auto"
              style={{ borderColor: '#e5eaf0', background: 'white' }}
            >
              <div className="flex gap-1.5 w-max">
                <button
                  onClick={() => setActiveFilter('all')}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                  style={activeFilter === 'all'
                    ? { background: '#0078d4', color: 'white' }
                    : { background: '#f0f4f8', color: '#4a6480' }
                  }
                >
                  All ({insights.length})
                </button>
                {ALL_CATEGORIES.map(cat => {
                  const count = insights.filter(i => i.category === cat).length;
                  if (count === 0) return null;
                  const meta = CATEGORY_META[cat];
                  return (
                    <button
                      key={cat}
                      onClick={() => setActiveFilter(cat)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex items-center gap-1"
                      style={activeFilter === cat
                        ? { background: meta.color, color: 'white' }
                        : { background: meta.bg, color: meta.color }
                      }
                    >
                      {meta.icon}
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 py-4">
              {isLoading ? (
                <div className="flex flex-col gap-3">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="rounded-xl border p-3.5 bg-white" style={{ borderColor: '#e5eaf0' }}>
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-lg flex-shrink-0" style={{ background: '#f0f4f8' }} />
                        <div className="flex-1">
                          <div className="h-3 rounded w-4/5 mb-1.5" style={{ background: '#edf1f5' }} />
                          <div className="h-2.5 rounded w-2/5" style={{ background: '#edf1f5' }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center"
                    style={{ background: '#f0f4f8', color: '#c5d4e0' }}
                  >
                    <Sparkles size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold" style={{ color: '#4a6480' }}>No insights in this category</p>
                    <p className="text-xs mt-1" style={{ color: '#8ba3be' }}>Try selecting a different filter</p>
                  </div>
                </div>
              ) : (
                <>
                  <SummaryStrip insights={filtered} />

                  {activeFilter === 'all' ? (
                    ALL_CATEGORIES.map(cat => (
                      <CategorySection
                        key={cat}
                        category={cat}
                        insights={byCategory[cat]}
                      />
                    ))
                  ) : (
                    <div className="flex flex-col gap-2">
                      {filtered.map((ins, i) => (
                        <InsightCard key={ins.id} insight={ins} index={i} />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Footer */}
            <div
              className="flex-shrink-0 px-4 py-2.5 border-t flex items-center justify-between"
              style={{ borderColor: '#e5eaf0', background: 'white' }}
            >
              <p className="text-xs" style={{ color: '#8ba3be' }}>
                Based on {insights.length} data patterns
              </p>
              <div className="flex items-center gap-1.5">
                <Repeat2 size={11} style={{ color: '#8ba3be' }} />
                <span className="text-xs" style={{ color: '#8ba3be' }}>Auto-generated</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
