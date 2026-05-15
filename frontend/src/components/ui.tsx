import React from 'react';
import { Loader as Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-lg ${className}`} style={{ background: '#edf1f5' }} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-5 animate-pulse" style={{ borderColor: '#e5eaf0' }}>
      <div className="flex items-start justify-between mb-4">
        <Skeleton className="w-10 h-10 rounded-xl" />
        <Skeleton className="w-14 h-5 rounded-md" />
      </div>
      <Skeleton className="h-7 w-28 mb-1.5" />
      <Skeleton className="h-3 w-20 mb-1" />
      <Skeleton className="h-3 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3.5 px-5 border-b animate-pulse" style={{ borderColor: '#f0f4f8' }}>
          <Skeleton className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="animate-pulse flex items-end gap-2 px-4 pt-4" style={{ height }}>
      {[55, 75, 45, 85, 65, 90, 50, 70, 80, 60].map((h, i) => (
        <div key={i} className="flex-1 rounded-t" style={{ height: `${h}%`, background: '#edf1f5' }} />
      ))}
    </div>
  );
}

// ─── Spinner ─────────────────────────────────────────────────────────────────

export function Spinner({ size = 20 }: { size?: number }) {
  return <Loader2 size={size} className="animate-spin" style={{ color: '#0078d4' }} />;
}

export function LoadingOverlay() {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <Spinner size={28} />
      <p className="text-xs" style={{ color: '#8ba3be' }}>Loading data...</p>
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: '#f0f4f8', color: '#c5d4e0' }}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#4a6480' }}>{title}</p>
        {description && <p className="text-xs mt-1 max-w-xs" style={{ color: '#8ba3be' }}>{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

// ─── Search Bar ──────────────────────────────────────────────────────────────

interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }: SearchBarProps) {
  return (
    <div className={`relative ${className}`}>
      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ba3be' }} />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none transition-all"
        style={{ borderColor: '#e5eaf0', background: '#f7fafd', color: '#0d1f30' }}
        onFocus={e => { e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,120,212,0.12)'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.boxShadow = 'none'; }}
      />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────

interface PaginationProps {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
  totalItems?: number;
  pageSize?: number;
}

export function Pagination({ page, totalPages, onPage, totalItems, pageSize }: PaginationProps) {
  if (totalPages <= 1) return null;
  const start = totalItems && pageSize ? (page - 1) * pageSize + 1 : undefined;
  const end = totalItems && pageSize ? Math.min(page * pageSize, totalItems) : undefined;

  return (
    <div className="flex items-center justify-between px-5 py-3 border-t" style={{ borderColor: '#f0f4f8' }}>
      {totalItems !== undefined ? (
        <p className="text-xs" style={{ color: '#8ba3be' }}>
          Showing {start}–{end} of {totalItems}
        </p>
      ) : <div />}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: '#e5eaf0', color: '#4a6480' }}
        >
          <ChevronLeft size={13} />
        </button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 7) {
            if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
          }
          return (
            <button
              key={p}
              onClick={() => onPage(p)}
              className="min-w-[28px] h-7 px-1.5 text-xs rounded-lg font-medium transition-colors border"
              style={p === page
                ? { background: '#0078d4', color: 'white', borderColor: '#0078d4' }
                : { color: '#4a6480', borderColor: '#e5eaf0', background: 'white' }
              }
            >
              {p}
            </button>
          );
        })}
        <button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: '#e5eaf0', color: '#4a6480' }}
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Select ───────────────────────────────────────────────────────────────────

interface SelectProps {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function Select({ value, onChange, options, className = '' }: SelectProps) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border outline-none cursor-pointer transition-all font-medium"
        style={{ borderColor: '#e5eaf0', background: 'white', color: '#4a6480' }}
        onFocus={e => { e.currentTarget.style.borderColor = '#0078d4'; }}
        onBlur={e => { e.currentTarget.style.borderColor = '#e5eaf0'; }}
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
      <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ba3be' }} />
    </div>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────

type BadgeVariant = 'green' | 'red' | 'yellow' | 'blue' | 'gray' | 'orange';

const badgeMap: Record<BadgeVariant, { bg: string; color: string; border: string }> = {
  green:  { bg: '#ecfdf5', color: '#059669', border: '#a7f3d0' },
  red:    { bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
  yellow: { bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  blue:   { bg: '#eff6ff', color: '#2563eb', border: '#bfdbfe' },
  gray:   { bg: '#f8fafc', color: '#64748b', border: '#e2e8f0' },
  orange: { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' },
};

export function Badge({ variant = 'gray', children }: { variant?: BadgeVariant; children: React.ReactNode }) {
  const s = badgeMap[variant];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border"
      style={{ background: s.bg, color: s.color, borderColor: s.border }}
    >
      {children}
    </span>
  );
}

// ─── Trend ────────────────────────────────────────────────────────────────────

export function Trend({ value, suffix = '%', inverse = false }: { value: number; suffix?: string; inverse?: boolean }) {
  const isPositive = inverse ? value < 0 : value > 0;
  const color = isPositive ? '#059669' : value === 0 ? '#8ba3be' : '#dc2626';
  return (
    <span className="inline-flex items-center gap-0.5 text-xs font-semibold" style={{ color }}>
      {value > 0 ? <TrendingUp size={10} /> : value < 0 ? <TrendingDown size={10} /> : null}
      {value > 0 ? '+' : ''}{value}{suffix}
    </span>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

const AVATAR_GRADIENTS = [
  'linear-gradient(135deg, #0078d4, #00aaff)',
  'linear-gradient(135deg, #e07b39, #f59e0b)',
  'linear-gradient(135deg, #10b981, #34d399)',
  'linear-gradient(135deg, #3b82f6, #6366f1)',
  'linear-gradient(135deg, #ec4899, #f43f5e)',
  'linear-gradient(135deg, #14b8a6, #06b6d4)',
  'linear-gradient(135deg, #8b5cf6, #a855f7)',
  'linear-gradient(135deg, #f97316, #fb923c)',
];

export function Avatar({ initials, size = 32, index = 0 }: { initials: string; size?: number; index?: number }) {
  return (
    <div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
        fontSize: size * 0.34,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, color = '#0078d4', className = '' }: {
  value: number; max?: number; color?: string; className?: string;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${className}`} style={{ background: '#edf1f5' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────

export function MiniStat({ label, value, change, color = '#0078d4' }: {
  label: string; value: string; change?: number; color?: string;
}) {
  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#e5eaf0' }}>
      <p className="text-xs mb-1" style={{ color: '#8ba3be' }}>{label}</p>
      <p className="text-xl font-bold mb-1" style={{ color }}>{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          <Trend value={change} />
          <span className="text-xs" style={{ color: '#8ba3be' }}>vs last week</span>
        </div>
      )}
    </div>
  );
}

// ─── FilterBar ────────────────────────────────────────────────────────────────

export function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="flex items-center gap-2 flex-wrap">{children}</div>;
}

// ─── SectionCard ─────────────────────────────────────────────────────────────

export function SectionCard({
  title, action, children, className = '', noPadding = false,
}: {
  title?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}) {
  return (
    <div
      className={`bg-white rounded-xl border overflow-hidden transition-shadow duration-200 ${className}`}
      style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
    >
      {(title || action) && (
        <div
          className="flex items-center justify-between px-5 py-3.5 border-b"
          style={{ borderColor: '#f0f4f8' }}
        >
          {title && (
            <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{title}</p>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </div>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

export function KpiCard({
  label, value, change, icon, iconBg = '#eff6ff', iconColor = '#0078d4', sub,
}: {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  iconBg?: string;
  iconColor?: string;
  sub?: string;
}) {
  return (
    <div
      className="bg-white rounded-xl border p-5 transition-all duration-200 cursor-default group"
      style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
      onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,30,60,0.1)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,30,60,0.05)'; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </div>
        {change !== undefined && (
          <div
            className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={change >= 0
              ? { background: '#ecfdf5', color: '#059669' }
              : { background: '#fef2f2', color: '#dc2626' }
            }
          >
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change >= 0 ? '+' : ''}{change}%
          </div>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5 tracking-tight" style={{ color: '#0d1f30' }}>{value}</p>
      <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#b0c4d4' }}>{sub}</p>}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────────────────

interface TabsProps {
  tabs: { id: string; label: string; count?: number }[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex border-b" style={{ borderColor: '#f0f4f8' }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-4 py-2.5 text-xs font-semibold border-b-2 transition-all duration-150 flex items-center gap-1.5"
          style={active === t.id
            ? { borderColor: '#0078d4', color: '#0078d4' }
            : { borderColor: 'transparent', color: '#8ba3be' }
          }
          onMouseEnter={e => { if (active !== t.id) e.currentTarget.style.color = '#4a6480'; }}
          onMouseLeave={e => { if (active !== t.id) e.currentTarget.style.color = '#8ba3be'; }}
        >
          {t.label}
          {t.count !== undefined && (
            <span
              className="px-1.5 py-0.5 rounded text-xs font-bold"
              style={{ background: active === t.id ? '#eff6ff' : '#f0f4f8', color: active === t.id ? '#0078d4' : '#8ba3be' }}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

export function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: active ? '#10b981' : '#e5eaf0' }}
    />
  );
}

// ─── PageHeader ───────────────────────────────────────────────────────────────

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div
      className="flex-shrink-0 bg-white border-b px-6 py-4"
      style={{ borderColor: '#e5eaf0' }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}
