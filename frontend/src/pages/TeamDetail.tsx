import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import {
  ChevronLeft, Users, DollarSign, Zap, Bot, Trophy, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import { fetchTeamDetail } from '../api/league';
import { Avatar, LoadingOverlay, ProgressBar, SectionCard } from '../components/ui';

const CHART_COLORS = ['#0078d4', '#10b981', '#e07b39', '#d97706', '#0891b2', '#8b5cf6'];

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

export default function TeamDetail() {
  const { name } = useParams<{ name: string }>();
  const navigate = useNavigate();

  const { data: team, isLoading, error } = useQuery({
    queryKey: ['team-detail', name],
    queryFn: () => fetchTeamDetail(name!),
    enabled: !!name,
  });

  if (isLoading) return <LoadingOverlay />;

  if (error || !team) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-4" style={{ background: '#f0f4f8' }}>
        <p className="text-sm" style={{ color: '#8ba3be' }}>Team not found.</p>
        <button className="btn-primary" onClick={() => navigate('/teams')}>
          <ChevronLeft size={14} /> Back to Teams
        </button>
      </div>
    );
  }

  const members: any[] = team.members ?? [];
  const hasDevin = !!team.devin;

  const radarData = [
    { subject: 'Token Eff.', score: team.tokenEfficiency ?? 0 },
    { subject: 'Prompt Suc.', score: team.promptSuccessRate ?? 0 },
    { subject: 'Code Accept.', score: team.codeAcceptance ?? 0 },
    { subject: 'Model Opt.', score: team.modelOptimization ?? 0 },
    { subject: 'Productivity', score: team.productivityGain ?? 0 },
  ];

  const memberBarData = members.slice(0, 8).map(m => ({
    name: m.name.split(' ')[0],
    score: m.totalScore,
  }));

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
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ background: CHART_COLORS[0] }}
          >
            {team.name?.split(' ').map((w: string) => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <h1 className="text-base font-bold" style={{ color: '#0d1f30' }}>{team.name}</h1>
            <p className="text-xs" style={{ color: '#8ba3be' }}>Rank #{team.rank} · {team.size} members</p>
          </div>
        </div>
        <div
          className="px-3 py-1.5 rounded-lg text-sm font-bold"
          style={{ background: '#eff6ff', color: '#0078d4' }}
        >
          Score {team.totalScore}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <MetricCard label="Team Score" value={String(team.totalScore)} color="#0078d4" icon={<Trophy size={16} />} />
          <MetricCard label="Cost Saved" value={`$${team.costSaved?.toLocaleString()}`} color="#059669" icon={<DollarSign size={16} />} />
          <MetricCard label="AI Adoption" value={`${team.adoptionScore}%`} color="#e07b39" icon={<Zap size={16} />} />
          <MetricCard label="Members" value={String(team.size)} color="#8b5cf6" icon={<Users size={16} />} />
        </div>

        {/* Radar + Member Bar */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SectionCard title="Team Skill Radar">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius={72}>
                  <PolarGrid stroke="#f0f4f8" />
                  <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#8ba3be' }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="score" stroke="#0078d4" fill="#0078d4" fillOpacity={0.14} strokeWidth={2} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Member AI Scores">
            <div className="p-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={memberBarData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4f8" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#8ba3be' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 10, border: '1px solid #e5eaf0', fontSize: 12 }} formatter={(v: number) => [v, 'AI Score']} />
                  <Bar dataKey="score" radius={[4, 4, 0, 0]}>
                    {memberBarData.map((_: any, i: number) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>

        {/* Devin Team Stats */}
        {hasDevin && (
          <SectionCard title="Devin AI Team Stats" action={
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: '#eff6ff', color: '#0078d4' }}>
              <Bot size={10} /> Devin
            </div>
          }>
            <div className="p-5">
              <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { label: 'Sessions', value: team.devin.sessions, color: '#0078d4' },
                  { label: 'ACU Used', value: Math.round(team.devin.acu_used * 100) / 100, color: '#8b5cf6' },
                  { label: 'Total PRs', value: team.devin.total_prs, color: '#e07b39' },
                  { label: 'Merged PRs', value: team.devin.merged_prs, color: '#10b981' },
                  { label: 'Developers', value: team.devin.developers, color: '#0891b2' },
                  { label: 'AI Score', value: team.devin.ai_score, color: '#d97706' },
                ].map(m => (
                  <div key={m.label} className="rounded-xl p-3 text-center" style={{ background: '#f7fafd' }}>
                    <p className="text-xl font-bold" style={{ color: m.color }}>{m.value}</p>
                    <p className="text-xs" style={{ color: '#8ba3be' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Member Table */}
        {members.length > 0 && (
          <SectionCard title="Team Members">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                    <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Member</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>AI Score</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Token Eff.</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Prompt Suc.</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Cost Saved</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Devin Sessions</th>
                    <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>7d</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m: any, i: number) => (
                    <tr
                      key={m.name}
                      className="border-b transition-colors cursor-pointer"
                      style={{ borderColor: '#f0f4f8' }}
                      onClick={() => navigate(`/developers/${encodeURIComponent(m.name)}`)}
                      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f7fafd'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar initials={m.avatar} size={32} index={i} />
                          <div>
                            <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{m.name}</p>
                            {i === 0 && <p className="text-xs" style={{ color: '#d97706' }}>Team Lead</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>{m.totalScore}</span>
                          <ProgressBar value={m.totalScore} max={100} color={m.totalScore >= 90 ? '#059669' : '#0078d4'} className="w-12" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold text-xs" style={{ color: '#4a6480' }}>{m.tokenEfficiency}</td>
                      <td className="px-4 py-3 text-right font-semibold text-xs" style={{ color: '#4a6480' }}>{m.promptSuccessRate}</td>
                      <td className="px-4 py-3 text-right font-bold text-xs" style={{ color: '#059669' }}>${m.costSaved?.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        {m.devin_sessions > 0 ? (
                          <span className="text-xs font-semibold" style={{ color: '#0078d4' }}>{m.devin_sessions}</span>
                        ) : (
                          <span className="text-xs" style={{ color: '#c5d4e0' }}>—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          {m.weeklyChange > 0
                            ? <ArrowUpRight size={11} style={{ color: '#059669' }} />
                            : <ArrowDownRight size={11} style={{ color: '#dc2626' }} />
                          }
                          <span className="text-xs font-semibold" style={{ color: m.weeklyChange > 0 ? '#059669' : '#dc2626' }}>
                            {m.weeklyChange > 0 ? '+' : ''}{m.weeklyChange}
                          </span>
                        </div>
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
