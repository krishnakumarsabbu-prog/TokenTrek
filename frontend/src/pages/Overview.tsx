import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { Activity, Cpu, DollarSign, Users, Clock, TrendingUp, TrendingDown, Filter, Sliders, ChevronRight, Shield, Zap, MessageSquare, AlertTriangle, BarChart2, RefreshCw, ArrowUpRight, Sparkles } from 'lucide-react';
import {
  fetchStats, fetchUsageTrend, fetchPlatformCosts, fetchModelCosts,
  fetchTopPrompts, fetchDeveloperScores, fetchTeamCosts, fetchLiveActivity,
  fetchWasteItems, fetchInsights,
} from '../api/overview';
import StatCard from '../components/StatCard';

// ── constants ───────────────────────────────────────────────────────────────

const PLATFORMS = ['All Platforms', 'GitHub Copilot', 'Cursor', 'Claude', 'Devin', 'Custom Tools'];

const PCOLORS: Record<string, string> = {
  'GitHub Copilot': '#0078d4',
  Cursor: '#00b4d8',
  Claude: '#e07b39',
  Devin: '#64748b',
  'Custom Tools': '#10b981',
};

const AVATAR_BG: Record<string, string> = {
  RS: '#0078d4', AP: '#10b981', SY: '#e07b39', PV: '#6366f1', KS: '#ef4444',
};

const WASTE_STYLE: Record<string, { bg: string; dot: string; badge: string }> = {
  high:   { bg: '#fff1f2', dot: '#ef4444', badge: 'bg-red-100 text-red-700' },
  medium: { bg: '#fffbeb', dot: '#f59e0b', badge: 'bg-amber-100 text-amber-700' },
  low:    { bg: '#eff6ff', dot: '#3b82f6', badge: 'bg-blue-100 text-blue-700' },
};

const INSIGHT_CONFIG: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {
  cost:         { bg: '#f0fdf4', color: '#16a34a', icon: <DollarSign size={15} /> },
  model:        { bg: '#eff6ff', color: '#2563eb', icon: <Cpu size={15} /> },
  prompt:       { bg: '#fefce8', color: '#ca8a04', icon: <MessageSquare size={15} /> },
  security:     { bg: '#fff1f2', color: '#dc2626', icon: <Shield size={15} /> },
  productivity: { bg: '#f0f9ff', color: '#0284c7', icon: <Zap size={15} /> },
};

// ── fallback data ────────────────────────────────────────────────────────────

const FB_STATS = {
  totalRequests: 2450000, totalTokens: 1240000000, totalCost: 186245,
  activeDevelopers: 342, timeSaved: 1842, aiRoi: 276300,
  changes: { totalRequests: 18.6, totalTokens: 24.7, totalCost: 21.4, activeDevelopers: 12.8, timeSaved: 30.5, aiRoi: 28.3 },
};

const FB_TREND = [
  { date: 'May 12', requests: 760, tokens: 1090, developers: 45 },
  { date: 'May 13', requests: 690, tokens: 992,  developers: 52 },
  { date: 'May 14', requests: 843, tokens: 1203, developers: 58 },
  { date: 'May 15', requests: 925, tokens: 1310, developers: 63 },
  { date: 'May 16', requests: 1007, tokens: 1441, developers: 71 },
  { date: 'May 17', requests: 1090, tokens: 1561, developers: 78 },
  { date: 'May 18', requests: 1155, tokens: 1652, developers: 84 },
];

const FB_PCOSTS = {
  total: 186245,
  items: [
    { name: 'GitHub Copilot', cost: 72432, pct: 38.9, color: '#0078d4' },
    { name: 'Cursor',         cost: 46125, pct: 24.8, color: '#00b4d8' },
    { name: 'Claude',         cost: 32584, pct: 17.5, color: '#e07b39' },
    { name: 'Devin',          cost: 18245, pct:  9.8, color: '#64748b' },
    { name: 'Custom Tools',   cost: 16859, pct:  9.0, color: '#10b981' },
  ],
};

const FB_MODELS = [
  { model_name: 'GPT-4o',            cost: 58762, pct: 31.6 },
  { model_name: 'Claude 3.5 Sonnet', cost: 42138, pct: 22.6 },
  { model_name: 'GPT-4 Turbo',       cost: 28945, pct: 15.6 },
  { model_name: 'Claude 3 Haiku',    cost: 18456, pct:  9.9 },
  { model_name: 'Gemini 1.5 Pro',    cost: 14235, pct:  7.7 },
];

const FB_PROMPTS = [
  { prompt: 'Explain this code',    uses: 18245, successRate: 92, avgTokens: 1245 },
  { prompt: 'Write unit tests',     uses: 15672, successRate: 89, avgTokens: 2134 },
  { prompt: 'Refactor this code',   uses: 12398, successRate: 91, avgTokens: 1876 },
  { prompt: 'Debug issue',          uses: 11245, successRate: 85, avgTokens: 1567 },
  { prompt: 'Optimize performance', uses:  9876, successRate: 88, avgTokens: 1345 },
];

const FB_DEV_SCORES = [
  { developer: 'Rohit Sharma',  avatar: 'RS', score: 92, trend: 8 },
  { developer: 'Anita Patel',   avatar: 'AP', score: 89, trend: 5 },
  { developer: 'Sandeep Yadav', avatar: 'SY', score: 87, trend: 3 },
  { developer: 'Priya Verma',   avatar: 'PV', score: 86, trend: 6 },
  { developer: 'Karan Singh',   avatar: 'KS', score: 84, trend: 2 },
];

const FB_TEAM_COSTS = [
  { team: 'Platform Team', cost: 54235, change: 24.6 },
  { team: 'Backend Team',  cost: 42876, change: 18.7 },
  { team: 'Frontend Team', cost: 28945, change: 20.1 },
  { team: 'DevOps Team',   cost: 26134, change: 15.3 },
  { team: 'QA Automation', cost: 18055, change: 19.8 },
];

const FB_ACTIVITY = {
  activeSessions: 124,
  items: [
    { developer: 'Rohit Sharma',  avatar: 'RS', action: 'Used Claude 3.5 Sonnet',  time: '2m ago' },
    { developer: 'Anita Patel',   avatar: 'AP', action: 'Used GPT-4o',              time: '3m ago' },
    { developer: 'Sandeep Yadav', avatar: 'SY', action: 'Used Cursor – Claude 3.5', time: '5m ago' },
    { developer: 'Priya Verma',   avatar: 'PV', action: 'Used GitHub Copilot',      time: '6m ago' },
    { developer: 'Karan Singh',   avatar: 'KS', action: 'Used Devin AI',            time: '8m ago' },
  ],
};

const FB_WASTE = [
  { description: 'High token, low success prompts', count: 23,  severity: 'high',   category: 'efficiency' },
  { description: 'Repeated prompts',                count: 156, severity: 'medium', category: 'redundancy' },
  { description: 'Overused expensive models',       count: 14,  severity: 'high',   category: 'cost' },
  { description: 'Inefficient long prompts',        count: 31,  severity: 'low',    category: 'optimization' },
];

const FB_INSIGHTS = [
  { type: 'cost',         title: 'Cost Optimization',    description: 'Team Backend is spending 38% more than average.' },
  { type: 'model',        title: 'Model Recommendation', description: 'Use GPT-4o Mini for simple tasks to save $12,430' },
  { type: 'prompt',       title: 'Prompt Optimization',  description: 'Optimize 156 repeated prompts to save tokens' },
  { type: 'security',     title: 'Security Alert',       description: '3 prompts contain potential sensitive information' },
  { type: 'productivity', title: 'Productivity Boost',   description: 'Developers saved 1,842 hours this week!' },
];

// ── helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function fmtDate(d: string) {
  return 'May ' + new Date(d).getDate();
}

function normalizeTrend(raw: { date: string; requests: number; tokens: number; developers: number }[]) {
  return raw.map(r => ({
    date: r.date.includes('-') ? fmtDate(r.date) : r.date,
    requests: r.requests > 10000 ? Math.round(r.requests / 1000) : r.requests,
    tokens: r.tokens > 10000 ? Math.round(r.tokens / 1000) : r.tokens,
    developers: r.developers,
  }));
}

function Avatar({ initials }: { initials: string }) {
  return (
    <div
      className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold shadow-sm"
      style={{ background: AVATAR_BG[initials] || '#64748b' }}
    >
      {initials}
    </div>
  );
}

function SectionHeader({ title, action }: { title: string; action?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <span className="text-[13px] font-semibold text-gray-800">{title}</span>
      {action && (
        <button className="text-[10px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5 transition-colors">
          {action} <ArrowUpRight size={10} />
        </button>
      )}
    </div>
  );
}

const SCORE_COLORS = ['#0078d4', '#10b981', '#e07b39', '#6366f1', '#ef4444'];

// ── component ────────────────────────────────────────────────────────────────

export default function Overview() {
  const [activePlatform, setActivePlatform] = useState('All Platforms');
  const [trendPeriod, setTrendPeriod] = useState('Daily');

  const { data: stats }      = useQuery({ queryKey: ['stats'],           queryFn: fetchStats });
  const { data: trend }      = useQuery({ queryKey: ['usage-trend'],     queryFn: fetchUsageTrend });
  const { data: pCosts }     = useQuery({ queryKey: ['platform-costs'],  queryFn: fetchPlatformCosts });
  const { data: modelCosts } = useQuery({ queryKey: ['model-costs'],     queryFn: fetchModelCosts });
  const { data: prompts }    = useQuery({ queryKey: ['top-prompts'],     queryFn: fetchTopPrompts });
  const { data: devScores }  = useQuery({ queryKey: ['dev-scores'],      queryFn: fetchDeveloperScores });
  const { data: teamCosts }  = useQuery({ queryKey: ['team-costs'],      queryFn: fetchTeamCosts });
  const { data: activity }   = useQuery({ queryKey: ['live-activity'],   queryFn: fetchLiveActivity, refetchInterval: 30000 });
  const { data: waste }      = useQuery({ queryKey: ['waste-items'],     queryFn: fetchWasteItems });
  const { data: insights }   = useQuery({ queryKey: ['insights'],        queryFn: fetchInsights });

  const s         = stats        || FB_STATS;
  const trendData = normalizeTrend(trend || FB_TREND);
  const costData  = pCosts       || FB_PCOSTS;
  const models    = modelCosts   || FB_MODELS;
  const topPrompts  = prompts    || FB_PROMPTS;
  const scores    = devScores    || FB_DEV_SCORES;
  const teams     = teamCosts    || FB_TEAM_COSTS;
  const liveData  = activity     || FB_ACTIVITY;
  const wasteData = waste        || FB_WASTE;
  const insightData = insights   || FB_INSIGHTS;

  const totalWaste = wasteData.reduce((sum: number, w: { count: number }) => sum + w.count, 0);

  return (
    <div className="animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 pt-4 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[16px] font-bold text-gray-900 flex items-center gap-2">
              AI Command Center
              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full text-[10px] font-semibold text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
              </span>
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Unified overview of all AI platform usage, cost, prompts, and developer productivity
            </p>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-gray-500">
            <RefreshCw size={11} className="text-gray-400" />
            <span>Auto-refreshes every 30s</span>
            <span className="text-gray-300">|</span>
            <span className="font-medium text-gray-600">May 12 – May 18, 2025</span>
          </div>
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-2 mt-3 pb-3 flex-wrap">
          {PLATFORMS.map(p => (
            <button
              key={p}
              onClick={() => setActivePlatform(p)}
              className={`platform-pill ${activePlatform === p ? 'platform-pill-active' : 'platform-pill-inactive'}`}
            >
              {PCOLORS[p] && <span className="w-2 h-2 rounded-full" style={{ background: PCOLORS[p] }} />}
              {p}
              {p === 'All Platforms' && <ChevronRight size={9} className="rotate-90 opacity-60" />}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <button className="platform-pill platform-pill-inactive">
              All Teams <ChevronRight size={9} className="rotate-90 opacity-60" />
            </button>
            <div className="w-px h-4 bg-gray-200" />
            <button className="platform-pill platform-pill-inactive gap-1">
              <Filter size={9} /> Filters
            </button>
            <button className="platform-pill platform-pill-inactive gap-1">
              <Sliders size={9} /> Customize
            </button>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-3">
          <StatCard icon={<Activity size={13} />}    label="Total Requests"    value={fmt(s.totalRequests)}             change={s.changes.totalRequests}    sub="vs May 5 – May 11" />
          <StatCard icon={<Cpu size={13} />}         label="Total Tokens"      value={fmt(s.totalTokens)}               change={s.changes.totalTokens}      sub="vs May 5 – May 11" />
          <StatCard icon={<DollarSign size={13} />}  label="Total Cost"        value={`$${s.totalCost.toLocaleString()}`} change={s.changes.totalCost}      sub="vs May 5 – May 11" />
          <StatCard icon={<Users size={13} />}       label="Active Developers" value={s.activeDevelopers.toString()}    change={s.changes.activeDevelopers} sub="vs May 5 – May 11" />
          <StatCard icon={<Clock size={13} />}       label="Time Saved (Est.)" value={`${s.timeSaved.toLocaleString()} hrs`} change={s.changes.timeSaved}  sub="vs May 5 – May 11" />
          <StatCard icon={<TrendingUp size={13} />}  label="AI ROI (Est.)"     value={`$${s.aiRoi.toLocaleString()}`}  change={s.changes.aiRoi}            sub="vs May 5 – May 11" />
        </div>

        {/* ── Row 2: Charts + Activity ──────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Usage Trend */}
          <div className="col-span-5 section-card p-4">
            <div className="flex items-center justify-between mb-4">
              <SectionHeader title="Usage Trend" />
              <select
                value={trendPeriod}
                onChange={e => setTrendPeriod(e.target.value)}
                className="text-xs border border-gray-200 rounded-md px-2 py-1 text-gray-600 outline-none bg-white hover:border-gray-300 transition-colors cursor-pointer -mt-3"
              >
                <option>Daily</option>
                <option>Weekly</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={trendData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="reqGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0078d4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="tokGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}K`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,.08)', padding: '8px 12px' }}
                  formatter={(v: number, name: string) => [
                    name === 'requests' ? `${v}K reqs` : name === 'tokens' ? `${v}K tok` : `${v} devs`, name
                  ]}
                  labelStyle={{ fontWeight: 600, color: '#374151', marginBottom: 4 }}
                />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 10, paddingTop: 8 }} />
                <Area type="monotone" dataKey="requests"   stroke="#0078d4" strokeWidth={2} fill="url(#reqGrad)" dot={{ r: 2.5, fill: '#0078d4' }} name="Requests" />
                <Area type="monotone" dataKey="tokens"     stroke="#00b4d8" strokeWidth={2} fill="url(#tokGrad)"  dot={{ r: 2.5, fill: '#00b4d8' }} name="Tokens" />
                <Line  type="monotone" dataKey="developers" stroke="#f59e0b" strokeWidth={2} dot={{ r: 2.5, fill: '#f59e0b' }} name="Developers" strokeDasharray="4 2" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Cost by Platform */}
          <div className="col-span-3 section-card p-4">
            <SectionHeader title="Cost by Platform" action="Details" />
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <PieChart width={120} height={120}>
                  <Pie
                    data={costData.items}
                    cx={57} cy={57}
                    innerRadius={36} outerRadius={56}
                    dataKey="cost"
                    paddingAngle={2}
                    strokeWidth={0}
                  >
                    {costData.items.map((e: { color: string }, i: number) => (
                      <Cell key={i} fill={e.color} />
                    ))}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-gray-900">${Math.round(costData.total / 1000)}K</span>
                  <span className="text-[9px] text-gray-400 mt-0.5">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                {costData.items.map((item: { name: string; cost: number; pct: number; color: string }, i: number) => (
                  <div key={i} className="flex items-center gap-2 group">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-gray-700 font-medium truncate">{item.name}</span>
                        <span className="text-[10px] text-gray-500 ml-1 flex-shrink-0">{item.pct}%</span>
                      </div>
                      <div className="mt-0.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${item.pct}%`, background: item.color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Models */}
          <div className="col-span-2 section-card p-4">
            <SectionHeader title="Top Models" action="View all" />
            <div className="space-y-3">
              {models.slice(0, 5).map((m: { model_name: string; cost: number; pct: number }, i: number) => (
                <div key={i}>
                  <div className="flex justify-between items-center text-[10px] mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SCORE_COLORS[i] }} />
                      <span className="text-gray-700 font-medium truncate max-w-[90px]">{m.model_name}</span>
                    </div>
                    <span className="text-gray-900 font-bold flex-shrink-0">${(m.cost / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(m.pct * 2.8, 100)}%`, background: SCORE_COLORS[i] }}
                      />
                    </div>
                    <span className="text-[9px] text-gray-400 w-7 text-right">{m.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity */}
          <div className="col-span-2 section-card p-4">
            <SectionHeader title="Live Activity" action="View all" />
            <div className="space-y-2.5">
              {liveData.items.slice(0, 5).map((item: { developer: string; avatar: string; action: string; time: string }, i: number) => (
                <div key={i} className="flex items-center gap-2 group hover:bg-gray-50 rounded-md px-1 py-0.5 -mx-1 transition-colors cursor-pointer">
                  <Avatar initials={item.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold text-gray-800 truncate">{item.developer.split(' ')[0]}</div>
                    <div className="text-[9px] text-gray-400 truncate">{item.action}</div>
                  </div>
                  <span className="text-[9px] text-gray-400 flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2.5 border-t border-gray-50 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-gray-500 font-medium">{liveData.activeSessions} active sessions</span>
            </div>
          </div>
        </div>

        {/* ── Row 3: Bottom tables ──────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Top Prompts */}
          <div className="col-span-3 section-card p-4">
            <SectionHeader title="Top Prompts" action="View all" />
            <div className="grid grid-cols-[1fr_auto_auto] text-[9px] text-gray-400 uppercase tracking-wide mb-1.5 px-1 gap-x-3">
              <span>Prompt</span>
              <span className="text-right">Uses</span>
              <span className="text-right">Success</span>
            </div>
            <div className="space-y-0.5">
              {topPrompts.map((p: { prompt: string; uses: number; successRate: number; avgTokens: number }, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_auto] items-center hover:bg-gray-50 rounded-md px-1 py-2 -mx-1 cursor-pointer transition-colors gap-x-3"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-4 h-4 rounded bg-gray-100 text-gray-500 text-[9px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                    <span className="text-[11px] text-gray-700 truncate">{p.prompt}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 text-right font-medium">{p.uses.toLocaleString()}</span>
                  <span className={`text-[10px] font-semibold text-right ${p.successRate >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {p.successRate}%
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 text-[9px] text-gray-400">
              Showing top 5 of 1,234 prompts
            </div>
          </div>

          {/* Developer AI Score */}
          <div className="col-span-3 section-card p-4">
            <SectionHeader title="Developer AI Score" action="View all" />
            <div className="grid grid-cols-[1fr_auto_auto] text-[9px] text-gray-400 uppercase tracking-wide mb-1.5 px-1 gap-x-3">
              <span>Developer</span>
              <span className="text-center">Score</span>
              <span className="text-right">Trend</span>
            </div>
            <div className="space-y-0.5">
              {scores.map((d: { developer: string; avatar: string; score: number; trend: number }, i: number) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_auto_auto] items-center hover:bg-gray-50 rounded-md px-1 py-2 -mx-1 cursor-pointer transition-colors gap-x-3"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Avatar initials={d.avatar} />
                    <span className="text-[11px] text-gray-700 truncate">{d.developer.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-10 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${d.score}%`, background: SCORE_COLORS[i] }}
                      />
                    </div>
                    <span className="text-[11px] font-bold text-gray-800 w-6 text-right">{d.score}</span>
                  </div>
                  <div className={`text-[10px] font-semibold text-right flex items-center justify-end gap-0.5 ${d.trend >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {d.trend >= 0 ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
                    {d.trend >= 0 ? '+' : ''}{d.trend}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 text-[9px] text-gray-400">
              Based on usage, efficiency, and productivity
            </div>
          </div>

          {/* Cost by Team */}
          <div className="col-span-3 section-card p-4">
            <SectionHeader title="Cost by Team" action="View all" />
            <div className="grid grid-cols-[1fr_auto_auto] text-[9px] text-gray-400 uppercase tracking-wide mb-1.5 px-1 gap-x-3">
              <span>Team</span>
              <span className="text-right">Cost</span>
              <span className="text-right">Change</span>
            </div>
            <div className="space-y-0.5">
              {teams.map((t: { team: string; cost: number; change: number }, i: number) => {
                const maxCost = teams[0]?.cost || 1;
                return (
                  <div
                    key={i}
                    className="hover:bg-gray-50 rounded-md px-1 py-2 -mx-1 cursor-pointer transition-colors"
                  >
                    <div className="grid grid-cols-[1fr_auto_auto] items-center gap-x-3 mb-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: SCORE_COLORS[i] }} />
                        <span className="text-[11px] text-gray-700 truncate">{t.team}</span>
                      </div>
                      <span className="text-[11px] font-bold text-gray-900 text-right">${(t.cost / 1000).toFixed(1)}K</span>
                      <div className="text-[10px] font-semibold text-right flex items-center justify-end gap-0.5 text-emerald-600">
                        <TrendingUp size={9} /> +{t.change}%
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: `${(t.cost / maxCost) * 100}%`, background: SCORE_COLORS[i] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2.5 pt-2 border-t border-gray-50 text-[9px] text-gray-400">
              Showing top 5 of 12 teams
            </div>
          </div>

          {/* AI Waste Detector */}
          <div className="col-span-3 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[13px] font-semibold text-gray-800">AI Waste Detector</span>
                <span className="inline-flex items-center px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-[9px] font-bold text-red-600">
                  {totalWaste} issues
                </span>
              </div>
              <button className="text-[10px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5 transition-colors">
                View all <ArrowUpRight size={10} />
              </button>
            </div>
            <div className="space-y-2">
              {wasteData.map((w: { description: string; count: number; severity: string }, i: number) => {
                const { bg, dot, badge } = WASTE_STYLE[w.severity] || WASTE_STYLE.low;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2.5 hover:bg-gray-50 rounded-md px-2 py-2 -mx-2 cursor-pointer transition-colors group"
                  >
                    <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center" style={{ background: bg }}>
                      <AlertTriangle size={12} style={{ color: dot }} />
                    </div>
                    <span className="text-[11px] text-gray-700 flex-1 leading-snug">{w.description}</span>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <span className="text-sm font-bold text-gray-900">{w.count}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${badge}`}>
                        {w.severity}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <button className="mt-3 w-full py-2 text-[10px] text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-md flex items-center justify-center gap-1 font-semibold transition-colors border border-blue-100">
              <BarChart2 size={11} /> View Full Waste Report
            </button>
          </div>
        </div>

        {/* ── Insights footer ───────────────────────────────────────────────── */}
        <div className="section-card p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-amber-50 flex items-center justify-center">
                <Sparkles size={13} className="text-amber-500" />
              </div>
              <span className="text-[13px] font-semibold text-gray-800">Insights &amp; Recommendations</span>
              <span className="inline-flex items-center px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-full text-[9px] font-bold text-blue-600">
                {insightData.length} new
              </span>
            </div>
            <button className="text-[10px] text-blue-500 hover:text-blue-600 font-medium flex items-center gap-0.5 transition-colors">
              View all insights <ArrowUpRight size={10} />
            </button>
          </div>
          <div className="grid grid-cols-5 gap-3">
            {insightData.map((ins: { type: string; title: string; description: string }, i: number) => {
              const cfg = INSIGHT_CONFIG[ins.type] || INSIGHT_CONFIG.cost;
              return (
                <div
                  key={i}
                  className="relative flex flex-col gap-2.5 p-3 border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-md transition-all cursor-pointer group overflow-hidden"
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(135deg, ${cfg.bg} 0%, transparent 70%)` }}
                  />
                  <div
                    className="relative w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, color: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <div className="relative flex-1">
                    <div className="text-[11px] font-semibold text-gray-800 mb-1">{ins.title}</div>
                    <div className="text-[10px] text-gray-500 leading-relaxed">{ins.description}</div>
                  </div>
                  <button
                    className="relative text-[10px] font-semibold flex items-center gap-0.5 transition-colors mt-auto"
                    style={{ color: cfg.color }}
                  >
                    View details <ChevronRight size={10} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
