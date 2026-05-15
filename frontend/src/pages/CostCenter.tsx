import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell } from 'recharts';
import { DollarSign, TrendingUp, TriangleAlert as AlertTriangle, Target, ArrowUpRight } from 'lucide-react';
import { fetchDailyUsage, fetchPlatformUsage, fetchTeamRanking } from '../api/analytics';
import { SectionCard, KpiCard, Badge, Select, FilterBar, LoadingOverlay } from '../components/ui';

const PLATFORM_COLORS: Record<string, string> = {
  'GitHub Copilot': '#0078d4', 'Cursor': '#00b4d8', 'Claude': '#e07b39', 'Devin': '#8b5cf6', 'Custom Tools': '#10b981',
};

const COST_ALERTS = [
  { id: 1, severity: 'high', title: 'Platform Team exceeded budget', message: 'Platform Team is 24.6% over this month\'s AI budget of $60K', time: '2h ago' },
  { id: 2, severity: 'medium', title: 'Unusual spending spike', message: 'Claude API costs increased 38% in the last 24 hours', time: '5h ago' },
  { id: 3, severity: 'high', title: 'Token quota 90% reached', message: 'Backend Team has used 90% of monthly token quota', time: '8h ago' },
  { id: 4, severity: 'low', title: 'Model cost optimization available', message: 'Switching 30% of GPT-4o to Claude Haiku could save $12,430/month', time: '1d ago' },
];

const SEVERITY_BADGE: Record<string, 'red' | 'yellow' | 'blue'> = { high: 'red', medium: 'yellow', low: 'blue' };

function fmt(n: number) {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n}`;
}

export default function CostCenter() {
  const [period, setPeriod] = useState('7d');
  const [view, setView] = useState('stacked');

  const dailyUsage = useQuery({ queryKey: ['daily-usage'], queryFn: fetchDailyUsage });
  const platformUsage = useQuery({ queryKey: ['platform-usage'], queryFn: fetchPlatformUsage });
  const teamRanking = useQuery({ queryKey: ['team-ranking'], queryFn: fetchTeamRanking });

  const totalCost = (platformUsage.data || []).reduce((s: number, p: any) => s + p.cost, 0);
  const maxDailyCost = dailyUsage.data ? Math.max(...dailyUsage.data.map((d: any) => d.cost)) : 0;
  const avgDailyCost = dailyUsage.data?.length ? totalCost / dailyUsage.data.length : 0;
  const projMonthly = avgDailyCost * 30;

  // Build stacked daily cost by platform (approximated from platform pct × daily total)
  const stackedData = (dailyUsage.data || []).map((d: any) => {
    const row: any = { date: d.date.slice(5), total: d.cost };
    (platformUsage.data || []).forEach((p: any) => {
      row[p.name] = Math.round(d.cost * (p.costPct / 100));
    });
    return row;
  });

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Cost Center</h1>
            <p className="text-xs text-gray-500 mt-0.5">AI spend tracking, budget alerts & cost optimization</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onChange={setPeriod} options={[
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: '90d', label: 'Last 90 days' },
            ]} />
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
              <DollarSign size={13} /> Export
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Spend" value={fmt(totalCost)} change={21.4} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Avg Daily Cost" value={fmt(Math.round(avgDailyCost))} change={18.6} icon={<TrendingUp size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Projected Monthly" value={fmt(Math.round(projMonthly))} icon={<Target size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Active Alerts" value={String(COST_ALERTS.filter(a => a.severity === 'high').length)} icon={<AlertTriangle size={18} />} iconBg="#fff7ed" iconColor="#dc2626" sub="budget breaches" />
        </div>

        {/* Main chart */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <SectionCard title="Daily Cost Trend" className="xl:col-span-2" action={
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[{ id: 'stacked', label: 'By Platform' }, { id: 'total', label: 'Total' }].map(v => (
                <button key={v.id} onClick={() => setView(v.id)}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${view === v.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {v.label}
                </button>
              ))}
            </div>
          }>
            {dailyUsage.isLoading || platformUsage.isLoading ? <div className="p-5"><div className="animate-pulse bg-gray-100 rounded h-52" /></div> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  {view === 'stacked' ? (
                    <AreaChart data={stackedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        {(platformUsage.data || []).map((p: any, i: number) => (
                          <linearGradient key={i} id={`grad${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={p.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={p.color} stopOpacity={0.05} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, '']} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      {(platformUsage.data || []).map((p: any, i: number) => (
                        <Area key={p.name} type="monotone" dataKey={p.name} stackId="1" stroke={p.color} fill={`url(#grad${i})`} strokeWidth={1.5} />
                      ))}
                    </AreaChart>
                  ) : (
                    <AreaChart data={stackedData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gTotal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0078d4" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total Cost']} />
                      <Area type="monotone" dataKey="total" stroke="#0078d4" fill="url(#gTotal)" strokeWidth={2.5} dot={{ r: 4, fill: '#0078d4', stroke: 'white', strokeWidth: 2 }} />
                    </AreaChart>
                  )}
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          {/* Platform breakdown */}
          <SectionCard title="Platform Cost Share">
            {platformUsage.isLoading ? <LoadingOverlay /> : (
              <div className="p-4 space-y-3">
                {(platformUsage.data || []).map((p: any, i: number) => (
                  <div key={i} className="p-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                        <span className="text-xs font-semibold text-gray-700">{p.name}</span>
                      </div>
                      <span className="text-xs font-bold text-gray-900">${p.cost.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${p.costPct}%`, background: p.color }} />
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-400">{p.costPct}% of total</span>
                      <div className="flex items-center gap-0.5 text-red-500">
                        <ArrowUpRight size={10} />
                        <span className="text-xs">18.6%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        {/* Team costs + Alerts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <SectionCard title="Team Cost Breakdown">
            {teamRanking.isLoading ? <LoadingOverlay /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={(teamRanking.data || []).map((t: any) => ({ name: t.team.replace(' Team', '').replace(' Automation', ''), cost: t.cost, share: t.costShare }))} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                      {(teamRanking.data || []).map((_: any, i: number) => (
                        <Cell key={i} fill={['#0078d4', '#00b4d8', '#e07b39', '#10b981', '#f59e0b'][i % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Budget Alerts" action={
            <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">{COST_ALERTS.length} alerts</span>
          }>
            <div className="divide-y divide-gray-50">
              {COST_ALERTS.map(alert => (
                <div key={alert.id} className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.severity === 'high' ? 'bg-red-100' : alert.severity === 'medium' ? 'bg-amber-100' : 'bg-blue-100'
                  }`}>
                    <AlertTriangle size={14} className={
                      alert.severity === 'high' ? 'text-red-600' : alert.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-xs font-semibold text-gray-800">{alert.title}</p>
                      <Badge variant={SEVERITY_BADGE[alert.severity]}>{alert.severity}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{alert.message}</p>
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0">{alert.time}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Budget vs Actual */}
        <SectionCard title="Budget vs Actual by Team">
          {teamRanking.isLoading ? <LoadingOverlay /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Team</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actual</th>
                    <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Variance</th>
                    <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[160px]">Utilization</th>
                    <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {[
                    { team: 'Platform Team', budget: 60000, actual: 54235, change: 24.6 },
                    { team: 'Backend Team', budget: 50000, actual: 42876, change: 18.7 },
                    { team: 'Frontend Team', budget: 35000, actual: 28945, change: 20.1 },
                    { team: 'DevOps Team', budget: 30000, actual: 26134, change: 15.3 },
                    { team: 'QA Automation', budget: 22000, actual: 18055, change: 19.8 },
                  ].map((row, i) => {
                    const util = Math.round((row.actual / row.budget) * 100);
                    const variance = row.actual - row.budget;
                    return (
                      <tr key={row.team} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ background: ['#0078d4', '#00b4d8', '#e07b39', '#10b981', '#f59e0b'][i] }} />
                            <span className="text-sm font-medium text-gray-800">{row.team}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-gray-500">${row.budget.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900">${row.actual.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-xs font-semibold ${variance < 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {variance < 0 ? '' : '+'}{variance.toLocaleString()}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full rounded-full" style={{
                                width: `${Math.min(util, 100)}%`,
                                background: util > 90 ? '#ef4444' : util > 75 ? '#f59e0b' : '#10b981'
                              }} />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{util}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant={util > 90 ? 'red' : util > 75 ? 'yellow' : 'green'}>
                            {util > 90 ? 'Over Budget' : util > 75 ? 'Warning' : 'On Track'}
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
