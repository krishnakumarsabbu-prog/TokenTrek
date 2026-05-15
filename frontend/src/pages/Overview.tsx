import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';
import { Activity, Cpu, DollarSign, Users, Clock, TrendingUp, ListFilter as Filter, FileSliders as Sliders, ChevronRight, Shield, Zap, MessageSquare } from 'lucide-react';
import {
  fetchStats, fetchUsageTrend, fetchPlatformCosts
} from '../api/overview';
import StatCard from '../components/StatCard';

const PLATFORMS = ['All Platforms', 'GitHub Copilot', 'Cursor', 'Claude', 'Devin', 'Custom Tools'];
const PCOLORS: Record<string, string> = {
  'GitHub Copilot': '#0078d4', Cursor: '#00b4d8', Claude: '#e07b39', Devin: '#7c3aed', 'Custom Tools': '#10b981',
};

const AVATAR_BG: Record<string, string> = {
  RS: '#0078d4', AP: '#10b981', SY: '#e07b39', PV: '#7c3aed', KS: '#ef4444',
};

function Avatar({ initials }: { initials: string }) {
  return (
    <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
      style={{ background: AVATAR_BG[initials] || '#64748b' }}>
      {initials}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
}

function fmtDate(d: string) {
  return 'May ' + new Date(d).getDate();
}

// ── static fallback data ────────────────────────────────────────────────────

const TREND = [
  { date: '2025-05-12', requests: 760000, tokens: 1090, developers: 45 },
  { date: '2025-05-13', requests: 690000, tokens: 992, developers: 52 },
  { date: '2025-05-14', requests: 843000, tokens: 1203, developers: 58 },
  { date: '2025-05-15', requests: 925000, tokens: 1310, developers: 63 },
  { date: '2025-05-16', requests: 1007000, tokens: 1441, developers: 71 },
  { date: '2025-05-17', requests: 1090000, tokens: 1561, developers: 78 },
  { date: '2025-05-18', requests: 1155000, tokens: 1652, developers: 84 },
];

const PCOSTS = {
  total: 186245,
  items: [
    { name: 'GitHub Copilot', cost: 72432, pct: 38.9, color: '#0078d4' },
    { name: 'Cursor',         cost: 46125, pct: 24.8, color: '#00b4d8' },
    { name: 'Claude',         cost: 32584, pct: 17.5, color: '#e07b39' },
    { name: 'Devin',          cost: 18245, pct:  9.8, color: '#7c3aed' },
    { name: 'Custom Tools',   cost: 16859, pct:  9.0, color: '#10b981' },
  ],
};

const MODELS = [
  { model_name: 'GPT-4o',            cost: 58762, pct: 31.6 },
  { model_name: 'Claude 3.5 Sonnet', cost: 42138, pct: 22.6 },
  { model_name: 'GPT-4 Turbo',       cost: 28945, pct: 15.6 },
  { model_name: 'Claude 3 Haiku',    cost: 18456, pct:  9.9 },
  { model_name: 'Gemini 1.5 Pro',    cost: 14235, pct:  7.7 },
];

const PROMPTS = [
  { prompt: 'Explain this code',    uses: 18245, successRate: 92, avgTokens: 1245 },
  { prompt: 'Write unit tests',     uses: 15672, successRate: 89, avgTokens: 2134 },
  { prompt: 'Refactor this code',   uses: 12398, successRate: 91, avgTokens: 1876 },
  { prompt: 'Debug issue',          uses: 11245, successRate: 85, avgTokens: 1567 },
  { prompt: 'Optimize performance', uses:  9876, successRate: 88, avgTokens: 1345 },
];

const DEV_SCORES = [
  { developer: 'Rohit Sharma',  avatar: 'RS', score: 92, trend: 8 },
  { developer: 'Anita Patel',   avatar: 'AP', score: 89, trend: 5 },
  { developer: 'Sandeep Yadav', avatar: 'SY', score: 87, trend: 3 },
  { developer: 'Priya Verma',   avatar: 'PV', score: 86, trend: 6 },
  { developer: 'Karan Singh',   avatar: 'KS', score: 84, trend: 2 },
];

const TEAM_COSTS = [
  { team: 'Platform Team',  cost: 54235, change: 24.6 },
  { team: 'Backend Team',   cost: 42876, change: 18.7 },
  { team: 'Frontend Team',  cost: 28945, change: 20.1 },
  { team: 'DevOps Team',    cost: 26134, change: 15.3 },
  { team: 'QA Automation',  cost: 18055, change: 19.8 },
];

const ACTIVITY = {
  activeSessions: 124,
  items: [
    { developer: 'Rohit Sharma',  avatar: 'RS', action: 'Used Claude 3.5 Sonnet',  time: '2m ago' },
    { developer: 'Anita Patel',   avatar: 'AP', action: 'Used GPT-4o',              time: '3m ago' },
    { developer: 'Sandeep Yadav', avatar: 'SY', action: 'Used Cursor – Claude 3.5', time: '5m ago' },
    { developer: 'Priya Verma',   avatar: 'PV', action: 'Used GitHub Copilot',      time: '6m ago' },
    { developer: 'Karan Singh',   avatar: 'KS', action: 'Used Devin AI',            time: '8m ago' },
  ],
};

const WASTE = [
  { description: 'High token, low success prompts', count: 23,  severity: 'high'   },
  { description: 'Repeated prompts',                count: 156, severity: 'medium' },
  { description: 'Overused expensive models',       count: 14,  severity: 'high'   },
  { description: 'Inefficient long prompts',        count: 31,  severity: 'low'    },
];

const INSIGHTS = [
  { type: 'cost',         title: 'Cost Optimization',     description: 'Team Backend is spending 38% more than average.' },
  { type: 'model',        title: 'Model Recommendation',  description: 'Use GPT-4o Mini for simple tasks to save $12,430' },
  { type: 'prompt',       title: 'Prompt Optimization',   description: 'Optimize 156 repeated prompts to save tokens' },
  { type: 'security',     title: 'Security Alert',        description: '3 prompts contain potential sensitive information' },
  { type: 'productivity', title: 'Productivity Boost',    description: 'Developers saved 1,842 hours this week!' },
];

const INSIGHT_STYLE: Record<string, { bg: string; el: React.ReactNode }> = {
  cost:         { bg: '#dcfce7', el: <DollarSign size={14} className="text-emerald-600" /> },
  model:        { bg: '#dbeafe', el: <Cpu        size={14} className="text-blue-600"    /> },
  prompt:       { bg: '#fef9c3', el: <MessageSquare size={14} className="text-yellow-600" /> },
  security:     { bg: '#fee2e2', el: <Shield     size={14} className="text-red-500"     /> },
  productivity: { bg: '#ede9fe', el: <Zap        size={14} className="text-violet-600"  /> },
};

const WASTE_STYLE: Record<string, { bg: string; dot: string }> = {
  high:   { bg: '#fee2e2', dot: '#ef4444' },
  medium: { bg: '#fef9c3', dot: '#ca8a04' },
  low:    { bg: '#dbeafe', dot: '#2563eb' },
};

// ── component ───────────────────────────────────────────────────────────────

export default function Overview() {
  const [activePlatform, setActivePlatform] = useState('All Platforms');

  const { data: stats } = useQuery({ queryKey: ['stats'],         queryFn: fetchStats,         placeholderData: undefined });
  const { data: trend }  = useQuery({ queryKey: ['usage-trend'],  queryFn: fetchUsageTrend,    placeholderData: undefined });
  const { data: pCosts } = useQuery({ queryKey: ['platform-costs'], queryFn: fetchPlatformCosts, placeholderData: undefined });

  const trendData = (trend || TREND).map((r: { date: string; requests: number; tokens: number; developers: number }) => ({
    ...r,
    date: fmtDate(r.date),
    requests: Math.round(r.requests / 1000),
  }));

  const costData  = pCosts || PCOSTS;
  const s         = stats  || { totalRequests: 2450000, totalTokens: 1240000000, totalCost: 186245, activeDevelopers: 342, timeSaved: 1842, aiRoi: 276300, changes: { totalRequests: 18.6, totalTokens: 24.7, totalCost: 21.4, activeDevelopers: 12.8, timeSaved: 30.5, aiRoi: 28.3 } };

  return (
    <div className="animate-fade-in">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 pt-4 pb-0">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-[17px] font-bold text-gray-900 flex items-center gap-2">
              AI Command Center <span>🚀</span>
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Unified overview of all AI platform usage, cost, prompts, and developer productivity.
            </p>
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
              {p === 'All Platforms' && <ChevronRight size={10} className="rotate-90 opacity-60" />}
            </button>
          ))}
          <button className="platform-pill platform-pill-inactive ml-auto">
            All Teams <ChevronRight size={10} className="rotate-90 opacity-60" />
          </button>
          <div className="w-px h-4 bg-gray-200" />
          <button className="platform-pill platform-pill-inactive gap-1">
            <Filter size={10} /> Filters
          </button>
          <button className="platform-pill platform-pill-inactive gap-1">
            <Sliders size={10} /> Customize
          </button>
        </div>
      </div>

      <div className="p-5 space-y-4">

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-6 gap-3">
          <StatCard icon={<Activity size={13}   />} label="Total Requests"    value={fmt(s.totalRequests)}                              change={s.changes.totalRequests}    sub="vs May 5 – May 11" />
          <StatCard icon={<Cpu size={13}        />} label="Total Tokens"      value={fmt(s.totalTokens)}                                change={s.changes.totalTokens}      sub="vs May 5 – May 11" />
          <StatCard icon={<DollarSign size={13} />} label="Total Cost"        value={`$${s.totalCost.toLocaleString()}`}                change={s.changes.totalCost}        sub="vs May 5 – May 11" />
          <StatCard icon={<Users size={13}      />} label="Active Developers" value={s.activeDevelopers.toString()}                     change={s.changes.activeDevelopers} sub="vs May 5 – May 11" />
          <StatCard icon={<Clock size={13}      />} label="Time Saved (Est.)" value={`${s.timeSaved.toLocaleString()} hrs`}             change={s.changes.timeSaved}        sub="vs May 5 – May 11" />
          <StatCard icon={<TrendingUp size={13} />} label="AI ROI (Est.)"     value={`$${s.aiRoi.toLocaleString()}`}                   change={s.changes.aiRoi}            sub="vs May 5 – May 11" />
        </div>

        {/* ── Row 2 ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Usage Trend */}
          <div className="col-span-4 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Usage Trend</span>
              <select className="text-xs border border-gray-200 rounded px-2 py-1 text-gray-600 outline-none">
                <option>Daily</option><option>Weekly</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={175}>
              <LineChart data={trendData} margin={{ top: 0, right: 4, left: -28, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} tickFormatter={v => `${v}K`} />
                <Tooltip
                  contentStyle={{ fontSize: 11, borderRadius: 6, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px rgba(0,0,0,.08)' }}
                  formatter={(v: number, name: string) => [name === 'requests' ? `${v}K` : v, name]}
                />
                <Legend iconSize={7} wrapperStyle={{ fontSize: 10, paddingTop: 6 }} />
                <Line type="monotone" dataKey="requests"   stroke="#0078d4" strokeWidth={2} dot={{ r: 2.5 }} name="Requests"   />
                <Line type="monotone" dataKey="tokens"     stroke="#00b4d8" strokeWidth={2} dot={{ r: 2.5 }} name="Tokens"     />
                <Line type="monotone" dataKey="developers" stroke="#7c3aed" strokeWidth={2} dot={{ r: 2.5 }} name="Developers" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Cost by Platform */}
          <div className="col-span-3 section-card p-4">
            <span className="text-sm font-semibold text-gray-800">Cost by Platform</span>
            <div className="flex items-center gap-3 mt-2">
              <div className="relative flex-shrink-0">
                <PieChart width={120} height={120}>
                  <Pie data={costData.items} cx={57} cy={57} innerRadius={35} outerRadius={56} dataKey="cost" paddingAngle={2}>
                    {costData.items.map((e: { color: string }, i: number) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-xs font-bold text-gray-800">${Math.round(costData.total / 1000)}K</span>
                  <span className="text-[9px] text-gray-400">Total</span>
                </div>
              </div>
              <div className="flex-1 space-y-1.5 min-w-0">
                {costData.items.map((item: { name: string; cost: number; pct: number; color: string }, i: number) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <span className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5" style={{ background: item.color }} />
                    <div className="min-w-0">
                      <div className="text-[10px] text-gray-700 truncate font-medium">{item.name}</div>
                      <div className="text-[9px] text-gray-400">${item.cost.toLocaleString()} ({item.pct}%)</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Models */}
          <div className="col-span-2 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Top Models by Cost</span>
              <button className="text-[10px] text-blue-500 hover:underline">View all</button>
            </div>
            <div className="flex justify-between text-[9px] text-gray-400 uppercase tracking-wide mb-2">
              <span>Model</span><span>Cost</span>
            </div>
            <div className="space-y-2.5">
              {MODELS.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-700 font-medium truncate pr-1">{m.model_name}</span>
                    <span className="text-gray-900 font-bold flex-shrink-0">${(m.cost / 1000).toFixed(1)}K</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${m.pct * 2.5}%`, background: '#0078d4' }} />
                    </div>
                    <span className="text-[9px] text-gray-400 w-7 text-right">{m.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live Activity */}
          <div className="col-span-3 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">
                Live Activity <span className="text-[10px] text-gray-400 font-normal">(Last 1h)</span>
              </span>
              <button className="text-[10px] text-blue-500 hover:underline">View all</button>
            </div>
            <div className="space-y-2.5">
              {ACTIVITY.items.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Avatar initials={item.avatar} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-gray-800">{item.developer}</div>
                    <div className="text-[10px] text-gray-400 truncate">{item.action}</div>
                  </div>
                  <span className="text-[10px] text-gray-400 flex-shrink-0">{item.time}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-2 border-t border-gray-50 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-gray-500">{ACTIVITY.activeSessions} active sessions</span>
            </div>
          </div>
        </div>

        {/* ── Row 3 ────────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-12 gap-4">

          {/* Top Prompts */}
          <div className="col-span-3 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Top Prompts</span>
              <button className="text-[10px] text-blue-500 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-3 text-[9px] text-gray-400 uppercase tracking-wide mb-1.5 px-1">
              <span>Prompt</span><span className="text-right">Uses</span><span className="text-right">Success</span>
            </div>
            {PROMPTS.map((p, i) => (
              <div key={i} className="grid grid-cols-3 items-center hover:bg-gray-50 rounded px-1 py-1.5 -mx-1 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-700 truncate pr-2">{p.prompt}</span>
                <span className="text-[10px] text-gray-500 text-right">{p.uses.toLocaleString()}</span>
                <span className="text-[10px] text-emerald-600 font-semibold text-right">{p.successRate}%</span>
              </div>
            ))}
            <div className="mt-2 text-[9px] text-gray-400">Showing top 5 of 1,234 prompts</div>
          </div>

          {/* Developer AI Score */}
          <div className="col-span-3 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Developer AI Score</span>
              <button className="text-[10px] text-blue-500 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-3 text-[9px] text-gray-400 uppercase tracking-wide mb-1.5 px-1">
              <span>Developer</span><span className="text-center">Score</span><span className="text-right">Trend</span>
            </div>
            {DEV_SCORES.map((d, i) => (
              <div key={i} className="grid grid-cols-3 items-center hover:bg-gray-50 rounded px-1 py-1.5 -mx-1 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Avatar initials={d.avatar} />
                  <span className="text-xs text-gray-700 truncate">{d.developer.split(' ')[0]}</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <div className="w-8 h-1 bg-emerald-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${d.score}%` }} />
                  </div>
                  <span className="text-xs font-bold text-gray-800">{d.score}</span>
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold text-right flex items-center justify-end gap-0.5">
                  <TrendingUp size={9} /> +{d.trend}
                </div>
              </div>
            ))}
            <div className="mt-2 text-[9px] text-gray-400">Based on usage, efficiency, and productivity</div>
          </div>

          {/* Cost by Team */}
          <div className="col-span-3 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">Cost by Team</span>
              <button className="text-[10px] text-blue-500 hover:underline">View all</button>
            </div>
            <div className="grid grid-cols-3 text-[9px] text-gray-400 uppercase tracking-wide mb-1.5 px-1">
              <span>Team</span><span className="text-right">Cost</span><span className="text-right">Change</span>
            </div>
            {TEAM_COSTS.map((t, i) => (
              <div key={i} className="grid grid-cols-3 items-center hover:bg-gray-50 rounded px-1 py-1.5 -mx-1 cursor-pointer transition-colors border-b border-gray-50 last:border-0">
                <span className="text-xs text-gray-700 truncate pr-2">{t.team}</span>
                <span className="text-[10px] font-bold text-gray-800 text-right">${t.cost.toLocaleString()}</span>
                <div className="text-[10px] text-emerald-600 font-semibold text-right flex items-center justify-end gap-0.5">
                  <TrendingUp size={9} /> +{t.change}%
                </div>
              </div>
            ))}
            <div className="mt-2 text-[9px] text-gray-400">Showing top 5 of 12 teams</div>
          </div>

          {/* AI Waste Detector */}
          <div className="col-span-3 section-card p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold text-gray-800">AI Waste Detector</span>
              <button className="text-[10px] text-blue-500 hover:underline">View all</button>
            </div>
            <div className="space-y-2">
              {WASTE.map((w, i) => {
                const { bg, dot } = WASTE_STYLE[w.severity];
                return (
                  <div key={i} className="flex items-center gap-2.5 hover:bg-gray-50 rounded px-1 py-1.5 -mx-1 cursor-pointer transition-colors">
                    <div className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center" style={{ background: bg }}>
                      <span className="w-2 h-2 rounded-full" style={{ background: dot }} />
                    </div>
                    <span className="text-xs text-gray-700 flex-1 leading-snug">{w.description}</span>
                    <span className="text-sm font-bold text-gray-900">{w.count}</span>
                  </div>
                );
              })}
            </div>
            <button className="mt-3 w-full text-[10px] text-blue-500 hover:underline flex items-center justify-center gap-0.5 font-medium">
              View All Recommendations <ChevronRight size={11} />
            </button>
          </div>
        </div>

        {/* ── Insights ─────────────────────────────────────────────────────── */}
        <div className="section-card p-4">
          <span className="text-sm font-semibold text-gray-800">Insights &amp; Recommendations</span>
          <div className="grid grid-cols-5 gap-3 mt-3">
            {INSIGHTS.map((ins, i) => {
              const { bg, el } = INSIGHT_STYLE[ins.type] || INSIGHT_STYLE.cost;
              return (
                <div key={i} className="flex flex-col gap-2 p-3 border border-gray-100 rounded-lg hover:border-gray-200 hover:shadow-sm transition-all cursor-pointer">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
                    {el}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800 mb-1">{ins.title}</div>
                    <div className="text-[10px] text-gray-500 leading-relaxed">{ins.description}</div>
                  </div>
                  <button className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5 font-medium mt-auto">
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
