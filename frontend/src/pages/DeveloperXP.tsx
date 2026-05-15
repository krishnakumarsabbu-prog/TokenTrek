import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Zap, Trophy, Star, TrendingUp, Clock, DollarSign, CheckCircle2, Target, ChevronUp, ChevronDown, Search } from 'lucide-react';
import { fetchDeveloperXP } from '../api/analytics';
import { Avatar, PageHeader, SectionCard, LoadingOverlay, SearchBar, Select, Pagination } from '../components/ui';

const PAGE_SIZE = 9;

interface DevXP {
  developer_id: number;
  developer: string;
  avatar: string;
  team: string;
  xp: number;
  xpProgress: number;
  level: string;
  levelColor: string;
  levelIndex: number;
  score: number;
  trend: number;
  aiEfficiency: number;
  promptsUsed: number;
  successfulPrompts: number;
  acceptedCode: number;
  timeSavedHrs: number;
  estimatedROI: number;
  rank: number;
}

const LEVEL_CONFIG: Record<string, { icon: string; gradient: string; glow: string; border: string }> = {
  'Beginner':     { icon: '🌱', gradient: 'linear-gradient(135deg, #94a3b8, #cbd5e1)', glow: 'rgba(148,163,184,0.3)', border: '#cbd5e1' },
  'Explorer':     { icon: '🔍', gradient: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.3)',  border: '#6ee7b7' },
  'Prompt Ninja': { icon: '⚡', gradient: 'linear-gradient(135deg, #0078d4, #38bdf8)', glow: 'rgba(0,120,212,0.35)', border: '#7dd3fc' },
  'Token Master': { icon: '🔥', gradient: 'linear-gradient(135deg, #d97706, #fbbf24)', glow: 'rgba(217,119,6,0.35)',  border: '#fcd34d' },
  'AI Champion':  { icon: '🏆', gradient: 'linear-gradient(135deg, #e07b39, #f97316)', glow: 'rgba(224,123,57,0.4)', border: '#fdba74' },
};

const RANK_MEDAL: Record<number, { bg: string; color: string; label: string }> = {
  1: { bg: '#fef9c3', color: '#d97706', label: '🥇' },
  2: { bg: '#f1f5f9', color: '#64748b', label: '🥈' },
  3: { bg: '#fff7ed', color: '#c2410c', label: '🥉' },
};

function fmtXP(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

function fmtNum(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// Top 3 podium card
function PodiumCard({ dev, place }: { dev: DevXP; place: number }) {
  const medal = RANK_MEDAL[place];
  const cfg = LEVEL_CONFIG[dev.level] ?? LEVEL_CONFIG['Beginner'];
  const heights = [180, 140, 120];
  const h = heights[place - 1];

  return (
    <div
      className="flex flex-col items-center gap-2 px-4"
      style={{ minWidth: 140 }}
    >
      <div
        className="relative flex flex-col items-center p-4 rounded-2xl w-full transition-transform duration-200 cursor-default"
        style={{
          background: 'white',
          border: `2px solid ${cfg.border}`,
          boxShadow: `0 4px 24px ${cfg.glow}`,
          minHeight: h,
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(-4px)'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.transform = 'translateY(0)'; }}
      >
        {/* medal */}
        <span className="text-2xl mb-2 leading-none">{medal.label}</span>

        {/* avatar */}
        <div className="relative mb-2">
          <Avatar initials={dev.avatar} size={52} index={dev.rank - 1} />
          <span
            className="absolute -bottom-1 -right-1 text-sm leading-none w-6 h-6 flex items-center justify-center rounded-full border-2 border-white"
            style={{ background: cfg.gradient, fontSize: 14 }}
          >
            {cfg.icon}
          </span>
        </div>

        <p className="text-sm font-bold text-center leading-tight" style={{ color: '#0d1f30' }}>
          {dev.developer.split(' ')[0]}
        </p>
        <p className="text-xs text-center mb-2" style={{ color: '#8ba3be' }}>{dev.team}</p>

        {/* XP badge */}
        <div
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ background: cfg.gradient, color: 'white', letterSpacing: '0.04em' }}
        >
          {fmtXP(dev.xp)} XP
        </div>

        {/* level badge */}
        <div
          className="mt-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold"
          style={{ background: `${dev.levelColor}18`, color: dev.levelColor }}
        >
          {dev.level}
        </div>
      </div>
    </div>
  );
}

// Compact XP progress bar with level indicator
function XPBar({ xp, progress, level, levelColor, nextLevelXp }: {
  xp: number; progress: number; level: string; levelColor: string; nextLevelXp: number;
}) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold" style={{ color: levelColor }}>{level}</span>
        <span className="text-xs" style={{ color: '#8ba3be' }}>
          {fmtXP(xp)} / {fmtXP(nextLevelXp)} XP
        </span>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: '#edf1f5' }}>
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${progress}%`,
            background: `linear-gradient(90deg, ${levelColor}, ${levelColor}aa)`,
          }}
        />
      </div>
    </div>
  );
}

// Level badge for display
function LevelBadge({ level, color }: { level: string; color: string }) {
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG['Beginner'];
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-bold border"
      style={{ background: `${color}14`, color, borderColor: `${color}40` }}
    >
      <span>{cfg.icon}</span>
      {level}
    </span>
  );
}

// Profile card for the grid view
function ProfileCard({ dev }: { dev: DevXP }) {
  const cfg = LEVEL_CONFIG[dev.level] ?? LEVEL_CONFIG['Beginner'];
  const medal = RANK_MEDAL[dev.rank];
  const nextLevelXpMap: Record<string, number> = {
    'Beginner': 1000, 'Explorer': 3000, 'Prompt Ninja': 6000, 'Token Master': 10000, 'AI Champion': 10000,
  };

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden transition-all duration-200 cursor-default flex flex-col"
      style={{
        borderColor: dev.rank <= 3 ? cfg.border : '#e5eaf0',
        boxShadow: dev.rank <= 3 ? `0 4px 16px ${cfg.glow}` : '0 1px 3px rgba(0,30,60,0.05)',
      }}
      onMouseEnter={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = `0 8px 28px ${cfg.glow}`;
        el.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        const el = e.currentTarget as HTMLDivElement;
        el.style.boxShadow = dev.rank <= 3 ? `0 4px 16px ${cfg.glow}` : '0 1px 3px rgba(0,30,60,0.05)';
        el.style.transform = 'translateY(0)';
      }}
    >
      {/* Header gradient strip */}
      <div className="h-1.5 w-full" style={{ background: cfg.gradient }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Top row: rank + avatar + name */}
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={medal
              ? { background: medal.bg, color: medal.color }
              : { background: '#f0f4f8', color: '#8ba3be' }
            }
          >
            {medal ? medal.label : `#${dev.rank}`}
          </div>

          <div className="relative flex-shrink-0">
            <Avatar initials={dev.avatar} size={44} index={dev.rank - 1} />
            <span
              className="absolute -bottom-1 -right-1 text-xs leading-none w-5 h-5 flex items-center justify-center rounded-full border-2 border-white"
              style={{ background: cfg.gradient }}
            >
              {cfg.icon}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold truncate" style={{ color: '#0d1f30' }}>{dev.developer}</p>
            <p className="text-xs truncate" style={{ color: '#8ba3be' }}>{dev.team}</p>
            <div className="mt-1">
              <LevelBadge level={dev.level} color={dev.levelColor} />
            </div>
          </div>

          {/* trend */}
          <div className="flex-shrink-0 flex items-center gap-0.5 text-xs font-semibold"
            style={{ color: dev.trend >= 0 ? '#059669' : '#dc2626' }}>
            {dev.trend >= 0 ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {Math.abs(dev.trend)}
          </div>
        </div>

        {/* XP bar */}
        <XPBar
          xp={dev.xp}
          progress={dev.xpProgress}
          level={dev.level}
          levelColor={dev.levelColor}
          nextLevelXp={(() => {
            return nextLevelXpMap[dev.level] ?? 10000;
          })()}
        />

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl p-2.5" style={{ background: '#f7fafd' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Zap size={11} style={{ color: '#0078d4' }} />
              <span className="text-xs" style={{ color: '#8ba3be' }}>AI Efficiency</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>{dev.aiEfficiency}%</span>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: '#f7fafd' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Target size={11} style={{ color: '#10b981' }} />
              <span className="text-xs" style={{ color: '#8ba3be' }}>Success Rate</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>
              {Math.round((dev.successfulPrompts / Math.max(dev.promptsUsed, 1)) * 100)}%
            </span>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: '#f7fafd' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <CheckCircle2 size={11} style={{ color: '#d97706' }} />
              <span className="text-xs" style={{ color: '#8ba3be' }}>Accepted Code</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>{fmtNum(dev.acceptedCode)}</span>
          </div>
          <div className="rounded-xl p-2.5" style={{ background: '#f7fafd' }}>
            <div className="flex items-center gap-1.5 mb-0.5">
              <Clock size={11} style={{ color: '#e07b39' }} />
              <span className="text-xs" style={{ color: '#8ba3be' }}>Time Saved</span>
            </div>
            <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>{dev.timeSavedHrs}h</span>
          </div>
        </div>

        {/* ROI footer */}
        <div
          className="flex items-center justify-between rounded-xl px-3 py-2 mt-auto"
          style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}
        >
          <div className="flex items-center gap-1.5">
            <DollarSign size={12} style={{ color: '#059669' }} />
            <span className="text-xs" style={{ color: '#4a6480' }}>Est. ROI</span>
          </div>
          <span className="text-sm font-bold" style={{ color: '#059669' }}>
            ${dev.estimatedROI.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
}

// Leaderboard table row
function LeaderRow({ dev, rank }: { dev: DevXP; rank: number }) {
  const cfg = LEVEL_CONFIG[dev.level] ?? LEVEL_CONFIG['Beginner'];
  const medal = RANK_MEDAL[rank];

  return (
    <tr
      className="border-b transition-colors cursor-default"
      style={{ borderColor: '#f0f4f8' }}
      onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#f7fafd'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'; }}
    >
      {/* Rank */}
      <td className="px-4 py-3 w-12">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={medal ? { background: medal.bg, color: medal.color } : { background: '#f0f4f8', color: '#8ba3be' }}
        >
          {medal ? medal.label : rank}
        </div>
      </td>

      {/* Developer */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Avatar initials={dev.avatar} size={36} index={rank - 1} />
            <span
              className="absolute -bottom-0.5 -right-0.5 text-xs leading-none w-4 h-4 flex items-center justify-center rounded-full border border-white"
              style={{ background: cfg.gradient, fontSize: 10 }}
            >
              {cfg.icon}
            </span>
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{dev.developer}</p>
            <p className="text-xs" style={{ color: '#8ba3be' }}>{dev.team}</p>
          </div>
        </div>
      </td>

      {/* Level badge */}
      <td className="px-4 py-3">
        <LevelBadge level={dev.level} color={dev.levelColor} />
      </td>

      {/* XP + bar */}
      <td className="px-4 py-3" style={{ minWidth: 160 }}>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold" style={{ color: '#0d1f30' }}>{fmtXP(dev.xp)}</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#edf1f5', minWidth: 60 }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${dev.xpProgress}%`, background: cfg.gradient }}
            />
          </div>
        </div>
      </td>

      {/* AI Efficiency */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold" style={{ color: dev.aiEfficiency >= 80 ? '#059669' : dev.aiEfficiency >= 65 ? '#d97706' : '#dc2626' }}>
          {dev.aiEfficiency}%
        </span>
      </td>

      {/* Prompts used / successful */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold" style={{ color: '#4a6480' }}>{fmtNum(dev.promptsUsed)}</span>
        <span className="text-xs ml-1" style={{ color: '#8ba3be' }}>/ {fmtNum(dev.successfulPrompts)}</span>
      </td>

      {/* Accepted code */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold" style={{ color: '#4a6480' }}>{fmtNum(dev.acceptedCode)}</span>
      </td>

      {/* Time saved */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-semibold" style={{ color: '#4a6480' }}>{dev.timeSavedHrs}h</span>
      </td>

      {/* ROI */}
      <td className="px-4 py-3 text-right">
        <span className="text-sm font-bold" style={{ color: '#059669' }}>${(dev.estimatedROI / 1000).toFixed(1)}K</span>
      </td>

      {/* Trend */}
      <td className="px-4 py-3 text-right">
        <span
          className="inline-flex items-center gap-0.5 text-xs font-semibold"
          style={{ color: dev.trend >= 0 ? '#059669' : '#dc2626' }}
        >
          {dev.trend >= 0 ? <TrendingUp size={10} /> : <ChevronDown size={10} />}
          {dev.trend >= 0 ? '+' : ''}{dev.trend}
        </span>
      </td>
    </tr>
  );
}

const LEVEL_NAMES = ['All Levels', 'Beginner', 'Explorer', 'Prompt Ninja', 'Token Master', 'AI Champion'];
const TEAM_ALL = 'All Teams';

export default function DeveloperXP() {
  const { data, isLoading } = useQuery<DevXP[]>({ queryKey: ['developer-xp'], queryFn: fetchDeveloperXP });

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('All Levels');
  const [teamFilter, setTeamFilter] = useState(TEAM_ALL);
  const [sortBy, setSortBy] = useState('xp');
  const [view, setView] = useState<'cards' | 'table'>('cards');
  const [page, setPage] = useState(1);

  const devs = data ?? [];

  const teams = useMemo(() => {
    const ts = Array.from(new Set(devs.map(d => d.team)));
    return [TEAM_ALL, ...ts.sort()];
  }, [devs]);

  const filtered = useMemo(() => {
    let d = [...devs];
    if (search) d = d.filter(x => x.developer.toLowerCase().includes(search.toLowerCase()) || x.team.toLowerCase().includes(search.toLowerCase()));
    if (levelFilter !== 'All Levels') d = d.filter(x => x.level === levelFilter);
    if (teamFilter !== TEAM_ALL) d = d.filter(x => x.team === teamFilter);
    d.sort((a, b) => {
      if (sortBy === 'xp')           return b.xp - a.xp;
      if (sortBy === 'efficiency')   return b.aiEfficiency - a.aiEfficiency;
      if (sortBy === 'roi')          return b.estimatedROI - a.estimatedROI;
      if (sortBy === 'time_saved')   return b.timeSavedHrs - a.timeSavedHrs;
      if (sortBy === 'prompts')      return b.promptsUsed - a.promptsUsed;
      return 0;
    });
    return d;
  }, [devs, search, levelFilter, teamFilter, sortBy]);

  const top3 = devs.slice(0, 3);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // KPI summary
  const totalXP = devs.reduce((s, d) => s + d.xp, 0);
  const avgEfficiency = devs.length ? Math.round(devs.reduce((s, d) => s + d.aiEfficiency, 0) / devs.length) : 0;
  const totalROI = devs.reduce((s, d) => s + d.estimatedROI, 0);
  const champions = devs.filter(d => d.level === 'AI Champion').length;

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Developer XP System"
        subtitle="Track AI proficiency, rank progression, and ROI per developer"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setView('cards')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
              style={view === 'cards'
                ? { background: '#0078d4', color: 'white', borderColor: '#0078d4' }
                : { background: 'white', color: '#4a6480', borderColor: '#e5eaf0' }
              }
            >
              Cards
            </button>
            <button
              onClick={() => setView('table')}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all"
              style={view === 'table'
                ? { background: '#0078d4', color: 'white', borderColor: '#0078d4' }
                : { background: 'white', color: '#4a6480', borderColor: '#e5eaf0' }
              }
            >
              Leaderboard
            </button>
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">
        {isLoading ? (
          <LoadingOverlay />
        ) : (
          <>
            {/* KPIs */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
              <div
                className="bg-white rounded-xl border p-5 transition-all duration-200 cursor-default"
                style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)'; }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#eff6ff' }}>
                    <Zap size={18} style={{ color: '#0078d4' }} />
                  </div>
                  <span className="text-xl">⚡</span>
                </div>
                <p className="text-2xl font-bold tracking-tight mb-0.5" style={{ color: '#0d1f30' }}>{fmtXP(totalXP)}</p>
                <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>Total XP Earned</p>
              </div>

              <div
                className="bg-white rounded-xl border p-5 transition-all duration-200 cursor-default"
                style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)'; }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#f0fdf4' }}>
                    <TrendingUp size={18} style={{ color: '#10b981' }} />
                  </div>
                  <span className="text-xl">🎯</span>
                </div>
                <p className="text-2xl font-bold tracking-tight mb-0.5" style={{ color: '#0d1f30' }}>{avgEfficiency}%</p>
                <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>Avg AI Efficiency</p>
              </div>

              <div
                className="bg-white rounded-xl border p-5 transition-all duration-200 cursor-default"
                style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)'; }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fff7ed' }}>
                    <DollarSign size={18} style={{ color: '#ea580c' }} />
                  </div>
                  <span className="text-xl">💰</span>
                </div>
                <p className="text-2xl font-bold tracking-tight mb-0.5" style={{ color: '#0d1f30' }}>
                  ${(totalROI / 1000).toFixed(0)}K
                </p>
                <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>Total Estimated ROI</p>
              </div>

              <div
                className="bg-white rounded-xl border p-5 transition-all duration-200 cursor-default"
                style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)'; }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: '#fffbeb' }}>
                    <Trophy size={18} style={{ color: '#d97706' }} />
                  </div>
                  <span className="text-xl">🏆</span>
                </div>
                <p className="text-2xl font-bold tracking-tight mb-0.5" style={{ color: '#0d1f30' }}>{champions}</p>
                <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>AI Champions</p>
              </div>
            </div>

            {/* Top 3 Podium */}
            {top3.length >= 3 && (
              <SectionCard title="Top Performers Podium">
                <div className="p-6">
                  <div className="flex items-end justify-center gap-4">
                    {/* 2nd place */}
                    <PodiumCard dev={top3[1]} place={2} />
                    {/* 1st place (elevated) */}
                    <div style={{ marginBottom: 20 }}>
                      <PodiumCard dev={top3[0]} place={1} />
                    </div>
                    {/* 3rd place */}
                    <PodiumCard dev={top3[2]} place={3} />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Level legend */}
            <div className="flex items-center gap-2 flex-wrap">
              {['Beginner', 'Explorer', 'Prompt Ninja', 'Token Master', 'AI Champion'].map(lvl => {
                const cfg = LEVEL_CONFIG[lvl];
                const count = devs.filter(d => d.level === lvl).length;
                return (
                  <div
                    key={lvl}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-white text-xs font-semibold transition-all cursor-default"
                    style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
                  >
                    <span className="text-base leading-none">{cfg.icon}</span>
                    <span style={{ color: '#4a6480' }}>{lvl}</span>
                    <span
                      className="px-1.5 py-0.5 rounded-md text-xs font-bold"
                      style={{ background: cfg.glow, color: '#0d1f30' }}
                    >
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Filters */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ba3be' }} />
                  <input
                    type="text"
                    value={search}
                    onChange={e => { setSearch(e.target.value); setPage(1); }}
                    placeholder="Search developers..."
                    className="pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none w-52"
                    style={{ borderColor: '#e5eaf0', background: '#f7fafd', color: '#0d1f30' }}
                  />
                </div>
                <Select
                  value={levelFilter}
                  onChange={v => { setLevelFilter(v); setPage(1); }}
                  options={LEVEL_NAMES.map(l => ({ value: l, label: l }))}
                />
                <Select
                  value={teamFilter}
                  onChange={v => { setTeamFilter(v); setPage(1); }}
                  options={teams.map(t => ({ value: t, label: t }))}
                />
              </div>
              <Select
                value={sortBy}
                onChange={v => { setSortBy(v); setPage(1); }}
                options={[
                  { value: 'xp',         label: 'Sort: XP Score'     },
                  { value: 'efficiency', label: 'Sort: AI Efficiency' },
                  { value: 'roi',        label: 'Sort: ROI'           },
                  { value: 'time_saved', label: 'Sort: Time Saved'    },
                  { value: 'prompts',    label: 'Sort: Prompts Used'  },
                ]}
              />
            </div>

            {/* Card grid */}
            {view === 'cards' ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {paged.map(dev => (
                    <ProfileCard key={dev.developer_id} dev={dev} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-1">
                    <p className="text-xs" style={{ color: '#8ba3be' }}>
                      Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-40"
                        style={{ borderColor: '#e5eaf0', color: '#4a6480', background: 'white' }}
                      >
                        Prev
                      </button>
                      <span className="px-3 py-1.5 text-xs font-semibold" style={{ color: '#4a6480' }}>
                        {page} / {totalPages}
                      </span>
                      <button
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="px-3 py-1.5 text-xs rounded-lg border transition-all disabled:opacity-40"
                        style={{ borderColor: '#e5eaf0', color: '#4a6480', background: 'white' }}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Leaderboard table */
              <SectionCard>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>#</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Developer</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Level</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>XP Score</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>AI Efficiency</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Prompts (Total/Success)</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Accepted Code</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Time Saved</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Est. ROI</th>
                        <th className="px-4 py-3 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>Trend</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paged.map((dev, i) => (
                        <LeaderRow key={dev.developer_id} dev={dev} rank={(page - 1) * PAGE_SIZE + i + 1} />
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination page={page} totalPages={totalPages} onPage={setPage} totalItems={filtered.length} pageSize={PAGE_SIZE} />
              </SectionCard>
            )}
          </>
        )}
      </div>
    </div>
  );
}
