import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, Clock, CheckCircle, XCircle, DollarSign, Search, X, User, Cpu, Globe, FolderOpen, ThumbsUp, ThumbsDown, Minus, Code as Code2, FileCode as FileCode2, Hash, Zap, ChevronRight } from 'lucide-react';
import { fetchReplayItems } from '../api/analytics';
import {
  SectionCard, SearchBar, Select, Pagination, KpiCard, Badge,
  FilterBar, LoadingOverlay, EmptyState, Avatar,
} from '../components/ui';

const PAGE_SIZE = 8;

const MODEL_COLORS: Record<string, string> = {
  'Claude 3.5 Sonnet': '#e07b39',
  'GPT-4o': '#0078d4',
  'GPT-4 Turbo': '#00b4d8',
  'Claude 3 Haiku': '#f59e0b',
  'Gemini 1.5 Pro': '#10b981',
};

const ACCEPTANCE_CONFIG: Record<string, { label: string; variant: 'green' | 'yellow' | 'red' | 'gray'; icon: typeof ThumbsUp }> = {
  accepted: { label: 'Accepted', variant: 'green', icon: ThumbsUp },
  partially_accepted: { label: 'Partial', variant: 'yellow', icon: Minus },
  rejected: { label: 'Rejected', variant: 'red', icon: ThumbsDown },
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

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-gray-400 font-medium">{label}</span>
      <div className="text-sm text-gray-800">{children}</div>
    </div>
  );
}

function MetaBadge({ icon: Icon, label, value, color = '#374151' }: { icon: typeof User; label: string; value: string; color?: string }) {
  return (
    <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">
      <Icon size={13} style={{ color }} className="flex-shrink-0" />
      <div>
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-xs font-semibold text-gray-700 truncate">{value}</p>
      </div>
    </div>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words">
      {children}
    </pre>
  );
}

function SessionDrawer({ session, onClose }: { session: any; onClose: () => void }) {
  const modelColor = MODEL_COLORS[session.model] || '#0078d4';
  const acceptance = ACCEPTANCE_CONFIG[session.acceptance] || ACCEPTANCE_CONFIG.rejected;
  const AcceptIcon = acceptance.icon;

  // Split response into text and code blocks for rendering
  const renderResponse = (text: string) => {
    const parts = text.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
        return <CodeBlock key={i}>{code}</CodeBlock>;
      }
      if (!part.trim()) return null;
      return (
        <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
          {part.trim()}
        </p>
      );
    });
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/25 z-40 transition-opacity duration-200"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-[620px] max-w-full bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${session.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {session.success
                ? <CheckCircle size={16} className="text-emerald-600" />
                : <XCircle size={16} className="text-red-500" />}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{session.session_id}</p>
              <p className="text-xs text-gray-400">{new Date(session.started_at).toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-2">
            <MetaBadge icon={User} label="Developer" value={session.developer} />
            <MetaBadge icon={Cpu} label="Model" value={session.model} color={modelColor} />
            <MetaBadge icon={Globe} label="Platform" value={session.platform} />
            <MetaBadge icon={FolderOpen} label="Project" value={session.project} />
          </div>

          {/* Acceptance + Status row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">Status:</span>
              <Badge variant={session.success ? 'green' : 'red'}>
                {session.success ? 'Success' : 'Failed'}
              </Badge>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">Acceptance:</span>
              <Badge variant={acceptance.variant}>
                <AcceptIcon size={10} className="mr-1" />
                {acceptance.label}
              </Badge>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            <div className="bg-blue-50 rounded-xl p-3 text-center">
              <p className="text-xs text-blue-500 font-medium mb-1">Tokens</p>
              <p className="text-base font-bold text-blue-700">{fmt(session.tokens_used)}</p>
              <p className="text-xs text-blue-400 mt-0.5">
                {fmt(session.prompt_tokens)}↑ {fmt(session.completion_tokens)}↓
              </p>
            </div>
            <div className="bg-amber-50 rounded-xl p-3 text-center">
              <p className="text-xs text-amber-500 font-medium mb-1">Cost</p>
              <p className="text-base font-bold text-amber-700">${session.cost}</p>
              <p className="text-xs text-amber-400 mt-0.5">USD</p>
            </div>
            <div className="bg-emerald-50 rounded-xl p-3 text-center">
              <p className="text-xs text-emerald-500 font-medium mb-1">Latency</p>
              <p className="text-base font-bold text-emerald-700">{(session.duration_ms / 1000).toFixed(1)}s</p>
              <p className="text-xs text-emerald-400 mt-0.5">{session.duration_ms}ms</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3 text-center">
              <p className="text-xs text-gray-500 font-medium mb-1">Time</p>
              <p className="text-base font-bold text-gray-700">{relTime(session.started_at)}</p>
              <p className="text-xs text-gray-400 mt-0.5">ago</p>
            </div>
          </div>

          {/* Generated Code Stats */}
          {session.generated_code && (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                <Code2 size={12} />
                Generated Code Stats
              </p>
              <div className="grid grid-cols-4 gap-2">
                <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <FileCode2 size={14} className="text-gray-400 mb-1" />
                  <p className="text-sm font-bold text-gray-800">{session.generated_code.lines}</p>
                  <p className="text-xs text-gray-400">Lines</p>
                </div>
                <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <Hash size={14} className="text-gray-400 mb-1" />
                  <p className="text-sm font-bold text-gray-800">{session.generated_code.functions}</p>
                  <p className="text-xs text-gray-400">Functions</p>
                </div>
                <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <Zap size={14} className="text-gray-400 mb-1" />
                  <p className="text-sm font-bold text-gray-800">{session.generated_code.files_modified}</p>
                  <p className="text-xs text-gray-400">Files</p>
                </div>
                <div className="flex flex-col items-center bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                  <Code2 size={14} className="text-gray-400 mb-1" />
                  <p className="text-xs font-bold text-gray-800 truncate w-full text-center">{session.generated_code.language}</p>
                  <p className="text-xs text-gray-400">Lang</p>
                </div>
              </div>
            </div>
          )}

          {/* Tags */}
          {session.tags && session.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {session.tags.map((tag: string) => (
                <span key={tag} className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Prompt */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ChevronRight size={12} />
              Prompt
            </p>
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-sm text-blue-900 leading-relaxed">{session.prompt}</p>
            </div>
          </div>

          {/* Response */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <ChevronRight size={12} />
              Response
            </p>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              {renderResponse(session.response)}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

export default function ReplayCenter() {
  const [search, setSearch] = useState('');
  const [modelFilter, setModelFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [selectedSession, setSelectedSession] = useState<any>(null);

  const sessions = useQuery({ queryKey: ['replay'], queryFn: fetchReplayItems });
  const data = sessions.data || [];

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) d = d.filter((s: any) =>
      s.developer.toLowerCase().includes(search.toLowerCase()) ||
      s.prompt.toLowerCase().includes(search.toLowerCase()) ||
      s.model.toLowerCase().includes(search.toLowerCase())
    );
    if (modelFilter !== 'all') d = d.filter((s: any) => s.model === modelFilter);
    if (statusFilter !== 'all') d = d.filter((s: any) => statusFilter === 'success' ? s.success : !s.success);
    return d;
  }, [data, search, modelFilter, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalCost = data.reduce((s: number, r: any) => s + r.cost, 0);
  const successRate = data.length ? Math.round((data.filter((r: any) => r.success).length / data.length) * 100) : 0;
  const avgDuration = data.length ? Math.round(data.reduce((s: number, r: any) => s + r.duration_ms, 0) / data.length / 1000) : 0;

  const modelSet: string[] = data.map((r: any) => r.model as string);
  const models: string[] = ['all', ...Array.from(new Set(modelSet))];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <div className="flex-shrink-0 bg-white border-b px-6 py-4" style={{ borderColor: '#e5eaf0' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>Replay Center</h1>
            <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>Review, analyze & replay AI sessions</p>
          </div>
          <button className="btn-primary">
            <PlayCircle size={13} /> Export Sessions
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          <KpiCard label="Total Sessions" value={String(data.length)} change={18.6} icon={<PlayCircle size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Success Rate" value={`${successRate}%`} change={2.4} icon={<CheckCircle size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Avg Duration" value={`${avgDuration}s`} icon={<Clock size={18} />} iconBg="#fef3c7" iconColor="#d97706" />
          <KpiCard label="Total Token Cost" value={`$${totalCost.toFixed(2)}`} change={21.4} icon={<DollarSign size={18} />} iconBg="#fff7ed" iconColor="#ea580c" />
        </div>

        {/* Model breakdown cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 mb-6">
          {Object.entries(MODEL_COLORS).map(([model, color]) => {
            const count = data.filter((r: any) => r.model === model).length;
            const cost = data.filter((r: any) => r.model === model).reduce((s: number, r: any) => s + r.cost, 0);
            const active = modelFilter === model;
            return (
              <div
                key={model}
                className={`bg-white border rounded-xl p-3.5 hover:shadow-sm transition-all cursor-pointer ${active ? 'border-blue-400 ring-1 ring-blue-200' : 'border-gray-100 hover:border-blue-200'}`}
                onClick={() => setModelFilter(active ? 'all' : model)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                  <span className="text-xs font-semibold text-gray-700 truncate">{model.split(' ')[0]}</span>
                </div>
                <p className="text-lg font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-400">sessions · ${cost.toFixed(2)}</p>
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
                  const acceptance = ACCEPTANCE_CONFIG[session.acceptance];
                  const isSelected = selectedSession?.session_id === session.session_id;
                  return (
                    <div
                      key={session.session_id}
                      className={`flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-blue-50/30 transition-colors ${isSelected ? 'bg-blue-50/40' : ''}`}
                      onClick={() => setSelectedSession(isSelected ? null : session)}
                    >
                      <div className="flex-shrink-0">
                        {session.success
                          ? <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center"><CheckCircle size={16} className="text-emerald-600" /></div>
                          : <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center"><XCircle size={16} className="text-red-500" /></div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Avatar initials={session.avatar} size={22} index={i} />
                          <span className="text-xs font-semibold text-gray-700">{session.developer}</span>
                          <span className="text-xs text-gray-300">·</span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${modelColor}18`, color: modelColor }}>{session.model}</span>
                        </div>
                        <p className="text-sm text-gray-700 truncate font-medium">{session.prompt}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {session.tags.map((tag: string) => (
                            <span key={tag} className="text-xs text-gray-400 font-mono">#{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center gap-5 flex-shrink-0">
                        {acceptance && (
                          <div className="text-right hidden xl:block">
                            <p className="text-xs text-gray-400">Accepted</p>
                            <Badge variant={acceptance.variant}>
                              {acceptance.label}
                            </Badge>
                          </div>
                        )}
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
                        <div className="text-right hidden md:block">
                          <p className="text-xs text-gray-400">Time</p>
                          <p className="text-xs text-gray-500">{relTime(session.started_at)}</p>
                        </div>
                        <ChevronRight size={14} className={`text-gray-300 transition-transform ${isSelected ? 'rotate-90' : ''}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </>
          )}
        </SectionCard>
      </div>

      {/* Side Drawer */}
      {selectedSession && (
        <SessionDrawer session={selectedSession} onClose={() => setSelectedSession(null)} />
      )}
    </div>
  );
}
