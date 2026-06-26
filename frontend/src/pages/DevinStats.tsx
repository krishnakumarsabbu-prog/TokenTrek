import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { Bot, Users, Cpu, GitPullRequest, CircleCheck as CheckCircle, TrendingUp, Activity, Search } from 'lucide-react';
import { fetchDevinStats, fetchDevinDevelopers, fetchDevinTrends, fetchDevinCategories } from '../api/devin';
import { SectionCard, PageHeader, KpiCard, EmptyState, Badge, SearchBar, Select, Pagination } from '../components/ui';

const CHART_COLORS = ['#0078d4', '#10b981', '#e07b39', '#f59e0b', '#0891b2', '#8b5cf6', '#dc2626', '#64748b'];
const PAGE_SIZE = 10;

interface DevStat {
  rank: number;
  user_email: string;
  user_name: string;
  team_name: string;
  sessions: number;
  acu_used: number;
  total_prs: number;
  merged_prs: number;
  open_prs: number;
  failed_prs: number;
  categories: string[];
  ai_score: number;
}

function fmt2(n: number) {
  return Math.round(n * 100) / 100;
}

const MEDAL: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: '#fef9c3', color: '#d97706', label: '1' },
  2: { bg: '#f1f5f9', color: '#64748b', label: '2' },
  3: { bg: '#fff7ed', color: '#c2410c', label: '3' },
};

export default function DevinStats() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('ai_score');
  const [page, setPage] = useState(1);

  const { data: stats } = useQuery({ queryKey: ['devin-stats'], queryFn: fetchDevinStats });
  const { data: developers = [] } = useQuery<DevStat[]>({ queryKey: ['devin-developers'], queryFn: fetchDevinDevelopers });
  const { data: trends = [] } = useQuery({ queryKey: ['devin-trends'], queryFn: fetchDevinTrends });
  const { data: categories = [] } = useQuery({ queryKey: ['devin-categories'], queryFn: fetchDevinCategories });

  const prPieData = useMemo(() => {
    if (!stats) return [];
    const merged = stats.merged_prs ?? 0;
    const total = stats.total_prs ?? 0;
    const open = developers.reduce((s: number, d: DevStat) => s + d.open_prs, 0);
    const failed = total - merged - open;
    return [
      { name: 'Merged', value: merged, color: '#10b981' },
      { name: 'Open', value: open, color: '#f59e0b' },
      { name: 'Failed', value: Math.max(failed, 0), color: '#dc2626' },
    ].filter(d => d.value > 0);
  }, [stats, developers]);

  const devAdoptionData = useMemo(() =>
    [...developers]
      .sort((a, b) => b.sessions - a.sessions)
      .slice(0, 12)
      .map(d => ({ name: d.user_name.split('.')[0] || d.user_email.split('@')[0], sessions: d.sessions, acu: Math.round(d.acu_used * 10) / 10 })),
    [developers]
  );

  const filtered = useMemo(() => {
    let d = [...developers];
    if (search) d = d.filter(x =>
      x.user_name.toLowerCase().includes(search.toLowerCase()) ||
      x.user_email.toLowerCase().includes(search.toLowerCase()) ||
      x.team_name.toLowerCase().includes(search.toLowerCase())
    );
    d.sort((a, b) => {
      if (sortBy === 'ai_score') return b.ai_score - a.ai_score;
      if (sortBy === 'sessions') return b.sessions - a.sessions;
      if (sortBy === 'acu') return b.acu_used - a.acu_used;
      if (sortBy === 'merged_prs') return b.merged_prs - a.merged_prs;
      return 0;
    });
    return d;
  }, [developers, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const isEmpty = !stats || stats.total_sessions === 0;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Devin Stats"
        subtitle="AI-assisted development productivity — sessions, ACU usage, PR delivery rate"
        actions={
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#eff6ff', color: '#0078d4' }}>
            <Bot size={13} /> Devin AI Telemetry
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {isEmpty ? (
          <EmptyState
            icon={<Bot size={32} />}
            title="No Devin telemetry yet"
            description="Upload Devin session JSON from the Upload Center to see analytics"
          />
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 xl:grid-cols-6 gap-4">
              <KpiCard
                label="Total Sessions"
                value={String(stats?.total_sessions ?? 0)}
                icon={<Activity size={17} />}
                iconBg="#eff6ff"
                iconColor="#0078d4"
              />
              <KpiCard
                label="Active Developers"
                value={String(stats?.active_developers ?? 0)}
                icon={<Users size={17} />}
                iconBg="#f0fdf4"
                iconColor="#16a34a"
              />
              <KpiCard
                label="Total ACU"
                value={String(fmt2(stats?.total_acu ?? 0))}
                icon={<Cpu size={17} />}
                iconBg="#fff7ed"
                iconColor="#ea580c"
                sub="compute units"
              />
              <KpiCard
                label="Pull Requests"
                value={String(stats?.total_prs ?? 0)}
                icon={<GitPullRequest size={17} />}
                iconBg="#fdf4ff"
                iconColor="#9333ea"
              />
              <KpiCard
                label="Successful Delivery"
                value={String(stats?.merged_prs ?? 0)}
                icon={<CheckCircle size={17} />}
                iconBg="#f0fdf4"
                iconColor="#10b981"
                sub="merged PRs"
              />
              <KpiCard
                label="AI Delivery Rate"
                value={`${stats?.ai_delivery_rate ?? 0}%`}
                icon={<TrendingUp size={17} />}
                iconBg="#fffbeb"
                iconColor="#d97706"
                sub="merged / total PRs"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <SectionCard title="Devin Usage Trend" className="xl:col-span-2">
                <div className="p-4">
                  {trends.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#8ba3be' }}>No trend data yet</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={trends}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                        <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                        <Line type="monotone" dataKey="sessions" stroke="#0078d4" strokeWidth={2} dot={{ r: 3 }} name="Sessions" />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="PR Outcome">
                <div className="p-4">
                  {prPieData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#8ba3be' }}>No PR data yet</div>
                  ) : (
                    <>
                      <ResponsiveContainer width="100%" height={140}>
                        <PieChart>
                          <Pie data={prPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={38} outerRadius={62} paddingAngle={3} strokeWidth={0}>
                            {prPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => [v, 'PRs']} contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="space-y-2 mt-2">
                        {prPieData.map((item, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                              <span className="font-medium" style={{ color: '#4a6480' }}>{item.name}</span>
                            </div>
                            <span className="font-bold" style={{ color: '#0d1f30' }}>{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <SectionCard title="Developer Adoption">
                <div className="p-4">
                  {devAdoptionData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#8ba3be' }}>No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={devAdoptionData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                        <Bar dataKey="sessions" name="Sessions" fill="#0078d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </SectionCard>

              <SectionCard title="ACU Consumption by Developer">
                <div className="p-4">
                  {devAdoptionData.length === 0 ? (
                    <div className="flex items-center justify-center h-48 text-xs" style={{ color: '#8ba3be' }}>No data</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={devAdoptionData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                        <Bar dataKey="acu" name="ACU Used" fill="#e07b39" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </SectionCard>
            </div>

            {/* Category Analysis */}
            {categories.length > 0 && (
              <SectionCard title="Category Analysis">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Category</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Sessions</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Developers</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Merged PRs</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categories.map((cat: any, i: number) => (
                        <tr key={i} className="border-b transition-colors" style={{ borderColor: '#f0f4f8' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-sm font-semibold" style={{ color: '#0d1f30' }}>
                                {cat.category === 'uncategorized' ? 'Uncategorized' : cat.category.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}
                              </span>
                              {cat.subcategory && (
                                <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#f0f4f8', color: '#8ba3be' }}>
                                  {cat.subcategory}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: '#0d1f30' }}>{cat.sessions}</td>
                          <td className="px-4 py-3 text-right font-semibold" style={{ color: '#4a6480' }}>{cat.developers}</td>
                          <td className="px-4 py-3 text-right">
                            <Badge variant="green">{cat.merged_prs}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}

            {/* Developer Leaderboard */}
            <SectionCard title="Developer Devin Leaderboard" action={
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ba3be' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search..."
                    className="pl-7 pr-3 py-1.5 text-xs rounded-lg border outline-none w-40"
                    style={{ borderColor: '#e5eaf0', background: '#f7fafd', color: '#0d1f30' }}
                  />
                </div>
                <Select
                  value={sortBy}
                  onChange={v => { setSortBy(v); setPage(1); }}
                  options={[
                    { value: 'ai_score', label: 'Sort: AI Score' },
                    { value: 'sessions', label: 'Sort: Sessions' },
                    { value: 'acu', label: 'Sort: ACU' },
                    { value: 'merged_prs', label: 'Sort: Merged PRs' },
                  ]}
                />
              </div>
            }>
              {filtered.length === 0 ? (
                <EmptyState icon={<Users size={28} />} title="No developers found" description="Try adjusting your search" />
              ) : (
                <>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Rank</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Developer</th>
                          <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Team</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Sessions</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>ACU</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>PRs</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Merged</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Success</th>
                          <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>AI Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paged.map((dev, i) => {
                          const rank = (page - 1) * PAGE_SIZE + i + 1;
                          const medal = MEDAL[rank];
                          const successRate = dev.total_prs > 0 ? Math.round((dev.merged_prs / dev.total_prs) * 100) : 0;
                          const initials = dev.user_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() ||
                            dev.user_email.slice(0, 2).toUpperCase();
                          return (
                            <tr key={dev.user_email} className="border-b transition-colors" style={{ borderColor: '#f0f4f8' }}
                              onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                              <td className="px-4 py-3">
                                <div
                                  className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
                                  style={medal ? { background: medal.bg, color: medal.color } : { background: '#f0f4f8', color: '#8ba3be' }}
                                >
                                  {rank}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                    style={{ background: CHART_COLORS[(rank - 1) % CHART_COLORS.length] }}
                                  >
                                    {initials}
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{dev.user_name || dev.user_email}</p>
                                    <p className="text-xs" style={{ color: '#8ba3be' }}>{dev.user_email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-lg" style={{ background: '#f0f4f8', color: '#4a6480' }}>
                                  {dev.team_name}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ color: '#0d1f30' }}>{dev.sessions}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ color: '#4a6480' }}>{fmt2(dev.acu_used)}</td>
                              <td className="px-4 py-3 text-right font-semibold" style={{ color: '#4a6480' }}>{dev.total_prs}</td>
                              <td className="px-4 py-3 text-right">
                                <Badge variant="green">{dev.merged_prs}</Badge>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-xs font-bold" style={{ color: successRate >= 80 ? '#059669' : successRate >= 50 ? '#d97706' : '#dc2626' }}>
                                  {successRate}%
                                </span>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <span className="text-sm font-bold" style={{ color: '#0078d4' }}>{dev.ai_score}</span>
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
