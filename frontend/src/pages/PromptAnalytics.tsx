import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ScatterChart, Scatter, ZAxis } from 'recharts';
import { MessageSquare, TrendingUp, CircleCheck as CheckCircle, Zap, Download } from 'lucide-react';
import { fetchPromptRanking } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, FilterBar, LoadingOverlay, EmptyState, ProgressBar, PageHeader } from '../components/ui';

const PAGE_SIZE = 8;

function fmt(n: number) {
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

const TIER_COLOR = (rate: number) => rate >= 90 ? '#059669' : rate >= 85 ? '#0078d4' : '#d97706';
const TIER_BADGE = (rate: number): 'green' | 'blue' | 'yellow' => rate >= 90 ? 'green' : rate >= 85 ? 'blue' : 'yellow';

const BAR_COLORS = ['#0078d4', '#10b981', '#e07b39', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#3b82f6'];

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
    name: p.prompt.length > 22 ? p.prompt.slice(0, 22) + '…' : p.prompt,
    uses: p.uses,
    success: p.successRate,
  }));

  const scatterData = data.map((p: any) => ({
    x: p.avgTokens,
    y: p.successRate,
    z: p.uses / 1000,
    name: p.prompt,
  }));

  const highCount = data.filter((p: any) => p.successRate >= 90).length;
  const medCount = data.filter((p: any) => p.successRate >= 85 && p.successRate < 90).length;
  const lowCount = data.filter((p: any) => p.successRate < 85).length;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Prompt Analytics"
        subtitle="Usage patterns, success rates & token efficiency"
        actions={
          <button className="btn-primary">
            <Download size={13} /> Export Prompts
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Prompt Uses" value={fmt(totalUses)} change={22.4} icon={<MessageSquare size={17} />} iconBg="#eff6ff" iconColor="#0078d4" />
          <KpiCard label="Avg Success Rate" value={`${avgSuccess}%`} change={3.1} icon={<CheckCircle size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Avg Tokens/Prompt" value={fmt(avgTokens)} icon={<Zap size={17} />} iconBg="#fffbeb" iconColor="#d97706" />
          <KpiCard label="Top Prompt" value={top ? fmt(top.uses) + ' uses' : '–'} icon={<TrendingUp size={17} />} iconBg="#fff7ed" iconColor="#ea580c" sub={top?.prompt?.slice(0, 18) + '…'} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard title="Top Prompts by Usage">
            <div className="p-4 pt-3">
              {ranking.isLoading ? <div className="animate-pulse rounded-xl h-48" style={{ background: '#edf1f5' }} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={barDataUse} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={fmt} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: '#4a6480' }} tickLine={false} axisLine={false} width={150} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      formatter={(v: number, name: string) => [name === 'uses' ? fmt(v) : `${v}%`, name === 'uses' ? 'Uses' : 'Success Rate']}
                    />
                    <Bar dataKey="uses" name="uses" radius={[0, 4, 4, 0]}>
                      {barDataUse.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </SectionCard>

          <SectionCard title="Token Usage vs Success Rate">
            <div className="p-4 pt-3">
              {ranking.isLoading ? <div className="animate-pulse rounded-xl h-48" style={{ background: '#edf1f5' }} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <ScatterChart margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" />
                    <XAxis dataKey="x" name="Avg Tokens" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} label={{ value: 'Avg Tokens', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#8ba3be' }} />
                    <YAxis dataKey="y" name="Success %" domain={[80, 100]} tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} label={{ value: 'Success %', angle: -90, position: 'insideLeft', offset: 10, fontSize: 10, fill: '#8ba3be' }} />
                    <ZAxis dataKey="z" range={[40, 200]} />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      content={({ payload }) => {
                        if (!payload?.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-white border rounded-xl p-2.5 shadow-lg text-xs" style={{ borderColor: '#e5eaf0' }}>
                            <p className="font-semibold mb-1" style={{ color: '#0d1f30' }}>{d.name}</p>
                            <p style={{ color: '#4a6480' }}>Tokens: {d.x} · Success: {d.y}%</p>
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

        {/* Success Rate Summary */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Excellent (≥ 90%)', count: highCount, color: '#059669', bg: '#f0fdf4', border: '#a7f3d0' },
            { label: 'Good (85–89%)', count: medCount, color: '#0078d4', bg: '#eff6ff', border: '#bfdbfe' },
            { label: 'Needs Work (< 85%)', count: lowCount, color: '#d97706', bg: '#fffbeb', border: '#fde68a' },
          ].map(item => (
            <div
              key={item.label}
              className="rounded-xl border p-4 text-center transition-all duration-150 cursor-default"
              style={{ background: item.bg, borderColor: item.border }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,30,60,0.08)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              <p className="text-3xl font-bold" style={{ color: item.color }}>{item.count}</p>
              <p className="text-xs font-semibold mt-1" style={{ color: item.color }}>{item.label}</p>
              <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>
                {data.length ? Math.round((item.count / data.length) * 100) : 0}% of prompts
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search prompts..." className="w-60" />
            <div className="flex rounded-lg border overflow-hidden" style={{ borderColor: '#e5eaf0' }}>
              {[{ id: 'all', label: 'All' }, { id: 'high', label: 'High Success' }, { id: 'low', label: 'Low Success' }].map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setPage(1); }}
                  className="px-3 py-1.5 text-xs font-semibold transition-colors"
                  style={tab === t.id
                    ? { background: '#0078d4', color: 'white' }
                    : { color: '#8ba3be', background: 'white' }
                  }
                >
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
            <EmptyState icon={<MessageSquare size={28} />} title="No prompts match" description="Try a different search or filter" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                      <th className="table-header-cell">#</th>
                      <th className="table-header-cell">Prompt</th>
                      <th className="table-header-cell text-right">Uses</th>
                      <th className="table-header-cell text-right">Success Rate</th>
                      <th className="table-header-cell text-right">Avg Tokens</th>
                      <th className="table-header-cell text-right">Rank Score</th>
                      <th className="table-header-cell text-center">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((p: any, i: number) => {
                      const rank = (page - 1) * PAGE_SIZE + i + 1;
                      return (
                        <tr
                          key={p.id}
                          className="border-b transition-colors"
                          style={{ borderColor: '#f0f4f8' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="table-cell text-xs" style={{ color: '#8ba3be' }}>{rank}</td>
                          <td className="table-cell">
                            <p className="text-sm font-medium" style={{ color: '#0d1f30' }}>{p.prompt}</p>
                          </td>
                          <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>{p.uses.toLocaleString()}</td>
                          <td className="table-cell text-right">
                            <div className="flex items-center justify-end gap-2">
                              <ProgressBar value={p.successRate} max={100} color={TIER_COLOR(p.successRate)} className="w-16" />
                              <span className="text-sm font-bold" style={{ color: TIER_COLOR(p.successRate) }}>{p.successRate}%</span>
                            </div>
                          </td>
                          <td className="table-cell text-right" style={{ color: '#4a6480' }}>{p.avgTokens.toLocaleString()}</td>
                          <td className="table-cell text-right font-semibold" style={{ color: '#4a6480' }}>{p.rankScore.toLocaleString()}</td>
                          <td className="table-cell text-center">
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
