import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, Zap, TrendingUp, TrendingDown, Crown, Award, Target, DollarSign, Users, ArrowUpRight, ArrowDownRight, Flame, Shield } from 'lucide-react';
import { fetchDevLeaderboard, fetchTeamLeaderboard, fetchChampions, DevLeaderboardEntry, TeamLeaderboardEntry } from '../api/league';
import { SectionCard, Avatar, ProgressBar, Tabs, PageHeader, KpiCard, Badge } from '../components/ui';

const PLATFORM_COLORS: Record<string, string> = {
  Claude: '#e07b39',
  'GPT-4o': '#10a37f',
  Cursor: '#0078d4',
  'GitHub Copilot': '#6366f1',
};

const MEDAL_CONFIG = [
  { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', shadow: 'rgba(255,215,0,0.4)', label: 'Gold' },
  { bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', shadow: 'rgba(192,192,192,0.4)', label: 'Silver' },
  { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', shadow: 'rgba(205,127,50,0.4)', label: 'Bronze' },
];

function RankMedal({ rank }: { rank: number }) {
  if (rank > 3) {
    return (
      <span className="text-sm font-bold tabular-nums" style={{ color: '#8ba3be', minWidth: 24, display: 'inline-block', textAlign: 'center' }}>
        {rank}
      </span>
    );
  }
  const m = MEDAL_CONFIG[rank - 1];
  return (
    <div
      className="w-7 h-7 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        background: m.bg,
        boxShadow: `0 2px 8px ${m.shadow}`,
        fontSize: 11,
      }}
    >
      {rank}
    </div>
  );
}

function ScoreBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#edf1f5' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
      <span className="text-xs font-bold tabular-nums w-7 text-right" style={{ color: '#0d1f30' }}>{value}</span>
    </div>
  );
}

function AnimatedScore({ value, color = '#0078d4' }: { value: number; color?: string }) {
  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={56} height={56} viewBox="0 0 56 56">
        <circle cx={28} cy={28} r={23} fill="none" stroke="#f0f4f8" strokeWidth={4} />
        <circle
          cx={28} cy={28} r={23}
          fill="none"
          stroke={color}
          strokeWidth={4}
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 144.5} 144.5`}
          strokeDashoffset={36}
          style={{ transition: 'stroke-dasharray 1s ease-out' }}
        />
      </svg>
      <span className="absolute text-sm font-bold" style={{ color: '#0d1f30' }}>{value}</span>
    </div>
  );
}

function TrophyCard({
  title, subtitle, icon, gradient, dev, team, isTeam = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  gradient: string;
  dev?: DevLeaderboardEntry;
  team?: TeamLeaderboardEntry;
  isTeam?: boolean;
}) {
  const name = isTeam ? team?.name : dev?.name;
  const avatar = isTeam ? (team?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)) : dev?.avatar;
  const score = isTeam ? team?.totalScore : dev?.totalScore;
  const sub = isTeam ? `${team?.size} members` : dev?.team;

  return (
    <div
      className="rounded-2xl overflow-hidden relative group cursor-default transition-all duration-300"
      style={{
        background: gradient,
        boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
      }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.18)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.12)'; }}
    >
      <div className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-white opacity-70">{subtitle}</p>
            <p className="text-sm font-bold text-white mt-0.5">{title}</p>
          </div>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.2)' }}>
            <span className="text-white">{icon}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isTeam ? (
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {avatar}
            </div>
          ) : (
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.25)' }}
            >
              {avatar}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{name}</p>
            <p className="text-white text-xs opacity-70 truncate">{sub}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <p className="text-white font-bold text-xl leading-none">{score}</p>
            <p className="text-white text-xs opacity-70">score</p>
          </div>
        </div>
      </div>
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.06), transparent)' }} />
    </div>
  );
}

function SpecialTrophyCard({
  title, description, icon, color, bg, person, metric, metricLabel,
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  person: DevLeaderboardEntry | undefined;
  metric: number;
  metricLabel: string;
}) {
  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden cursor-default transition-all duration-300"
      style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 4px rgba(0,30,60,0.06)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,30,60,0.12)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,30,60,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: bg }}>
            <span style={{ color }}>{icon}</span>
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: '#0d1f30' }}>{title}</p>
            <p className="text-xs" style={{ color: '#8ba3be' }}>{description}</p>
          </div>
        </div>
        {person && (
          <div className="flex items-center gap-3 p-3 rounded-xl" style={{ background: bg }}>
            <Avatar initials={person.avatar} size={36} index={person.rank - 1} />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate" style={{ color: '#0d1f30' }}>{person.name}</p>
              <p className="text-xs truncate" style={{ color: '#8ba3be' }}>{person.team}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-bold" style={{ color }}>{typeof metric === 'number' && metricLabel === 'saved' ? `$${metric}` : metric}</p>
              <p className="text-xs" style={{ color: '#8ba3be' }}>{metricLabel}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const SCORE_METRICS = [
  { key: 'tokenEfficiency', label: 'Token Efficiency', color: '#0078d4' },
  { key: 'promptSuccessRate', label: 'Prompt Success', color: '#059669' },
  { key: 'codeAcceptance', label: 'Code Acceptance', color: '#e07b39' },
  { key: 'modelOptimization', label: 'Model Optimization', color: '#6366f1' },
  { key: 'productivityGain', label: 'Productivity Gain', color: '#ec4899' },
] as const;

function DevRow({ entry, expanded, onToggle }: { entry: DevLeaderboardEntry; expanded: boolean; onToggle: () => void }) {
  const pc = PLATFORM_COLORS[entry.platform] || '#0078d4';
  const isTop3 = entry.rank <= 3;

  return (
    <>
      <tr
        className="border-b transition-colors cursor-pointer"
        style={{ borderColor: '#f0f4f8', background: expanded ? '#f7fafd' : undefined }}
        onClick={onToggle}
        onMouseEnter={e => { if (!expanded) e.currentTarget.style.background = '#f7fafd'; }}
        onMouseLeave={e => { if (!expanded) e.currentTarget.style.background = 'transparent'; }}
      >
        <td className="px-4 py-3">
          <RankMedal rank={entry.rank} />
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Avatar initials={entry.avatar} size={34} index={entry.rank - 1} />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{entry.name}</p>
                {isTop3 && (
                  <Crown size={11} style={{ color: MEDAL_CONFIG[entry.rank - 1].label === 'Gold' ? '#FFD700' : MEDAL_CONFIG[entry.rank - 1].label === 'Silver' ? '#A8A8A8' : '#CD7F32' }} />
                )}
              </div>
              <p className="text-xs" style={{ color: '#8ba3be' }}>{entry.team}</p>
            </div>
          </div>
        </td>
        <td className="px-4 py-3">
          <AnimatedScore value={entry.totalScore} color={entry.totalScore >= 90 ? '#059669' : entry.totalScore >= 80 ? '#0078d4' : '#d97706'} />
        </td>
        <td className="px-4 py-3 hidden md:table-cell">
          <div className="w-28">
            <ScoreBar value={entry.tokenEfficiency} color="#0078d4" />
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <div className="w-28">
            <ScoreBar value={entry.promptSuccessRate} color="#059669" />
          </div>
        </td>
        <td className="px-4 py-3 hidden lg:table-cell">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={{ background: `${pc}15`, color: pc }}
          >
            {entry.platform}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {entry.weeklyChange > 0
              ? <ArrowUpRight size={13} style={{ color: '#059669' }} />
              : entry.weeklyChange < 0
                ? <ArrowDownRight size={13} style={{ color: '#dc2626' }} />
                : null
            }
            <span className="text-xs font-semibold" style={{ color: entry.weeklyChange > 0 ? '#059669' : entry.weeklyChange < 0 ? '#dc2626' : '#8ba3be' }}>
              {entry.weeklyChange > 0 ? '+' : ''}{entry.weeklyChange}
            </span>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr style={{ background: '#f7fafd' }}>
          <td colSpan={7} className="px-6 py-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              {SCORE_METRICS.map(m => (
                <div key={m.key} className="bg-white rounded-xl p-3 border" style={{ borderColor: '#e5eaf0' }}>
                  <p className="text-xs mb-2 font-medium" style={{ color: '#8ba3be' }}>{m.label}</p>
                  <ScoreBar value={entry[m.key]} color={m.color} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-3 mt-3">
              <div className="bg-white rounded-xl p-3 border text-center" style={{ borderColor: '#e5eaf0' }}>
                <p className="text-lg font-bold" style={{ color: '#059669' }}>${entry.costSaved.toLocaleString()}</p>
                <p className="text-xs" style={{ color: '#8ba3be' }}>Cost Saved</p>
              </div>
              <div className="bg-white rounded-xl p-3 border text-center" style={{ borderColor: '#e5eaf0' }}>
                <p className="text-lg font-bold" style={{ color: '#0078d4' }}>{entry.promptsCreated}</p>
                <p className="text-xs" style={{ color: '#8ba3be' }}>Prompts Created</p>
              </div>
              <div className="bg-white rounded-xl p-3 border text-center" style={{ borderColor: '#e5eaf0' }}>
                <p className="text-lg font-bold" style={{ color: '#e07b39' }}>{entry.adoptionScore}</p>
                <p className="text-xs" style={{ color: '#8ba3be' }}>Adoption Score</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function TeamRow({ entry }: { entry: TeamLeaderboardEntry }) {
  const isTop3 = entry.rank <= 3;
  return (
    <tr
      className="border-b transition-colors cursor-default"
      style={{ borderColor: '#f0f4f8' }}
      onMouseEnter={e => { e.currentTarget.style.background = '#f7fafd'; }}
      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
    >
      <td className="px-4 py-3.5">
        <RankMedal rank={entry.rank} />
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs flex-shrink-0"
            style={{ background: isTop3 ? MEDAL_CONFIG[entry.rank - 1].bg : 'linear-gradient(135deg, #94a3b8, #64748b)' }}
          >
            {entry.name.split(' ').map(w => w[0]).join('').slice(0, 2)}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{entry.name}</p>
              {isTop3 && <Crown size={11} style={{ color: MEDAL_CONFIG[entry.rank - 1].label === 'Gold' ? '#FFD700' : MEDAL_CONFIG[entry.rank - 1].label === 'Silver' ? '#A8A8A8' : '#CD7F32' }} />}
            </div>
            <p className="text-xs" style={{ color: '#8ba3be' }}>{entry.size} members</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-3.5">
        <AnimatedScore
          value={entry.totalScore}
          color={entry.totalScore >= 90 ? '#059669' : entry.totalScore >= 80 ? '#0078d4' : '#d97706'}
        />
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <div className="w-28">
          <ScoreBar value={entry.tokenEfficiency} color="#0078d4" />
        </div>
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <div className="w-28">
          <ScoreBar value={entry.codeAcceptance} color="#e07b39" />
        </div>
      </td>
      <td className="px-4 py-3.5 hidden lg:table-cell">
        <span className="text-sm font-bold" style={{ color: '#059669' }}>${entry.costSaved.toLocaleString()}</span>
      </td>
      <td className="px-4 py-3.5">
        <div className="flex items-center gap-1">
          {entry.weeklyChange > 0
            ? <ArrowUpRight size={13} style={{ color: '#059669' }} />
            : entry.weeklyChange < 0
              ? <ArrowDownRight size={13} style={{ color: '#dc2626' }} />
              : null
          }
          <span className="text-xs font-semibold" style={{ color: entry.weeklyChange > 0 ? '#059669' : entry.weeklyChange < 0 ? '#dc2626' : '#8ba3be' }}>
            {entry.weeklyChange > 0 ? '+' : ''}{entry.weeklyChange}
          </span>
        </div>
      </td>
    </tr>
  );
}

export default function AILeague() {
  const [tab, setTab] = useState('developers');
  const [expandedDev, setExpandedDev] = useState<string | null>(null);

  const { data: devLeaderboard = [], isLoading: devLoading } = useQuery({
    queryKey: ['league-devs'],
    queryFn: fetchDevLeaderboard,
  });

  const { data: teamLeaderboard = [], isLoading: teamLoading } = useQuery({
    queryKey: ['league-teams'],
    queryFn: fetchTeamLeaderboard,
  });

  const { data: champions, isLoading: champLoading } = useQuery({
    queryKey: ['league-champions'],
    queryFn: fetchChampions,
  });

  const topDev = devLeaderboard[0];
  const totalCostSaved = devLeaderboard.reduce((s, d) => s + d.costSaved, 0);
  const avgScore = devLeaderboard.length ? Math.round(devLeaderboard.reduce((s, d) => s + d.totalScore, 0) / devLeaderboard.length) : 0;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="AI League"
        subtitle="Gamified AI productivity rankings — developer & team leaderboards, champions & special awards"
        actions={
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#fff7ed', color: '#ea580c' }}
            >
              <Flame size={12} />
              Season 3 · Week 20
            </div>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="League Leader"
            value={topDev?.name.split(' ')[0] ?? '—'}
            icon={<Trophy size={17} />}
            iconBg="#fffbeb"
            iconColor="#d97706"
            sub={topDev ? `Score: ${topDev.totalScore}` : undefined}
          />
          <KpiCard
            label="Avg League Score"
            value={String(avgScore)}
            change={3.8}
            icon={<TrendingUp size={17} />}
            iconBg="#eff6ff"
            iconColor="#0078d4"
          />
          <KpiCard
            label="Total Cost Saved"
            value={`$${(totalCostSaved / 1000).toFixed(1)}K`}
            change={12.4}
            icon={<DollarSign size={17} />}
            iconBg="#f0fdf4"
            iconColor="#16a34a"
          />
          <KpiCard
            label="Active Competitors"
            value={String(devLeaderboard.length)}
            icon={<Users size={17} />}
            iconBg="#fdf4ff"
            iconColor="#9333ea"
            sub={`${teamLeaderboard.length} teams`}
          />
        </div>

        {/* Champion Cards */}
        {!champLoading && champions && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Crown size={14} style={{ color: '#d97706' }} />
              <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>Champions</p>
            </div>
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <TrophyCard
                title="Weekly Dev Champion"
                subtitle="This Week"
                icon={<Star size={16} />}
                gradient="linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"
                dev={champions.weekly.developer}
              />
              <TrophyCard
                title="Monthly Dev Champion"
                subtitle="This Month"
                icon={<Trophy size={16} />}
                gradient="linear-gradient(135deg, #0078d4 0%, #005fa3 100%)"
                dev={champions.monthly.developer}
              />
              <TrophyCard
                title="Weekly Team Champion"
                subtitle="This Week"
                icon={<Shield size={16} />}
                gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
                team={champions.weekly.team}
                isTeam
              />
              <TrophyCard
                title="Monthly Team Champion"
                subtitle="This Month"
                icon={<Award size={16} />}
                gradient="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                team={champions.monthly.team}
                isTeam
              />
            </div>
          </div>
        )}

        {/* Special Awards */}
        {!champLoading && champions && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: '#0078d4' }} />
              <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>Special Awards</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <SpecialTrophyCard
                title="Best Prompt Creator"
                description="Most prompts authored this period"
                icon={<Star size={16} />}
                color="#e07b39"
                bg="#fff7ed"
                person={champions.special.bestPromptCreator}
                metric={champions.special.bestPromptCreator?.promptsCreated ?? 0}
                metricLabel="prompts"
              />
              <SpecialTrophyCard
                title="Highest Cost Saver"
                description="Maximum token cost reduction"
                icon={<DollarSign size={16} />}
                color="#059669"
                bg="#f0fdf4"
                person={champions.special.highestCostSaver}
                metric={champions.special.highestCostSaver?.costSaved ?? 0}
                metricLabel="saved"
              />
              <SpecialTrophyCard
                title="Top AI Adopter"
                description="Highest AI tool adoption score"
                icon={<Target size={16} />}
                color="#0078d4"
                bg="#eff6ff"
                person={champions.special.topAIAdopter}
                metric={champions.special.topAIAdopter?.adoptionScore ?? 0}
                metricLabel="adoption"
              />
            </div>
          </div>
        )}

        {/* Leaderboards */}
        <SectionCard noPadding>
          <Tabs
            tabs={[
              { id: 'developers', label: 'Developer Leaderboard', count: devLeaderboard.length },
              { id: 'teams', label: 'Team Leaderboard', count: teamLeaderboard.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {tab === 'developers' && (
            <>
              {devLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-pulse text-sm" style={{ color: '#8ba3be' }}>Loading leaderboard...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Rank</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Developer</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Score</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold hidden md:table-cell" style={{ color: '#8ba3be' }}>Token Efficiency</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: '#8ba3be' }}>Prompt Success</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: '#8ba3be' }}>Platform</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>7d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {devLeaderboard.map(entry => (
                        <DevRow
                          key={entry.name}
                          entry={entry}
                          expanded={expandedDev === entry.name}
                          onToggle={() => setExpandedDev(expandedDev === entry.name ? null : entry.name)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {tab === 'teams' && (
            <>
              {teamLoading ? (
                <div className="p-8 flex justify-center">
                  <div className="animate-pulse text-sm" style={{ color: '#8ba3be' }}>Loading leaderboard...</div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Rank</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Team</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Score</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold hidden md:table-cell" style={{ color: '#8ba3be' }}>Token Efficiency</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: '#8ba3be' }}>Code Acceptance</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold hidden lg:table-cell" style={{ color: '#8ba3be' }}>Cost Saved</th>
                        <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>7d</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamLeaderboard.map(entry => (
                        <TeamRow key={entry.name} entry={entry} />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </SectionCard>

        {/* Scoring Legend */}
        <SectionCard title="Scoring Criteria">
          <div className="p-5 grid grid-cols-2 md:grid-cols-5 gap-4">
            {SCORE_METRICS.map(m => (
              <div key={m.key} className="text-center">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center mx-auto mb-2"
                  style={{ background: `${m.color}15` }}
                >
                  <div className="w-3 h-3 rounded-full" style={{ background: m.color }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: '#0d1f30' }}>{m.label}</p>
                <ProgressBar value={20} max={20} color={m.color} className="mt-2" />
                <p className="text-xs mt-1" style={{ color: '#8ba3be' }}>20% weight</p>
              </div>
            ))}
          </div>
        </SectionCard>

      </div>
    </div>
  );
}
