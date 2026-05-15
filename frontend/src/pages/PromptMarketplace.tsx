import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Star, Zap, Users, Search, CircleCheck as CheckCircle, Tag, TrendingUp, Copy, Share2, Check, LayoutGrid, List, Award, Target, ChartBar as BarChart2, X, Eye } from 'lucide-react';
import { fetchMarketplacePrompts } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, FilterBar, LoadingOverlay, EmptyState, ProgressBar } from '../components/ui';

const PAGE_SIZE = 9;

interface MarketplacePrompt {
  id: number;
  title: string;
  description: string;
  prompt: string;
  category: string;
  author: string;
  rating: number;
  uses: number;
  tokens: number;
  successRate: number;
  tags: string[];
  verified: boolean;
}

const CATEGORY_COLORS: Record<string, { bg: string; color: string; dot: string }> = {
  Engineering:   { bg: '#eff6ff', color: '#2563eb', dot: '#3b82f6' },
  Testing:       { bg: '#f0fdf4', color: '#16a34a', dot: '#22c55e' },
  Database:      { bg: '#fef9c3', color: '#a16207', dot: '#eab308' },
  Documentation: { bg: '#f0f9ff', color: '#0369a1', dot: '#0ea5e9' },
  Frontend:      { bg: '#ecfdf5', color: '#059669', dot: '#10b981' },
  Security:      { bg: '#fef2f2', color: '#dc2626', dot: '#ef4444' },
  Performance:   { bg: '#fff7ed', color: '#ea580c', dot: '#f97316' },
  DevOps:        { bg: '#f0f9ff', color: '#0369a1', dot: '#38bdf8' },
  Data:          { bg: '#fdf4ff', color: '#7e22ce', dot: '#a855f7' },
  Architecture:  { bg: '#f8fafc', color: '#475569', dot: '#64748b' },
};

const CATEGORIES = [
  'all', 'Engineering', 'Testing', 'Database', 'Documentation',
  'Frontend', 'Security', 'Performance', 'DevOps', 'Data', 'Architecture',
];

const SORT_OPTIONS = [
  { value: 'uses',    label: 'Most Used' },
  { value: 'rating',  label: 'Highest Rated' },
  { value: 'success', label: 'Best Success Rate' },
  { value: 'tokens',  label: 'Most Efficient' },
];

function fmt(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function successColor(rate: number) {
  if (rate >= 93) return '#16a34a';
  if (rate >= 85) return '#0369a1';
  if (rate >= 75) return '#ea580c';
  return '#dc2626';
}

function SuccessBadge({ rate }: { rate: number }) {
  const color = successColor(rate);
  return (
    <span
      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-semibold"
      style={{ background: `${color}18`, color }}
    >
      <Target size={9} />
      {rate}%
    </span>
  );
}

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <button
      onClick={handleCopy}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
        ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function ShareButton({ prompt }: { prompt: MarketplacePrompt }) {
  const [shared, setShared] = useState(false);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareText = `${prompt.title}\n\n${prompt.description}\n\nPrompt:\n${prompt.prompt}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: prompt.title, text: shareText });
        setShared(true);
        setTimeout(() => setShared(false), 2000);
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    }
  }, [prompt]);

  return (
    <button
      onClick={handleShare}
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all
        ${shared ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
    >
      <Share2 size={11} />
      {shared ? 'Shared!' : 'Share'}
    </button>
  );
}

function PromptDetailModal({ prompt, onClose }: { prompt: MarketplacePrompt; onClose: () => void }) {
  const catColors = CATEGORY_COLORS[prompt.category] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: catColors.bg, color: catColors.color }}>
                {prompt.category}
              </span>
              {prompt.verified && (
                <div className="flex items-center gap-0.5 text-emerald-600">
                  <CheckCircle size={12} />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
            </div>
            <h2 className="text-lg font-bold text-gray-900">{prompt.title}</h2>
            <p className="text-sm text-gray-500 mt-1">{prompt.description}</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors flex-shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Stats row */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Uses', value: fmt(prompt.uses), icon: <Users size={13} />, color: '#2563eb' },
              { label: 'Avg Tokens', value: String(prompt.tokens), icon: <Zap size={13} />, color: '#d97706' },
              { label: 'Success Rate', value: `${prompt.successRate}%`, icon: <Target size={13} />, color: successColor(prompt.successRate) },
              { label: 'Rating', value: `${prompt.rating} ★`, icon: <Star size={13} />, color: '#d97706' },
            ].map(s => (
              <div key={s.label} className="bg-gray-50 rounded-xl p-3 text-center">
                <div className="flex items-center justify-center gap-1 mb-1" style={{ color: s.color }}>
                  {s.icon}
                  <span className="text-sm font-bold" style={{ color: s.color }}>{s.value}</span>
                </div>
                <p className="text-xs text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Success bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">Success Rate</span>
              <span className="text-xs font-bold" style={{ color: successColor(prompt.successRate) }}>{prompt.successRate}%</span>
            </div>
            <ProgressBar value={prompt.successRate} max={100} color={successColor(prompt.successRate)} />
          </div>

          {/* Prompt template */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-700">Prompt Template</span>
              <CopyButton text={prompt.prompt} label="Copy Prompt" />
            </div>
            <pre className="bg-gray-50 rounded-xl p-4 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap font-mono overflow-x-auto border border-gray-100">
              {prompt.prompt}
            </pre>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {prompt.tags.map(tag => (
              <span key={tag} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">#{tag}</span>
            ))}
          </div>

          {/* Footer actions */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <CopyButton text={prompt.prompt} label="Copy Prompt" />
            <ShareButton prompt={prompt} />
            <span className="text-xs text-gray-400 ml-auto">by {prompt.author}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PromptCard({ p, onOpen }: { p: MarketplacePrompt; onOpen: () => void }) {
  const catColors = CATEGORY_COLORS[p.category] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
  const [saved, setSaved] = useState(false);

  return (
    <div
      className="bg-white border border-gray-100 rounded-2xl p-5 hover:border-blue-200 hover:shadow-lg transition-all group cursor-pointer flex flex-col"
      onClick={onOpen}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: catColors.bg, color: catColors.color }}>
            {p.category}
          </span>
          {p.verified && (
            <div className="flex items-center gap-0.5 text-emerald-600">
              <CheckCircle size={11} />
              <span className="text-xs font-medium">Verified</span>
            </div>
          )}
        </div>
        <button
          onClick={e => { e.stopPropagation(); setSaved(s => !s); }}
          className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${saved ? 'bg-blue-50 text-blue-600' : 'text-gray-200 hover:text-gray-400'}`}
        >
          <Tag size={13} />
        </button>
      </div>

      <h3 className="text-sm font-bold text-gray-900 mb-1.5 group-hover:text-blue-700 transition-colors">{p.title}</h3>
      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2 flex-1">{p.description}</p>

      <div className="flex flex-wrap gap-1 mb-3">
        {p.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-50 text-gray-400 rounded font-mono">#{tag}</span>
        ))}
      </div>

      {/* Success bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-400">Success rate</span>
          <span className="text-xs font-semibold" style={{ color: successColor(p.successRate) }}>{p.successRate}%</span>
        </div>
        <ProgressBar value={p.successRate} max={100} color={successColor(p.successRate)} />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
        <div className="flex items-center gap-3 text-xs text-gray-400">
          <div className="flex items-center gap-1">
            <Users size={10} />
            <span>{fmt(p.uses)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Zap size={10} />
            <span>{p.tokens} avg</span>
          </div>
        </div>
        <div className="flex items-center gap-0.5">
          <Star size={11} className="text-amber-400 fill-amber-400" />
          <span className="text-xs font-semibold text-gray-700">{p.rating}</span>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={e => { e.stopPropagation(); onOpen(); }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
        >
          <Eye size={11} />
          View Prompt
        </button>
        <CopyButton text={p.prompt} />
        <ShareButton prompt={p} />
      </div>
    </div>
  );
}

export default function PromptMarketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('uses');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [activePrompt, setActivePrompt] = useState<MarketplacePrompt | null>(null);

  const { data = [], isLoading } = useQuery<MarketplacePrompt[]>({
    queryKey: ['marketplace'],
    queryFn: fetchMarketplacePrompts,
  });

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) {
      const q = search.toLowerCase();
      d = d.filter(p =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q)) ||
        p.author.toLowerCase().includes(q)
      );
    }
    if (category !== 'all') d = d.filter(p => p.category === category);
    d.sort((a, b) => {
      if (sortBy === 'uses')    return b.uses - a.uses;
      if (sortBy === 'rating')  return b.rating - a.rating;
      if (sortBy === 'success') return b.successRate - a.successRate;
      if (sortBy === 'tokens')  return a.tokens - b.tokens;
      return 0;
    });
    return d;
  }, [data, search, category, sortBy]);

  const topPrompts = useMemo(() => [...data].sort((a, b) => b.uses - a.uses).slice(0, 3), [data]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalUses = data.reduce((s, p) => s + p.uses, 0);
  const avgRating = data.length ? (data.reduce((s, p) => s + p.rating, 0) / data.length).toFixed(1) : '0';
  const avgSuccess = data.length ? Math.round(data.reduce((s, p) => s + p.successRate, 0) / data.length) : 0;
  const verifiedCount = data.filter(p => p.verified).length;

  const handleSearch = (v: string) => { setSearch(v); setPage(1); };
  const handleCategory = (v: string) => { setCategory(v); setPage(1); };

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <div className="flex-shrink-0 bg-white border-b px-6 py-4" style={{ borderColor: '#e5eaf0' }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>Prompt Marketplace</h1>
            <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>Discover, reuse & share high-performing prompts</p>
          </div>
          <button className="btn-primary">
            <ShoppingBag size={13} /> Submit Prompt
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 min-h-0">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
          <KpiCard label="Total Prompts" value={String(data.length)} icon={<ShoppingBag size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Total Uses" value={fmt(totalUses)} change={22.4} icon={<TrendingUp size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Avg Success Rate" value={`${avgSuccess}%`} icon={<Target size={18} />} iconBg="#fff7ed" iconColor="#ea580c" sub={`Avg rating ${avgRating} ★`} />
          <KpiCard label="Verified Prompts" value={String(verifiedCount)} icon={<CheckCircle size={18} />} iconBg="#ecfdf5" iconColor="#059669" sub={`of ${data.length} total`} />
        </div>

        {/* Top Prompts Banner */}
        {!isLoading && topPrompts.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Award size={15} className="text-amber-500" />
              <span className="text-sm font-semibold text-gray-800">Top Prompts This Week</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {topPrompts.map((p, i) => {
                const catColors = CATEGORY_COLORS[p.category] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
                const medals = ['🥇', '🥈', '🥉'];
                return (
                  <div
                    key={p.id}
                    onClick={() => setActivePrompt(p)}
                    className="bg-white border border-gray-100 rounded-xl p-4 hover:border-amber-200 hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-base">{medals[i]}</span>
                      <SuccessBadge rate={p.successRate} />
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mb-1 line-clamp-1">{p.title}</p>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="font-medium" style={{ color: catColors.color }}>{p.category}</span>
                      <span className="flex items-center gap-0.5"><Users size={10} /> {fmt(p.uses)}</span>
                      <span className="flex items-center gap-0.5"><Zap size={10} /> {p.tokens}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={handleSearch} placeholder="Search prompts, tags, authors..." className="w-64" />
            <Select value={category} onChange={handleCategory} options={CATEGORIES.map(c => ({ value: c, label: c === 'all' ? 'All Categories' : c }))} />
            <Select value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} />
          </FilterBar>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <LayoutGrid size={12} /> Grid
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              <List size={12} /> List
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.filter(c => c !== 'all').map(c => {
            const colors = CATEGORY_COLORS[c] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
            const active = category === c;
            const count = data.filter(p => p.category === c).length;
            return (
              <button
                key={c}
                onClick={() => handleCategory(active ? 'all' : c)}
                className="px-3 py-1 text-xs font-medium rounded-full border transition-all flex items-center gap-1"
                style={{
                  background: active ? colors.color : colors.bg,
                  color: active ? 'white' : colors.color,
                  borderColor: active ? colors.color : 'transparent',
                }}
              >
                {c}
                <span
                  className="text-xs font-bold opacity-70 ml-0.5"
                  style={{ color: active ? 'rgba(255,255,255,0.85)' : colors.color }}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-500">
            Showing <span className="font-semibold text-gray-700">{filtered.length}</span> prompt{filtered.length !== 1 ? 's' : ''}
            {category !== 'all' && <> in <span className="font-semibold text-gray-700">{category}</span></>}
            {search && <> matching <span className="font-semibold text-gray-700">"{search}"</span></>}
          </p>
          {(search || category !== 'all') && (
            <button
              onClick={() => { setSearch(''); setCategory('all'); setPage(1); }}
              className="text-xs text-blue-600 hover:underline flex items-center gap-1"
            >
              <X size={11} /> Clear filters
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
          <EmptyState
            icon={<Search size={28} />}
            title="No prompts found"
            description="Try a different search term or category filter"
            action={
              <button onClick={() => { setSearch(''); setCategory('all'); }} className="text-xs text-blue-600 hover:underline">
                Clear filters
              </button>
            }
          />
        ) : (
          <>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                {paged.map(p => (
                  <PromptCard key={p.id} p={p} onOpen={() => setActivePrompt(p)} />
                ))}
              </div>
            ) : (
              <SectionCard className="mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prompt</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Uses</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Success %</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                          <div className="flex items-center justify-end gap-1"><BarChart2 size={11} /> Avg Tokens</div>
                        </th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paged.map(p => {
                        const catColors = CATEGORY_COLORS[p.category] || { bg: '#f1f5f9', color: '#475569', dot: '#94a3b8' };
                        return (
                          <tr key={p.id} className="hover:bg-blue-50/30 transition-colors cursor-pointer" onClick={() => setActivePrompt(p)}>
                            <td className="px-5 py-3.5 max-w-xs">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-800 truncate">{p.title}</p>
                                {p.verified && <CheckCircle size={12} className="text-emerald-500 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5 truncate">{p.description.slice(0, 65)}…</p>
                              <p className="text-xs text-gray-300 mt-0.5">by {p.author}</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: catColors.bg, color: catColors.color }}>
                                {p.category}
                              </span>
                            </td>
                            <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">{fmt(p.uses)}</td>
                            <td className="px-5 py-3.5">
                              <div className="flex flex-col items-end gap-1">
                                <span className="text-xs font-bold" style={{ color: successColor(p.successRate) }}>{p.successRate}%</span>
                                <div className="w-16">
                                  <ProgressBar value={p.successRate} max={100} color={successColor(p.successRate)} />
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <span className="text-sm font-medium text-gray-600">{p.tokens}</span>
                              <span className="text-xs text-gray-400 ml-1">tok</span>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-0.5">
                                <Star size={11} className="text-amber-400 fill-amber-400" />
                                <span className="text-sm font-semibold text-gray-700">{p.rating}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center justify-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <CopyButton text={p.prompt} />
                                <ShareButton prompt={p} />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
              </SectionCard>
            )}

            {view === 'grid' && totalPages > 1 && (
              <div className="flex justify-center mt-4">
                <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
              </div>
            )}
          </>
        )}
      </div>

      {activePrompt && (
        <PromptDetailModal prompt={activePrompt} onClose={() => setActivePrompt(null)} />
      )}
    </div>
  );
}
