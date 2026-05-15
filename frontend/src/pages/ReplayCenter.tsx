import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { PlayCircle, Clock, CheckCircle, XCircle, DollarSign, Search, X, User, Cpu, Globe, FolderOpen, ThumbsUp, ThumbsDown, Minus, Code as Code2, FileCode as FileCode2, Hash, Zap, ChevronRight, Users, Tag, AlertTriangle, CheckSquare, MessageSquare, Terminal, ArrowRight, Maximize2, TrendingUp } from 'lucide-react';
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

const TIMELINE_CONFIG: Record<string, { color: string; bg: string; icon: typeof CheckCircle }> = {
  start:      { color: '#2563eb', bg: '#eff6ff', icon: PlayCircle },
  prompt:     { color: '#7c3aed', bg: '#f5f3ff', icon: MessageSquare },
  processing: { color: '#d97706', bg: '#fef3c7', icon: Cpu },
  response:   { color: '#059669', bg: '#ecfdf5', icon: Terminal },
  review:     { color: '#0891b2', bg: '#ecfeff', icon: Search },
  accepted:   { color: '#16a34a', bg: '#f0fdf4', icon: CheckSquare },
  rejected:   { color: '#dc2626', bg: '#fef2f2', icon: XCircle },
  warning:    { color: '#ea580c', bg: '#fff7ed', icon: AlertTriangle },
  end:        { color: '#475569', bg: '#f8fafc', icon: CheckCircle },
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

function timeStr(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

function CodeBlock({ children, lang }: { children: string; lang?: string }) {
  return (
    <div className="rounded-xl overflow-hidden border border-gray-800">
      {lang && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700">
          <span className="text-xs text-gray-400 font-mono font-medium">{lang}</span>
        </div>
      )}
      <pre className="bg-gray-900 text-gray-100 p-4 text-xs font-mono overflow-x-auto leading-relaxed whitespace-pre-wrap break-words m-0">
        {children}
      </pre>
    </div>
  );
}

function renderResponse(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  return parts.map((part, i) => {
    if (part.startsWith('```')) {
      const firstLine = part.split('\n')[0].replace('```', '').trim();
      const code = part.replace(/^```\w*\n?/, '').replace(/```$/, '');
      return <CodeBlock key={i} lang={firstLine || undefined}>{code}</CodeBlock>;
    }
    if (!part.trim()) return null;
    return (
      <p key={i} className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
        {part.trim()}
      </p>
    );
  });
}

function MetaTile({ icon: Icon, label, value, color = '#374151' }: {
  icon: typeof User; label: string; value: string; color?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 bg-gray-50 border border-gray-100 rounded-xl px-3.5 py-3">
      <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <Icon size={13} style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
        <p className="text-xs font-semibold text-gray-800 truncate">{value}</p>
      </div>
    </div>
  );
}

function TokenBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="text-xs font-semibold text-gray-700">{fmt(value)}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
        />
      </div>
    </div>
  );
}

function SessionModal({ session, onClose, allSessions, onNavigate }: {
  session: any;
  onClose: () => void;
  allSessions: any[];
  onNavigate: (s: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'prompt' | 'response' | 'code' | 'timeline'>('overview');
  const modelColor = MODEL_COLORS[session.model] || '#0078d4';
  const acceptance = ACCEPTANCE_CONFIG[session.acceptance] || ACCEPTANCE_CONFIG.rejected;
  const AcceptIcon = acceptance.icon;
  const currentIdx = allSessions.findIndex(s => s.session_id === session.session_id);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft' && currentIdx > 0) onNavigate(allSessions[currentIdx - 1]);
      if (e.key === 'ArrowRight' && currentIdx < allSessions.length - 1) onNavigate(allSessions[currentIdx + 1]);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, currentIdx, allSessions, onNavigate]);

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'prompt', label: 'Prompt' },
    { id: 'response', label: 'Response' },
    ...(session.accepted_code ? [{ id: 'code', label: 'Accepted Code' }] : []),
    { id: 'timeline', label: 'Timeline' },
  ] as { id: typeof activeTab; label: string }[];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ background: 'rgba(0,15,30,0.7)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ width: '90vw', maxWidth: 1100, height: '88vh', maxHeight: 860 }}
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${session.success ? 'bg-emerald-50' : 'bg-red-50'}`}>
              {session.success
                ? <CheckCircle size={18} className="text-emerald-600" />
                : <XCircle size={18} className="text-red-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-bold text-gray-900 font-mono">{session.session_id}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: `${modelColor}18`, color: modelColor }}>
                  {session.model}
                </span>
                <Badge variant={session.success ? 'green' : 'red'}>{session.success ? 'Success' : 'Failed'}</Badge>
                <Badge variant={acceptance.variant}>
                  <AcceptIcon size={9} className="mr-1" />
                  {acceptance.label}
                </Badge>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{new Date(session.started_at).toLocaleString()} · {relTime(session.started_at)}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                disabled={currentIdx <= 0}
                onClick={() => onNavigate(allSessions[currentIdx - 1])}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={14} className="rotate-180" />
              </button>
              <span className="text-xs text-gray-400">{currentIdx + 1} / {allSessions.length}</span>
              <button
                disabled={currentIdx >= allSessions.length - 1}
                onClick={() => onNavigate(allSessions[currentIdx + 1])}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors ml-1"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-100 px-6 flex-shrink-0 bg-gray-50/50">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className="px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors"
                style={activeTab === t.id
                  ? { borderColor: '#0078d4', color: '#0078d4' }
                  : { borderColor: 'transparent', color: '#8ba3be' }
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="h-full"
              >
                {/* ── OVERVIEW ── */}
                {activeTab === 'overview' && (
                  <div className="p-6 space-y-6">
                    {/* Meta grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <MetaTile icon={User} label="Developer" value={session.developer} color="#0078d4" />
                      <MetaTile icon={Users} label="Team" value={session.team || 'Unknown'} color="#7c3aed" />
                      <MetaTile icon={FolderOpen} label="Project" value={session.project} color="#059669" />
                      <MetaTile icon={Globe} label="Platform" value={session.platform} color="#d97706" />
                      <MetaTile icon={Cpu} label="Model" value={session.model} color={modelColor} />
                      <MetaTile icon={Tag} label="Category" value={session.prompt_category || 'General'} color="#0891b2" />
                      <MetaTile icon={Clock} label="Duration" value={`${(session.duration_ms / 1000).toFixed(1)}s`} color="#475569" />
                      <MetaTile icon={DollarSign} label="Total Cost" value={`$${session.cost}`} color="#ea580c" />
                    </div>

                    {/* Stats row */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-blue-500 font-semibold mb-1.5">Total Tokens</p>
                        <p className="text-2xl font-bold text-blue-700">{fmt(session.tokens_used)}</p>
                      </div>
                      <div className="bg-amber-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-amber-500 font-semibold mb-1.5">Cost (USD)</p>
                        <p className="text-2xl font-bold text-amber-700">${session.cost}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-xl p-4 text-center">
                        <p className="text-xs text-emerald-500 font-semibold mb-1.5">Latency</p>
                        <p className="text-2xl font-bold text-emerald-700">{(session.duration_ms / 1000).toFixed(1)}s</p>
                      </div>
                      <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                        <p className="text-xs text-gray-500 font-semibold mb-1.5">Session Age</p>
                        <p className="text-2xl font-bold text-gray-700">{relTime(session.started_at)}</p>
                      </div>
                    </div>

                    {/* Token breakdown */}
                    <div className="bg-white border border-gray-100 rounded-xl p-5">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Token Breakdown</p>
                      <div className="space-y-3">
                        <TokenBar label="Prompt tokens" value={session.prompt_tokens} total={session.tokens_used} color="#3b82f6" />
                        <TokenBar label="Completion tokens" value={session.completion_tokens} total={session.tokens_used} color="#10b981" />
                      </div>
                      <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-50">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Prompt</p>
                          <p className="text-base font-bold text-blue-600">{fmt(session.prompt_tokens)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Completion</p>
                          <p className="text-base font-bold text-emerald-600">{fmt(session.completion_tokens)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Total</p>
                          <p className="text-base font-bold text-gray-800">{fmt(session.tokens_used)}</p>
                        </div>
                      </div>
                    </div>

                    {/* Generated code stats */}
                    {session.generated_code && (
                      <div className="bg-white border border-gray-100 rounded-xl p-5">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-1.5">
                          <Code2 size={12} /> Generated Code
                        </p>
                        <div className="grid grid-cols-4 gap-3">
                          {[
                            { icon: FileCode2, label: 'Lines', value: session.generated_code.lines },
                            { icon: Hash, label: 'Functions', value: session.generated_code.functions },
                            { icon: Zap, label: 'Files Modified', value: session.generated_code.files_modified },
                          ].map(({ icon: Icon, label, value }) => (
                            <div key={label} className="flex flex-col items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                              <Icon size={15} className="text-gray-400 mb-1.5" />
                              <p className="text-lg font-bold text-gray-800">{value}</p>
                              <p className="text-xs text-gray-400">{label}</p>
                            </div>
                          ))}
                          <div className="flex flex-col items-center bg-gray-50 rounded-xl p-3 border border-gray-100">
                            <Code2 size={15} className="text-gray-400 mb-1.5" />
                            <p className="text-sm font-bold text-gray-800">{session.generated_code.language}</p>
                            <p className="text-xs text-gray-400">Language</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Final outcome */}
                    {session.final_outcome && (
                      <div className={`rounded-xl p-4 border flex items-start gap-3 ${session.success ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100'}`}>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${session.success ? 'bg-emerald-100' : 'bg-red-100'}`}>
                          {session.success
                            ? <TrendingUp size={13} className="text-emerald-600" />
                            : <AlertTriangle size={13} className="text-red-500" />}
                        </div>
                        <div>
                          <p className={`text-xs font-semibold mb-1 ${session.success ? 'text-emerald-700' : 'text-red-600'}`}>Final Outcome</p>
                          <p className={`text-sm leading-relaxed ${session.success ? 'text-emerald-800' : 'text-red-700'}`}>{session.final_outcome}</p>
                        </div>
                      </div>
                    )}

                    {/* Tags */}
                    {session.tags && session.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {session.tags.map((tag: string) => (
                          <span key={tag} className="inline-flex items-center gap-1 text-xs font-mono bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full border border-gray-200">
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── PROMPT ── */}
                {activeTab === 'prompt' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Category</span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 font-semibold border border-blue-100">
                        {session.prompt_category || 'General'}
                      </span>
                    </div>
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center">
                          <User size={11} className="text-blue-700" />
                        </div>
                        <span className="text-xs font-semibold text-blue-700">{session.developer}</span>
                        <span className="text-xs text-blue-400">{new Date(session.started_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-blue-900 leading-relaxed font-medium">{session.prompt}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <ArrowRight size={12} />
                      <span>Sent to {session.model} via {session.platform}</span>
                      <span>·</span>
                      <span>{fmt(session.prompt_tokens)} prompt tokens</span>
                    </div>
                  </div>
                )}

                {/* ── RESPONSE ── */}
                {activeTab === 'response' && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: `${modelColor}20` }}>
                          <Cpu size={11} style={{ color: modelColor }} />
                        </div>
                        <span className="text-xs font-semibold" style={{ color: modelColor }}>{session.model}</span>
                      </div>
                      <span className="text-xs text-gray-400">{fmt(session.completion_tokens)} completion tokens · {(session.duration_ms / 1000).toFixed(1)}s</span>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4">
                      {renderResponse(session.response)}
                    </div>
                  </div>
                )}

                {/* ── ACCEPTED CODE ── */}
                {activeTab === 'code' && session.accepted_code && (
                  <div className="p-6 space-y-4">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                        <CheckSquare size={15} className="text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">Accepted Code</p>
                        <p className="text-xs text-gray-400">Code that was accepted and applied by the developer</p>
                      </div>
                      {session.generated_code?.language && (
                        <span className="ml-auto text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 font-mono">
                          {session.generated_code.language}
                        </span>
                      )}
                    </div>
                    <CodeBlock lang={session.generated_code?.language}>
                      {session.accepted_code}
                    </CodeBlock>
                    {session.final_outcome && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4">
                        <p className="text-xs font-semibold text-emerald-700 mb-1">Outcome after applying</p>
                        <p className="text-sm text-emerald-800">{session.final_outcome}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TIMELINE ── */}
                {activeTab === 'timeline' && (
                  <div className="p-6">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-6">Session Timeline</p>
                    <div className="relative">
                      {/* Vertical line */}
                      <div className="absolute left-[18px] top-0 bottom-0 w-px bg-gray-100" />
                      <div className="space-y-1">
                        {(session.timeline || []).map((event: any, i: number) => {
                          const cfg = TIMELINE_CONFIG[event.type] || TIMELINE_CONFIG.end;
                          const Icon = cfg.icon;
                          const isLast = i === (session.timeline?.length ?? 0) - 1;
                          return (
                            <motion.div
                              key={i}
                              className="flex items-start gap-4 relative"
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ duration: 0.3, delay: i * 0.06, ease: 'easeOut' }}
                            >
                              {/* Node */}
                              <div
                                className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm z-10"
                                style={{ background: cfg.bg }}
                              >
                                <Icon size={14} style={{ color: cfg.color }} />
                              </div>
                              {/* Content */}
                              <div className={`flex-1 pb-6 ${isLast ? 'pb-0' : ''}`}>
                                <div className="bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-200 transition-colors">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-gray-800 leading-snug">{event.event}</p>
                                    <span
                                      className="text-xs font-mono px-2 py-0.5 rounded-lg flex-shrink-0"
                                      style={{ background: cfg.bg, color: cfg.color }}
                                    >
                                      {event.type}
                                    </span>
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1 font-mono">{timeStr(event.time)}</p>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Duration summary */}
                    <div className="mt-6 bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
                      <Clock size={16} className="text-gray-400 flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Total session duration</p>
                        <p className="text-sm font-bold text-gray-800">{(session.duration_ms / 1000).toFixed(1)} seconds</p>
                      </div>
                      <div className="ml-auto">
                        <p className="text-xs text-gray-500 font-medium text-right">Events</p>
                        <p className="text-sm font-bold text-gray-800 text-right">{session.timeline?.length ?? 0} steps</p>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
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
  const models: string[] = ['all', ...(Array.from(new Set(data.map((r: any) => r.model))) as string[])];

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
                  return (
                    <motion.div
                      key={session.session_id}
                      className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-blue-50/30 transition-colors group"
                      onClick={() => setSelectedSession(session)}
                      whileHover={{ x: 2 }}
                      transition={{ duration: 0.15 }}
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
                          {session.team && (
                            <>
                              <span className="text-xs text-gray-300">·</span>
                              <span className="text-xs text-gray-400">{session.team}</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm text-gray-700 truncate font-medium">{session.prompt}</p>
                        <div className="flex items-center gap-3 mt-0.5">
                          {session.prompt_category && (
                            <span className="text-xs text-blue-500 font-medium">{session.prompt_category}</span>
                          )}
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
                        <div className="w-7 h-7 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                          <Maximize2 size={12} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
            </>
          )}
        </SectionCard>
      </div>

      {/* Full-screen Modal */}
      {selectedSession && (
        <SessionModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          allSessions={filtered}
          onNavigate={s => setSelectedSession(s)}
        />
      )}
    </div>
  );
}
