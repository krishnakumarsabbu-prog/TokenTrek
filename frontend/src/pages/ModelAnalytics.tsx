import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Legend } from 'recharts';
import { Cpu, DollarSign, TrendingUp, Zap, Download } from 'lucide-react';
import { fetchModelEfficiency } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, FilterBar, LoadingOverlay, EmptyState, ProgressBar, PageHeader } from '../components/ui';

const PAGE_SIZE = 8;

function fmt(n: number) {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

const MODEL_COLORS = ['#0078d4', '#e07b39', '#10b981', '#8b5cf6', '#f59e0b', '#ec4899'];

const MODEL_DETAILS: Record<string, { provider: string; context: string; speed: number; quality: number; cost_tier: string }> = {
  'GPT-4o': { provider: 'OpenAI', context: '128K', speed: 72, quality: 95, cost_tier: 'premium' },
  'Claude 3.5 Sonnet': { provider: 'Anthropic', context: '200K', speed: 85, quality: 96, cost_tier: 'premium' },
  'GPT-4 Turbo': { provider: 'OpenAI', context: '128K', speed: 68, quality: 92, cost_tier: 'premium' },
  'Claude 3 Haiku': { provider: 'Anthropic', context: '200K', speed: 98, quality: 82, cost_tier: 'economy' },
  'Gemini 1.5 Pro': { provider: 'Google', context: '1M', speed: 76, quality: 90, cost_tier: 'standard' },
};

const COST_TIER_BADGE: Record<string, 'blue' | 'orange' | 'green'> = { premium: 'blue', standard: 'orange', economy: 'green' };

const PROVIDER_LOGOS: Record<string, string> = {
  OpenAI: '#10a37f',
  Anthropic: '#d97706',
  Google: '#4285f4',
  Unknown: '#8ba3be',
};

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

  const pieData = data.map((m: any, i: number) => ({
    name: m.model,
    value: m.cost,
    color: MODEL_COLORS[i % MODEL_COLORS.length],
  }));

  const radarRows = [
    { subject: 'Speed', 'GPT-4o': 72, 'Claude 3.5': 85, 'Haiku': 98 },
    { subject: 'Quality', 'GPT-4o': 95, 'Claude 3.5': 96, 'Haiku': 82 },
    { subject: 'Context', 'GPT-4o': 70, 'Claude 3.5': 90, 'Haiku': 90 },
    { subject: 'Cost Eff', 'GPT-4o': 60, 'Claude 3.5': 65, 'Haiku': 92 },
    { subject: 'Accuracy', 'GPT-4o': 93, 'Claude 3.5': 95, 'Haiku': 80 },
  ];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Model Analytics"
        subtitle="Cost efficiency, performance benchmarks & model comparison"
        actions={
          <button className="btn-primary">
            <Download size={13} /> Export Report
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard label="Total Model Cost" value={`$${(totalCost / 1000).toFixed(0)}K`} change={21.4} icon={<DollarSign size={17} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Models Active" value={String(data.length)} icon={<Cpu size={17} />} iconBg="#eff6ff" iconColor="#0078d4" />
          <KpiCard label="Top Spend" value={topModel?.model?.split(' ')[0] || '–'} icon={<TrendingUp size={17} />} iconBg="#fffbeb" iconColor="#d97706" sub={topModel ? `$${topModel.cost.toLocaleString()}` : ''} />
          <KpiCard label="Most Efficient" value={mostEfficient?.model?.split(' ')[0] || '–'} icon={<Zap size={17} />} iconBg="#f0fdf4" iconColor="#16a34a" sub={mostEfficient ? `Score: ${mostEfficient.efficiencyScore}` : ''} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <SectionCard title="Cost Distribution">
            {efficiency.isLoading ? <div className="p-5"><div className="animate-pulse rounded-xl h-56" style={{ background: '#edf1f5' }} /></div> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={155}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={42} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                      {pieData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']}
                      contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 mt-1">
                  {pieData.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: item.color }} />
                        <span className="font-medium truncate max-w-[110px]" style={{ color: '#4a6480' }}>{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: '#8ba3be' }}>{Math.round((item.value / totalCost) * 100)}%</span>
                        <span className="font-bold" style={{ color: '#0d1f30' }}>${item.value.toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Cost Comparison">
            {efficiency.isLoading ? <div className="p-5"><div className="animate-pulse rounded-xl h-56" style={{ background: '#edf1f5' }} /></div> : (
              <div className="p-4 pt-3">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.map((m: any, i: number) => ({ name: m.model.split(' ')[0], cost: m.cost, color: MODEL_COLORS[i % MODEL_COLORS.length] }))}
                    margin={{ top: 5, right: 5, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip
                      contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }}
                      formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']}
                    />
                    <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                      {data.map((_: any, i: number) => <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Capability Radar">
            <div className="p-4 pt-3">
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarRows} cx="50%" cy="50%" outerRadius={72}>
                  <PolarGrid stroke="#f0f4f8" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8ba3be' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="GPT-4o" stroke="#0078d4" fill="#0078d4" fillOpacity={0.1} strokeWidth={2} />
                  <Radar dataKey="Claude 3.5" stroke="#e07b39" fill="#e07b39" fillOpacity={0.1} strokeWidth={2} />
                  <Radar dataKey="Haiku" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={2} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <FilterBar>
            <SearchBar
              value={search}
              onChange={v => { setSearch(v); setPage(1); }}
              placeholder="Search models..."
              className="w-52"
            />
          </FilterBar>
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'cost', label: 'Sort: Cost' },
              { value: 'efficiency', label: 'Sort: Efficiency' },
              { value: 'share', label: 'Sort: Cost Share' },
            ]}
          />
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
                    <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                      <th className="table-header-cell">Model</th>
                      <th className="table-header-cell">Provider</th>
                      <th className="table-header-cell">Tier</th>
                      <th className="table-header-cell text-right">Total Cost</th>
                      <th className="table-header-cell text-right">Cost Share</th>
                      <th className="table-header-cell">Cost Share Bar</th>
                      <th className="table-header-cell text-right">Eff. Score</th>
                      <th className="table-header-cell text-center">Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((m: any, i: number) => {
                      const details = MODEL_DETAILS[m.model] || { provider: 'Unknown', context: '–', cost_tier: 'standard' };
                      const color = MODEL_COLORS[(page - 1) * PAGE_SIZE + i];
                      const providerColor = PROVIDER_LOGOS[details.provider] || '#8ba3be';
                      return (
                        <tr
                          key={m.model}
                          className="border-b transition-colors"
                          style={{ borderColor: '#f0f4f8' }}
                          onMouseEnter={e => (e.currentTarget.style.background = '#f7fafd')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td className="table-cell">
                            <div className="flex items-center gap-3">
                              <div
                                className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                                style={{ background: color }}
                              >
                                {m.model.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{m.model}</p>
                                <p className="text-xs" style={{ color: '#8ba3be' }}>Context: {details.context}</p>
                              </div>
                            </div>
                          </td>
                          <td className="table-cell">
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md" style={{ background: `${providerColor}15`, color: providerColor }}>
                              {details.provider}
                            </span>
                          </td>
                          <td className="table-cell">
                            <Badge variant={COST_TIER_BADGE[details.cost_tier] || 'gray'}>{details.cost_tier}</Badge>
                          </td>
                          <td className="table-cell text-right">
                            <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>${m.cost.toLocaleString()}</span>
                          </td>
                          <td className="table-cell text-right">
                            <span className="text-sm font-semibold" style={{ color: '#4a6480' }}>{m.costShare}%</span>
                          </td>
                          <td className="table-cell">
                            <ProgressBar value={m.costShare} max={35} color={color} className="w-24" />
                          </td>
                          <td className="table-cell text-right">
                            <span className="text-sm" style={{ color: '#4a6480' }}>{m.efficiencyScore.toLocaleString()}</span>
                          </td>
                          <td className="table-cell text-center">
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
