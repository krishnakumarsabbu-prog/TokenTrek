import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Users, DollarSign, TrendingUp, Activity, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { fetchTeamRanking } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, Trend, FilterBar, LoadingOverlay, EmptyState, ProgressBar } from '../components/ui';

const PAGE_SIZE = 8;

const teamsData = [
  { id: 1, name: 'Platform Team', members: 12, cost: 54235, change: 24.6, requests: 45231, tokens: 3200000, platform: 'Claude', budget: 60000, utilization: 90, head: 'Rohit Sharma', headAvatar: 'RS' },
  { id: 2, name: 'Backend Team', members: 10, cost: 42876, change: 18.7, requests: 38965, tokens: 2800000, platform: 'GPT-4o', budget: 50000, utilization: 86, head: 'Anita Patel', headAvatar: 'AP' },
  { id: 3, name: 'Frontend Team', members: 8, cost: 28945, change: 20.1, requests: 29876, tokens: 2100000, platform: 'Cursor', budget: 35000, utilization: 83, head: 'Sandeep Yadav', headAvatar: 'SY' },
  { id: 4, name: 'DevOps Team', members: 6, cost: 26134, change: 15.3, requests: 22345, tokens: 1600000, platform: 'GitHub Copilot', budget: 30000, utilization: 87, head: 'Priya Verma', headAvatar: 'PV' },
  { id: 5, name: 'QA Automation', members: 5, cost: 18055, change: 19.8, requests: 16789, tokens: 1200000, platform: 'Claude', budget: 22000, utilization: 82, head: 'Karan Singh', headAvatar: 'KS' },
];

const COLORS = ['#0078d4', '#00b4d8', '#e07b39', '#10b981', '#f59e0b'];

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export default function Teams() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cost');
  const [page, setPage] = useState(1);

  const ranking = useQuery({ queryKey: ['team-ranking'], queryFn: fetchTeamRanking });

  const filtered = useMemo(() => {
    let data = [...teamsData];
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

  const totalCost = teamsData.reduce((s, t) => s + t.cost, 0);
  const totalMembers = teamsData.reduce((s, t) => s + t.members, 0);
  const avgUtil = Math.round(teamsData.reduce((s, t) => s + t.utilization, 0) / teamsData.length);
  const topTeam = teamsData.reduce((a, b) => a.cost > b.cost ? a : b);

  const pieData = teamsData.map((t, i) => ({ name: t.name, value: t.cost, color: COLORS[i] }));
  const barData = teamsData.map((t, i) => ({ name: t.name.replace(' Team', '').replace(' Automation', ''), cost: t.cost, budget: t.budget, color: COLORS[i] }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Team Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Cost, usage & productivity by engineering team</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Users size={13} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Teams" value={String(teamsData.length)} icon={<Users size={18} />} iconBg="#eff6ff" iconColor="#2563eb" sub={`${totalMembers} members`} />
          <KpiCard label="Total AI Spend" value={`$${(totalCost / 1000).toFixed(0)}K`} change={20.1} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Avg Budget Util" value={`${avgUtil}%`} change={3.2} icon={<TrendingUp size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Highest Spend" value={topTeam.name.split(' ')[0]} icon={<Activity size={18} />} iconBg="#fef9c3" iconColor="#d97706" sub={`$${(topTeam.cost / 1000).toFixed(0)}K`} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <SectionCard title="Cost vs Budget by Team" className="xl:col-span-2">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number, name: string) => [`$${v.toLocaleString()}`, name === 'cost' ? 'Actual Cost' : 'Budget']} />
                  <Bar dataKey="budget" name="Budget" radius={[4, 4, 0, 0]} fill="#e2e8f0" />
                  <Bar dataKey="cost" name="Cost" radius={[4, 4, 0, 0]}>
                    {barData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Cost Share">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
                    {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {pieData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                      <span className="text-gray-600 truncate max-w-[100px]">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{Math.round((item.value / totalCost) * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search teams..." className="w-52" />
          </FilterBar>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Sort by:</span>
            <Select value={sortBy} onChange={setSortBy} options={[
              { value: 'cost', label: 'Cost' },
              { value: 'members', label: 'Members' },
              { value: 'requests', label: 'Requests' },
              { value: 'utilization', label: 'Budget Util' },
            ]} />
          </div>
        </div>

        {/* Table */}
        <SectionCard>
          {ranking.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
            <EmptyState icon={<Users size={28} />} title="No teams found" description="Try adjusting your search" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Team</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Lead</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Members</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">AI Cost</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Change</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Requests</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tokens</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Budget Utilization</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Platform</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((t, i) => (
                      <tr key={t.id} className="hover:bg-blue-50/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                              style={{ background: COLORS[i % COLORS.length] }}>
                              {t.name.charAt(0)}
                            </div>
                            <span className="text-sm font-semibold text-gray-800">{t.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600">{t.head}</td>
                        <td className="px-5 py-3.5 text-center">
                          <span className="text-sm font-semibold text-gray-800">{t.members}</span>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900">${t.cost.toLocaleString()}</td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            {t.change > 0 ? <ArrowUpRight size={13} className="text-red-400" /> : <ArrowDownRight size={13} className="text-emerald-500" />}
                            <Trend value={t.change} />
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm text-gray-700">{fmt(t.requests)}</td>
                        <td className="px-5 py-3.5 text-right text-sm text-gray-700">{fmt(t.tokens)}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2 min-w-[120px]">
                            <ProgressBar value={t.utilization} max={100} color={t.utilization > 90 ? '#ef4444' : t.utilization > 75 ? '#f59e0b' : '#10b981'} className="flex-1" />
                            <span className="text-xs text-gray-500 w-8">{t.utilization}%</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-medium">{t.platform}</span>
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
      </div>
    </div>
  );
}
