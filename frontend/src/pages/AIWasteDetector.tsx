import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Trash2, AlertTriangle, TrendingDown, DollarSign, RefreshCw, Zap } from 'lucide-react';
import { fetchAIWaste, fetchRecommendations } from '../api/analytics';
import { SectionCard, KpiCard, Badge, Select, SearchBar, FilterBar, Pagination, LoadingOverlay, EmptyState, ProgressBar, PageHeader } from '../components/ui';

const PAGE_SIZE = 8;

const SEVERITY_COLOR: Record<string, string> = { high: '#dc2626', medium: '#d97706', low: '#0078d4' };
const SEVERITY_BG: Record<string, string> = { high: '#fef2f2', medium: '#fffbeb', low: '#eff6ff' };

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'blue' | 'gray'> = {
  critical: 'red', high: 'red', medium: 'yellow', low: 'blue',
};

export default function AIWasteDetector() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const { data: wasteData, isLoading: isWasteLoading } = useQuery({ queryKey: ['ai-waste'], queryFn: fetchAIWaste });
  const recommendations = useQuery({ queryKey: ['recommendations'], queryFn: fetchRecommendations });

  const isLoading = isWasteLoading || recommendations.isLoading;

  const wasteItems: any[] = wasteData?.items ?? [];
  const trendData: any[] = wasteData?.trendData ?? [];
  const totalOccurrences = wasteData?.totalOccurrences ?? 0;
  const totalWasteCost = wasteData?.totalEstimatedWasteCost ?? 0;
  const highSeverityCount = wasteData?.highSeverityCount ?? 0;
  const savingsOpp = Math.round(totalWasteCost * 0.7);

  const filtered = useMemo(() => {
    let data = [...wasteItems];
    if (search) data = data.filter((w: any) => w.description.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase()));
    if (severityFilter !== 'all') data = data.filter((w: any) => w.severity === severityFilter);
    if (categoryFilter !== 'all') data = data.filter((w: any) => w.category === categoryFilter);
    return data;
  }, [wasteItems, search, severityFilter, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const pieData = [
    { name: 'Efficiency', value: wasteItems.filter((w: any) => w.category === 'efficiency').reduce((s: number, w: any) => s + w.estimatedCost, 0), color: '#dc2626' },
    { name: 'Redundancy', value: wasteItems.filter((w: any) => w.category === 'redundancy').reduce((s: number, w: any) => s + w.estimatedCost, 0), color: '#d97706' },
    { name: 'Cost', value: wasteItems.filter((w: any) => w.category === 'cost').reduce((s: number, w: any) => s + w.estimatedCost, 0), color: '#8b5cf6' },
    { name: 'Optimization', value: wasteItems.filter((w: any) => w.category === 'optimization').reduce((s: number, w: any) => s + w.estimatedCost, 0), color: '#0078d4' },
    { name: 'Security', value: wasteItems.filter((w: any) => w.category === 'security').reduce((s: number, w: any) => s + w.estimatedCost, 0), color: '#ec4899' },
  ];

  if (isLoading) {
    return <LoadingOverlay />;
  }

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="AI Waste Detector"
        subtitle="Identify inefficiencies, redundancies & cost-saving opportunities"
        actions={
          <button className="btn-primary">
            <RefreshCw size={13} /> Scan Now
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Waste Events" value={String(totalOccurrences)} change={-8.4} icon={<Trash2 size={17} />} iconBg="#fef2f2" iconColor="#dc2626" />
          <KpiCard label="Estimated Waste Cost" value={`$${totalWasteCost.toLocaleString()}`} change={-12.1} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="High Severity" value={String(highSeverityCount)} icon={<AlertTriangle size={17} />} iconBg="#fef2f2" iconColor="#dc2626" sub="critical events" />
          <KpiCard label="Savings Opportunity" value={`$${savingsOpp.toLocaleString()}`} icon={<TrendingDown size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" sub="if optimized" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="Waste Trend — 7 Days" className="xl:col-span-2">
            <div className="p-4 pt-3">
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gWaste" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                    formatter={(v: number) => [`$${v.toLocaleString()}`, 'Waste Cost']}
                  />
                  <Area type="monotone" dataKey="waste" stroke="#dc2626" strokeWidth={2.5} fill="url(#gWaste)" dot={{ r: 4, fill: '#dc2626', stroke: 'white', strokeWidth: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Waste by Category">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={135}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={32} outerRadius={58} paddingAngle={3} strokeWidth={0}>
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
                      <span className="font-medium" style={{ color: '#4a6480' }}>{item.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: '#0d1f30' }}>${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Recommendations */}
        {(recommendations.data || []).slice(0, 3).length > 0 && (
          <SectionCard title="AI Recommendations" action={
            <span className="text-xs font-semibold px-2 py-0.5 rounded-lg" style={{ background: '#f0fdf4', color: '#059669' }}>
              <Zap size={10} className="inline mr-1" />
              {(recommendations.data || []).length} tips
            </span>
          }>
            <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
              {(recommendations.data || []).slice(0, 3).map((r: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl border transition-all duration-150 cursor-default"
                  style={{ borderColor: '#f0f4f8', background: '#fafbfc' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,120,212,0.08)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#f0f4f8'; e.currentTarget.style.boxShadow = 'none'; }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#8ba3be' }}>{r.category}</span>
                    <Badge variant={(PRIORITY_BADGE[r.priority] || 'gray') as any}>{r.priority}</Badge>
                  </div>
                  <p className="text-sm font-semibold mb-1" style={{ color: '#0d1f30' }}>{r.title}</p>
                  <p className="text-xs leading-relaxed mb-2.5" style={{ color: '#4a6480' }}>{r.description}</p>
                  {r.estimatedSavings && (
                    <div className="flex items-center gap-1.5" style={{ color: '#059669' }}>
                      <DollarSign size={11} />
                      <span className="text-xs font-bold">Save ${r.estimatedSavings.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search waste items..." className="w-56" />
            <Select value={severityFilter} onChange={v => { setSeverityFilter(v); setPage(1); }} options={[
              { value: 'all', label: 'All Severity' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]} />
            <Select value={categoryFilter} onChange={v => { setCategoryFilter(v); setPage(1); }} options={[
              { value: 'all', label: 'All Categories' },
              { value: 'efficiency', label: 'Efficiency' },
              { value: 'redundancy', label: 'Redundancy' },
              { value: 'cost', label: 'Cost' },
              { value: 'optimization', label: 'Optimization' },
              { value: 'security', label: 'Security' },
            ]} />
          </FilterBar>
          <span className="text-xs font-medium" style={{ color: '#8ba3be' }}>{filtered.length} items</span>
        </div>

        {/* Table */}
        <SectionCard>
          {filtered.length === 0 ? (
            <EmptyState icon={<Trash2 size={28} />} title="No waste items found" description="Try adjusting filters or run a new scan" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                      <th className="table-header-cell">Issue</th>
                      <th className="table-header-cell">Category</th>
                      <th className="table-header-cell text-center">Severity</th>
                      <th className="table-header-cell text-right">Occurrences</th>
                      <th className="table-header-cell text-right">Est. Cost</th>
                      <th className="table-header-cell min-w-[120px]">Impact</th>
                      <th className="table-header-cell text-right">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((w) => (
                      <tr
                        key={w.id}
                        className="border-b transition-colors"
                        style={{ borderColor: '#f0f4f8' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: SEVERITY_BG[w.severity] }}
                            >
                              <AlertTriangle size={13} style={{ color: SEVERITY_COLOR[w.severity] }} />
                            </div>
                            <p className="text-sm font-medium" style={{ color: '#0d1f30' }}>{w.description}</p>
                          </div>
                        </td>
                        <td className="table-cell capitalize text-xs font-medium" style={{ color: '#4a6480' }}>{w.category}</td>
                        <td className="table-cell text-center">
                          <Badge variant={w.severity === 'high' ? 'red' : w.severity === 'medium' ? 'yellow' : 'blue'}>
                            {w.severity}
                          </Badge>
                        </td>
                        <td className="table-cell text-right font-bold" style={{ color: '#0d1f30' }}>{w.occurrences}</td>
                        <td className="table-cell text-right font-bold" style={{ color: SEVERITY_COLOR[w.severity] }}>
                          ${w.estimatedCost.toLocaleString()}
                        </td>
                        <td className="table-cell">
                          <ProgressBar value={w.estimatedCost} max={totalWasteCost / 3} color={SEVERITY_COLOR[w.severity]} className="w-24" />
                        </td>
                        <td className="table-cell text-right">
                          <span
                            className="text-xs font-bold"
                            style={{ color: w.trend < 0 ? '#059669' : w.trend > 0 ? '#dc2626' : '#8ba3be' }}
                          >
                            {w.trend > 0 ? '+' : ''}{w.trend}%
                          </span>
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
