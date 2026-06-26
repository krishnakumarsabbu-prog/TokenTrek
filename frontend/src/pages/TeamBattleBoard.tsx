import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, DollarSign, Zap, Clock, Crown, Swords, ArrowUpRight, ArrowDownRight, ChartBar as BarChart2, Star, Target, Activity, Bot, GitPullRequest } from 'lucide-react';
import { SectionCard, PageHeader, KpiCard, ProgressBar, EmptyState, LoadingOverlay } from '../components/ui';
import { fetchLeagueTeams } from '../api/analytics';
import { fetchDevinTeams } from '../api/devin';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamEntry {
  name: string;
  size: number;
  totalScore: number;
  rank: number;
  weeklyChange: number;
  tokenEfficiency: number;
  promptSuccessRate: number;
  codeAcceptance: number;
  modelOptimization: number;
  productivityGain: number;
  costSaved: number;
  adoptionScore: number;
}

// ─── Colour palette per team ──────────────────────────────────────────────────

const TEAM_COLORS = [
  { primary: '#0078d4', light: '#eff6ff', ring: 'rgba(0,120,212,0.25)' },
  { primary: '#059669', light: '#f0fdf4', ring: 'rgba(5,150,105,0.25)' },
  { primary: '#e07b39', light: '#fff7ed', ring: 'rgba(224,123,57,0.25)' },
  { primary: '#d97706', light: '#fffbeb', ring: 'rgba(217,119,6,0.25)' },
  { primary: '#0891b2', light: '#ecfeff', ring: 'rgba(8,145,178,0.25)' },
];

const MEDALS = [
  { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', text: '#7a4f00' },
  { bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', text: '#444' },
  { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', text: '#fff' },
];

const RADAR_AXES = [
  { key: 'tokenEfficiency',   label: 'Token Eff.'     },
  { key: 'promptSuccessRate', label: 'Prompt Success' },
  { key: 'codeAcceptance',    label: 'Code Accept.'   },
  { key: 'modelOptimization', label: 'Model Opt.'     },
  { key: 'productivityGain',  label: 'Productivity'   },
];

// ─── Radar Chart ──────────────────────────────────────────────────────────────

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ teams, selected }: { teams: TeamEntry[]; selected: string[] }) {
  const cx = 150, cy = 150, maxR = 110;
  const n = RADAR_AXES.length;
  const angles = RADAR_AXES.map((_, i) => (360 / n) * i);
  const gridLevels = [20, 40, 60, 80, 100];
  const visibleTeams = teams.filter(t => selected.includes(t.name));

  function teamPoints(team: TeamEntry) {
    return RADAR_AXES.map((ax, i) => {
      const val = (team as any)[ax.key] / 100;
      const { x, y } = polarToXY(angles[i], val * maxR, cx, cy);
      return `${x},${y}`;
    }).join(' ');
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto" style={{ height: 280 }}>
      {gridLevels.map(level => (
        <polygon key={level}
          points={angles.map(a => { const { x, y } = polarToXY(a, (level / 100) * maxR, cx, cy); return `${x},${y}`; }).join(' ')}
          fill="none" stroke="#e5eaf0" strokeWidth={1}
        />
      ))}
      {angles.map((angle, i) => {
        const outer = polarToXY(angle, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e5eaf0" strokeWidth={1} />;
      })}
      {visibleTeams.map(team => {
        const idx = teams.findIndex(t => t.name === team.name);
        const color = TEAM_COLORS[idx % TEAM_COLORS.length].primary;
        return (
          <g key={team.name}>
            <polygon points={teamPoints(team)} fill={color} fillOpacity={0.12} stroke={color} strokeWidth={2} strokeLinejoin="round" />
            {RADAR_AXES.map((ax, i) => {
              const val = (team as any)[ax.key] / 100;
              const { x, y } = polarToXY(angles[i], val * maxR, cx, cy);
              return <circle key={i} cx={x} cy={y} r={3} fill={color} />;
            })}
          </g>
        );
      })}
      {RADAR_AXES.map((ax, i) => {
        const { x, y } = polarToXY(angles[i], maxR + 18, cx, cy);
        return <text key={ax.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={9} fontWeight={600} fill="#8ba3be">{ax.label}</text>;
      })}
    </svg>
  );
}

// ─── Metric Bar Row ───────────────────────────────────────────────────────────

function MetricBarRow({ label, values, teams, maxValue }: { label: string; values: number[]; teams: TeamEntry[]; maxValue: number }) {
  const maxIdx = values.indexOf(Math.max(...values));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>{label}</p>
        <span className="text-xs font-bold" style={{ color: TEAM_COLORS[maxIdx % TEAM_COLORS.length].primary }}>
          {teams[maxIdx]?.name.split(' ')[0]} leads
        </span>
      </div>
      {values.map((v, i) => {
        const color = TEAM_COLORS[i % TEAM_COLORS.length].primary;
        const isMax = i === maxIdx;
        return (
          <div key={i} className="flex items-center gap-2">
            <span className="text-xs w-24 truncate font-medium" style={{ color: isMax ? '#0d1f30' : '#8ba3be' }}>
              {teams[i]?.name.split(' ')[0]}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f0f4f8' }}>
              <div className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(v / maxValue) * 100}%`, background: color, opacity: isMax ? 1 : 0.55 }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color: isMax ? color : '#8ba3be' }}>
              {v > 200 ? v.toLocaleString() : v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Team Card ────────────────────────────────────────────────────────────────

function TeamCard({ team, colorIdx, isSelected, onSelect, allTeams }: {
  team: TeamEntry; colorIdx: number; isSelected: boolean; onSelect: () => void; allTeams: TeamEntry[];
}) {
  const color = TEAM_COLORS[colorIdx % TEAM_COLORS.length];
  const medal = team.rank <= 3 ? MEDALS[team.rank - 1] : null;
  const initials = team.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        borderColor: isSelected ? color.primary : '#e5eaf0',
        boxShadow: isSelected ? `0 0 0 2px ${color.ring}, 0 4px 16px rgba(0,30,60,0.08)` : '0 1px 3px rgba(0,30,60,0.05)',
        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={onSelect}
      onMouseEnter={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
      onMouseLeave={e => { if (!isSelected) { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; } }}
    >
      <div className="px-4 pt-4 pb-3" style={{ background: isSelected ? color.light : '#fafbfd' }}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
              style={medal ? { background: medal.bg, color: medal.text } : { background: color.primary, color: '#fff' }}>
              {initials}
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: '#0d1f30' }}>{team.name}</p>
              <p className="text-xs" style={{ color: '#8ba3be' }}>{team.size} members</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold" style={{ color: color.primary }}>{team.totalScore}</p>
            <p className="text-xs" style={{ color: '#8ba3be' }}>score</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {team.rank <= 3 && <Crown size={11} style={{ color: team.rank === 1 ? '#d97706' : team.rank === 2 ? '#94a3b8' : '#a16207' }} />}
          <span className="text-xs font-bold" style={{ color: team.rank <= 3 ? '#0d1f30' : '#8ba3be' }}>#{team.rank}</span>
          <span className="flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: team.weeklyChange > 0 ? '#059669' : team.weeklyChange < 0 ? '#dc2626' : '#8ba3be' }}>
            {team.weeklyChange > 0 ? <ArrowUpRight size={11} /> : team.weeklyChange < 0 ? <ArrowDownRight size={11} /> : null}
            {team.weeklyChange > 0 ? '+' : ''}{team.weeklyChange}
          </span>
        </div>
      </div>
      <div className="px-4 py-3 space-y-2">
        {[
          { label: 'Cost Saved',   value: `$${team.costSaved.toLocaleString()}`, icon: <DollarSign size={11} />, color: '#059669' },
          { label: 'AI Adoption',  value: `${team.adoptionScore}%`,              icon: <Zap size={11} />,         color: '#e07b39' },
          { label: 'Productivity', value: `${team.productivityGain}`,             icon: <Star size={11} />,        color: '#d97706' },
          { label: 'Code Accept.', value: `${team.codeAcceptance}%`,             icon: <Target size={11} />,      color: '#0891b2' },
        ].map(m => (
          <div key={m.label} className="flex items-center gap-1.5">
            <span style={{ color: m.color }}>{m.icon}</span>
            <div>
              <p className="text-xs" style={{ color: '#8ba3be' }}>{m.label}</p>
              <p className="text-xs font-bold" style={{ color: '#0d1f30' }}>{m.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="px-4 pb-4">
        <ProgressBar value={team.totalScore} max={100} color={color.primary} />
      </div>
    </div>
  );
}

// ─── Ranking Table ────────────────────────────────────────────────────────────

function RankingTable({ teams }: { teams: TeamEntry[] }) {
  const cols: { label: string; key: keyof TeamEntry; fmt: (v: number) => string }[] = [
    { label: 'Token Eff.',   key: 'tokenEfficiency',   fmt: v => `${v}` },
    { label: 'Prompt Suc.',  key: 'promptSuccessRate', fmt: v => `${v}%` },
    { label: 'Code Accept.', key: 'codeAcceptance',    fmt: v => `${v}%` },
    { label: 'Model Opt.',   key: 'modelOptimization', fmt: v => `${v}` },
    { label: 'Productivity', key: 'productivityGain',  fmt: v => `${v}` },
    { label: 'Cost Saved',   key: 'costSaved',         fmt: v => `$${v.toLocaleString()}` },
    { label: 'Score',        key: 'totalScore',        fmt: v => `${v}` },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
            <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Rank</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Team</th>
            {cols.map(c => <th key={c.key} className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>{c.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => {
            const color = TEAM_COLORS[i % TEAM_COLORS.length];
            const medal = team.rank <= 3 ? MEDALS[team.rank - 1] : null;
            const initials = team.name.split(' ').map(w => w[0]).join('').slice(0, 2);
            return (
              <tr key={team.name} className="border-b transition-colors" style={{ borderColor: '#f0f4f8' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f7fafd'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <td className="px-4 py-3">
                  {medal
                    ? <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: medal.bg, color: medal.text }}>{team.rank}</div>
                    : <span className="text-sm font-bold" style={{ color: '#8ba3be' }}>{team.rank}</span>}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: medal ? medal.bg : color.primary, color: medal ? medal.text : '#fff' }}>
                      {initials}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{team.name}</p>
                      <p className="text-xs" style={{ color: '#8ba3be' }}>{team.size} members</p>
                    </div>
                  </div>
                </td>
                {cols.map(c => {
                  const val = team[c.key] as number;
                  const isMax = val === Math.max(...teams.map(t => t[c.key] as number));
                  return (
                    <td key={c.key} className="px-4 py-3 text-right">
                      <span className="text-xs font-bold tabular-nums" style={{ color: isMax ? color.primary : '#4a6480' }}>
                        {c.fmt(val)}{isMax && <span className="ml-1" style={{ color: color.primary }}>▲</span>}
                      </span>
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function TeamBattleBoard() {
  const { data: teams = [], isLoading } = useQuery<TeamEntry[]>({
    queryKey: ['league-teams'],
    queryFn: fetchLeagueTeams,
  });

  const { data: devinTeams = [] } = useQuery({
    queryKey: ['devin-teams'],
    queryFn: fetchDevinTeams,
  });

  const [selected, setSelected] = useState<string[]>([]);
  const allSelected = useMemo(() => selected.length === 0 ? teams.map(t => t.name) : selected, [selected, teams]);

  function toggleTeam(name: string) {
    setSelected(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }

  const leader = teams[0];
  const totalCost = teams.reduce((s, t) => s + t.costSaved, 0);
  const avgAdoption = teams.length ? Math.round(teams.reduce((s, t) => s + t.adoptionScore, 0) / teams.length) : 0;
  const avgProductivity = teams.length ? Math.round(teams.reduce((s, t) => s + t.productivityGain, 0) / teams.length) : 0;

  const metricRows = [
    { label: 'Token Efficiency (%)',   key: 'tokenEfficiency'   as const, maxValue: 100 },
    { label: 'Prompt Success Rate (%)',key: 'promptSuccessRate' as const, maxValue: 100 },
    { label: 'AI Adoption (%)',        key: 'adoptionScore'     as const, maxValue: 100 },
    { label: 'Code Acceptance (%)',    key: 'codeAcceptance'    as const, maxValue: 100 },
    { label: 'Productivity Gain',      key: 'productivityGain'  as const, maxValue: 100 },
  ];

  if (isLoading) return <LoadingOverlay />;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Team Battle Board"
        subtitle="Head-to-head team comparison across all key AI productivity metrics"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#fff0e6', color: '#e07b39' }}>
              <Swords size={12} /> Live Battle
            </div>
            {selected.length > 0 && (
              <button onClick={() => setSelected([])} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#f0f4f8', color: '#4a6480' }}>
                Show All
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {teams.length === 0 ? (
          <EmptyState icon={<Trophy size={32} />} title="No team data yet" description="Team battle scores will appear once AI usage data is recorded" />
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <KpiCard label="Battle Leader" value={leader?.name?.split(' ')[0] ?? '—'} icon={<Trophy size={17} />} iconBg="#fffbeb" iconColor="#d97706" sub={leader ? `Score: ${leader.totalScore}` : undefined} />
              <KpiCard label="Total Cost Saved" value={`$${totalCost.toLocaleString()}`} icon={<DollarSign size={17} />} iconBg="#f0fdf4" iconColor="#059669" />
              <KpiCard label="Avg AI Adoption" value={`${avgAdoption}%`} icon={<Zap size={17} />} iconBg="#fff7ed" iconColor="#e07b39" />
              <KpiCard label="Avg Productivity" value={`${avgProductivity}`} icon={<Activity size={17} />} iconBg="#ecfeff" iconColor="#0891b2" />
            </div>

            {/* Team Cards */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Swords size={14} style={{ color: '#e07b39' }} />
                <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>Team Comparison</p>
                <span className="text-xs" style={{ color: '#8ba3be' }}>— click to select teams for radar</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                {teams.map((team, i) => (
                  <TeamCard key={team.name} team={team} colorIdx={i} isSelected={allSelected.includes(team.name)} onSelect={() => toggleTeam(team.name)} allTeams={teams} />
                ))}
              </div>
            </div>

            {/* Radar + Metric Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <SectionCard
                title="Skill Radar"
                action={
                  <div className="flex items-center gap-2 flex-wrap">
                    {teams.map((t, i) => {
                      const color = TEAM_COLORS[i % TEAM_COLORS.length].primary;
                      const isVis = allSelected.includes(t.name);
                      return (
                        <button key={t.name} onClick={() => toggleTeam(t.name)}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                          style={{ background: isVis ? `${color}18` : '#f0f4f8', color: isVis ? color : '#8ba3be', border: `1px solid ${isVis ? color + '40' : 'transparent'}` }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: isVis ? color : '#d1d5db' }} />
                          {t.name.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                }
              >
                <div className="p-4">
                  <RadarChart teams={teams} selected={allSelected} />
                </div>
              </SectionCard>

              <SectionCard title="Metric Breakdown">
                <div className="p-5 space-y-6">
                  {metricRows.map(m => (
                    <MetricBarRow key={m.key} label={m.label} values={teams.map(t => t[m.key] as number)} teams={teams} maxValue={m.maxValue} />
                  ))}
                </div>
              </SectionCard>
            </div>

            {/* Full Ranking Table */}
            <SectionCard title="Full Team Ranking" noPadding>
              <RankingTable teams={teams} />
            </SectionCard>

            {/* Devin AI Leaderboard */}
            {(devinTeams as any[]).length > 0 && (
              <SectionCard title="Devin AI Leaderboard" action={
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-semibold" style={{ background: '#eff6ff', color: '#0078d4' }}>
                  <Bot size={11} /> Devin Telemetry
                </div>
              }>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Rank</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Team</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>AI Score</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Devin Sessions</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>ACU Used</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Total PRs</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Merged PRs</th>
                        <th className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Developers</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(devinTeams as any[]).map((t: any, i: number) => {
                        const color = TEAM_COLORS[i % TEAM_COLORS.length];
                        const medal = t.rank <= 3 ? MEDALS[t.rank - 1] : null;
                        const initials = t.team_name.split(' ').map((w: string) => w[0]).join('').slice(0, 2);
                        return (
                          <tr key={t.team_name} className="border-b transition-colors" style={{ borderColor: '#f0f4f8' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f7fafd'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                            <td className="px-4 py-3">
                              {medal
                                ? <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: medal.bg, color: medal.text }}>{t.rank}</div>
                                : <span className="text-sm font-bold" style={{ color: '#8ba3be' }}>{t.rank}</span>}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: medal ? medal.bg : color.primary, color: medal ? medal.text : '#fff' }}>
                                  {initials}
                                </div>
                                <span className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{t.team_name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold" style={{ color: '#e07b39' }}>{t.ai_score}</td>
                            <td className="px-4 py-3 text-right font-semibold" style={{ color: '#0078d4' }}>{t.sessions}</td>
                            <td className="px-4 py-3 text-right font-semibold" style={{ color: '#4a6480' }}>{Math.round(t.acu_used * 100) / 100}</td>
                            <td className="px-4 py-3 text-right font-semibold" style={{ color: '#4a6480' }}>{t.total_prs}</td>
                            <td className="px-4 py-3 text-right">
                              <span className="text-sm font-bold" style={{ color: '#10b981' }}>{t.merged_prs}</span>
                            </td>
                            <td className="px-4 py-3 text-right font-semibold" style={{ color: '#4a6480' }}>{t.developers}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </SectionCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
