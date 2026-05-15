import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, LineChart, Line } from 'recharts';
import { Trash2, AlertTriangle, TrendingDown, DollarSign, Zap, RefreshCw } from 'lucide-react';
import { fetchAIWaste, fetchRecommendations } from '../api/analytics';
import { SectionCard, KpiCard, Badge, Select, SearchBar, FilterBar, Pagination, LoadingOverlay, EmptyState, ProgressBar } from '../components/ui';

const PAGE_SIZE = 8;

const SEVERITY_COLOR: Record<string, string> = { high: '#ef4444', medium: '#f59e0b', low: '#3b82f6' };
const SEVERITY_BG: Record<string, string> = { high: '#fef2f2', medium: '#fffbeb', low: '#eff6ff' };

const extendedWaste = [
  { id: 1, category: 'efficiency', description: 'High token, low success prompts', occurrences: 23, severity: 'high', estimatedCost: 2760, trend: -5 },
  { id: 2, category: 'redundancy', description: 'Repeated identical prompts', occurrences: 156, severity: 'medium', estimatedCost: 6240, trend: -12 },
  { id: 3, category: 'cost', description: 'Overused expensive models for simple tasks', occurrences: 14, severity: 'high', estimatedCost: 1680, trend: 3 },
  { id: 4, category: 'optimization', description: 'Inefficient long-context prompts', occurrences: 31, severity: 'low', estimatedCost: 310, trend: -8 },
  { id: 5, category: 'redundancy', description: 'Multi-turn prompts with context loss', occurrences: 45, severity: 'medium', estimatedCost: 1800, trend: -2 },
  { id: 6, category: 'efficiency', description: 'Prompts with no clear instructions', occurrences: 67, severity: 'medium', estimatedCost: 2680, trend: 5 },
  { id: 7, category: 'security', description: 'Prompts containing PII or secrets', occurrences: 3, severity: 'high', estimatedCost: 360, trend: 0 },
  { id: 8, category: 'cost', description: 'Unused completions (aborted sessions)', occurrences: 89, severity: 'low', estimatedCost: 890, trend: -15 },
  { id: 9, category: 'optimization', description: 'Duplicate code generation requests', occurrences: 52, severity: 'medium', estimatedCost: 2080, trend: -7 },
  { id: 10, category: 'efficiency', description: 'Overly complex system prompts', occurrences: 18, severity: 'low', estimatedCost: 180, trend: 2 },
];

const trendData = [
  { date: 'May 12', waste: 4200 }, { date: 'May 13', waste: 3800 }, { date: 'May 14', waste: 4600 },
  { date: 'May 15', waste: 3200 }, { date: 'May 16', waste: 3900 }, { date: 'May 17', waste: 2800 },
  { date: 'May 18', waste: 2400 },
];

const PRIORITY_BADGE: Record<string, 'red' | 'yellow' | 'blue' | 'gray'> = { critical: 'red', high: 'red', medium: 'yellow', low: 'blue' };

export default function AIWasteDetector() {
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [page, setPage] = useState(1);

  const waste = useQuery({ queryKey: ['ai-waste'], queryFn: fetchAIWaste });
  const recommendations = useQuery({ queryKey: ['recommendations'], queryFn: fetchRecommendations });

  const filtered = useMemo(() => {
    let data = [...extendedWaste];
    if (search) data = data.filter(w => w.description.toLowerCase().includes(search.toLowerCase()) || w.category.toLowerCase().includes(search.toLowerCase()));
    if (severityFilter !== 'all') data = data.filter(w => w.severity === severityFilter);
    if (categoryFilter !== 'all') data = data.filter(w => w.category === categoryFilter);
    return data;
  }, [search, severityFilter, categoryFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalOccurrences = extendedWaste.reduce((s, w) => s + w.occurrences, 0);
  const totalWasteCost = extendedWaste.reduce((s, w) => s + w.estimatedCost, 0);
  const highSeverityCount = extendedWaste.filter(w => w.severity === 'high').reduce((s, w) => s + w.occurrences, 0);
  const savingsOpp = Math.round(totalWasteCost * 0.7);

  const pieData = [
    { name: 'Efficiency', value: extendedWaste.filter(w => w.category === 'efficiency').reduce((s, w) => s + w.estimatedCost, 0), color: '#ef4444' },
    { name: 'Redundancy', value: extendedWaste.filter(w => w.category === 'redundancy').reduce((s, w) => s + w.estimatedCost, 0), color: '#f59e0b' },
    { name: 'Cost', value: extendedWaste.filter(w => w.category === 'cost').reduce((s, w) => s + w.estimatedCost, 0), color: '#8b5cf6' },
    { name: 'Optimization', value: extendedWaste.filter(w => w.category === 'optimization').reduce((s, w) => s + w.estimatedCost, 0), color: '#3b82f6' },
    { name: 'Security', value: extendedWaste.filter(w => w.category === 'security').reduce((s, w) => s + w.estimatedCost, 0), color: '#ec4899' },
  ];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">AI Waste Detector</h1>
            <p className="text-xs text-gray-500 mt-0.5">Identify inefficiencies, redundancies & cost-saving opportunities</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <RefreshCw size={13} /> Scan Now
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Waste Events" value={String(totalOccurrences)} change={-8.4} icon={<Trash2 size={18} />} iconBg="#fef2f2" iconColor="#dc2626" />
          <KpiCard label="Estimated Waste Cost" value={`$${totalWasteCost.toLocaleString()}`} change={-12.1} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="High Severity" value={String(highSeverityCount)} icon={<AlertTriangle size={18} />} iconBg="#fef2f2" iconColor="#dc2626" sub="critical events" />
          <KpiCard label="Savings Opportunity" value={`$${savingsOpp.toLocaleString()}`} icon={<TrendingDown size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" sub="if optimized" />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <SectionCard title="Waste Trend (7 Days)" className="xl:col-span-2">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={trendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(1)}K`} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Waste Cost']} />
                  <Line type="monotone" dataKey="waste" stroke="#ef4444" strokeWidth={2.5} dot={{ r: 4, fill: '#ef4444', stroke: 'white', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Waste by Category">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={35} outerRadius={65} paddingAngle={2}>
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
                      <span className="text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">${item.value.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        {/* Recommendations */}
        {(recommendations.data || []).slice(0, 3).length > 0 && (
          <SectionCard title="AI Recommendations" className="mb-6">
            <div className="p-4 grid grid-cols-1 xl:grid-cols-3 gap-3">
              {(recommendations.data || []).slice(0, 3).map((r: any, i: number) => (
                <div key={i} className="p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-sm transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-gray-400">{r.category}</span>
                    <Badge variant={(PRIORITY_BADGE[r.priority] || 'gray') as any}>{r.priority}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mb-1">{r.title}</p>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">{r.description}</p>
                  {r.estimatedSavings && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <DollarSign size={12} />
                      <span className="text-xs font-semibold">Save ${r.estimatedSavings.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
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
          <span className="text-xs text-gray-400">{filtered.length} items</span>
        </div>

        {/* Table */}
        <SectionCard>
          {waste.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
            <EmptyState icon={<Trash2 size={28} />} title="No waste items found" description="Try adjusting filters or run a new scan" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Issue</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Severity</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Occurrences</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Est. Cost</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide min-w-[120px]">Impact</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Trend</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((w) => (
                      <tr key={w.id} className="hover:bg-red-50/20 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: SEVERITY_BG[w.severity] }}>
                              <AlertTriangle size={14} style={{ color: SEVERITY_COLOR[w.severity] }} />
                            </div>
                            <p className="text-sm font-medium text-gray-800">{w.description}</p>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-xs text-gray-600 capitalize">{w.category}</td>
                        <td className="px-5 py-3.5 text-center">
                          <Badge variant={w.severity === 'high' ? 'red' : w.severity === 'medium' ? 'yellow' : 'blue'}>{w.severity}</Badge>
                        </td>
                        <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-900">{w.occurrences}</td>
                        <td className="px-5 py-3.5 text-right text-sm font-bold" style={{ color: SEVERITY_COLOR[w.severity] }}>${w.estimatedCost.toLocaleString()}</td>
                        <td className="px-5 py-3.5">
                          <ProgressBar value={w.estimatedCost} max={totalWasteCost / 3} color={SEVERITY_COLOR[w.severity]} className="w-24" />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <span className={`text-xs font-semibold ${w.trend < 0 ? 'text-emerald-600' : w.trend > 0 ? 'text-red-500' : 'text-gray-400'}`}>
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
