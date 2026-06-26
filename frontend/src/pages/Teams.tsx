import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, DollarSign, TrendingUp, Activity, ArrowUpRight, Download, Bot, ChevronRight } from 'lucide-react';
import { fetchLeagueTeams, fetchUIConfig } from '../api/analytics';
import { fetchDevinTeams } from '../api/devin';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, Trend, FilterBar, LoadingOverlay, EmptyState, ProgressBar, PageHeader, Avatar } from '../components/ui';

const PAGE_SIZE = 8;
const CHART_COLORS = ['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b', '#0891b2', '#dc2626', '#64748b'];

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export default function Teams() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cost');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data: rawTeams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['league-teams'],
    queryFn: fetchLeagueTeams,
  });

  const { data: devinTeams = [] } = useQuery({
    queryKey: ['devin-teams'],
    queryFn: fetchDevinTeams,
  });

  const { data: uiConfig, isLoading: configLoading } = useQuery({
    queryKey: ['ui-config'],
    queryFn: fetchUIConfig,
  });

  const isLoading = teamsLoading || configLoading;

  const platformColors: Record<string, string> = useMemo(
    () => uiConfig?.platformColors ?? {},
    [uiConfig]
  );

  // Normalize league team data to component shape
  const teams = useMemo(() => (rawTeams as any[]).map((t: any, i: number) => {
    const devinData = (devinTeams as any[]).find((dt: any) =>
      dt.team_name.toLowerCase().includes(t.name?.toLowerCase()?.split(' ')[0]?.toLowerCase() || '') ||
      t.name?.toLowerCase().includes(dt.team_name?.toLowerCase()?.split(' ')[0]?.toLowerCase() || '')
    );
    return {
      id: i + 1,
      name: t.name ?? '',
      members: t.size ?? 0,
      cost: t.costSaved ?? 0,
      change: t.weeklyChange ?? 0,
      requests: t.totalUsage ?? 0,
      tokens: (t.totalUsage ?? 0) * 45,
      platform: 'Various',
      budget: Math.round((t.costSaved ?? 0) * 1.25),
      utilization: t.adoptionScore ?? 0,
      head: '',
      headAvatar: t.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) ?? '??',
      devinSessions: devinData?.sessions ?? 0,
      devinMergedPRs: devinData?.merged_prs ?? 0,
      devinAiScore: devinData?.ai_score ?? 0,
    };
  }), [rawTeams, devinTeams]);

  const filtered = useMemo(() => {
    let data = [...teams];
    if (search) data = data.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    data.sort((a, b) => {
      if (sortBy === 'cost') return b.cost - a.cost;
      if (sortBy === 'members') return b.members - a.members;
      if (sortBy === 'requests') return b.requests - a.requests;
      if (sortBy === 'utilization') return b.utilization - a.utilization;
      if (sortBy === 'devinSessions') return b.devinSessions - a.devinSessions;
      if (sortBy === 'devinAiScore') return b.devinAiScore - a.devinAiScore;
      return 0;
    });
    return data;
  }, [teams, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCost = teams.reduce((s, t) => s + t.cost, 0);
  const totalMembers = teams.reduce((s, t) => s + t.members, 0);
  const avgUtil = teams.length ? Math.round(teams.reduce((s, t) => s + t.utilization, 0) / teams.length) : 0;
  const topTeam = teams.reduce((a, b) => a.cost > b.cost ? a : b, teams[0]);

  const pieData = teams.map((t, i) => ({ name: t.name, value: t.cost, color: CHART_COLORS[i % CHART_COLORS.length] }));
  const barData = teams.map((t, i) => ({
    name: t.name.replace(' Team', '').replace(' Automation', ''),
    cost: t.cost,
    budget: t.budget,
    color: CHART_COLORS[i % CHART_COLORS.length],
  }));

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Team Analytics"
        subtitle="Cost, usage & productivity by engineering team"
        actions={
          <button className="btn-primary">
            <Download size={13} /> Export
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {teams.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No team data yet" description="Team analytics will appear once AI usage data is recorded" />
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard label="Total Teams" value={String(teams.length)} icon={<Users size={17} />} iconBg="#eff6ff" iconColor="#0078d4" sub={`${totalMembers} members`} />
              <KpiCard label="Total AI Spend" value={`$${(totalCost / 1000).toFixed(0)}K`} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
              <KpiCard label="Avg AI Adoption" value={`${avgUtil}%`} icon={<TrendingUp size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" />
              <KpiCard label="Highest Spend" value={topTeam?.name.split(' ')[0] ?? '—'} icon={<Activity size={17} />} iconBg="#fffbeb" iconColor="#d97706" sub={topTeam ? `$${(topTeam.cost / 1000).toFixed(0)}K` : undefined} />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <SectionCard title="Cost vs Budget by Team" className="xl:col-span-2">
                <div className="p-4 pt-3">
                  <ResponsiveContainer width="100%" height={210}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                      <Tooltip
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                        formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name === 'cost' ? 'Actual Cost' : 'Budget']}
                      />
                      <Bar dataKey="budget" name="Budget" radius={[4, 4, 0, 0]} fill="#edf1f5" />
                      <Bar dataKey="cost" name="Cost" radius={[4, 4, 0, 0]}>
                        {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Cost Share">
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <PieChart>
                      <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip
                        formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']}
                        contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 mt-1">
                    {pieData.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                          <span className="font-medium truncate max-w-[100px]" style={{ color: '#4a6480' }}>{item.name}</span>
                        </div>
                        <span className="font-bold" style={{ color: '#0d1f30' }}>
                          {totalCost > 0 ? Math.round((item.value / totalCost) * 100) : 0}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <FilterBar>
                <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search teams..." className="w-52" />
              </FilterBar>
              <Select value={sortBy} onChange={setSortBy} options={[
                { value: 'cost', label: 'Sort: Cost' },
                { value: 'members', label: 'Sort: Members' },
                { value: 'requests', label: 'Sort: Usage' },
                { value: 'utilization', label: 'Sort: AI Adoption' },
                { value: 'devinSessions', label: 'Sort: Devin Sessions' },
                { value: 'devinAiScore', label: 'Sort: AI Score' },
              ]} />
            </div>

            {/* Table */}
            <SectionCard>
              {filtered.length === 0 ? (
                <EmptyState icon={<Users size={28} />} title="No teams found" description="Try adjusting your search" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                          <th className="table-header-cell">Team</th>
                          <th className="table-header-cell text-center">Members</th>
                          <th className="table-header-cell text-right">AI Cost</th>
                          <th className="table-header-cell text-right">Change</th>
                          <th className="table-header-cell text-right">Usage</th>
                          <th className="table-header-cell text-right">Devin Sessions</th>
                          <th className="table-header-cell text-right">Merged PR</th>
                          <th className="table-header-cell text-right">AI Score</th>
                          <th className="table-header-cell min-w-[150px]">AI Adoption</th>
                          <th className="table-header-cell w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((t, i) => (
                          <tr
                            key={t.id}
                            className="border-b transition-colors cursor-pointer"
                            style={{ borderColor: '#f0f4f8' }}
                            onClick={() => navigate(`/teams/${encodeURIComponent(t.name)}`)}
                            onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <td className="table-cell">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                  style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
                                >
                                  {t.name.charAt(0)}
                                </div>
                                <span className="font-semibold" style={{ color: '#0d1f30' }}>{t.name}</span>
                              </div>
                            </td>
                            <td className="table-cell text-center font-semibold" style={{ color: '#0d1f30' }}>{t.members}</td>
                            <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>${t.cost.toLocaleString()}</td>
                            <td className="table-cell text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                {t.change >= 0
                                  ? <ArrowUpRight size={12} style={{ color: '#dc2626' }} />
                                  : null}
                                <Trend value={t.change} />
                              </div>
                            </td>
                            <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{fmt(t.requests)}</td>
                            <td className="table-cell text-right">
                              {t.devinSessions > 0 ? (
                                <div className="flex items-center justify-end gap-1">
                                  <Bot size={11} style={{ color: '#0078d4' }} />
                                  <span className="font-semibold" style={{ color: '#0078d4' }}>{t.devinSessions}</span>
                                </div>
                              ) : (
                                <span className="text-xs" style={{ color: '#8ba3be' }}>—</span>
                              )}
                            </td>
                            <td className="table-cell text-right">
                              {t.devinMergedPRs > 0 ? (
                                <Badge variant="green">{t.devinMergedPRs}</Badge>
                              ) : (
                                <span className="text-xs" style={{ color: '#8ba3be' }}>—</span>
                              )}
                            </td>
                            <td className="table-cell text-right">
                              {t.devinAiScore > 0 ? (
                                <span className="text-sm font-bold" style={{ color: '#e07b39' }}>{t.devinAiScore}</span>
                              ) : (
                                <span className="text-xs" style={{ color: '#8ba3be' }}>—</span>
                              )}
                            </td>
                            <td className="table-cell">
                              <div className="flex items-center gap-2.5">
                                <ProgressBar
                                  value={t.utilization}
                                  max={100}
                                  color={t.utilization > 90 ? '#dc2626' : t.utilization > 80 ? '#d97706' : '#10b981'}
                                  className="flex-1"
                                />
                                <span
                                  className="text-xs font-semibold w-8"
                                  style={{ color: t.utilization > 90 ? '#dc2626' : t.utilization > 80 ? '#d97706' : '#059669' }}
                                >
                                  {t.utilization}%
                                </span>
                              </div>
                            </td>
                            <td className="table-cell text-right">
                              <ChevronRight size={14} style={{ color: '#c5d4e0', marginLeft: 'auto' }} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
                </>
              )}
            </SectionCard>
          </>
        )}
      </div>
    </div>
  );
}
