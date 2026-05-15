import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Activity, TrendingUp, DollarSign, Users, Clock, Zap, TriangleAlert as AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import {
  fetchStats, fetchUsageTrend, fetchPlatformCosts,
  fetchModelCosts, fetchTopPrompts, fetchDeveloperScores,
  fetchTeamCosts, fetchLiveActivity, fetchWasteItems, fetchInsights
} from '../api/overview';
import { KpiCard, SectionCard, Avatar, ProgressBar, Badge, CardSkeleton, ChartSkeleton, Trend } from '../components/ui';

function fmt(n: number) {
  if (n >= 1e9) return `${(n / 1e9).toFixed(1)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function fmtCost(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

const SEVERITY_COLOR: Record<string, string> = { high: 'red', medium: 'yellow', low: 'blue' };

const INSIGHT_ICONS: Record<string, React.ReactNode> = {
  cost: <DollarSign size={14} />, model: <Zap size={14} />, prompt: <Activity size={14} />,
  security: <AlertTriangle size={14} />, productivity: <TrendingUp size={14} />,
};
const INSIGHT_COLORS: Record<string, { bg: string; color: string }> = {
  cost: { bg: '#fef9c3', color: '#a16207' }, model: { bg: '#eff6ff', color: '#1d4ed8' },
  prompt: { bg: '#f0fdf4', color: '#166534' }, security: { bg: '#fff7ed', color: '#9a3412' },
  productivity: { bg: '#f0fdf4', color: '#166534' },
};

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

function TableSkel() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="flex gap-3 animate-pulse">
          <div className="w-8 h-8 bg-gray-100 rounded-full flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-gray-100 rounded w-3/4" />
            <div className="h-2.5 bg-gray-100 rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Overview() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const trend = useQuery({ queryKey: ['usage-trend'], queryFn: fetchUsageTrend });
  const platformCosts = useQuery({ queryKey: ['platform-costs'], queryFn: fetchPlatformCosts });
  const modelCosts = useQuery({ queryKey: ['model-costs'], queryFn: fetchModelCosts });
  const topPrompts = useQuery({ queryKey: ['top-prompts'], queryFn: fetchTopPrompts });
  const devScores = useQuery({ queryKey: ['dev-scores'], queryFn: fetchDeveloperScores });
  const teamCosts = useQuery({ queryKey: ['team-costs'], queryFn: fetchTeamCosts });
  const liveActivity = useQuery({ queryKey: ['live-activity'], queryFn: fetchLiveActivity, refetchInterval: 30000 });
  const wasteItems = useQuery({ queryKey: ['waste-items'], queryFn: fetchWasteItems });
  const insights = useQuery({ queryKey: ['insights'], queryFn: fetchInsights });

  const s = stats.data;

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Usage Overview</h1>
            <p className="text-xs text-gray-500 mt-0.5">May 12 – May 18, 2025 &nbsp;·&nbsp; All platforms</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs font-medium text-emerald-700">Live</span>
            </div>
            <span className="text-xs text-gray-400">{liveActivity.data?.activeSessions || 124} active sessions</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPI Row */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
          {stats.isLoading ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />) : (
            <>
              <KpiCard label="Total Requests" value={fmt(s?.totalRequests || 0)} change={s?.changes?.totalRequests} icon={<Activity size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
              <KpiCard label="Tokens Used" value={fmt(s?.totalTokens || 0)} change={s?.changes?.totalTokens} icon={<Zap size={18} />} iconBg="#fef9c3" iconColor="#d97706" />
              <KpiCard label="Total Cost" value={fmtCost(s?.totalCost || 0)} change={s?.changes?.totalCost} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
              <KpiCard label="Active Developers" value={fmt(s?.activeDevelopers || 0)} change={s?.changes?.activeDevelopers} icon={<Users size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
              <KpiCard label="Hours Saved" value={`${fmt(s?.timeSaved || 0)}h`} change={s?.changes?.timeSaved} icon={<Clock size={18} />} iconBg="#f5f3ff" iconColor="#7c3aed" />
              <KpiCard label="AI ROI" value={fmtCost(s?.aiRoi || 0)} change={s?.changes?.aiRoi} icon={<TrendingUp size={18} />} iconBg="#ecfdf5" iconColor="#059669" />
            </>
          )}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <SectionCard title="Usage Trend (7 Days)" className="xl:col-span-2">
            {trend.isLoading ? <div className="p-5"><ChartSkeleton height={220} /></div> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={trend.data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0078d4" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gTok" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00b4d8" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#00b4d8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.08)', fontSize: 12 }}
                      formatter={(v: number, n: string) => [fmt(v), n === 'requests' ? 'Requests' : n === 'tokens' ? 'Tokens (K)' : 'Devs']}
                      labelFormatter={(l: string) => `Date: ${l}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Area type="monotone" dataKey="requests" name="Requests" stroke="#0078d4" strokeWidth={2} fill="url(#gReq)" dot={false} />
                    <Area type="monotone" dataKey="tokens" name="Tokens (K)" stroke="#00b4d8" strokeWidth={2} fill="url(#gTok)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cost by Platform">
            {platformCosts.isLoading ? <div className="p-5"><ChartSkeleton height={220} /></div> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={platformCosts.data?.items} dataKey="cost" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={2}>
                      {(platformCosts.data?.items || []).map((entry: any, i: number) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {(platformCosts.data?.items || []).map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: item.color }} />
                        <span className="text-gray-600 truncate max-w-[90px]">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">{item.pct}%</span>
                        <span className="font-semibold text-gray-800">${item.cost.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-4">
          <SectionCard title="Top Models by Cost">
            {modelCosts.isLoading ? <div className="p-5"><ChartSkeleton /></div> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={modelCosts.data} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <YAxis dataKey="model_name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                      {(modelCosts.data || []).map((_: any, i: number) => (
                        <Cell key={i} fill={['#0078d4', '#00b4d8', '#e07b39', '#10b981', '#f59e0b'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Developer AI Scores">
            {devScores.isLoading ? <div className="p-4"><TableSkel /></div> : (
              <div className="p-4 space-y-3">
                {(devScores.data || []).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <Avatar initials={d.avatar} size={32} index={i} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-gray-800 truncate">{d.developer}</span>
                        <div className="flex items-center gap-0.5">
                          <span className="text-xs font-bold text-gray-900">{d.score}</span>
                          {d.trend > 0 ? <ArrowUpRight size={11} className="text-emerald-500" /> : <ArrowDownRight size={11} className="text-red-400" />}
                        </div>
                      </div>
                      <ProgressBar value={d.score} max={100} color={d.score >= 90 ? '#10b981' : d.score >= 80 ? '#0078d4' : '#f59e0b'} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cost by Team">
            {teamCosts.isLoading ? <div className="p-4"><TableSkel /></div> : (
              <div className="divide-y divide-gray-50">
                {(teamCosts.data || []).map((t: any, i: number) => (
                  <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: ['#0078d4', '#00b4d8', '#e07b39', '#10b981', '#f59e0b'][i % 5] }}>
                        {t.team.charAt(0)}
                      </div>
                      <span className="text-sm text-gray-700 font-medium">{t.team}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900">${t.cost.toLocaleString()}</p>
                      <Trend value={t.change} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="Top Prompts by Usage">
            {topPrompts.isLoading ? <div className="p-4"><TableSkel /></div> : (
              <div className="divide-y divide-gray-50">
                {(topPrompts.data || []).map((p: any, i: number) => (
                  <div key={i} className="px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">{i + 1}</span>
                        <span className="text-sm text-gray-700 truncate">{p.prompt}</span>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 flex-shrink-0">{p.uses.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 pl-7">
                      <span className="text-xs text-emerald-600 font-medium">{p.successRate}% success</span>
                      <span className="text-xs text-gray-400">{p.avgTokens.toLocaleString()} tokens avg</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Live Activity" action={
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-xs text-emerald-600 font-medium">Live</span>
            </div>
          }>
            {liveActivity.isLoading ? <div className="p-4"><TableSkel /></div> : (
              <div className="divide-y divide-gray-50">
                {(liveActivity.data?.items || []).map((a: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50/50 transition-colors">
                    <Avatar initials={a.avatar} size={30} index={i} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-800 truncate">{a.developer}</p>
                      <p className="text-xs text-gray-500 truncate">{a.action}</p>
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0">{relTime(a.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>

          <div className="flex flex-col gap-4">
            <SectionCard title="AI Waste Detected">
              {wasteItems.isLoading ? <div className="p-4"><TableSkel /></div> : (
                <div className="divide-y divide-gray-50">
                  {(wasteItems.data || []).map((w: any, i: number) => (
                    <div key={i} className="flex items-center justify-between px-5 py-2.5 hover:bg-gray-50/50 transition-colors">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="text-xs font-semibold text-gray-700 truncate">{w.description}</p>
                        <p className="text-xs text-gray-400 capitalize">{w.category}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs font-bold text-gray-700">{w.count}</span>
                        <Badge variant={SEVERITY_COLOR[w.severity] as any}>{w.severity}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="AI Insights">
              {insights.isLoading ? <div className="p-4"><TableSkel /></div> : (
                <div className="p-3 space-y-2">
                  {(insights.data || []).slice(0, 3).map((ins: any, i: number) => {
                    const c = INSIGHT_COLORS[ins.type] || { bg: '#f8fafc', color: '#475569' };
                    return (
                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg" style={{ background: c.bg }}>
                        <div className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0" style={{ color: c.color }}>
                          {INSIGHT_ICONS[ins.type]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold" style={{ color: c.color }}>{ins.title}</p>
                          <p className="text-xs text-gray-600 leading-relaxed">{ins.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>
        </div>
      </div>
    </div>
  );
}
