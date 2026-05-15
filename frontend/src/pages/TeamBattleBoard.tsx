import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, TrendingUp, TrendingDown, DollarSign, Users, Zap, Star, Target, Clock, Crown, Swords, ArrowUpRight, ArrowDownRight, BarChart2, Activity } from 'lucide-react';
import { SectionCard, PageHeader, KpiCard, ProgressBar, Badge } from '../components/ui';
import client from '../api/client';

// ─── Types ────────────────────────────────────────────────────────────────────

interface TeamBattleEntry {
  name: string;
  size: number;
  totalUsage: number;
  cost: number;
  bestPromptScore: number;
  aiAdoption: number;
  avgXP: number;
  timeSaved: number;
  topModel: string;
  totalScore: number;
  rank: number;
  weeklyChange: number;
  trend: number[];
  tokenEfficiency: number;
  promptSuccessRate: number;
  codeAcceptance: number;
  modelOptimization: number;
  productivityGain: number;
}

// ─── In-memory data generation ────────────────────────────────────────────────

function seededRandom(seed: number) {
  const x = Math.sin(seed + 1) * 10000;
  return x - Math.floor(x);
}

const TEAMS_RAW = [
  { name: 'Platform Team', size: 4, topModel: 'Claude' },
  { name: 'Backend Team', size: 5, topModel: 'GPT-4o' },
  { name: 'Frontend Team', size: 4, topModel: 'Cursor' },
  { name: 'DevOps Team', size: 3, topModel: 'GitHub Copilot' },
  { name: 'QA Automation', size: 3, topModel: 'Claude' },
];

function generateTeamData(): TeamBattleEntry[] {
  return TEAMS_RAW.map((t, i) => {
    const base = 88 - i * 3.5;
    const tokenEff = Math.round(base - seededRandom(i * 7 + 200) * 8 + 3);
    const promptSuccess = Math.round(base - seededRandom(i * 13 + 200) * 10 + 2);
    const codeAcceptance = Math.round(base - seededRandom(i * 17 + 200) * 12 + 4);
    const modelOpt = Math.round(base - seededRandom(i * 23 + 200) * 6 + 1);
    const productivityGain = Math.round(base - seededRandom(i * 31 + 200) * 9 + 3);
    const totalScore = Math.round(
      (tokenEff + promptSuccess + codeAcceptance + modelOpt + productivityGain) / 5
    );
    const totalUsage = Math.round(42000 - i * 5200 + seededRandom(i * 11 + 200) * 8000);
    const cost = Math.round((5200 - i * 480 + seededRandom(i * 17 + 200) * 800) * 100) / 100;
    const aiAdoption = Math.round(base + seededRandom(i * 37 + 200) * 5 - 2);
    const avgXP = Math.round(1800 - i * 180 + seededRandom(i * 41 + 200) * 300);
    const timeSaved = Math.round(240 - i * 28 + seededRandom(i * 43 + 200) * 50);
    const bestPromptScore = Math.round(base + seededRandom(i * 53 + 200) * 10 - 3);
    const trend = Array.from({ length: 7 }, (_, w) =>
      Math.round(totalScore - 5 + seededRandom(i * 100 + w * 7) * 12)
    );
    return {
      name: t.name,
      size: t.size,
      topModel: t.topModel,
      totalUsage,
      cost,
      bestPromptScore: Math.min(99, bestPromptScore),
      aiAdoption: Math.min(99, aiAdoption),
      avgXP,
      timeSaved,
      totalScore: Math.min(99, totalScore),
      tokenEfficiency: Math.min(99, tokenEff),
      promptSuccessRate: Math.min(99, promptSuccess),
      codeAcceptance: Math.min(99, codeAcceptance),
      modelOptimization: Math.min(99, modelOpt),
      productivityGain: Math.min(99, productivityGain),
      rank: 0,
      weeklyChange: Math.round(seededRandom(i * 43 + 200) * 10 - 3),
      trend,
    };
  })
    .sort((a, b) => b.totalScore - a.totalScore)
    .map((t, i) => ({ ...t, rank: i + 1 }));
}

async function fetchTeamBattle(): Promise<TeamBattleEntry[]> {
  try {
    const { data } = await client.get('/league/team-leaderboard');
    // Augment league data with extra fields from in-memory generation
    const generated = generateTeamData();
    return data.map((d: TeamBattleEntry) => {
      const gen = generated.find(g => g.name === d.name) ?? generated[0];
      return { ...gen, ...d, trend: gen.trend };
    });
  } catch {
    return generateTeamData();
  }
}

// ─── Colour palette per team ──────────────────────────────────────────────────

const TEAM_COLORS = [
  { primary: '#0078d4', light: '#eff6ff', ring: 'rgba(0,120,212,0.25)' },
  { primary: '#059669', light: '#f0fdf4', ring: 'rgba(5,150,105,0.25)' },
  { primary: '#e07b39', light: '#fff7ed', ring: 'rgba(224,123,57,0.25)' },
  { primary: '#d97706', light: '#fffbeb', ring: 'rgba(217,119,6,0.25)' },
  { primary: '#0891b2', light: '#ecfeff', ring: 'rgba(8,145,178,0.25)' },
];

const MODEL_COLORS: Record<string, string> = {
  Claude: '#e07b39',
  'GPT-4o': '#10a37f',
  Cursor: '#0078d4',
  'GitHub Copilot': '#24292e',
};

// ─── Medal config ─────────────────────────────────────────────────────────────

const MEDALS = [
  { bg: 'linear-gradient(135deg, #FFD700, #FFA500)', text: '#7a4f00', label: 'Gold' },
  { bg: 'linear-gradient(135deg, #C0C0C0, #A8A8A8)', text: '#444', label: 'Silver' },
  { bg: 'linear-gradient(135deg, #CD7F32, #A0522D)', text: '#fff', label: 'Bronze' },
];

// ─── Radar Chart ──────────────────────────────────────────────────────────────

const RADAR_AXES = [
  { key: 'tokenEfficiency', label: 'Token Eff.' },
  { key: 'promptSuccessRate', label: 'Prompt Success' },
  { key: 'codeAcceptance', label: 'Code Accept.' },
  { key: 'modelOptimization', label: 'Model Opt.' },
  { key: 'productivityGain', label: 'Productivity' },
];

function polarToXY(angle: number, r: number, cx: number, cy: number) {
  const rad = (angle - 90) * (Math.PI / 180);
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function RadarChart({ teams, selected }: { teams: TeamBattleEntry[]; selected: string[] }) {
  const cx = 150, cy = 150, maxR = 110;
  const n = RADAR_AXES.length;
  const angles = RADAR_AXES.map((_, i) => (360 / n) * i);
  const gridLevels = [20, 40, 60, 80, 100];

  const visibleTeams = teams.filter(t => selected.includes(t.name));

  function teamPoints(team: TeamBattleEntry) {
    return RADAR_AXES.map((ax, i) => {
      const val = (team as unknown as Record<string, number>)[ax.key] / 100;
      const { x, y } = polarToXY(angles[i], val * maxR, cx, cy);
      return `${x},${y}`;
    }).join(' ');
  }

  return (
    <svg viewBox="0 0 300 300" className="w-full max-w-xs mx-auto" style={{ height: 280 }}>
      {/* Grid circles */}
      {gridLevels.map(level => (
        <polygon
          key={level}
          points={angles.map(a => {
            const { x, y } = polarToXY(a, (level / 100) * maxR, cx, cy);
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="#e5eaf0"
          strokeWidth={1}
        />
      ))}
      {/* Axis lines */}
      {angles.map((angle, i) => {
        const outer = polarToXY(angle, maxR, cx, cy);
        return <line key={i} x1={cx} y1={cy} x2={outer.x} y2={outer.y} stroke="#e5eaf0" strokeWidth={1} />;
      })}
      {/* Team polygons */}
      {visibleTeams.map((team, ti) => {
        const idx = teams.findIndex(t => t.name === team.name);
        const color = TEAM_COLORS[idx % TEAM_COLORS.length].primary;
        return (
          <g key={team.name}>
            <polygon
              points={teamPoints(team)}
              fill={color}
              fillOpacity={0.12}
              stroke={color}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            {RADAR_AXES.map((ax, i) => {
              const val = (team as unknown as Record<string, number>)[ax.key] / 100;
              const { x, y } = polarToXY(angles[i], val * maxR, cx, cy);
              return (
                <circle key={i} cx={x} cy={y} r={3} fill={color} />
              );
            })}
          </g>
        );
      })}
      {/* Axis labels */}
      {RADAR_AXES.map((ax, i) => {
        const { x, y } = polarToXY(angles[i], maxR + 18, cx, cy);
        return (
          <text
            key={ax.key}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={600}
            fill="#8ba3be"
          >
            {ax.label}
          </text>
        );
      })}
    </svg>
  );
}

// ─── Mini Sparkline ───────────────────────────────────────────────────────────

function Sparkline({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const area = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${w},${h} L0,${h} Z`;
  const line = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <path d={area} fill={color} fillOpacity={0.12} />
      <path d={line} fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Win Indicator ───────────────────────────────────────────────────────────

function WinBadge({ wins, total }: { wins: number; total: number }) {
  const pct = Math.round((wins / total) * 100);
  const color = pct >= 60 ? '#059669' : pct >= 40 ? '#d97706' : '#dc2626';
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex gap-0.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm"
            style={{ background: i < wins ? color : '#e5eaf0' }}
          />
        ))}
      </div>
      <span className="text-xs font-bold" style={{ color }}>{wins}/{total}</span>
    </div>
  );
}

// ─── Metric Bar Row ───────────────────────────────────────────────────────────

function MetricBarRow({
  label, values, teams, maxValue,
}: {
  label: string;
  values: number[];
  teams: TeamBattleEntry[];
  maxValue: number;
}) {
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
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${(v / maxValue) * 100}%`, background: color, opacity: isMax ? 1 : 0.55 }}
              />
            </div>
            <span className="text-xs font-bold tabular-nums w-10 text-right" style={{ color: isMax ? color : '#8ba3be' }}>
              {typeof v === 'number' && v > 200 ? v.toLocaleString() : v}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Team Comparison Card ─────────────────────────────────────────────────────

function TeamComparisonCard({
  team, colorIdx, rank, isSelected, onSelect, allTeams,
}: {
  team: TeamBattleEntry;
  colorIdx: number;
  rank: number;
  isSelected: boolean;
  onSelect: () => void;
  allTeams: TeamBattleEntry[];
}) {
  const color = TEAM_COLORS[colorIdx % TEAM_COLORS.length];
  const medal = rank <= 3 ? MEDALS[rank - 1] : null;
  const initials = team.name.split(' ').map(w => w[0]).join('').slice(0, 2);
  const modelColor = MODEL_COLORS[team.topModel] ?? '#0078d4';

  // win count: how many metrics this team leads in
  const metrics: (keyof TeamBattleEntry)[] = [
    'totalUsage', 'aiAdoption', 'avgXP', 'timeSaved', 'bestPromptScore',
  ];
  const wins = metrics.filter(m => {
    const vals = allTeams.map(t => t[m] as number);
    return (team[m] as number) === Math.max(...vals);
  }).length;

  return (
    <div
      className="bg-white rounded-2xl border overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        borderColor: isSelected ? color.primary : '#e5eaf0',
        boxShadow: isSelected ? `0 0 0 2px ${color.ring}, 0 4px 16px rgba(0,30,60,0.08)` : '0 1px 3px rgba(0,30,60,0.05)',
        transform: isSelected ? 'translateY(-2px)' : 'translateY(0)',
      }}
      onClick={onSelect}
      onMouseEnter={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)';
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={e => {
        if (!isSelected) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Header band */}
      <div
        className="px-4 pt-4 pb-3"
        style={{ background: isSelected ? `${color.light}` : '#fafbfd' }}
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2.5">
            {medal ? (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0"
                style={{ background: medal.bg, color: medal.text, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
              >
                {initials}
              </div>
            ) : (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 text-white"
                style={{ background: color.primary }}
              >
                {initials}
              </div>
            )}
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

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {rank <= 3 && <Crown size={11} style={{ color: rank === 1 ? '#d97706' : rank === 2 ? '#94a3b8' : '#a16207' }} />}
            <span className="text-xs font-bold" style={{ color: rank <= 3 ? '#0d1f30' : '#8ba3be' }}>
              #{rank}
            </span>
            <span
              className="flex items-center gap-0.5 text-xs font-semibold"
              style={{ color: team.weeklyChange > 0 ? '#059669' : team.weeklyChange < 0 ? '#dc2626' : '#8ba3be' }}
            >
              {team.weeklyChange > 0 ? <ArrowUpRight size={11} /> : team.weeklyChange < 0 ? <ArrowDownRight size={11} /> : null}
              {team.weeklyChange > 0 ? '+' : ''}{team.weeklyChange}
            </span>
          </div>
          <WinBadge wins={wins} total={metrics.length} />
        </div>
      </div>

      {/* Metrics */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {[
            { label: 'Total Usage', value: team.totalUsage.toLocaleString(), icon: <BarChart2 size={11} />, color: color.primary },
            { label: 'Cost', value: `$${team.cost.toLocaleString()}`, icon: <DollarSign size={11} />, color: '#059669' },
            { label: 'AI Adoption', value: `${team.aiAdoption}%`, icon: <Zap size={11} />, color: '#e07b39' },
            { label: 'Avg XP', value: team.avgXP.toLocaleString(), icon: <Star size={11} />, color: '#d97706' },
            { label: 'Time Saved', value: `${team.timeSaved}h`, icon: <Clock size={11} />, color: '#0891b2' },
            { label: 'Best Prompt', value: String(team.bestPromptScore), icon: <Target size={11} />, color: '#059669' },
          ].map(m => (
            <div key={m.label} className="flex items-center gap-1.5">
              <span style={{ color: m.color }}>{m.icon}</span>
              <div className="min-w-0">
                <p className="text-xs" style={{ color: '#8ba3be' }}>{m.label}</p>
                <p className="text-xs font-bold" style={{ color: '#0d1f30' }}>{m.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Top Model */}
        <div className="flex items-center justify-between pt-1.5 border-t" style={{ borderColor: '#f0f4f8' }}>
          <span className="text-xs" style={{ color: '#8ba3be' }}>Top Model</span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={{ background: `${modelColor}15`, color: modelColor }}
          >
            {team.topModel}
          </span>
        </div>

        {/* Sparkline */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: '#8ba3be' }}>7d trend</span>
          <Sparkline data={team.trend} color={color.primary} />
        </div>
      </div>

      {/* Score bar */}
      <div className="px-4 pb-4">
        <ProgressBar value={team.totalScore} max={100} color={color.primary} />
      </div>
    </div>
  );
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function TrendChart({ teams, selected }: { teams: TeamBattleEntry[]; selected: string[] }) {
  const visible = teams.filter(t => selected.includes(t.name));
  const allVals = visible.flatMap(t => t.trend);
  const min = Math.floor(Math.min(...allVals) - 2);
  const max = Math.ceil(Math.max(...allVals) + 2);
  const range = max - min || 1;
  const w = 500, h = 160, padL = 32, padR = 16, padT = 12, padB = 24;
  const chartW = w - padL - padR;
  const chartH = h - padT - padB;

  function yOf(val: number) {
    return padT + chartH - ((val - min) / range) * chartH;
  }
  function xOf(i: number) {
    return padL + (i / (WEEK_LABELS.length - 1)) * chartW;
  }

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: h }}>
      {/* Y gridlines */}
      {[0, 25, 50, 75, 100].map(pct => {
        const v = min + (pct / 100) * range;
        const y = yOf(v);
        return (
          <g key={pct}>
            <line x1={padL} x2={w - padR} y1={y} y2={y} stroke="#f0f4f8" strokeWidth={1} />
            <text x={padL - 4} y={y} textAnchor="end" dominantBaseline="middle" fontSize={8} fill="#b0c4d4">
              {Math.round(v)}
            </text>
          </g>
        );
      })}
      {/* X labels */}
      {WEEK_LABELS.map((label, i) => (
        <text key={label} x={xOf(i)} y={h - 6} textAnchor="middle" fontSize={8} fill="#b0c4d4">{label}</text>
      ))}
      {/* Lines */}
      {visible.map(team => {
        const idx = teams.findIndex(t => t.name === team.name);
        const color = TEAM_COLORS[idx % TEAM_COLORS.length].primary;
        const pts = team.trend.map((v, i) => `${xOf(i)},${yOf(v)}`);
        const area = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')} L${xOf(WEEK_LABELS.length - 1)},${padT + chartH} L${padL},${padT + chartH} Z`;
        const line = `M${pts[0]} ${pts.slice(1).map(p => `L${p}`).join(' ')}`;
        return (
          <g key={team.name}>
            <path d={area} fill={color} fillOpacity={0.08} />
            <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
            {team.trend.map((v, i) => (
              <circle key={i} cx={xOf(i)} cy={yOf(v)} r={3} fill={color} />
            ))}
          </g>
        );
      })}
    </svg>
  );
}

// ─── Team Ranking Table ───────────────────────────────────────────────────────

function TeamRankingTable({ teams }: { teams: TeamBattleEntry[] }) {
  const cols: { label: string; key: keyof TeamBattleEntry; fmt: (v: number) => string }[] = [
    { label: 'Total Usage', key: 'totalUsage', fmt: v => v.toLocaleString() },
    { label: 'Cost', key: 'cost', fmt: v => `$${v.toLocaleString()}` },
    { label: 'AI Adoption', key: 'aiAdoption', fmt: v => `${v}%` },
    { label: 'Avg XP', key: 'avgXP', fmt: v => v.toLocaleString() },
    { label: 'Time Saved', key: 'timeSaved', fmt: v => `${v}h` },
    { label: 'Best Prompt', key: 'bestPromptScore', fmt: v => String(v) },
    { label: 'Score', key: 'totalScore', fmt: v => String(v) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: '#f0f4f8' }}>
            <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Rank</th>
            <th className="px-4 py-2.5 text-left text-xs font-semibold" style={{ color: '#8ba3be' }}>Team</th>
            {cols.map(c => (
              <th key={c.key} className="px-4 py-2.5 text-right text-xs font-semibold" style={{ color: '#8ba3be' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {teams.map((team, i) => {
            const color = TEAM_COLORS[i % TEAM_COLORS.length];
            const medal = team.rank <= 3 ? MEDALS[team.rank - 1] : null;
            const initials = team.name.split(' ').map(w => w[0]).join('').slice(0, 2);
            return (
              <tr
                key={team.name}
                className="border-b transition-colors"
                style={{ borderColor: '#f0f4f8' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#f7fafd'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
              >
                <td className="px-4 py-3">
                  {medal ? (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-xs"
                      style={{ background: medal.bg, boxShadow: `0 2px 6px rgba(0,0,0,0.2)` }}
                    >
                      {team.rank}
                    </div>
                  ) : (
                    <span className="text-sm font-bold tabular-nums" style={{ color: '#8ba3be' }}>
                      {team.rank}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                      style={{ background: medal ? medal.bg : color.primary }}
                    >
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
                  const colVals = teams.map(t => t[c.key] as number);
                  const isMax = val === Math.max(...colVals);
                  return (
                    <td key={c.key} className="px-4 py-3 text-right">
                      <span
                        className="text-xs font-bold tabular-nums"
                        style={{ color: isMax ? color.primary : '#4a6480' }}
                      >
                        {c.fmt(val)}
                        {isMax && (
                          <span className="ml-1 text-xs" style={{ color: color.primary }}>▲</span>
                        )}
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
  const { data: teams = [], isLoading } = useQuery({
    queryKey: ['team-battle'],
    queryFn: fetchTeamBattle,
  });

  const [selected, setSelected] = useState<string[]>([]);

  const allSelected = useMemo(
    () => (selected.length === 0 ? teams.map(t => t.name) : selected),
    [selected, teams]
  );

  function toggleTeam(name: string) {
    setSelected(prev => {
      if (prev.includes(name)) {
        return prev.filter(n => n !== name);
      }
      return [...prev, name];
    });
  }

  const leader = teams[0];
  const totalCost = teams.reduce((s, t) => s + t.cost, 0);
  const avgAdoption = teams.length ? Math.round(teams.reduce((s, t) => s + t.aiAdoption, 0) / teams.length) : 0;
  const totalTimeSaved = teams.reduce((s, t) => s + t.timeSaved, 0);

  const metricRows = [
    { label: 'Total Usage (tokens)', key: 'totalUsage' as const, maxValue: Math.max(...teams.map(t => t.totalUsage)) },
    { label: 'AI Adoption (%)', key: 'aiAdoption' as const, maxValue: 100 },
    { label: 'Avg XP', key: 'avgXP' as const, maxValue: Math.max(...teams.map(t => t.avgXP)) },
    { label: 'Time Saved (hours)', key: 'timeSaved' as const, maxValue: Math.max(...teams.map(t => t.timeSaved)) },
    { label: 'Best Prompt Score', key: 'bestPromptScore' as const, maxValue: 100 },
  ];

  return (
    <div className="flex flex-col h-full min-h-0" style={{ background: '#f0f4f8' }}>
      <PageHeader
        title="Team Battle Board"
        subtitle="Head-to-head team comparison across all key AI productivity metrics"
        actions={
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: '#fff0e6', color: '#e07b39' }}
            >
              <Swords size={12} />
              Live Battle
            </div>
            {selected.length > 0 && (
              <button
                onClick={() => setSelected([])}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                style={{ background: '#f0f4f8', color: '#4a6480' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#e5eaf0'; }}
                onMouseLeave={e => { e.currentTarget.style.background = '#f0f4f8'; }}
              >
                Show All
              </button>
            )}
          </div>
        }
      />

      <div className="flex-1 overflow-y-auto p-5 min-h-0 space-y-5">

        {/* KPIs */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <KpiCard
            label="Battle Leader"
            value={leader?.name?.split(' ')[0] ?? '—'}
            icon={<Trophy size={17} />}
            iconBg="#fffbeb"
            iconColor="#d97706"
            sub={leader ? `Score: ${leader.totalScore}` : undefined}
          />
          <KpiCard
            label="Total AI Cost"
            value={`$${totalCost.toLocaleString()}`}
            change={-4.2}
            icon={<DollarSign size={17} />}
            iconBg="#f0fdf4"
            iconColor="#059669"
          />
          <KpiCard
            label="Avg AI Adoption"
            value={`${avgAdoption}%`}
            change={6.1}
            icon={<Zap size={17} />}
            iconBg="#fff7ed"
            iconColor="#e07b39"
          />
          <KpiCard
            label="Total Time Saved"
            value={`${totalTimeSaved}h`}
            change={8.3}
            icon={<Clock size={17} />}
            iconBg="#ecfeff"
            iconColor="#0891b2"
          />
        </div>

        {/* Comparison Cards */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Swords size={14} style={{ color: '#e07b39' }} />
            <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>Team Comparison</p>
            <span className="text-xs" style={{ color: '#8ba3be' }}>— click to select teams for radar & trend</span>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border h-64 animate-pulse" style={{ borderColor: '#e5eaf0' }} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
              {teams.map((team, i) => (
                <TeamComparisonCard
                  key={team.name}
                  team={team}
                  colorIdx={i}
                  rank={team.rank}
                  isSelected={allSelected.includes(team.name)}
                  onSelect={() => toggleTeam(team.name)}
                  allTeams={teams}
                />
              ))}
            </div>
          )}
        </div>

        {/* Radar + Trend charts */}
        {!isLoading && teams.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Radar Chart */}
            <SectionCard
              title="Skill Radar"
              action={
                <div className="flex items-center gap-2 flex-wrap">
                  {teams.map((t, i) => {
                    const color = TEAM_COLORS[i % TEAM_COLORS.length].primary;
                    const isVis = allSelected.includes(t.name);
                    return (
                      <button
                        key={t.name}
                        onClick={() => toggleTeam(t.name)}
                        className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-all"
                        style={{
                          background: isVis ? `${color}18` : '#f0f4f8',
                          color: isVis ? color : '#8ba3be',
                          border: `1px solid ${isVis ? color + '40' : 'transparent'}`,
                        }}
                      >
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

            {/* Trend Chart */}
            <SectionCard
              title="7-Day Score Trend"
              action={
                <div className="flex items-center gap-1.5 text-xs" style={{ color: '#8ba3be' }}>
                  <Activity size={12} />
                  Weekly performance
                </div>
              }
            >
              <div className="p-4">
                <TrendChart teams={teams} selected={allSelected} />
                <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t" style={{ borderColor: '#f0f4f8' }}>
                  {teams.filter(t => allSelected.includes(t.name)).map((team) => {
                    const idx = teams.findIndex(t => t.name === team.name);
                    const color = TEAM_COLORS[idx % TEAM_COLORS.length].primary;
                    const last = team.trend[team.trend.length - 1];
                    const prev = team.trend[team.trend.length - 2];
                    const delta = last - prev;
                    return (
                      <div key={team.name} className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                        <span className="text-xs font-medium" style={{ color: '#4a6480' }}>{team.name.split(' ')[0]}</span>
                        <span className="text-xs font-bold" style={{ color: delta >= 0 ? '#059669' : '#dc2626' }}>
                          {delta >= 0 ? '+' : ''}{delta}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </SectionCard>
          </div>
        )}

        {/* Metric Comparison Bars */}
        {!isLoading && teams.length > 0 && (
          <SectionCard title="Metric Breakdown">
            <div className="p-5 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {metricRows.map(m => (
                <MetricBarRow
                  key={m.key}
                  label={m.label}
                  values={teams.map(t => t[m.key] as number)}
                  teams={teams}
                  maxValue={m.maxValue}
                />
              ))}
              {/* Cost (lower is better — show inverted label) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>Cost ($)</p>
                  <span className="text-xs font-bold" style={{ color: '#059669' }}>
                    {teams.reduce((min, t) => t.cost < min.cost ? t : min, teams[0])?.name.split(' ')[0]} lowest
                  </span>
                </div>
                {teams.map((team, i) => {
                  const color = TEAM_COLORS[i % TEAM_COLORS.length].primary;
                  const isMin = team.cost === Math.min(...teams.map(t => t.cost));
                  const maxCost = Math.max(...teams.map(t => t.cost));
                  return (
                    <div key={team.name} className="flex items-center gap-2">
                      <span className="text-xs w-24 truncate font-medium" style={{ color: isMin ? '#0d1f30' : '#8ba3be' }}>
                        {team.name.split(' ')[0]}
                      </span>
                      <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#f0f4f8' }}>
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(team.cost / maxCost) * 100}%`, background: color, opacity: isMin ? 1 : 0.55 }}
                        />
                      </div>
                      <span className="text-xs font-bold tabular-nums w-14 text-right" style={{ color: isMin ? '#059669' : '#8ba3be' }}>
                        ${team.cost.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>
        )}

        {/* Team Ranking Table */}
        {!isLoading && teams.length > 0 && (
          <SectionCard title="Full Team Ranking" noPadding>
            <TeamRankingTable teams={teams} />
          </SectionCard>
        )}

      </div>
    </div>
  );
}
