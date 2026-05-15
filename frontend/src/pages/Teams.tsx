import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, DollarSign, TrendingUp, Activity, ArrowUpRight, Download } from 'lucide-react';
import { fetchTeamRanking } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, Trend, FilterBar, LoadingOverlay, EmptyState, ProgressBar, PageHeader, Avatar } from '../components/ui';

const PAGE_SIZE = 8;

const TEAMS = [
  { id: 1, name: 'Platform Team', members: 12, cost: 54235, change: 24.6, requests: 45231, tokens: 3200000, platform: 'Claude', budget: 60000, utilization: 90, head: 'Rohit Sharma', headAvatar: 'RS' },
  { id: 2, name: 'Backend Team', members: 10, cost: 42876, change: 18.7, requests: 38965, tokens: 2800000, platform: 'GPT-4o', budget: 50000, utilization: 86, head: 'Anita Patel', headAvatar: 'AP' },
  { id: 3, name: 'Frontend Team', members: 8, cost: 28945, change: 20.1, requests: 29876, tokens: 2100000, platform: 'Cursor', budget: 35000, utilization: 83, head: 'Sandeep Yadav', headAvatar: 'SY' },
  { id: 4, name: 'DevOps Team', members: 6, cost: 26134, change: 15.3, requests: 22345, tokens: 1600000, platform: 'GitHub Copilot', budget: 30000, utilization: 87, head: 'Priya Verma', headAvatar: 'PV' },
  { id: 5, name: 'QA Automation', members: 5, cost: 18055, change: 19.8, requests: 16789, tokens: 1200000, platform: 'Claude', budget: 22000, utilization: 82, head: 'Karan Singh', headAvatar: 'KS' },
];

const COLORS = ['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b'];

const PLATFORM_COLORS: Record<string, string> = {
  Claude: '#e07b39',
  'GPT-4o': '#10a37f',
  Cursor: '#0078d4',
  'GitHub Copilot': '#8b5cf6',
};

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export default function Teams() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cost');
  const [page, setPage] = useState(1);

  useQuery({ queryKey: ['team-ranking'], queryFn: fetchTeamRanking });

  const filtered = useMemo(() => {
    let data = [...TEAMS];
    if (search) data = data.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));
    data.sort((a, b) => {
      if (sortBy === 'cost') return b.cost - a.cost;
      if (sortBy === 'members') return b.members - a.members;
      if (sortBy === 'requests') return b.requests - a.requests;
      if (sortBy === 'utilization') return b.utilization - a.utilization;
      return 0;
    });
    return data;
  }, [search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCost = TEAMS.reduce((s, t) => s + t.cost, 0);
  const totalMembers = TEAMS.reduce((s, t) => s + t.members, 0);
  const avgUtil = Math.round(TEAMS.reduce((s, t) => s + t.utilization, 0) / TEAMS.length);
  const topTeam = TEAMS.reduce((a, b) => a.cost > b.cost ? a : b);

  const pieData = TEAMS.map((t, i) => ({ name: t.name, value: t.cost, color: COLORS[i] }));
  const barData = TEAMS.map((t, i) => ({
    name: t.name.replace(' Team', '').replace(' Automation', ''),
    cost: t.cost,
    budget: t.budget,
    color: COLORS[i],
  }));

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
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Teams" value={String(TEAMS.length)} icon={<Users size={17} />} iconBg="#eff6ff" iconColor="#0078d4" sub={`${totalMembers} members`} />
          <KpiCard label="Total AI Spend" value={`$${(totalCost / 1000).toFixed(0)}K`} change={20.1} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Avg Budget Util" value={`${avgUtil}%`} change={3.2} icon={<TrendingUp size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Highest Spend" value={topTeam.name.split(' ')[0]} icon={<Activity size={17} />} iconBg="#fffbeb" iconColor="#d97706" sub={`$${(topTeam.cost / 1000).toFixed(0)}K`} />
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
                    <span className="font-bold" style={{ color: '#0d1f30' }}>{Math.round((item.value / totalCost) * 100)}%</span>
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
            { value: 'requests', label: 'Sort: Requests' },
            { value: 'utilization', label: 'Sort: Budget Util' },
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
                      <th className="table-header-cell">Lead</th>
                      <th className="table-header-cell text-center">Members</th>
                      <th className="table-header-cell text-right">AI Cost</th>
                      <th className="table-header-cell text-right">Change</th>
                      <th className="table-header-cell text-right">Requests</th>
                      <th className="table-header-cell text-right">Tokens</th>
                      <th className="table-header-cell min-w-[150px]">Budget Util</th>
                      <th className="table-header-cell text-center">Platform</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((t, i) => {
                      const pc = PLATFORM_COLORS[t.platform] || '#0078d4';
                      return (
                        <tr
                          key={t.id}
                          className="border-b transition-colors"
                          style={{ borderColor: '#f0f4f8' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="table-cell">
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-8 h-8 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: COLORS[i % COLORS.length] }}
                              >
                                {t.name.charAt(0)}
                              </div>
                              <span className="font-semibold" style={{ color: '#0d1f30' }}>{t.name}</span>
                            </div>
                          </td>
                          <td className="table-cell">
                            <div className="flex items-center gap-2">
                              <Avatar initials={t.headAvatar} size={24} index={i} />
                              <span className="text-xs" style={{ color: '#4a6480' }}>{t.head}</span>
                            </div>
                          </td>
                          <td className="table-cell text-center font-semibold" style={{ color: '#0d1f30' }}>{t.members}</td>
                          <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>${t.cost.toLocaleString()}</td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <ArrowUpRight size={12} style={{ color: '#dc2626' }} />
                              <Trend value={t.change} />
                            </div>
                          </td>
                          <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{fmt(t.requests)}</td>
                          <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{fmt(t.tokens)}</td>
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
                          <td className="table-cell text-center">
                            <span
                              className="text-xs px-2 py-0.5 rounded-lg font-semibold"
                              style={{ background: `${pc}15`, color: pc }}
                            >
                              {t.platform}
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
