import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Cpu, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { fetchModelEfficiency } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, FilterBar, LoadingOverlay, EmptyState, ProgressBar } from '../components/ui';

const PAGE_SIZE = 8;

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

const MODEL_COLORS = ['#0078d4', '#e07b39', '#00b4d8', '#10b981', '#f59e0b', '#6366f1'];
const MODEL_DETAILS: Record<string, { provider: string; context: string; speed: number; quality: number; cost_tier: string }> = {
  'GPT-4o': { provider: 'OpenAI', context: '128K', speed: 72, quality: 95, cost_tier: 'premium' },
  'Claude 3.5 Sonnet': { provider: 'Anthropic', context: '200K', speed: 85, quality: 96, cost_tier: 'premium' },
  'GPT-4 Turbo': { provider: 'OpenAI', context: '128K', speed: 68, quality: 92, cost_tier: 'premium' },
  'Claude 3 Haiku': { provider: 'Anthropic', context: '200K', speed: 98, quality: 82, cost_tier: 'economy' },
  'Gemini 1.5 Pro': { provider: 'Google', context: '1M', speed: 76, quality: 90, cost_tier: 'standard' },
};

const COST_TIER_BADGE: Record<string, 'blue' | 'orange' | 'green'> = { premium: 'blue', standard: 'orange', economy: 'green' };

export default function ModelAnalytics() {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('cost');
  const [page, setPage] = useState(1);

  const efficiency = useQuery({ queryKey: ['model-efficiency'], queryFn: fetchModelEfficiency });

  const data = efficiency.data || [];

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) d = d.filter((m: any) => m.model.toLowerCase().includes(search.toLowerCase()));
    d.sort((a: any, b: any) => {
      if (sortBy === 'cost') return b.cost - a.cost;
      if (sortBy === 'efficiency') return a.efficiencyScore - b.efficiencyScore;
      if (sortBy === 'share') return b.costShare - a.costShare;
      return 0;
    });
    return d;
  }, [data, search, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCost = data.reduce((s: number, m: any) => s + m.cost, 0);
  const topModel = data[0] as any;
  const mostEfficient = [...data].sort((a: any, b: any) => a.efficiencyScore - b.efficiencyScore)[0] as any;

  const pieData = data.map((m: any, i: number) => ({ name: m.model, value: m.cost, color: MODEL_COLORS[i % MODEL_COLORS.length] }));
  const radarData = Object.entries(MODEL_DETAILS).slice(0, 3).map(([model, d]) => ({
    subject: model.length > 14 ? model.slice(0, 14) + '…' : model,
    speed: d.speed,
    quality: d.quality,
    costEff: 100 - Math.min(100, ((data.find((m: any) => m.model === model)?.efficiencyScore || 2000) / 40)),
  }));

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Model Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Cost, efficiency & performance by AI model</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <Cpu size={13} /> Export
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Model Cost" value={`$${(totalCost / 1000).toFixed(0)}K`} change={21.4} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Models Active" value={String(data.length)} icon={<Cpu size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Top Spend" value={topModel?.model?.split(' ')[0] || '–'} icon={<TrendingUp size={18} />} iconBg="#fef9c3" iconColor="#d97706" sub={topModel ? `$${topModel.cost.toLocaleString()}` : ''} />
          <KpiCard label="Most Efficient" value={mostEfficient?.model?.split(' ')[0] || '–'} icon={<Zap size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" sub={mostEfficient ? `Score: ${mostEfficient.efficiencyScore}` : ''} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <SectionCard title="Cost Distribution">
            {efficiency.isLoading ? <div className="p-5 animate-pulse bg-gray-100 rounded h-64" /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {pieData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm" style={{ background: item.color }} />
                        <span className="text-gray-600 truncate max-w-[120px]">{item.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <span className="text-gray-400">{Math.round((item.value / totalCost) * 100)}%</span>
                        <span className="font-semibold text-gray-800">${item.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cost Comparison">
            {efficiency.isLoading ? <div className="p-5 animate-pulse bg-gray-100 rounded h-64" /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data.map((m: any, i: number) => ({ name: m.model.split(' ')[0], cost: m.cost, color: MODEL_COLORS[i % MODEL_COLORS.length] }))} margin={{ top: 5, right: 5, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                      {data.map((_: any, i: number) => <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Model Capability Radar">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={240}>
                <RadarChart data={[
                  { subject: 'Speed', 'GPT-4o': 72, 'Claude 3.5': 85, 'Haiku': 98 },
                  { subject: 'Quality', 'GPT-4o': 95, 'Claude 3.5': 96, 'Haiku': 82 },
                  { subject: 'Context', 'GPT-4o': 70, 'Claude 3.5': 90, 'Haiku': 90 },
                  { subject: 'Cost Eff', 'GPT-4o': 60, 'Claude 3.5': 65, 'Haiku': 92 },
                  { subject: 'Accuracy', 'GPT-4o': 93, 'Claude 3.5': 95, 'Haiku': 80 },
                ]} cx="50%" cy="50%" outerRadius={80}>
                  <PolarGrid stroke="#f1f5f9" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#94a3b8' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="GPT-4o" stroke="#0078d4" fill="#0078d4" fillOpacity={0.1} strokeWidth={2} />
                  <Radar dataKey="Claude 3.5" stroke="#e07b39" fill="#e07b39" fillOpacity={0.1} strokeWidth={2} />
                  <Radar dataKey="Haiku" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search models..." className="w-52" />
          </FilterBar>
          <Select value={sortBy} onChange={setSortBy} options={[
            { value: 'cost', label: 'Sort: Cost' },
            { value: 'efficiency', label: 'Sort: Efficiency' },
            { value: 'share', label: 'Sort: Cost Share' },
          ]} />
        </div>

        {/* Table */}
        <SectionCard>
          {efficiency.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
            <EmptyState icon={<Cpu size={28} />} title="No models found" />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Model</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Provider</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tier</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Cost</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost Share</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Cost Share Bar</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Eff. Score</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {paged.map((m: any, i: number) => {
                      const details = MODEL_DETAILS[m.model] || { provider: 'Unknown', context: '–', cost_tier: 'standard' };
                      const color = MODEL_COLORS[(page - 1) * PAGE_SIZE + i];
                      return (
                        <tr key={m.model} className="hover:bg-blue-50/30 transition-colors">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ background: color }}>
                                {m.model.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-800">{m.model}</p>
                                <p className="text-xs text-gray-400">Context: {details.context}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3.5 text-xs text-gray-600">{details.provider}</td>
                          <td className="px-5 py-3.5">
                            <Badge variant={COST_TIER_BADGE[details.cost_tier] || 'gray'}>{details.cost_tier}</Badge>
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm font-bold text-gray-900">${m.cost.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">{m.costShare}%</td>
                          <td className="px-5 py-3.5">
                            <ProgressBar value={m.costShare} max={35} color={color} className="w-24" />
                          </td>
                          <td className="px-5 py-3.5 text-right text-sm text-gray-700">{m.efficiencyScore.toLocaleString()}</td>
                          <td className="px-5 py-3.5 text-center">
                            <Badge variant={m.tier === 'high' ? 'green' : m.tier === 'medium' ? 'blue' : 'yellow'}>
                              {m.tier}
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
