import { Calendar, RefreshCw, Bell, Search, ChevronDown, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useStore } from '../store/useStore';

export default function TopBar() {
  const [refreshing, setRefreshing] = useState(false);
  const { insightsPanelOpen, toggleInsightsPanel } = useStore();

  function handleRefresh() {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }

  return (
    <header
      className="flex-shrink-0 bg-white border-b flex items-center gap-3 px-6"
      style={{ borderColor: '#e5eaf0', height: '52px', boxShadow: '0 1px 0 rgba(0,30,60,0.06)' }}
    >
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#8ba3be' }} />
        <input
          type="text"
          placeholder="Search anything..."
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border outline-none transition-all"
          style={{
            borderColor: '#e5eaf0',
            background: '#f7fafd',
            color: '#0d1f30',
          }}
          onFocus={e => { e.currentTarget.style.borderColor = '#0078d4'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(0,120,212,0.12)'; }}
          onBlur={e => { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.boxShadow = 'none'; }}
        />
      </div>

      <div className="flex-1" />

      {/* Date range */}
      <button
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all"
        style={{ borderColor: '#e5eaf0', color: '#4a6480', background: 'white' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#b8c8d8'; e.currentTarget.style.background = '#f7fafd'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.background = 'white'; }}
      >
        <Calendar size={13} style={{ color: '#8ba3be' }} />
        <span>May 12 – May 18, 2026</span>
        <ChevronDown size={11} style={{ color: '#8ba3be' }} />
      </button>

      {/* Refresh */}
      <button
        onClick={handleRefresh}
        className="w-8 h-8 flex items-center justify-center rounded-lg border transition-all"
        style={{ borderColor: '#e5eaf0', color: '#8ba3be' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#b8c8d8'; e.currentTarget.style.background = '#f7fafd'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.background = 'white'; }}
      >
        <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
      </button>

      {/* AI Insights toggle */}
      <button
        onClick={toggleInsightsPanel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all"
        style={insightsPanelOpen
          ? { borderColor: '#0078d4', color: '#0078d4', background: '#eff6ff' }
          : { borderColor: '#e5eaf0', color: '#4a6480', background: 'white' }
        }
        onMouseEnter={e => { if (!insightsPanelOpen) { e.currentTarget.style.borderColor = '#b8c8d8'; e.currentTarget.style.background = '#f7fafd'; } }}
        onMouseLeave={e => { if (!insightsPanelOpen) { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.background = 'white'; } }}
        title="AI Insights"
      >
        <Sparkles size={13} />
        AI Insights
      </button>

      {/* Notifications */}
      <button
        className="w-8 h-8 flex items-center justify-center rounded-lg border relative transition-all"
        style={{ borderColor: '#e5eaf0', color: '#8ba3be' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#b8c8d8'; e.currentTarget.style.background = '#f7fafd'; }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5eaf0'; e.currentTarget.style.background = 'white'; }}
      >
        <Bell size={13} />
        <span
          className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
          style={{ background: '#ef4444' }}
        />
      </button>

      {/* Divider */}
      <div className="w-px h-5" style={{ background: '#e5eaf0' }} />

      {/* Avatar + name */}
      <div className="flex items-center gap-2 cursor-pointer group">
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #e07b39, #c4601a)', fontSize: '11px' }}
        >
          DP
        </div>
        <div className="hidden sm:block">
          <div className="text-xs font-semibold" style={{ color: '#0d1f30', lineHeight: 1.2 }}>Debabrata Panigrahi</div>
          <div className="text-xs" style={{ color: '#8ba3be', fontSize: '10px', lineHeight: 1.2 }}>Admin</div>
        </div>
        <ChevronDown size={12} style={{ color: '#8ba3be' }} />
      </div>
    </header>
  );
}
