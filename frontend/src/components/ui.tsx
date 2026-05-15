import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Loader as Loader2, Search, ChevronLeft, ChevronRight, ChevronDown, TrendingUp, TrendingDown } from 'lucide-react';
import { staggerItem } from '../lib/animations';

// ─── Shimmer ──────────────────────────────────────────────────────────────────

export function Shimmer({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-lg overflow-hidden relative ${className}`}
      style={{ background: '#edf1f5' }}
    >
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.6) 50%, transparent 100%)',
        }}
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

export function Skeleton({ className = '' }: { className?: string }) {
  return <Shimmer className={className} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl border p-5" style={{ borderColor: '#e5eaf0' }}>
      <div className="flex items-start justify-between mb-4">
        <Shimmer className="w-10 h-10 rounded-xl" />
        <Shimmer className="w-14 h-5 rounded-md" />
      </div>
      <Shimmer className="h-7 w-28 mb-2" />
      <Shimmer className="h-3 w-20 mb-1.5" />
      <Shimmer className="h-3 w-16" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 py-3.5 px-5 border-b" style={{ borderColor: '#f0f4f8' }}>
          <Shimmer className="h-8 w-8 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-1.5">
            <Shimmer className="h-3.5 w-3/5" />
            <Shimmer className="h-3 w-2/5" />
          </div>
          <Shimmer className="h-4 w-16" />
          <Shimmer className="h-4 w-14" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ height = 200 }: { height?: number }) {
  return (
    <div className="flex items-end gap-2 px-4 pt-4" style={{ height }}>
      {[55, 75, 45, 85, 65, 90, 50, 70, 80, 60].map((h, i) => (
        <div key={i} className="flex-1 rounded-t overflow-hidden relative" style={{ height: `${h}%`, background: '#edf1f5' }}>
          <motion.div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear', delay: i * 0.1 }}
          />
        </div>
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
    <motion.div
      className="flex flex-col items-center justify-center py-20 gap-3 text-center"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: '#f0f4f8', color: '#c5d4e0' }}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        {icon}
      </motion.div>
      <div>
        <p className="text-sm font-semibold" style={{ color: '#4a6480' }}>{title}</p>
        {description && <p className="text-xs mt-1 max-w-xs" style={{ color: '#8ba3be' }}>{description}</p>}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </motion.div>
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
        <motion.button
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="w-7 h-7 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: '#e5eaf0', color: '#4a6480' }}
          whileHover={{ background: '#f0f4f8' }}
          whileTap={{ scale: 0.92 }}
        >
          <ChevronLeft size={13} />
        </motion.button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
          let p = i + 1;
          if (totalPages > 7) {
            if (page <= 4) p = i + 1;
            else if (page >= totalPages - 3) p = totalPages - 6 + i;
            else p = page - 3 + i;
          }
          return (
            <motion.button
              key={p}
              onClick={() => onPage(p)}
              className="min-w-[28px] h-7 px-1.5 text-xs rounded-lg font-medium border"
              style={p === page
                ? { background: '#0078d4', color: 'white', borderColor: '#0078d4' }
                : { color: '#4a6480', borderColor: '#e5eaf0', background: 'white' }
              }
              whileHover={p !== page ? { background: '#f0f4f8' } : {}}
              whileTap={{ scale: 0.92 }}
            >
              {p}
            </motion.button>
          );
        })}
        <motion.button
          onClick={() => onPage(page + 1)}
          disabled={page === totalPages}
          className="w-7 h-7 flex items-center justify-center rounded-lg border disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ borderColor: '#e5eaf0', color: '#4a6480' }}
          whileHover={{ background: '#f0f4f8' }}
          whileTap={{ scale: 0.92 }}
        >
          <ChevronRight size={13} />
        </motion.button>
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
    <motion.div
      className="rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
      style={{
        width: size,
        height: size,
        background: AVATAR_GRADIENTS[index % AVATAR_GRADIENTS.length],
        fontSize: size * 0.34,
        letterSpacing: '0.02em',
      }}
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.2 }}
    >
      {initials}
    </motion.div>
  );
}

// ─── Animated Counter ─────────────────────────────────────────────────────────

function useAnimatedNumber(target: number, duration = 1.2) {
  const [display, setDisplay] = useState(0);
  const raf = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef(0);

  useEffect(() => {
    if (target === 0) { setDisplay(0); return; }
    startRef.current = null;
    startValRef.current = display;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = (ts - startRef.current) / 1000;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutExpo
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(startValRef.current + (target - startValRef.current) * eased));
      if (progress < 1) raf.current = requestAnimationFrame(animate);
    };

    raf.current = requestAnimationFrame(animate);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, max = 100, color = '#0078d4', className = '', animate: doAnimate = true }: {
  value: number; max?: number; color?: string; className?: string; animate?: boolean;
}) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={`h-1.5 rounded-full overflow-hidden ${className}`} style={{ background: '#edf1f5' }}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={doAnimate ? { width: 0 } : { width: `${pct}%` }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      />
    </div>
  );
}

// ─── MiniStat ─────────────────────────────────────────────────────────────────

export function MiniStat({ label, value, change, color = '#0078d4' }: {
  label: string; value: string; change?: number; color?: string;
}) {
  return (
    <motion.div
      className="bg-white rounded-xl border p-4"
      style={{ borderColor: '#e5eaf0' }}
      whileHover={{ y: -2, boxShadow: '0 4px 16px rgba(0,30,60,0.1)' }}
      transition={{ duration: 0.2 }}
    >
      <p className="text-xs mb-1" style={{ color: '#8ba3be' }}>{label}</p>
      <p className="text-xl font-bold mb-1" style={{ color }}>{value}</p>
      {change !== undefined && (
        <div className="flex items-center gap-1">
          <Trend value={change} />
          <span className="text-xs" style={{ color: '#8ba3be' }}>vs last week</span>
        </div>
      )}
    </motion.div>
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
    <motion.div
      className={`bg-white rounded-xl border overflow-hidden ${className}`}
      style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ boxShadow: '0 4px 20px rgba(0,30,60,0.08)' }}
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
    </motion.div>
  );
}

// ─── KpiCard ─────────────────────────────────────────────────────────────────

function parseNumericValue(value: string): { numeric: number; prefix: string; suffix: string } {
  const match = value.match(/^(\$?)([0-9.]+)([KMBh%]?)$/);
  if (!match) return { numeric: 0, prefix: '', suffix: '' };
  return {
    prefix: match[1] || '',
    numeric: parseFloat(match[2]),
    suffix: match[3] || '',
  };
}

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
  const { numeric, prefix, suffix } = parseNumericValue(value);
  const animated = useAnimatedNumber(numeric);
  const displayValue = numeric > 0 ? `${prefix}${animated}${suffix}` : value;

  return (
    <motion.div
      className="bg-white rounded-xl border p-5 cursor-default"
      style={{ borderColor: '#e5eaf0', boxShadow: '0 1px 3px rgba(0,30,60,0.05)' }}
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -3, boxShadow: '0 8px 24px rgba(0,30,60,0.12)', scale: 1.01 }}
    >
      <div className="flex items-start justify-between mb-3.5">
        <motion.div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: iconBg }}
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ duration: 0.2 }}
        >
          <span style={{ color: iconColor }}>{icon}</span>
        </motion.div>
        {change !== undefined && (
          <motion.div
            className="flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-lg"
            style={change >= 0
              ? { background: '#ecfdf5', color: '#059669' }
              : { background: '#fef2f2', color: '#dc2626' }
            }
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.25 }}
          >
            {change >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change >= 0 ? '+' : ''}{change}%
          </motion.div>
        )}
      </div>
      <p className="text-2xl font-bold mb-0.5 tracking-tight" style={{ color: '#0d1f30' }}>{displayValue}</p>
      <p className="text-xs font-medium" style={{ color: '#8ba3be' }}>{label}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#b0c4d4' }}>{sub}</p>}
    </motion.div>
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
    <div className="flex border-b relative" style={{ borderColor: '#f0f4f8' }}>
      {tabs.map(t => (
        <motion.button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-4 py-2.5 text-xs font-semibold border-b-2 flex items-center gap-1.5 relative"
          style={active === t.id
            ? { borderColor: '#0078d4', color: '#0078d4' }
            : { borderColor: 'transparent', color: '#8ba3be' }
          }
          whileHover={{ color: active !== t.id ? '#4a6480' : '#0078d4' }}
          transition={{ duration: 0.15 }}
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
        </motion.button>
      ))}
    </div>
  );
}

// ─── StatusDot ────────────────────────────────────────────────────────────────

export function StatusDot({ active = true }: { active?: boolean }) {
  return (
    <motion.span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: active ? '#10b981' : '#e5eaf0' }}
      animate={active ? { scale: [1, 1.3, 1], opacity: [1, 0.7, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

// ─── LivePulse ────────────────────────────────────────────────────────────────

export function LivePulse({ color = '#10b981', size = 8 }: { color?: string; size?: number }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      <motion.span
        className="absolute inline-flex rounded-full"
        style={{ width: size, height: size, background: color, opacity: 0.6 }}
        animate={{ scale: [1, 2.2, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeOut' }}
      />
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, background: color }}
      />
    </span>
  );
}

// ─── AnimatedTableRow ─────────────────────────────────────────────────────────

export function AnimatedTableRow({ children, index = 0, className = '', style = {} }: {
  children: React.ReactNode;
  index?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.tr
      className={className}
      style={style}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut', delay: index * 0.04 }}
      whileHover={{ backgroundColor: '#f7fafd' }}
    >
      {children}
    </motion.tr>
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
    <motion.div
      className="flex-shrink-0 bg-white border-b px-6 py-4"
      style={{ borderColor: '#e5eaf0' }}
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-base font-semibold tracking-tight" style={{ color: '#0d1f30' }}>{title}</h1>
          {subtitle && <p className="text-xs mt-0.5" style={{ color: '#8ba3be' }}>{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </motion.div>
  );
}

// ─── SlidePanel ───────────────────────────────────────────────────────────────

export function SlidePanel({
  open,
  onClose,
  title,
  children,
  width = 400,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,15,30,0.4)', backdropFilter: 'blur(2px)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed right-0 top-0 h-full z-50 bg-white shadow-2xl flex flex-col"
            style={{ width, borderLeft: '1px solid #e5eaf0' }}
            initial={{ x: width }}
            animate={{ x: 0 }}
            exit={{ x: width }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b flex-shrink-0" style={{ borderColor: '#e5eaf0' }}>
              <p className="text-sm font-semibold" style={{ color: '#0d1f30' }}>{title}</p>
              <motion.button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                style={{ color: '#8ba3be', background: '#f0f4f8' }}
                whileHover={{ background: '#e5eaf0', color: '#4a6480' }}
                whileTap={{ scale: 0.9 }}
              >
                ✕
              </motion.button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── StaggerList ──────────────────────────────────────────────────────────────

export function StaggerList({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.06 } },
      }}
    >
      {React.Children.map(children, (child, i) => (
        <motion.div key={i} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// ─── ChartContainer ───────────────────────────────────────────────────────────

export function ChartContainer({ children, height = 200 }: { children: React.ReactNode; height?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scaleY: 0.92 }}
      animate={{ opacity: 1, scaleY: 1 }}
      transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
      style={{ height, transformOrigin: 'bottom' }}
    >
      {children}
    </motion.div>
  );
}
