import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { MessageSquare, TrendingUp, CheckCircle, Zap, Search } from 'lucide-react';
import { fetchPromptRanking } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, FilterBar, LoadingOverlay, EmptyState, ProgressBar, Tabs } from '../components/ui';

const PAGE_SIZE = 8;

function fmt(n: number) {
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

const TIER_COLOR = (rate: number) => rate >= 90 ? '#10b981' : rate >= 85 ? '#0078d4' : '#f59e0b';
const TIER_BADGE = (rate: number): 'green' | 'blue' | 'yellow' => rate >= 90 ? 'green' : rate >= 85 ? 'blue' : 'yellow';

export default function PromptAnalytics() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('all');
  const [sortBy, setSortBy] = useState('uses');
  const [page, setPage] = useState(1);

  const ranking = useQuery({ queryKey: ['prompt-ranking'], queryFn: fetchPromptRanking });

  const data = ranking.data || [];

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) d = d.filter((p: any) => p.prompt.toLowerCase().includes(search.toLowerCase()));
    if (tab === 'high') d = d.filter((p: any) => p.successRate >= 90);
    if (tab === 'low') d = d.filter((p: any) => p.successRate < 85);
    d.sort((a: any, b: any) => {
      if (sortBy === 'uses') return b.uses - a.uses;
      if (sortBy === 'success') return b.successRate - a.successRate;
      if (sortBy === 'tokens') return a.avgTokens - b.avgTokens;
      if (sortBy === 'rank') return b.rankScore - a.rankScore;
      return 0;
    });
    return d;
  }, [data, search, tab, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalUses = data.reduce((s: number, p: any) => s + p.uses, 0);
  const avgSuccess = data.length ? Math.round(data.reduce((s: number, p: any) => s + p.successRate, 0) / data.length) : 0;
  const avgTokens = data.length ? Math.round(data.reduce((s: number, p: any) => s + p.avgTokens, 0) / data.length) : 0;
  const top = data[0] as any;

  const barDataUse = data.slice(0, 8).map((p: any) => ({
    name: p.prompt.length > 20 ? p.prompt.slice(0, 20) + '…' : p.prompt,
    uses: p.uses,
    success: p.successRate,
  }));

  const scatterData = data.map((p: any) => ({
    x: p.avgTokens,
    y: p.successRate,
    z: p.uses / 1000,
    name: p.prompt,
  }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Prompt Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Usage patterns, success rates & token efficiency</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <MessageSquare size={13} /> Export Prompts
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Prompt Uses" value={fmt(totalUses)} change={22.4} icon={<MessageSquare size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Avg Success Rate" value={`${avgSuccess}%`} change={3.1} icon={<CheckCircle size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Avg Tokens/Prompt" value={fmt(avgTokens)} icon={<Zap size={18} />} iconBg="#fef9c3" iconColor="#d97706" />
          <KpiCard label="Top Prompt" value={top ? fmt(top.uses) + ' uses' : '–'} icon={<TrendingUp size={18} />} iconBg="#fff7ed" iconColor="#ea580c" sub={top?.prompt?.slice(0, 18) + '…'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-6">
          <SectionCard title="Top Prompts by Usage">
            <div className="p-4">
              {ranking.isLoading ? <div className="animate-pulse bg-gray-100 rounded h-48" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barDataUse} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={150} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(v: number, name: string) => [name === 'uses' ? fmt(v) : `${v}%`, name === 'uses' ? 'Uses' : 'Success Rate']} />
                    <Bar dataKey="uses" name="uses" radius={[0, 4, 4, 0]}>
                      {barDataUse.map((_d: any, i: number) => <Cell key={i} fill={['#0078d4', '#00b4d8', '#e07b39', '#10b981', '#f59e0b', '#6366f1', '#ec4899', '#14b8a6'][i % 8]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Token Usage vs Success Rate">
            <div className="p-4">
              {ranking.isLoading ? <div className="animate-pulse bg-gray-100 rounded h-48" /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="x" name="Avg Tokens" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} label={{ value: 'Avg Tokens', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }} />
                    <YAxis dataKey="y" name="Success %" domain={[80, 100]} tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} label={{ value: 'Success %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#94a3b8' }} />
                    <ZAxis dataKey="z" range={[40, 200]} />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: 8, fontSize: 12 }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border border-gray-200 rounded-lg p-2.5 shadow-lg text-xs">
                            <p className="font-semibold text-gray-800 mb-1">{d.name}</p>
                            <p className="text-gray-500">Tokens: {d.x} &nbsp;·&nbsp; Success: {d.y}%</p>
                          </div>
                        );
                      }}
                    />
                    <Scatter data={scatterData} fill="#0078d4" opacity={0.7} />
                  </ScatterChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>
        </div>

        {/* Success Rate Distribution */}
        <SectionCard title="Success Rate Distribution" className="mb-6">
          <div className="p-5">
            <div className="grid grid-cols-3 gap-4 mb-4">
              {[
                { label: 'High (≥ 90%)', count: data.filter((p: any) => p.successRate >= 90).length, color: '#10b981', bg: '#f0fdf4' },
                { label: 'Medium (85–89%)', count: data.filter((p: any) => p.successRate >= 85 && p.successRate < 90).length, color: '#0078d4', bg: '#eff6ff' },
                { label: 'Low (< 85%)', count: data.filter((p: any) => p.successRate < 85).length, color: '#f59e0b', bg: '#fef9c3' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl text-center" style={{ background: item.bg }}>
                  <p className="text-2xl font-bold" style={{ color: item.color }}>{item.count}</p>
                  <p className="text-xs font-medium text-gray-500 mt-0.5">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </SectionCard>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search prompts..." className="w-60" />
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              {[{ id: 'all', label: 'All' }, { id: 'high', label: 'High Success' }, { id: 'low', label: 'Low Success' }].map(t => (
                <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${tab === t.id ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          </FilterBar>
          <Select value={sortBy} onChange={setSortBy} options={[
            { value: 'uses', label: 'Sort: Uses' },
            { value: 'success', label: 'Sort: Success Rate' },
            { value: 'tokens', label: 'Sort: Token Efficiency' },
            { value: 'rank', label: 'Sort: Rank Score' },
          ]} />
        </div>

        {/* Table */}
        <SectionCard>
          {ranking.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
            <EmptyState icon={<Search size={28} />} title="No prompts match" description="Try a different search or filter" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">#</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prompt</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Uses</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Success Rate</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Tokens</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rank Score</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Quality</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((p: any, i: number) => {
                      const rank = (page - 1) * PAGE_SIZE + i + 1;
                      return (
                        <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-3.5 text-xs text-gray-400">{rank}</td>
                          <td className="px-5 py-3.5">
                            <p className="text-sm font-medium text-gray-800">{p.prompt}</p>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{p.uses.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <ProgressBar value={p.successRate} max={100} color={TIER_COLOR(p.successRate)} className="w-16" />
                              <span className="text-sm font-semibold" style={{ color: TIER_COLOR(p.successRate) }}>{p.successRate}%</span>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm text-gray-600">{p.avgTokens.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">{p.rankScore.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge variant={TIER_BADGE(p.successRate)}>
                              {p.successRate >= 90 ? 'Excellent' : p.successRate >= 85 ? 'Good' : 'Needs Work'}
                            </Badge>
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
