import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CirclePlay as PlayCircle, Clock, CircleCheck as CheckCircle, Circle as XCircle, Zap, DollarSign, Search, Tag, Play } from 'lucide-react';
import { fetchReplayItems } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, FilterBar, LoadingOverlay, EmptyState, Avatar } from '../components/ui';

const PAGE_SIZE = 8;

const MODEL_COLORS: Record<string, string> = {
  'Claude 3.5 Sonnet': '#e07b39', 'GPT-4o': '#0078d4', 'GPT-4 Turbo': '#00b4d8',
  'Claude 3 Haiku': '#f59e0b', 'Gemini 1.5 Pro': '#10b981',
};

function fmt(n: number) {
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function relTime(iso: string) {
  const diff = (Date.now() - new Date(iso).getTime()) / 60000;
  if (diff < 60) return `${Math.floor(diff)}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

export default function ReplayCenter() {
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);

  const sessions = useQuery({ queryKey: ['replay'], queryFn: fetchReplayItems });

  const data = sessions.data || [];

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) d = d.filter((s: any) => s.developer.toLowerCase().includes(search.toLowerCase()) || s.prompt.toLowerCase().includes(search.toLowerCase()) || s.model.toLowerCase().includes(search.toLowerCase()));
    if (modelFilter !== 'all') d = d.filter((s: any) => s.model === modelFilter);
    if (statusFilter !== 'all') d = d.filter((s: any) => statusFilter === 'success' ? s.success : !s.success);
    return d;
  }, [data, search, modelFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCost = data.reduce((s: number, r: any) => s + r.cost, 0);
  const successRate = data.length ? Math.round((data.filter((r: any) => r.success).length / data.length) * 100) : 0;
  const avgDuration = data.length ? Math.round(data.reduce((s: number, r: any) => s + r.duration_ms, 0) / data.length / 1000) : 0;
  const totalTokens = data.reduce((s: number, r: any) => s + r.tokens_used, 0);

  const modelSet: string[] = data.map((r: any) => r.model as string);
  const models: string[] = ['all', ...Array.from(new Set(modelSet))];

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Replay Center</h1>
            <p className="text-xs text-gray-500 mt-0.5">Review, analyze & replay AI sessions</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <PlayCircle size={13} /> Export Sessions
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Sessions" value={String(data.length)} change={18.6} icon={<PlayCircle size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Success Rate" value={`${successRate}%`} change={2.4} icon={<CheckCircle size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Avg Duration" value={`${avgDuration}s`} icon={<Clock size={18} />} iconBg="#f5f3ff" iconColor="#7c3aed" />
          <KpiCard label="Total Token Cost" value={`$${totalCost.toFixed(2)}`} change={21.4} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
        </div>

        {/* Model breakdown cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
          {Object.entries(MODEL_COLORS).map(([model, color]) => {
            const count = data.filter((r: any) => r.model === model).length;
            const cost = data.filter((r: any) => r.model === model).reduce((s: number, r: any) => s + r.cost, 0);
            return (
              <div key={model} className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer"
                onClick={() => setModelFilter(modelFilter === model ? 'all' : model)}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold text-gray-700 truncate">{model.split(' ')[0]}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400">sessions &middot; ${cost.toFixed(2)}</p>
              </div>
            );
          })}
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search sessions, prompts..." className="w-64" />
            <Select value={modelFilter} onChange={v => { setModelFilter(v); setPage(1); }} options={models.map(m => ({ value: m, label: m === 'all' ? 'All Models' : m }))} />
            <Select value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={[
              { value: 'all', label: 'All Status' },
              { value: 'success', label: 'Successful' },
              { value: 'failed', label: 'Failed' },
            ]} />
          </FilterBar>
          <span className="text-xs text-gray-400">{filtered.length} sessions</span>
        </div>

        {/* Sessions Table */}
        <SectionCard>
          {sessions.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
            <EmptyState icon={<Search size={28} />} title="No sessions found" description="Try adjusting your search or filters" />
          ) : (
            <>
              <div className="divide-y divide-gray-50">
                {paged.map((session: any, i: number) => {
                  const modelColor = MODEL_COLORS[session.model] || '#0078d4';
                  const isExpanded = expanded === session.session_id;
                  return (
                    <div key={session.session_id} className="hover:bg-blue-50/20 transition-colors">
                      <div className="flex items-center gap-4 px-5 py-3.5 cursor-pointer" onClick={() => setExpanded(isExpanded ? null : session.session_id)}>
                        <div className="flex-shrink-0">
                          {session.success
                            ? <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle size={16} className="text-emerald-600" /></div>
                            : <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><XCircle size={16} className="text-red-500" /></div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <Avatar initials={session.avatar} size={22} index={i} />
                            <span className="text-xs font-semibold text-gray-700">{session.developer}</span>
                            <span className="text-xs text-gray-400">·</span>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${modelColor}15`, color: modelColor }}>{session.model}</span>
                          </div>
                          <p className="text-sm text-gray-700 truncate font-medium">{session.prompt}</p>
                          <div className="flex items-center gap-3 mt-1">
                            {session.tags.map((tag: string) => (
                              <span key={tag} className="text-xs text-gray-400 font-mono">#{tag}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-6 flex-shrink-0">
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Tokens</p>
                            <p className="text-sm font-semibold text-gray-800">{fmt(session.tokens_used)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Cost</p>
                            <p className="text-sm font-semibold text-gray-800">${session.cost}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Duration</p>
                            <p className="text-sm font-semibold text-gray-800">{(session.duration_ms / 1000).toFixed(1)}s</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400">Time</p>
                            <p className="text-xs text-gray-500">{relTime(session.started_at)}</p>
                          </div>
                          <button className="p-1.5 bg-blue-50 rounded-lg text-blue-600 hover:bg-blue-100 transition-colors">
                            <Play size={14} />
                          </button>
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-5 pb-4 bg-blue-50/30">
                          <div className="bg-white border border-gray-200 rounded-xl p-4">
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Session Details</p>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                              <div><p className="text-xs text-gray-400">Session ID</p><p className="text-xs font-mono text-gray-700">{session.session_id}</p></div>
                              <div><p className="text-xs text-gray-400">Model</p><p className="text-xs font-semibold text-gray-700">{session.model}</p></div>
                              <div><p className="text-xs text-gray-400">Status</p><Badge variant={session.success ? 'green' : 'red'}>{session.success ? 'Success' : 'Failed'}</Badge></div>
                              <div><p className="text-xs text-gray-400">Started</p><p className="text-xs text-gray-700">{new Date(session.started_at).toLocaleString()}</p></div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-3">
                              <p className="text-xs font-semibold text-gray-500 mb-1">Prompt</p>
                              <p className="text-sm text-gray-700">{session.prompt}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </>
          )}
        </SectionCard>
      </div>
    </div>
  );
}
