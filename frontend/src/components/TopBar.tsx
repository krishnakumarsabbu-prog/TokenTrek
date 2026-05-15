import { Calendar, RefreshCw, Plus, ChevronDown } from 'lucide-react';

export default function TopBar() {
  return (
    <header className="flex-shrink-0 bg-white border-b border-gray-100 px-6 h-12 flex items-center gap-3 justify-end">
      <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-md text-sm text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors">
        <Calendar size={13} className="text-gray-400" />
        <span className="font-medium text-xs">May 12 - May 18, 2025</span>
        <ChevronDown size={11} className="text-gray-400" />
      </button>
      <button className="p-1.5 border border-gray-200 rounded-md text-gray-400 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-600 transition-colors">
        <RefreshCw size={13} />
      </button>
      <button
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold text-white transition-colors"
        style={{ background: '#0078d4' }}
        onMouseEnter={e => (e.currentTarget.style.background = '#006cbd')}
        onMouseLeave={e => (e.currentTarget.style.background = '#0078d4')}
      >
        <Plus size={13} /> Add Data
      </button>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold cursor-pointer"
        style={{ background: 'linear-gradient(135deg, #e07b39, #c4601a)' }}
      >
        DP
      </div>
    </header>
  );
}
