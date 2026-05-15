import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { DollarSign, TrendingUp, AlertTriangle, Target, ArrowUpRight, Download } from 'lucide-react';
import { fetchDailyUsage, fetchPlatformUsage, fetchTeamRanking } from '../api/analytics';
import { SectionCard, KpiCard, Badge, Select, LoadingOverlay, PageHeader, ProgressBar } from '../components/ui';

const SEVERITY_BADGE: Record<string, 'red' | 'yellow' | 'blue'> = { high: 'red', medium: 'yellow', low: 'blue' };

const COST_ALERTS = [
  { id: 1, severity: 'high', title: 'Platform Team exceeded budget', message: 'Platform Team is 24.6% over monthly AI budget of $60K', time: '2h ago' },
  { id: 2, severity: 'medium', title: 'Unusual spending spike', message: 'Claude API costs increased 38% in the last 24 hours', time: '5h ago' },
  { id: 3, severity: 'high', title: 'Token quota 90% reached', message: 'Backend Team has used 90% of monthly token quota', time: '8h ago' },
  { id: 4, severity: 'low', title: 'Model cost optimization available', message: 'Switching 30% of GPT-4o to Claude Haiku could save $12,430/month', time: '1d ago' },
];

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

const TEAM_BUDGETS = [
  { team: 'Platform Team', budget: 60000, actual: 74561, change: 24.6 },
  { team: 'Backend Team', budget: 50000, actual: 42876, change: 18.7 },
  { team: 'Frontend Team', budget: 35000, actual: 28945, change: 20.1 },
  { team: 'DevOps Team', budget: 30000, actual: 26134, change: 15.3 },
  { team: 'QA Automation', budget: 22000, actual: 18055, change: 19.8 },
];

export default function CostCenter() {
  const [period, setPeriod] = useState('7d');
  const [view, setView] = useState('stacked');

  const dailyUsage = useQuery({ queryKey: ['daily-usage'], queryFn: fetchDailyUsage });
  const platformUsage = useQuery({ queryKey: ['platform-usage'], queryFn: fetchPlatformUsage });
  const teamRanking = useQuery({ queryKey: ['team-ranking'], queryFn: fetchTeamRanking });

  const totalCost = (platformUsage.data || []).reduce((s: number, p: any) => s + p.cost, 0);
  const avgDailyCost = dailyUsage.data?.length ? totalCost / dailyUsage.data.length : 0;
  const projMonthly = avgDailyCost * 30;

  const stackedData = (dailyUsage.data || []).map((d: any) => {
    const row: any = { date: d.date.slice(5), total: d.cost };
    (platformUsage.data || []).forEach((p: any) => {
      row[p.name] = Math.round(d.cost * (p.costPct / 100));
    });
    return row;
  });

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Cost Center"
        subtitle="AI spend tracking, budget alerts & cost optimization"
        actions={
          <>
            <Select value={period} onChange={setPeriod} options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
            ]} />
            <button className="btn-primary">
              <Download size={13} /> Export
            </button>
          </>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Spend" value={fmt(totalCost)} change={21.4} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Avg Daily Cost" value={fmt(Math.round(avgDailyCost))} change={18.6} icon={<TrendingUp size={17} />} iconBg="#eff6ff" iconColor="#0078d4" />
          <KpiCard label="Projected Monthly" value={fmt(Math.round(projMonthly))} icon={<Target size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard
            label="Active Alerts"
            value={String(COST_ALERTS.filter(a => a.severity === 'high').length)}
            icon={<AlertTriangle size={17} />}
            iconBg="#fef2f2"
            iconColor="#dc2626"
            sub="budget breaches"
          />
        </div>

        {/* Main chart + platform breakdown */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard
            title="Daily Cost Trend"
            className="xl:col-span-2"
            action={
              <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: '#e5eaf0' }}>
                {[{ id: 'stacked', label: 'By Platform' }, { id: 'total', label: 'Total' }].map(v => (
                  <button
                    key={v.id}
                    onClick={() => setView(v.id)}
                    className="px-3 py-1 text-xs font-semibold transition-colors"
                    style={view === v.id
                      ? { background: '#0078d4', color: 'white' }
                      : { color: '#8ba3be', background: 'white' }
                    }
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            }
          >
            {dailyUsage.isLoading || platformUsage.isLoading
              ? <div className="p-5"><div className="animate-pulse rounded-xl h-52" style={{ background: '#edf1f5' }} /></div>
              : (
                <div className="p-4 pt-3">
                  <ResponsiveContainer width="100%" height={210}>
                    {view === 'stacked' ? (
                      <AreaChart data={stackedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          {(platformUsage.data || []).map((p: any, i: number) => (
                            <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={p.color} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={p.color} stopOpacity={0.05} />
                            </linearGradient>
                          ))}
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
                        />
                        {(platformUsage.data || []).map((p: any, i: number) => (
                          <Area key={p.name} type="monotone" dataKey={p.name} stackId="1" stroke={p.color} fill={`url(#grad${i})`} strokeWidth={1.5} />
                        ))}
                      </AreaChart>
                    ) : (
                      <AreaChart data={stackedData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#0078d4" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                        <Tooltip
                          contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                          formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total Cost']}
                        />
                        <Area type="monotone" dataKey="total" stroke="#0078d4" fill="url(#gTotal)" strokeWidth={2.5} dot={{ r: 3.5, fill: '#0078d4', stroke: 'white', strokeWidth: 2 }} />
                      </AreaChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )
            }
          </SectionCard>

          <SectionCard title="Platform Cost Share">
            {platformUsage.isLoading ? <LoadingOverlay /> : (
              <div className="p-4 space-y-3">
                {(platformUsage.data || []).map((p: any) => (
                  <div
                    key={p.name}
                    className="p-3 rounded-xl border transition-all duration-150 cursor-default"
                    style={{ borderColor: '#f0f4f8', background: '#fafbfc' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.background = '#f7fafd'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f4f8'; e.currentTarget.style.background = '#fafbfc'; }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs font-semibold" style={{ color: '#0d1f30' }}>{p.name}</span>
                      </div>
                      <span className="text-xs font-bold" style={{ color: '#0d1f30' }}>${p.cost.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#edf1f5' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${p.costPct}%`, background: p.color }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-xs" style={{ color: '#8ba3be' }}>{p.costPct}% of total</span>
                      <div className="flex items-center gap-0.5" style={{ color: '#dc2626' }}>
                        <ArrowUpRight size={10} />
                        <span className="text-xs font-semibold">18.6%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Team chart + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard title="Team Cost Breakdown">
            {teamRanking.isLoading ? <LoadingOverlay /> : (
              <div className="p-4 pt-3">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={(teamRanking.data || []).map((t: any) => ({
                      name: t.team.replace(' Team', '').replace(' Automation', ''),
                      cost: t.cost,
                    }))}
                    margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']}
                    />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                      {(teamRanking.data || []).map((_: any, i: number) => (
                        <Cell key={i} fill={['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Budget Alerts" action={
            <span
              className="text-xs font-bold px-2 py-0.5 rounded-lg"
              style={{ background: '#fef2f2', color: '#dc2626' }}
            >
              {COST_ALERTS.length} alerts
            </span>
          }>
            <div className="divide-y" style={{ borderColor: '#f0f4f8' }}>
              {COST_ALERTS.map(alert => (
                <div
                  key={alert.id}
                  className="flex items-start gap-3 px-5 py-3.5 transition-colors cursor-default"
                  onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: alert.severity === 'high' ? '#fef2f2' : alert.severity === 'medium' ? '#fffbeb' : '#eff6ff',
                    }}
                  >
                    <AlertTriangle
                      size={14}
                      style={{ color: alert.severity === 'high' ? '#dc2626' : alert.severity === 'medium' ? '#d97706' : '#0078d4' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold" style={{ color: '#0d1f30' }}>{alert.title}</p>
                      <Badge variant={SEVERITY_BADGE[alert.severity]}>{alert.severity}</Badge>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: '#4a6480' }}>{alert.message}</p>
                  </div>
                  <span className="text-xs flex-shrink-0" style={{ color: '#8ba3be' }}>{alert.time}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Budget vs Actual table */}
        <SectionCard title="Budget vs Actual by Team">
          {teamRanking.isLoading ? <LoadingOverlay /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                    <th className="table-header-cell">Team</th>
                    <th className="table-header-cell text-right">Budget</th>
                    <th className="table-header-cell text-right">Actual</th>
                    <th className="table-header-cell text-right">Variance</th>
                    <th className="table-header-cell min-w-[160px]">Utilization</th>
                    <th className="table-header-cell text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {TEAM_BUDGETS.map((row, i) => {
                    const util = Math.round((row.actual / row.budget) * 100);
                    const variance = row.actual - row.budget;
                    const teamColors = ['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b'];
                    return (
                      <tr
                        key={row.team}
                        className="border-b transition-colors"
                        style={{ borderColor: '#f0f4f8' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <div
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                              style={{ background: teamColors[i], fontSize: '11px' }}
                            >
                              {row.team.charAt(0)}
                            </div>
                            <span className="font-medium" style={{ color: '#0d1f30' }}>{row.team}</span>
                          </div>
                        </td>
                        <td className="table-cell text-right" style={{ color: '#8ba3be' }}>${row.budget.toLocaleString()}</td>
                        <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>${row.actual.toLocaleString()}</td>
                        <td className="table-cell text-right">
                          <span
                            className="text-xs font-bold"
                            style={{ color: variance > 0 ? '#dc2626' : '#059669' }}
                          >
                            {variance > 0 ? '+' : ''}{variance.toLocaleString()}
                          </span>
                        </td>
                        <td className="table-cell">
                          <div className="flex items-center gap-2.5">
                            <ProgressBar
                              value={Math.min(util, 100)}
                              max={100}
                              color={util > 100 ? '#dc2626' : util > 85 ? '#d97706' : '#10b981'}
                              className="flex-1"
                            />
                            <span
                              className="text-xs font-semibold w-10 text-right"
                              style={{ color: util > 100 ? '#dc2626' : util > 85 ? '#d97706' : '#059669' }}
                            >
                              {util}%
                            </span>
                          </div>
                        </td>
                        <td className="table-cell text-center">
                          <Badge variant={util > 100 ? 'red' : util > 85 ? 'yellow' : 'green'}>
                            {util > 100 ? 'Over Budget' : util > 85 ? 'Warning' : 'On Track'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
