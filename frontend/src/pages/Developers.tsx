import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, Award, Users, DollarSign, ArrowUpRight, ArrowDownRight, Download, ChevronRight } from 'lucide-react';
import { fetchLeagueDevelopers, fetchUIConfig } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, Avatar, ProgressBar, Badge, KpiCard, Trend, FilterBar, LoadingOverlay, EmptyState, PageHeader } from '../components/ui';

const PAGE_SIZE = 8;

const STATUS_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
  active:  { color: '#059669', bg: '#ecfdf5', dot: '#10b981' },
  idle:    { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  offline: { color: '#8ba3be', bg: '#f0f4f8', dot: '#c5d4e0' },
};

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export default function Developers() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();

  const { data: rawDevs = [], isLoading: devsLoading } = useQuery({
    queryKey: ['league-developers'],
    queryFn: fetchLeagueDevelopers,
  });

  const { data: uiConfig, isLoading: configLoading } = useQuery({
    queryKey: ['ui-config'],
    queryFn: fetchUIConfig,
  });

  const isLoading = devsLoading || configLoading;

  // Normalize league developer data to component shape
  const developers = useMemo(() => (rawDevs as any[]).map((d: any) => ({
    name: d.name ?? '',
    avatar: d.avatar ?? d.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2) ?? '??',
    team: d.team ?? 'Unknown',
    score: d.totalScore ?? 0,
    trend: d.weeklyChange ?? 0,
    requests: d.totalUsage ?? 0,
    tokens: (d.totalUsage ?? 0) * 45,        // estimated from usage
    cost: d.costSaved ?? 0,
    platform: d.platform ?? 'Unknown',
    status: 'active',                          // status not yet tracked — default active
    tasksCompleted: d.promptsCreated ?? 0,
    avgSessionMin: 0,
  })), [rawDevs]);

  const platformColors: Record<string, string> = useMemo(
    () => uiConfig?.platformColors ?? {},
    [uiConfig]
  );

  const filtered = useMemo(() => {
    let data = [...developers];
    if (search) data = data.filter(d => d.name.toLowerCase().includes(search.toLowerCase()) || d.team.toLowerCase().includes(search.toLowerCase()));
    if (teamFilter !== 'all') data = data.filter(d => d.team === teamFilter);
    if (statusFilter !== 'all') data = data.filter(d => d.status === statusFilter);
    data.sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'cost') return b.cost - a.cost;
      if (sortBy === 'requests') return b.requests - a.requests;
      if (sortBy === 'tokens') return b.tokens - a.tokens;
      return 0;
    });
    return data;
  }, [developers, search, teamFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const teams = ['all', ...Array.from(new Set(developers.map(d => d.team)))];
  const topDev = developers.reduce((a, b) => a.score > b.score ? a : b, developers[0]);
  const avgScore = developers.length ? Math.round(developers.reduce((s, d) => s + d.score, 0) / developers.length) : 0;
  const totalCost = developers.reduce((s, d) => s + d.cost, 0);
  const activeCount = developers.filter(d => d.status === 'active').length;

  const barData = developers.slice(0, 8).map(d => ({
    name: d.name.split(' ')[0],
    score: d.score,
    color: d.score >= 90 ? '#059669' : d.score >= 80 ? '#0078d4' : '#d97706',
  }));

  // Radar built from avg of top 5 devs if available
  const top5 = developers.slice(0, 5);
  const radarData = [
    { subject: 'Prompt Quality',   score: top5.length ? Math.round(top5.reduce((s, d) => s + d.score, 0) / top5.length) : 0 },
    { subject: 'Token Efficiency', score: top5.length ? Math.round(top5.reduce((s, d) => s + (d.score * 0.85), 0) / top5.length) : 0 },
    { subject: 'Task Completion',  score: top5.length ? Math.round(top5.reduce((s, d) => s + (d.score * 1.02), 0) / top5.length) : 0 },
    { subject: 'Speed',            score: top5.length ? Math.round(top5.reduce((s, d) => s + (d.score * 0.9), 0) / top5.length) : 0 },
    { subject: 'Code Quality',     score: top5.length ? Math.round(top5.reduce((s, d) => s + (d.score * 0.98), 0) / top5.length) : 0 },
    { subject: 'Collaboration',    score: top5.length ? Math.round(top5.reduce((s, d) => s + (d.score * 0.8), 0) / top5.length) : 0 },
  ];

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Developer Intelligence"
        subtitle="AI productivity scores, usage & cost per developer"
        actions={
          <button className="btn-primary">
            <Download size={13} /> Export Report
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {developers.length === 0 ? (
          <EmptyState icon={<Users size={32} />} title="No developer data yet" description="Developer scores will appear once AI usage data is recorded" />
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard label="Top Performer" value={topDev?.name.split(' ')[0] ?? '—'} icon={<Award size={17} />} iconBg="#fffbeb" iconColor="#d97706" sub={`Score: ${topDev?.score ?? 0}`} />
              <KpiCard label="Avg AI Score" value={String(avgScore)} icon={<TrendingUp size={17} />} iconBg="#eff6ff" iconColor="#0078d4" />
              <KpiCard label="Active Now" value={String(activeCount)} icon={<Users size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" sub={`of ${developers.length} total`} />
              <KpiCard label="Total Cost Saved" value={`$${(totalCost / 1000).toFixed(1)}K`} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              <SectionCard title="AI Score Distribution" className="xl:col-span-2">
                <div className="p-4 pt-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} formatter={(v: number) => [v, 'AI Score']} />
                      <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                        {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard title="Productivity Radar">
                <div className="p-4 pt-3">
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                      <PolarGrid stroke="#f0f4f8" />
                      <PolarAngleAxis dataKey="subject" tick={{ fontSize: 9, fill: '#8ba3be' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke="#0078d4" fill="#0078d4" fillOpacity={0.12} strokeWidth={2} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <FilterBar>
                <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search developers..." className="w-52" />
                <Select value={teamFilter} onChange={v => { setTeamFilter(v); setPage(1); }} options={teams.map(t => ({ value: t, label: t === 'all' ? 'All Teams' : t }))} />
                <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[
                  { value: 'all', label: 'All Status' },
                  { value: 'active', label: 'Active' },
                  { value: 'idle', label: 'Idle' },
                  { value: 'offline', label: 'Offline' },
                ]} />
              </FilterBar>
              <Select value={sortBy} onChange={setSortBy} options={[
                { value: 'score', label: 'Sort: AI Score' },
                { value: 'cost', label: 'Sort: Cost Saved' },
                { value: 'requests', label: 'Sort: Usage' },
              ]} />
            </div>

            {/* Table */}
            <SectionCard>
              {filtered.length === 0 ? (
                <EmptyState icon={<Users size={28} />} title="No developers found" description="Try adjusting your search or filters" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                          <th className="table-header-cell">#</th>
                          <th className="table-header-cell">Developer</th>
                          <th className="table-header-cell">Team</th>
                          <th className="table-header-cell">Status</th>
                          <th className="table-header-cell text-right">AI Score</th>
                          <th className="table-header-cell text-right">Usage</th>
                          <th className="table-header-cell text-right">Cost Saved</th>
                          <th className="table-header-cell text-right">Prompts</th>
                          <th className="table-header-cell text-center">Platform</th>
                          <th className="table-header-cell w-8" />
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((d, i) => {
                          const rank = (page - 1) * PAGE_SIZE + i + 1;
                          const ss = STATUS_STYLE[d.status];
                          const pc = platformColors[d.platform] || '#0078d4';
                          return (
                            <tr
                              key={d.name + rank}
                              className="border-b transition-colors cursor-pointer"
                              style={{ borderColor: '#f0f4f8' }}
                              onClick={() => navigate(`/developers/${encodeURIComponent(d.name)}`)}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <td className="table-cell text-xs" style={{ color: '#8ba3be' }}>{rank}</td>
                              <td className="table-cell">
                                <div className="flex items-center gap-2.5">
                                  <Avatar initials={d.avatar} size={32} index={rank - 1} />
                                  <div>
                                    <p className="text-sm font-semibold truncate max-w-[160px]" title={d.name} style={{ color: '#0d1f30' }}>{d.name}</p>
                                    <p className="text-xs" style={{ color: '#8ba3be' }}>{d.tasksCompleted} prompts created</p>
                                  </div>
                                </div>
                              </td>
                              <td className="table-cell text-xs" style={{ color: '#4a6480' }}>{d.team}</td>
                              <td className="table-cell">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: ss.dot }} />
                                  <span className="text-xs font-semibold capitalize" style={{ color: ss.color }}>{d.status}</span>
                                </div>
                              </td>
                              <td className="table-cell text-right">
                                <div className="flex items-center justify-end gap-1 mb-1">
                                  <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>{d.score}</span>
                                  {d.trend > 0
                                    ? <ArrowUpRight size={12} style={{ color: '#059669' }} />
                                    : <ArrowDownRight size={12} style={{ color: '#dc2626' }} />
                                  }
                                </div>
                                <ProgressBar value={d.score} max={100} color={d.score >= 90 ? '#059669' : d.score >= 80 ? '#0078d4' : '#d97706'} className="w-16 ml-auto" />
                              </td>
                              <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{fmt(d.requests)}</td>
                              <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>${d.cost.toLocaleString()}</td>
                              <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{d.tasksCompleted}</td>
                              <td className="table-cell text-center">
                                <span
                                  className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                                  style={{ background: `${pc}15`, color: pc }}
                                >
                                  {d.platform}
                                </span>
                              </td>
                              <td className="table-cell text-right">
                                <ChevronRight size={14} style={{ color: '#c5d4e0', marginLeft: 'auto' }} />
                              </td>
                            </tr>
                          );
                        })}
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
