import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Star, Zap, Users, Search, CheckCircle, Tag, TrendingUp } from 'lucide-react';
import { fetchMarketplacePrompts } from '../api/analytics';
import { SectionCard, SearchBar, Select, Pagination, KpiCard, Badge, FilterBar, LoadingOverlay, EmptyState } from '../components/ui';

const PAGE_SIZE = 9;

const CATEGORY_COLORS: Record<string, { bg: string; color: string }> = {
  Engineering: { bg: '#eff6ff', color: '#2563eb' },
  Testing: { bg: '#f0fdf4', color: '#16a34a' },
  Database: { bg: '#fef9c3', color: '#a16207' },
  Documentation: { bg: '#f5f3ff', color: '#7c3aed' },
  Frontend: { bg: '#ecfdf5', color: '#059669' },
  Security: { bg: '#fef2f2', color: '#dc2626' },
  Performance: { bg: '#fff7ed', color: '#ea580c' },
  DevOps: { bg: '#f0f9ff', color: '#0369a1' },
  Data: { bg: '#fdf4ff', color: '#9333ea' },
  Architecture: { bg: '#f1f5f9', color: '#475569' },
};

const CATEGORIES = ['all', 'Engineering', 'Testing', 'Database', 'Documentation', 'Frontend', 'Security', 'Performance', 'DevOps', 'Data', 'Architecture'];

function fmt(n: number) {
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

export default function PromptMarketplace() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('uses');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [page, setPage] = useState(1);
  const [saved, setSaved] = useState<Set<number>>(new Set());

  const marketplace = useQuery({ queryKey: ['marketplace'], queryFn: fetchMarketplacePrompts });

  const data = marketplace.data || [];

  const filtered = useMemo(() => {
    let d = [...data];
    if (search) d = d.filter((p: any) => p.title.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase()) || p.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase())));
    if (category !== 'all') d = d.filter((p: any) => p.category === category);
    d.sort((a: any, b: any) => {
      if (sortBy === 'uses') return b.uses - a.uses;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'tokens') return a.tokens - b.tokens;
      return 0;
    });
    return d;
  }, [data, search, category, sortBy]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const totalUses = data.reduce((s: number, p: any) => s + p.uses, 0);
  const avgRating = data.length ? (data.reduce((s: number, p: any) => s + p.rating, 0) / data.length).toFixed(1) : '0';
  const verifiedCount = data.filter((p: any) => p.verified).length;

  const toggleSave = (id: number) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-6 py-4 border-b border-gray-100 bg-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Prompt Marketplace</h1>
            <p className="text-xs text-gray-500 mt-0.5">Discover, use & share high-performing prompts</p>
          </div>
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors">
            <ShoppingBag size={13} /> Submit Prompt
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 min-h-0">
        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
          <KpiCard label="Total Prompts" value={String(data.length)} icon={<ShoppingBag size={18} />} iconBg="#eff6ff" iconColor="#2563eb" />
          <KpiCard label="Total Uses" value={fmt(totalUses)} change={22.4} icon={<TrendingUp size={18} />} iconBg="#f0fdf4" iconColor="#16a34a" />
          <KpiCard label="Avg Rating" value={`${avgRating} ★`} icon={<Star size={18} />} iconBg="#fef9c3" iconColor="#d97706" />
          <KpiCard label="Verified Prompts" value={String(verifiedCount)} icon={<CheckCircle size={18} />} iconBg="#ecfdf5" iconColor="#059669" sub={`of ${data.length} total`} />
        </div>

        {/* Filters */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <FilterBar>
            <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Search prompts, tags..." className="w-60" />
            <Select value={category} onChange={v => { setCategory(v); setPage(1); }} options={CATEGORIES.map(c => ({ value: c, label: c === 'all' ? 'All Categories' : c }))} />
            <Select value={sortBy} onChange={setSortBy} options={[
              { value: 'uses', label: 'Most Used' },
              { value: 'rating', label: 'Highest Rated' },
              { value: 'tokens', label: 'Most Efficient' },
            ]} />
          </FilterBar>
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            <button onClick={() => setView('grid')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              Grid
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-50'}`}>
              List
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex gap-2 flex-wrap mb-6">
          {CATEGORIES.filter(c => c !== 'all').map(c => {
            const colors = CATEGORY_COLORS[c] || { bg: '#f1f5f9', color: '#475569' };
            const active = category === c;
            return (
              <button key={c} onClick={() => { setCategory(active ? 'all' : c); setPage(1); }}
                className="px-3 py-1 text-xs font-medium rounded-full border transition-all"
                style={{
                  background: active ? colors.color : colors.bg,
                  color: active ? 'white' : colors.color,
                  borderColor: active ? colors.color : 'transparent',
                }}>
                {c}
              </button>
            );
          })}
        </div>

        {/* Grid/List */}
        {marketplace.isLoading ? <LoadingOverlay /> : filtered.length === 0 ? (
          <EmptyState icon={<Search size={28} />} title="No prompts found" description="Try a different search or category" />
        ) : (
          <>
            {view === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-4">
                {paged.map((p: any) => {
                  const catColors = CATEGORY_COLORS[p.category] || { bg: '#f1f5f9', color: '#475569' };
                  const isSaved = saved.has(p.id);
                  return (
                    <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:shadow-md transition-all group">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: catColors.bg, color: catColors.color }}>
                            {p.category}
                          </span>
                          {p.verified && (
                            <div className="flex items-center gap-0.5 text-emerald-600">
                              <CheckCircle size={12} />
                              <span className="text-xs font-medium">Verified</span>
                            </div>
                          )}
                        </div>
                        <button onClick={() => toggleSave(p.id)} className={`p-1.5 rounded-lg transition-colors ${isSaved ? 'bg-blue-50 text-blue-600' : 'text-gray-300 hover:text-gray-500'}`}>
                          <Tag size={14} />
                        </button>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 mb-1.5">{p.title}</h3>
                      <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{p.description}</p>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {p.tags.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-mono">#{tag}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <div className="flex items-center gap-1">
                            <Users size={11} />
                            <span>{fmt(p.uses)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Zap size={11} />
                            <span>{p.tokens} tokens</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star size={11} className="text-amber-400 fill-amber-400" />
                          <span className="text-xs font-semibold text-gray-700">{p.rating}</span>
                        </div>
                      </div>
                      <button className="w-full mt-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                        Use Prompt
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <SectionCard className="mb-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Prompt</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Category</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Author</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Uses</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Rating</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Tokens</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {paged.map((p: any) => {
                        const catColors = CATEGORY_COLORS[p.category] || { bg: '#f1f5f9', color: '#475569' };
                        return (
                          <tr key={p.id} className="hover:bg-blue-50/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-gray-800">{p.title}</p>
                                {p.verified && <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />}
                              </div>
                              <p className="text-xs text-gray-400 mt-0.5">{p.description.slice(0, 60)}…</p>
                            </td>
                            <td className="px-5 py-3.5">
                              <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: catColors.bg, color: catColors.color }}>{p.category}</span>
                            </td>
                            <td className="px-5 py-3.5 text-xs text-gray-600">{p.author}</td>
                            <td className="px-5 py-3.5 text-right text-sm font-semibold text-gray-700">{fmt(p.uses)}</td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Star size={11} className="text-amber-400 fill-amber-400" />
                                <span className="text-sm font-semibold text-gray-700">{p.rating}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right text-xs text-gray-500">{p.tokens}</td>
                            <td className="px-5 py-3.5 text-center">
                              <button className="px-3 py-1 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                                Use
                              </button>
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
            {view === 'grid' && (
              <div className="flex justify-center mt-4">
                <div className="flex items-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button key={i} onClick={() => setPage(i + 1)}
                      className={`w-8 h-8 text-xs rounded font-medium transition-colors ${page === i + 1 ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'}`}>
                      {i + 1}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
