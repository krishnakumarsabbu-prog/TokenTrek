import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Activity, TrendingUp, DollarSign, Users, Clock, Zap, AlertTriangle, ArrowUpRight, ArrowDownRight, Cpu, ChevronRight, BarChart2 } from 'lucide-react';
import {
  fetchStats, fetchUsageTrend, fetchPlatformCosts,
  fetchModelCosts, fetchTopPrompts, fetchDeveloperScores,
  fetchTeamCosts, fetchLiveActivity, fetchWasteItems, fetchInsights,
} from '../api/overview';
import {
  KpiCard, SectionCard, Avatar, ProgressBar, Badge, CardSkeleton, ChartSkeleton, Trend, PageHeader,
} from '../components/ui';

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

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 1) return 'just now';
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  return `${Math.floor(diff / 60)}h ago`;
}

const SEVERITY_COLOR: Record<string, 'red' | 'yellow' | 'blue'> = { high: 'red', medium: 'yellow', low: 'blue' };

const INSIGHT_COLORS: Record<string, { bg: string; color: string; iconBg: string }> = {
  cost:         { bg: '#fffbeb', color: '#d97706', iconBg: '#fef3c7' },
  model:        { bg: '#eff6ff', color: '#2563eb', iconBg: '#dbeafe' },
  prompt:       { bg: '#f0fdf4', color: '#16a34a', iconBg: '#dcfce7' },
  security:     { bg: '#fff7ed', color: '#ea580c', iconBg: '#ffedd5' },
  productivity: { bg: '#f0fdf4', color: '#059669', iconBg: '#d1fae5' },
};

function ActivitySkeleton() {
  return (
    <div className="space-y-0">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex items-center gap-3 px-4 py-3.5 border-b animate-pulse" style={{ borderColor: '#f0f4f8' }}>
          <div className="w-8 h-8 rounded-full flex-shrink-0" style={{ background: '#edf1f5' }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 rounded-md w-3/4" style={{ background: '#edf1f5' }} />
            <div className="h-2.5 rounded-md w-1/2" style={{ background: '#edf1f5' }} />
          </div>
          <div className="h-3 rounded-md w-10" style={{ background: '#edf1f5' }} />
        </div>
      ))}
    </div>
  );
}

const PLATFORM_EVENT_COLORS: Record<string, string> = {
  'GitHub Copilot': '#0078d4',
  'Cursor': '#10b981',
  'Claude': '#e07b39',
  'Devin': '#8b5cf6',
  'Custom Tools': '#f59e0b',
};

export default function Overview() {
  const stats = useQuery({ queryKey: ['stats'], queryFn: fetchStats });
  const trend = useQuery({ queryKey: ['usage-trend'], queryFn: fetchUsageTrend });
  const platformCosts = useQuery({ queryKey: ['platform-costs'], queryFn: fetchPlatformCosts });
  const modelCosts = useQuery({ queryKey: ['model-costs'], queryFn: fetchModelCosts });
  const topPrompts = useQuery({ queryKey: ['top-prompts'], queryFn: fetchTopPrompts });
  const devScores = useQuery({ queryKey: ['dev-scores'], queryFn: fetchDeveloperScores });
  const teamCosts = useQuery({ queryKey: ['team-costs'], queryFn: fetchTeamCosts });
  const liveActivity = useQuery({ queryKey: ['live-activity'], queryFn: fetchLiveActivity, refetchInterval: 20000 });
  const wasteItems = useQuery({ queryKey: ['waste-items'], queryFn: fetchWasteItems });
  const insights = useQuery({ queryKey: ['insights'], queryFn: fetchInsights });

  const s = stats.data;

  return (
    <div className="flex h-full min-h-0" style={{ background: '#f0f4f8' }}>
      {/* Main scrollable content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PageHeader
          title="AI Usage Dashboard"
          subtitle="May 12 – May 18, 2026  ·  All platforms"
          actions={
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-semibold"
                style={{ background: '#ecfdf5', borderColor: '#a7f3d0', color: '#059669' }}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
                Live
              </div>
              <span className="text-xs font-medium" style={{ color: '#8ba3be' }}>
                {liveActivity.data?.activeSessions || 124} active sessions
              </span>
            </div>
          }
        />

        <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.isLoading
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : (
                <>
                  <KpiCard label="Total Requests" value={fmt(s?.totalRequests || 0)} change={s?.changes?.totalRequests} icon={<Activity size={17} />} iconBg="#eff6ff" iconColor="#0078d4" />
                  <KpiCard label="Tokens Used" value={fmt(s?.totalTokens || 0)} change={s?.changes?.totalTokens} icon={<Zap size={17} />} iconBg="#fffbeb" iconColor="#d97706" />
                  <KpiCard label="Total Cost" value={fmtCost(s?.totalCost || 0)} change={s?.changes?.totalCost} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
                  <KpiCard label="Active Developers" value={fmt(s?.activeDevelopers || 0)} change={s?.changes?.activeDevelopers} icon={<Users size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" />
                  <KpiCard label="Hours Saved" value={`${fmt(s?.timeSaved || 0)}h`} change={s?.changes?.timeSaved} icon={<Clock size={17} />} iconBg="#f5f3ff" iconColor="#7c3aed" />
                  <KpiCard label="AI ROI" value={fmtCost(s?.aiRoi || 0)} change={s?.changes?.aiRoi} icon={<TrendingUp size={17} />} iconBg="#ecfdf5" iconColor="#059669" />
                </>
              )
            }
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SectionCard title="Usage Trend — Last 7 Days" className="xl:col-span-2"
              action={
                <div className="flex items-center gap-3 text-xs" style={{ color: '#8ba3be' }}>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 inline-block rounded" style={{ background: '#0078d4' }} /> Requests
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-0.5 inline-block rounded" style={{ background: '#10b981' }} /> Tokens (K)
                  </span>
                </div>
              }
            >
              {trend.isLoading ? <div className="p-5"><ChartSkeleton height={200} /></div> : (
                <div className="p-4 pt-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trend.data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gReq" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0078d4" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gTok" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: string) => v.slice(5)} />
                      <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', boxShadow: '0 4px 16px rgba(0,30,60,0.1)', fontSize: 12 }}
                        labelStyle={{ fontWeight: 600, color: '#0d1f30' }}
                        formatter={(v: number, n: string) => [fmt(v), n === 'requests' ? 'Requests' : 'Tokens (K)']}
                      />
                      <Area type="monotone" dataKey="requests" stroke="#0078d4" strokeWidth={2.5} fill="url(#gReq)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }} />
                      <Area type="monotone" dataKey="tokens" stroke="#10b981" strokeWidth={2.5} fill="url(#gTok)" dot={false} activeDot={{ r: 4, strokeWidth: 2, stroke: 'white' }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Cost by Platform">
              {platformCosts.isLoading ? <div className="p-5"><ChartSkeleton height={200} /></div> : (
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie
                        data={platformCosts.data?.items}
                        dataKey="cost"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={65}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {(platformCosts.data?.items || []).map((entry: any, i: number) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']}
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {(platformCosts.data?.items || []).map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                          <span className="font-medium truncate max-w-[100px]" style={{ color: '#4a6480' }}>{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span style={{ color: '#8ba3be' }}>{item.pct}%</span>
                          <span className="font-bold" style={{ color: '#0d1f30' }}>${item.cost.toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </SectionCard>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <SectionCard title="Top Models by Cost">
              {modelCosts.isLoading ? <div className="p-5"><ChartSkeleton /></div> : (
                <div className="p-4 pt-3">
                  <ResponsiveContainer width="100%" height={170}>
                    <BarChart data={modelCosts.data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <YAxis dataKey="model_name" type="category" tick={{ fontSize: 10, fill: '#4a6480' }} tickLine={false} axisLine={false} width={110} />
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']}
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      />
                      <Bar dataKey="cost" radius={[0, 4, 4, 0]}>
                        {(modelCosts.data || []).map((_: any, i: number) => (
                          <Cell key={i} fill={['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b'][i % 5]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </SectionCard>

            <SectionCard title="Developer AI Scores">
              {devScores.isLoading ? (
                <div className="p-4 space-y-3">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full" style={{ background: '#edf1f5' }} />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3 rounded w-3/4" style={{ background: '#edf1f5' }} />
                        <div className="h-2 rounded w-full" style={{ background: '#edf1f5' }} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 space-y-3.5">
                  {(devScores.data || []).map((d: any, i: number) => (
                    <div key={i} className="flex items-center gap-3">
                      <Avatar initials={d.avatar} size={30} index={i} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-semibold truncate" style={{ color: '#0d1f30' }}>{d.developer}</span>
                          <div className="flex items-center gap-0.5">
                            <span className="text-xs font-bold" style={{ color: '#0d1f30' }}>{d.score}</span>
                            {d.trend > 0
                              ? <ArrowUpRight size={10} style={{ color: '#059669' }} />
                              : <ArrowDownRight size={10} style={{ color: '#dc2626' }} />
                            }
                          </div>
                        </div>
                        <ProgressBar
                          value={d.score}
                          max={100}
                          color={d.score >= 90 ? '#059669' : d.score >= 80 ? '#0078d4' : '#d97706'}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Cost by Team">
              {teamCosts.isLoading ? (
                <div className="divide-y" style={{ borderColor: '#f0f4f8' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="flex items-center justify-between px-5 py-3 animate-pulse">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg" style={{ background: '#edf1f5' }} />
                        <div className="h-3 w-24 rounded" style={{ background: '#edf1f5' }} />
                      </div>
                      <div className="h-4 w-16 rounded" style={{ background: '#edf1f5' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f0f4f8' }}>
                  {(teamCosts.data || []).map((t: any, i: number) => {
                    const colors = ['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b'];
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between px-5 py-3 transition-colors cursor-default"
                        onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: colors[i % colors.length], fontSize: '11px' }}
                          >
                            {t.team.charAt(0)}
                          </div>
                          <span className="text-sm font-medium" style={{ color: '#0d1f30' }}>{t.team}</span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold" style={{ color: '#0d1f30' }}>${t.cost.toLocaleString()}</p>
                          <Trend value={t.change} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </SectionCard>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <SectionCard title="Top Prompts by Usage" action={
              <button className="text-xs font-medium flex items-center gap-1" style={{ color: '#0078d4' }}>
                View all <ChevronRight size={12} />
              </button>
            }>
              {topPrompts.isLoading ? (
                <div className="divide-y" style={{ borderColor: '#f0f4f8' }}>
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="px-5 py-3 animate-pulse">
                      <div className="h-3 rounded w-4/5 mb-1.5" style={{ background: '#edf1f5' }} />
                      <div className="h-2.5 rounded w-2/5" style={{ background: '#edf1f5' }} />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: '#f0f4f8' }}>
                  {(topPrompts.data || []).map((p: any, i: number) => (
                    <div
                      key={i}
                      className="px-5 py-3 transition-colors cursor-default"
                      onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 flex-1 min-w-0">
                          <span
                            className="w-5 h-5 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5"
                            style={{ background: '#eff6ff', color: '#0078d4' }}
                          >
                            {i + 1}
                          </span>
                          <span className="text-sm truncate" style={{ color: '#0d1f30' }}>{p.prompt}</span>
                        </div>
                        <span className="text-xs font-bold flex-shrink-0" style={{ color: '#4a6480' }}>
                          {p.uses.toLocaleString()} uses
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 pl-7">
                        <span className="text-xs font-semibold" style={{ color: '#059669' }}>{p.successRate}% success</span>
                        <span className="text-xs" style={{ color: '#8ba3be' }}>{p.avgTokens.toLocaleString()} tokens avg</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            <div className="flex flex-col gap-4">
              <SectionCard title="AI Waste Detected" action={
                <Badge variant="red">{wasteItems.data?.length || 0} issues</Badge>
              }>
                {wasteItems.isLoading ? (
                  <div className="p-4 space-y-2 animate-pulse">
                    {[1,2,3].map(i => <div key={i} className="h-8 rounded-lg" style={{ background: '#edf1f5' }} />)}
                  </div>
                ) : (
                  <div className="divide-y" style={{ borderColor: '#f0f4f8' }}>
                    {(wasteItems.data || []).map((w: any, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between px-5 py-2.5 transition-colors cursor-default"
                        onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <div className="flex-1 min-w-0 mr-3">
                          <p className="text-xs font-semibold truncate" style={{ color: '#0d1f30' }}>{w.description}</p>
                          <p className="text-xs capitalize" style={{ color: '#8ba3be' }}>{w.category}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-bold" style={{ color: '#4a6480' }}>{w.count}</span>
                          <Badge variant={SEVERITY_COLOR[w.severity]}>{w.severity}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="AI Insights" action={
                <button className="text-xs font-medium flex items-center gap-1" style={{ color: '#0078d4' }}>
                  View all <ChevronRight size={12} />
                </button>
              }>
                {insights.isLoading ? (
                  <div className="p-3 space-y-2 animate-pulse">
                    {[1,2].map(i => <div key={i} className="h-14 rounded-xl" style={{ background: '#edf1f5' }} />)}
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {(insights.data || []).slice(0, 3).map((ins: any, i: number) => {
                      const c = INSIGHT_COLORS[ins.type] || { bg: '#f8fafc', color: '#475569', iconBg: '#f0f4f8' };
                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2.5 p-3 rounded-xl cursor-default transition-all duration-150"
                          style={{ background: c.bg }}
                          onMouseEnter={e => (e.currentTarget.style.filter = 'brightness(0.97)')}
                          onMouseLeave={e => (e.currentTarget.style.filter = 'none')}
                        >
                          <div
                            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                            style={{ background: c.iconBg }}
                          >
                            <BarChart2 size={13} style={{ color: c.color }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold" style={{ color: c.color }}>{ins.title}</p>
                            <p className="text-xs leading-relaxed mt-0.5" style={{ color: '#4a6480' }}>{ins.description}</p>
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

      {/* Right Live Activity Panel */}
      <div
        className="flex-shrink-0 flex flex-col border-l"
        style={{ width: 280, borderColor: '#e5eaf0', background: 'white' }}
      >
        {/* Panel Header */}
        <div className="px-4 py-3.5 border-b flex-shrink-0" style={{ borderColor: '#f0f4f8' }}>
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-sm font-semibold" style={{ color: '#0d1f30' }}>Live Activity</span>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-xs font-semibold" style={{ color: '#10b981' }}>Live</span>
            </div>
          </div>
          <p className="text-xs" style={{ color: '#8ba3be' }}>
            {liveActivity.data?.activeSessions || 124} active sessions
          </p>
        </div>

        {/* Activity Feed */}
        <div className="flex-1 overflow-y-auto">
          {liveActivity.isLoading ? <ActivitySkeleton /> : (
            <div>
              {(liveActivity.data?.items || []).map((a: any, i: number) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3.5 border-b transition-colors cursor-default"
                  style={{ borderColor: '#f0f4f8' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar initials={a.avatar} size={30} index={i} />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white"
                      style={{ background: PLATFORM_EVENT_COLORS[a.platform] || '#10b981' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold truncate" style={{ color: '#0d1f30' }}>{a.developer}</p>
                    <p className="text-xs truncate mt-0.5" style={{ color: '#4a6480' }}>{a.action}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                        style={{
                          background: `${PLATFORM_EVENT_COLORS[a.platform] || '#10b981'}18`,
                          color: PLATFORM_EVENT_COLORS[a.platform] || '#10b981',
                        }}
                      >
                        {a.platform}
                      </span>
                      <span className="text-xs" style={{ color: '#b0c4d4' }}>{relTime(a.time)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel Summary */}
        <div className="flex-shrink-0 border-t p-4 space-y-3" style={{ borderColor: '#f0f4f8' }}>
          <p className="text-xs font-semibold" style={{ color: '#4a6480' }}>Today's Summary</p>
          {[
            { label: 'Completions', value: '14,832', color: '#0078d4' },
            { label: 'Avg Response', value: '1.4s', color: '#10b981' },
            { label: 'Error Rate', value: '0.3%', color: '#e07b39' },
          ].map(item => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-xs" style={{ color: '#8ba3be' }}>{item.label}</span>
              <span className="text-xs font-bold" style={{ color: item.color }}>{item.value}</span>
            </div>
          ))}

          <div className="pt-2 border-t" style={{ borderColor: '#f0f4f8' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#4a6480' }}>Platform Activity</p>
            {Object.entries(PLATFORM_EVENT_COLORS).map(([name, color]) => (
              <div key={name} className="flex items-center gap-2 mb-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: '#f0f4f8' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.random() * 60 + 20}%`,
                      background: color,
                      opacity: 0.8,
                    }}
                  />
                </div>
                <span className="text-xs w-16 truncate" style={{ color: '#8ba3be' }}>{name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
