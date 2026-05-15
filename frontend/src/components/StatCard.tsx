import { TrendingUp, TrendingDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface Props {
  icon: ReactNode;
  label: string;
  value: string;
  change: number;
  sub: string;
}

export default function StatCard({ icon, label, value, change, sub }: Props) {
  const up = change >= 0;
  return (
    <div className="bg-white border border-gray-100 rounded-lg p-4 flex flex-col gap-1.5 hover:shadow-sm transition-shadow">
      <div className="flex items-center gap-1.5 text-gray-400 text-xs font-medium">
        {icon}<span>{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-xl font-bold text-gray-900 leading-none tracking-tight">{value}</span>
        <span className={`flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${up ? 'text-emerald-600' : 'text-red-500'}`}>
          {up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {up ? '+' : ''}{change}%
        </span>
      </div>
      <div className="text-[10px] text-gray-400">{sub}</div>
    </div>
  );
}
