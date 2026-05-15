import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, Award, Users, DollarSign, ArrowUpRight, ArrowDownRight, Download } from 'lucide-react';
import { fetchDeveloperScores } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, Avatar, ProgressBar, Badge, KpiCard, Trend, FilterBar, LoadingOverlay, EmptyState, PageHeader } from '../components/ui';

const PAGE_SIZE = 8;

const DEVELOPERS = [
  { name: 'Rohit Sharma', avatar: 'RS', team: 'Platform Team', score: 92, trend: 8, requests: 18245, tokens: 1200000, cost: 2456, platform: 'Claude', status: 'active', tasksCompleted: 312, avgSessionMin: 28 },
  { name: 'Anita Patel', avatar: 'AP', team: 'Backend Team', score: 89, trend: 5, requests: 15672, tokens: 980000, cost: 1876, platform: 'GPT-4o', status: 'active', tasksCompleted: 287, avgSessionMin: 24 },
  { name: 'Sandeep Yadav', avatar: 'SY', team: 'Frontend Team', score: 87, trend: 3, requests: 12398, tokens: 820000, cost: 1567, platform: 'Cursor', status: 'active', tasksCompleted: 241, avgSessionMin: 31 },
  { name: 'Priya Verma', avatar: 'PV', team: 'DevOps Team', score: 86, trend: 6, requests: 11245, tokens: 750000, cost: 1432, platform: 'GitHub Copilot', status: 'active', tasksCompleted: 198, avgSessionMin: 19 },
  { name: 'Karan Singh', avatar: 'KS', team: 'QA Automation', score: 84, trend: 2, requests: 9876, tokens: 680000, cost: 1234, platform: 'Claude', status: 'idle', tasksCompleted: 176, avgSessionMin: 22 },
  { name: 'Maya Johnson', avatar: 'MJ', team: 'Platform Team', score: 81, trend: -2, requests: 8234, tokens: 560000, cost: 1120, platform: 'GPT-4o', status: 'active', tasksCompleted: 154, avgSessionMin: 17 },
  { name: 'Raj Kumar', avatar: 'RK', team: 'Backend Team', score: 78, trend: 4, requests: 7123, tokens: 490000, cost: 987, platform: 'Cursor', status: 'offline', tasksCompleted: 132, avgSessionMin: 26 },
  { name: 'Sofia Chen', avatar: 'SC', team: 'Frontend Team', score: 76, trend: -1, requests: 6543, tokens: 430000, cost: 876, platform: 'Claude', status: 'active', tasksCompleted: 118, avgSessionMin: 20 },
  { name: 'David Park', avatar: 'DP', team: 'DevOps Team', score: 74, trend: 7, requests: 5876, tokens: 380000, cost: 765, platform: 'GitHub Copilot', status: 'active', tasksCompleted: 98, avgSessionMin: 15 },
  { name: 'Aisha Williams', avatar: 'AW', team: 'QA Automation', score: 72, trend: 3, requests: 4987, tokens: 320000, cost: 654, platform: 'GPT-4o', status: 'idle', tasksCompleted: 89, avgSessionMin: 18 },
];

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

const STATUS_STYLE: Record<string, { color: string; bg: string; dot: string }> = {
  active:  { color: '#059669', bg: '#ecfdf5', dot: '#10b981' },
  idle:    { color: '#d97706', bg: '#fffbeb', dot: '#f59e0b' },
  offline: { color: '#8ba3be', bg: '#f0f4f8', dot: '#c5d4e0' },
};

const RADAR_DATA = [
  { subject: 'Prompt Quality', score: 88 },
  { subject: 'Token Efficiency', score: 76 },
  { subject: 'Task Completion', score: 94 },
  { subject: 'Speed', score: 82 },
  { subject: 'Code Quality', score: 90 },
  { subject: 'Collaboration', score: 73 },
];

const PLATFORM_COLORS: Record<string, string> = {
  Claude: '#e07b39',
  'GPT-4o': '#10a37f',
  Cursor: '#0078d4',
  'GitHub Copilot': '#8b5cf6',
};

export default function Developers() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [page, setPage] = useState(1);

  useQuery({ queryKey: ['dev-scores-full'], queryFn: fetchDeveloperScores });

  const filtered = useMemo(() => {
    let data = [...DEVELOPERS];
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
  }, [search, teamFilter, statusFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const teams = ['all', ...Array.from(new Set(DEVELOPERS.map(d => d.team)))];
  const topDev = DEVELOPERS.reduce((a, b) => a.score > b.score ? a : b);
  const avgScore = Math.round(DEVELOPERS.reduce((s, d) => s + d.score, 0) / DEVELOPERS.length);
  const totalCost = DEVELOPERS.reduce((s, d) => s + d.cost, 0);
  const activeCount = DEVELOPERS.filter(d => d.status === 'active').length;

  const barData = DEVELOPERS.slice(0, 8).map(d => ({
    name: d.name.split(' ')[0],
    score: d.score,
    color: d.score >= 90 ? '#059669' : d.score >= 80 ? '#0078d4' : '#d97706',
  }));

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
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Top Performer" value={topDev.name.split(' ')[0]} icon={<Award size={17} />} iconBg="#fffbeb" iconColor="#d97706" sub={`Score: ${topDev.score}`} />
          <KpiCard label="Avg AI Score" value={String(avgScore)} change={4.2} icon={<TrendingUp size={17} />} iconBg="#eff6ff" iconColor="#0078d4" />
          <KpiCard label="Active Now" value={String(activeCount)} icon={<Users size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" sub={`of ${DEVELOPERS.length} total`} />
          <KpiCard label="Total Cost" value={`$${(totalCost / 1000).toFixed(1)}K`} change={18.6} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="AI Score Distribution" className="xl:col-span-2">
            <div className="p-4 pt-3">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                    formatter={(v: number) => [v, 'AI Score']}
                  />
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
                <RadarChart data={RADAR_DATA} cx="50%" cy="50%" outerRadius={70}>
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
            { value: 'cost', label: 'Sort: Cost' },
            { value: 'requests', label: 'Sort: Requests' },
            { value: 'tokens', label: 'Sort: Tokens' },
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
                      <th className="table-header-cell text-right">Requests</th>
                      <th className="table-header-cell text-right">Tokens</th>
                      <th className="table-header-cell text-right">Cost</th>
                      <th className="table-header-cell text-center">Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((d, i) => {
                      const rank = (page - 1) * PAGE_SIZE + i + 1;
                      const ss = STATUS_STYLE[d.status];
                      const pc = PLATFORM_COLORS[d.platform] || '#0078d4';
                      return (
                        <tr
                          key={d.name}
                          className="border-b transition-colors cursor-default"
                          style={{ borderColor: '#f0f4f8' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="table-cell text-xs" style={{ color: '#8ba3be' }}>{rank}</td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2.5">
                              <Avatar initials={d.avatar} size={32} index={rank - 1} />
                              <div>
                                <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{d.name}</p>
                                <p className="text-xs" style={{ color: '#8ba3be' }}>{d.avgSessionMin}min avg session</p>
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
                          <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{fmt(d.tokens)}</td>
                          <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>${d.cost.toLocaleString()}</td>
                          <td className="table-cell text-center">
                            <span
                              className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                              style={{ background: `${pc}15`, color: pc }}
                            >
                              {d.platform}
                            </span>
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
      </div>
    </div>
  );
}
