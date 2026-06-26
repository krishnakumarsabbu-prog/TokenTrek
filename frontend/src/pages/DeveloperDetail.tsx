import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  ChevronLeft, Award, Zap, GitPullRequest, Bot, Target,
  DollarSign, Clock, TrendingUp, TrendingDown, ExternalLink, Tag,
} from 'lucide-react';
import { fetchDeveloperDetail } from '../api/league';
import { Avatar, LoadingOverlay, ProgressBar, SectionCard } from '../components/ui';

const COLORS = ['#0078d4', '#10b981', '#e07b39', '#d97706', '#0891b2', '#8b5cf6'];

function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  return (
    <div
      className="bg-white rounded-xl border p-4 flex items-center gap-3"
      style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
    >
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}15` }}>
        <span style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-lg font-bold leading-tight" style={{ color: '#0d1f30' }}>{value}</p>
        <p className="text-xs" style={{ color: '#8ba3be' }}>{label}</p>
      </div>
    </div>
  );
}

function ScoreBar({ value, label, color }: { value: number; label: string; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium" style={{ color: '#4a6480' }}>{label}</span>
        <span className="text-xs font-bold" style={{ color }}>{value}</span>
      </div>
      <ProgressBar value={value} max={100} color={color} />
    </div>
  );
}

export default function DeveloperDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  const { data: dev, isLoading, error } = useQuery({
    queryKey: ['developer-detail', name],
    queryFn: () => fetchDeveloperDetail(name!),
    enabled: !!name,
  });

  if (isLoading) return <LoadingOverlay />;

  if (error || !dev) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4" style={{ background: '#f0f4f8' }}>
        <p className="text-sm" style={{ color: '#8ba3be' }}>Developer not found.</p>
        <button className="btn-primary" onClick={() => navigate('/developers')}>
          <ChevronLeft size={14} /> Back to Developers
        </button>
      </div>
    );
  }

  const hasDevin = !!dev.devin;
  const prPieData = hasDevin ? [
    { name: 'Merged', value: dev.devin.merged_prs, color: '#10b981' },
    { name: 'Open', value: dev.devin.open_prs, color: '#0078d4' },
    { name: 'Failed', value: dev.devin.failed_prs, color: '#dc2626' },
  ].filter(d => d.value > 0) : [];

  // Build trend data from session timeline
  const trendByDate = new Map<string, { sessions: number; prs: number; acu: number }>();
  for (const s of (dev.sessionTimeline ?? [])) {
    const prev = trendByDate.get(s.date) ?? { sessions: 0, prs: 0, acu: 0 };
    trendByDate.set(s.date, { sessions: prev.sessions + 1, prs: prev.prs + s.merged_prs, acu: prev.acu + s.acu_used });
  }
  const trendData = Array.from(trendByDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date: date.slice(5), ...v }));

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      {/* Header */}
      <div
        className="flex items-center gap-4 px-6 py-4 flex-shrink-0"
        style={{ background: '#ffffff', borderBottom: '1px solid #e5eaf0', boxShadow: '0 1px 4px rgba(0,30,60,0.06)' }}
      >
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
          style={{ color: '#4a6480', background: '#f0f4f8' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#e5eaf0'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#f0f4f8'; }}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <div className="flex items-center gap-3 flex-1">
          <Avatar initials={dev.avatar} size={42} index={dev.rank - 1} />
          <div>
            <h1 className="text-base font-bold" style={{ color: '#0d1f30' }}>{dev.name}</h1>
            <p className="text-xs" style={{ color: '#8ba3be' }}>{dev.team} · Rank #{dev.rank}</p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-bold"
          style={{
            background: dev.totalScore >= 90 ? '#f0fdf4' : dev.totalScore >= 80 ? '#eff6ff' : '#fffbeb',
            color: dev.totalScore >= 90 ? '#059669' : dev.totalScore >= 80 ? '#0078d4' : '#d97706',
          }}
        >
          Score {dev.totalScore}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* KPI Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="AI Score" value={String(dev.totalScore)} color="#0078d4" icon={<Award size={16} />} />
          <MetricCard label="Token Efficiency" value={`${dev.tokenEfficiency}`} color="#10b981" icon={<Zap size={16} />} />
          <MetricCard label="Cost Saved" value={`$${dev.costSaved?.toLocaleString()}`} color="#059669" icon={<DollarSign size={16} />} />
          <MetricCard label="Prompts Created" value={String(dev.promptsCreated)} color="#e07b39" icon={<Target size={16} />} />
        </div>

        {/* Devin Stats + Score Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Score Breakdown */}
          <SectionCard title="Score Breakdown">
            <div className="p-5 space-y-4">
              <ScoreBar value={dev.tokenEfficiency} label="Token Efficiency" color="#0078d4" />
              <ScoreBar value={dev.promptSuccessRate} label="Prompt Success Rate" color="#10b981" />
              <ScoreBar value={dev.codeAcceptance} label="Code Acceptance" color="#e07b39" />
              <ScoreBar value={dev.modelOptimization} label="Model Optimization" color="#d97706" />
              <ScoreBar value={dev.productivityGain} label="Productivity Gain" color="#8b5cf6" />
            </div>
          </SectionCard>

          {/* Devin AI Stats */}
          {hasDevin ? (
            <SectionCard title="Devin AI Performance" action={
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: '#eff6ff', color: '#0078d4' }}>
                <Bot size={10} /> Devin
              </div>
            }>
              <div className="p-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: 'Sessions', value: dev.devin.sessions, color: '#0078d4' },
                    { label: 'ACU Used', value: Math.round(dev.devin.acu_used * 100) / 100, color: '#8b5cf6' },
                    { label: 'Total PRs', value: dev.devin.total_prs, color: '#e07b39' },
                    { label: 'Merged PRs', value: dev.devin.merged_prs, color: '#10b981' },
                  ].map(m => (
                    <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: '#f7fafd' }}>
                      <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                      <p className="text-xs" style={{ color: '#8ba3be' }}>{m.label}</p>
                    </div>
                  ))}
                </div>
                {/* AI Score */}
                <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#eff6ff' }}>
                  <span className="text-xs font-semibold" style={{ color: '#4a6480' }}>Devin AI Score</span>
                  <span className="text-base font-bold" style={{ color: '#0078d4' }}>{dev.devin.ai_score}</span>
                </div>
                {/* Categories */}
                {dev.devin.categories?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#8ba3be' }}>Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {dev.devin.categories.map((c: string) => (
                        <span key={c} className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f0f4f8', color: '#4a6480' }}>
                          <Tag size={9} /> {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Devin AI Performance">
              <div className="p-8 flex flex-col items-center justify-center gap-2" style={{ color: '#8ba3be' }}>
                <Bot size={28} style={{ opacity: 0.4 }} />
                <p className="text-xs">No Devin sessions recorded</p>
              </div>
            </SectionCard>
          )}
        </div>

        {/* Activity Trend */}
        {trendData.length > 0 && (
          <SectionCard title="Activity Timeline">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={trendData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="acuGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0078d4" stopOpacity={0.18} />
                      <stop offset="95%" stopColor="#0078d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                  <Area type="monotone" dataKey="acu" name="ACU Used" stroke="#0078d4" strokeWidth={2} fill="url(#acuGrad)" />
                  <Area type="monotone" dataKey="prs" name="Merged PRs" stroke="#10b981" strokeWidth={2} fill="transparent" strokeDasharray="4 2" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        )}

        {/* PR Outcomes + Category Analysis */}
        {hasDevin && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* PR Pie */}
            {prPieData.length > 0 && (
              <SectionCard title="PR Outcomes">
                <div className="p-4 flex items-center gap-6">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={prPieData} dataKey="value" cx="50%" cy="50%" innerRadius={36} outerRadius={58} paddingAngle={3} strokeWidth={0}>
                        {prPieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-3">
                    {prPieData.map(item => (
                      <div key={item.name} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                          <span style={{ color: '#4a6480' }}>{item.name}</span>
                        </div>
                        <span className="font-bold" style={{ color: '#0d1f30' }}>{item.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Category Bar */}
            {(dev.categories ?? []).length > 0 && (
              <SectionCard title="Category Distribution">
                <div className="p-4">
                  <ResponsiveContainer width="100%" height={140}>
                    <BarChart data={dev.categories} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                      <YAxis dataKey="category" type="category" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} width={90} />
                      <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                      <Bar dataKey="count" name="Sessions" radius={[0, 4, 4, 0]}>
                        {(dev.categories ?? []).map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {/* Session History */}
        {(dev.sessionTimeline ?? []).length > 0 && (
          <SectionCard title="Recent Devin Sessions">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Session</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Date</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>ACU</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Category</th>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Pull Requests</th>
                    <th className="px-4 py-2.5 text-center text-xs font-semibold" style={{ color: '#8ba3be' }}>Session</th>
                  </tr>
                </thead>
                <tbody>
                  {dev.sessionTimeline.map((s: any, i: number) => (
                    <tr
                      key={s.id}
                      className="border-b transition-colors"
                      style={{ borderColor: '#f0f4f8' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f7fafd'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-xs font-medium truncate" style={{ color: '#0d1f30' }}>{s.session_name || `Session ${i + 1}`}</p>
                      </td>
                      <td className="px-4 py-3 text-xs whitespace-nowrap" style={{ color: '#4a6480' }}>{s.date}</td>
                      <td className="px-4 py-3 text-right text-xs font-semibold whitespace-nowrap" style={{ color: '#8b5cf6' }}>{Math.round(s.acu_used * 100) / 100}</td>
                      <td className="px-4 py-3">
                        {s.category && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: '#f0f4f8', color: '#4a6480' }}>{s.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {(s.pull_requests ?? []).length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {(s.pull_requests as { pr_url: string; pr_status: string }[]).map((pr, pi) => {
                              const statusColor = pr.pr_status === 'merged' ? '#059669' : pr.pr_status === 'open' ? '#0078d4' : '#dc2626';
                              const statusBg   = pr.pr_status === 'merged' ? '#f0fdf4' : pr.pr_status === 'open' ? '#eff6ff' : '#fef2f2';
                              const repoAndPR  = pr.pr_url.replace(/https?:\/\/[^/]+\//, '').replace(/\/pull\//, ' #');
                              return (
                                <a
                                  key={pi}
                                  href={pr.pr_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={`${pr.pr_status} — ${pr.pr_url}`}
                                  className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-semibold transition-opacity hover:opacity-80"
                                  style={{ background: statusBg, color: statusColor, textDecoration: 'none' }}
                                >
                                  <GitPullRequest size={9} />
                                  <span className="truncate max-w-[120px]">{repoAndPR}</span>
                                  <ExternalLink size={8} />
                                </a>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: '#c5d4e0' }}>No PRs</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {s.session_url ? (
                          <a
                            href={s.session_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
                            style={{ background: '#f0f4f8', color: '#0078d4' }}
                            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#eff6ff'; }}
                            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = '#f0f4f8'; }}
                          >
                            <ExternalLink size={11} />
                          </a>
                        ) : (
                          <span style={{ color: '#c5d4e0' }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  );
}
