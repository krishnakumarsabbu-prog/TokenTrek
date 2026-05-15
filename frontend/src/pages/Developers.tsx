import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { TrendingUp, TrendingDown, Award, Users, Zap, DollarSign, ArrowUpRight, ArrowDownRight, MoveHorizontal as MoreHorizontal } from 'lucide-react';
import { fetchDeveloperScores } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, Avatar, ProgressBar, Badge, KpiCard, Trend, FilterBar, LoadingOverlay, EmptyState } from '../components/ui';

const PAGE_SIZE = 8;

const extendedDevs = [
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

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  active: { bg: '#f0fdf4', text: '#15803d', dot: '#22c55e' },
  idle: { bg: '#fef9c3', text: '#a16207', dot: '#eab308' },
  offline: { bg: '#f1f5f9', text: '#64748b', dot: '#94a3b8' },
};

const radarData = [
  { subject: 'Prompt Quality', score: 88 },
  { subject: 'Token Efficiency', score: 76 },
  { subject: 'Task Completion', score: 94 },
  { subject: 'Speed', score: 82 },
  { subject: 'Code Quality', score: 90 },
  { subject: 'Collab', score: 73 },
];

export default function Developers() {
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('score');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<number | null>(null);

  const scores = useQuery({ queryKey: ['dev-scores-full'], queryFn: fetchDeveloperScores });

  const filtered = useMemo(() => {
    let data = [...extendedDevs];
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

  const teams = ['all', ...Array.from(new Set(extendedDevs.map(d => d.team)))];

  const topDev = extendedDevs.reduce((a, b) => a.score > b.score ? a : b);
  const avgScore = Math.round(extendedDevs.reduce((s, d) => s + d.score, 0) / extendedDevs.length);
  const totalCost = extendedDevs.reduce((s, d) => s + d.cost, 0);
  const activeCount = extendedDevs.filter(d => d.status === 'active').length;

  const barData = extendedDevs.slice(0, 8).map(d => ({ name: d.name.split(' ')[0], score: d.score, requests: Math.round(d.requests / 1000) }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Developer Intelligence</h1>
            <p className="text-xs text-gray-500 mt-0.5">AI productivity scores, usage & cost per developer</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Users size={13} /> Export Report
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Top Performer" value={topDev.name.split(' ')[0]} icon={<Award size={18} />} iconBg="#fef9c3" iconColor="#d97706" sub={`Score: ${topDev.score}`} />
          <KpiCard label="Avg AI Score" value={String(avgScore)} change={4.2} icon={<TrendingUp size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Active Now" value={String(activeCount)} icon={<Users size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" sub={`of ${extendedDevs.length} total`} />
          <KpiCard label="Total Cost" value={`$${(totalCost / 1000).toFixed(1)}K`} change={18.6} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <SectionCard title="AI Score Distribution" className="xl:col-span-2">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number) => [v, 'AI Score']} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {barData.map((d, i) => (
                      <Cell key={i} fill={d.score >= 90 ? '#10b981' : d.score >= 80 ? '#0078d4' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title={selected !== null ? `${extendedDevs[selected].name} – Profile` : 'Productivity Radar'}>
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={70}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#0078d4" fill="#0078d4" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort by:</span>
            <Select value={sortBy} onChange={setSortBy} options={[
              { value: 'score', label: 'AI Score' },
              { value: 'cost', label: 'Cost' },
              { value: 'requests', label: 'Requests' },
              { value: 'tokens', label: 'Tokens' },
            ]} />
          </div>
        </div>

        {/* Table */}
        <SectionCard>
          {scores.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title="No developers found" description="Try adjusting your search or filters" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Developer</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Team</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Score</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Requests</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tokens</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Platform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((d, i) => {
                      const rank = (page - 1) * PAGE_SIZE + i + 1;
                      const sc = STATUS_COLORS[d.status];
                      return (
                        <tr key={d.name} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setSelected(selected === i ? null : i)}>
                          <td className="px-5 py-3.5 text-xs text-gray-400 font-medium">{rank}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <Avatar initials={d.avatar} size={32} index={rank - 1} />
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{d.name}</p>
                                <p className="text-xs text-gray-400">{d.avgSessionMin}min avg session</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{d.team}</td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: sc.dot }} />
                              <span className="text-xs capitalize" style={{ color: sc.text }}>{d.status}</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-sm font-bold text-gray-900">{d.score}</span>
                              {d.trend > 0
                                ? <ArrowUpRight size={13} className="text-emerald-500" />
                                : <ArrowDownRight size={13} className="text-red-400" />}
                            </div>
                            <ProgressBar value={d.score} max={100} color={d.score >= 90 ? '#10b981' : d.score >= 80 ? '#0078d4' : '#f59e0b'} className="w-16 ml-auto mt-1" />
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm text-gray-700 font-medium">{fmt(d.requests)}</td>
                          <td className="px-5 py-3.5 text-right text-sm text-gray-700 font-medium">{fmt(d.tokens)}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">${d.cost.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{d.platform}</span>
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
