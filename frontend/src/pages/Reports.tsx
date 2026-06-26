import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie } from 'recharts';
import { FileText, Download, RefreshCw, Clock, CheckCircle, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react';
import { fetchReports, fetchUIConfig } from '../api/analytics';
import { SectionCard, KpiCard, Badge, Select, FilterBar, LoadingOverlay } from '../components/ui';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  executive: <TrendingUp size={16} />,
  productivity: <CheckCircle size={16} />,
  cost: <DollarSign size={16} />,
  waste: <AlertTriangle size={16} />,
  security: <CheckCircle size={16} />,
  performance: <TrendingUp size={16} />,
};

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 86400000;
  if (diff < 1) return 'Today';
  if (diff < 2) return 'Yesterday';
  return `${Math.floor(diff)} days ago`;
}

export default function Reports() {
  const [period, setPeriod] = useState('weekly');

  const reports = useQuery({ queryKey: ['reports'], queryFn: fetchReports });
  const uiConfigQuery = useQuery({ queryKey: ['ui-config'], queryFn: fetchUIConfig });

  const data = reports.data;
  const uiConfig = uiConfigQuery.data;

  const typeColors = uiConfig?.typeColors ?? {};
  const platformColors = uiConfig?.platformColors ? (Object.values(uiConfig.platformColors) as string[]) : ['#0078d4', '#00b4d8', '#e07b39', '#8b5cf6', '#10b981'];

  const reportTypeColors = useMemo(() => {
    const res: Record<string, { bg: string; color: string; icon: React.ReactNode }> = {};
    Object.keys(typeColors).forEach(key => {
      res[key] = {
        bg: typeColors[key].bg,
        color: typeColors[key].color,
        icon: TYPE_ICONS[key] || <FileText size={16} />,
      };
    });
    return res;
  }, [typeColors]);

  if (reports.isLoading || uiConfigQuery.isLoading) {
    return <LoadingOverlay />;
  }

  const summary = data?.summary || {};
  const reportsList = data?.reports || [];
  const dailyBreakdown = data?.daily_breakdown || [];
  const platformBreakdown = data?.platform_breakdown || [];
  const teamBreakdown = data?.team_breakdown || [];

  const totalCost = summary.total_cost ?? 0;
  const totalRequests = summary.total_requests ?? 0;
  const activeDevelopers = summary.active_developers ?? 0;
  const costChange = summary.cost_change ?? 0;
  const requestChange = summary.request_change ?? 0;
  const periodSub = summary.period ?? '';

  const barData = dailyBreakdown.map((d: any) => ({
    date: d.date.slice(5),
    cost: d.cost,
    tokens: Math.round(d.tokens / 1000),
  }));

  const pieData = platformBreakdown.slice(0, 5).map((p: any, i: number) => ({
    name: p.name, value: p.cost, color: platformColors[i % platformColors.length] || '#0078d4',
  }));

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <div className="flex-shrink-0 bg-white border-b px-6 py-4" style={{ borderColor: '#e5eaf0' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>Reports</h1>
            <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>Scheduled & on-demand analytics reports</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={period} onChange={setPeriod} options={[
              { value: 'weekly', label: 'This Week' },
              { value: 'monthly', label: 'This Month' },
              { value: 'quarterly', label: 'This Quarter' },
            ]} />
            <button className="btn-primary">
              <FileText size={13} /> Generate Report
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 min-h-0" style={{ background: '#f0f4f8' }}>
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          <KpiCard label="Total Cost" value={`$${(totalCost / 1000).toFixed(0)}K`} change={costChange} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
          <KpiCard label="Total Requests" value={`${(totalRequests / 1e6).toFixed(2)}M`} change={requestChange} icon={<TrendingUp size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Active Developers" value={String(activeDevelopers)} icon={<CheckCircle size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Reports Generated" value={String(reportsList.length)} icon={<FileText size={18} />} iconBg="#f5f3ff" iconColor="#7c3aed" sub={periodSub} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 mb-6">
          <SectionCard title="Daily Cost Trend" className="xl:col-span-2">
            {reports.isLoading ? <div className="p-5 animate-pulse bg-gray-100 rounded h-52" /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={barData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCost" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0078d4" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Total Cost']} />
                    <Area type="monotone" dataKey="cost" stroke="#0078d4" fill="url(#gCost)" strokeWidth={2.5} dot={{ r: 4, fill: '#0078d4', stroke: 'white', strokeWidth: 2 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Platform Distribution">
            {reports.isLoading ? <div className="p-5 animate-pulse bg-gray-100 rounded h-52" /> : (
              <div className="p-4">
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={2}>
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
                        <span className="text-gray-600 truncate max-w-[100px]">{item.name}</span>
                      </div>
                      <span className="font-semibold text-gray-800">${item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Team breakdown */}
        <SectionCard title="Team Cost Breakdown" className="mb-6">
          <div className="p-4">
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={teamBreakdown.map((t: any) => ({ name: t.team.replace(' Team', '').replace(' Automation', ''), cost: t.cost }))} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}K`} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v: number) => [`$${v.toLocaleString()}`, 'Cost']} />
                <Bar dataKey="cost" radius={[4, 4, 0, 0]}>
                  {teamBreakdown.map((_: any, i: number) => <Cell key={i} fill={platformColors[i % platformColors.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        {/* Reports List */}
        <SectionCard title="Available Reports">
          {reports.isLoading ? <LoadingOverlay /> : (
            <div className="divide-y divide-gray-50">
              {reportsList.map((report: any) => {
                const typeConfig = reportTypeColors[report.type] || { bg: '#f1f5f9', color: '#475569', icon: <FileText size={16} /> };
                return (
                  <div key={report.id} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50/50 transition-colors">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: typeConfig.bg }}>
                      <span style={{ color: typeConfig.color }}>{typeConfig.icon}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-sm font-semibold text-gray-800">{report.name}</p>
                        <Badge variant={report.status === 'ready' ? 'green' : 'yellow'}>{report.status}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <Clock size={11} />
                          <span>Last run: {relTime(report.last_run)}</span>
                        </div>
                        <span>·</span>
                        <div className="flex items-center gap-1">
                          <RefreshCw size={11} />
                          <span className="capitalize">{report.schedule}</span>
                        </div>
                        <span>·</span>
                        <span>{report.size_kb} KB</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <RefreshCw size={12} /> Regenerate
                      </button>
                      <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        <Download size={12} /> Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
