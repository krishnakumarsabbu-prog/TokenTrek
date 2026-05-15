import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, GitBranch, MessageSquare, Cpu, DollarSign, Trash2, ShoppingBag, CirclePlay as PlayCircle, FileText, Settings, Circle as HelpCircle, ChevronLeft, ChevronRight, ChevronDown, Upload, Trophy } from 'lucide-react';
import { useStore } from '../store/useStore';

const NAV_GROUPS = [
  {
    label: 'OVERVIEW',
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', to: '/overview' },
      { icon: Upload, label: 'Upload Center', to: '/upload' },
    ],
  },
  {
    label: 'INTELLIGENCE',
    items: [
      { icon: MessageSquare, label: 'Prompt Analytics', to: '/prompt-analytics' },
      { icon: Cpu, label: 'Model Analytics', to: '/model-analytics' },
      { icon: DollarSign, label: 'Cost Center', to: '/cost-center' },
      { icon: Trash2, label: 'AI Waste Detector', to: '/waste' },
    ],
  },
  {
    label: 'ENTERPRISE',
    items: [
      { icon: Users, label: 'Developers', to: '/developers' },
      { icon: GitBranch, label: 'Teams', to: '/teams' },
      { icon: Trophy, label: 'AI League', to: '/league' },
      { icon: ShoppingBag, label: 'Prompt Marketplace', to: '/marketplace' },
      { icon: PlayCircle, label: 'Replay Center', to: '/replay' },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      { icon: FileText, label: 'Reports', to: '/reports' },
      { icon: Settings, label: 'Settings', to: '/settings' },
    ],
  },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore();
  const w = sidebarCollapsed ? 60 : 224;

  return (
    <aside
      className="sidebar-scroll flex flex-col overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-250"
      style={{ width: w, background: '#0B1F3A', borderRight: '1px solid #1e3555' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 flex-shrink-0 border-b"
        style={{ borderColor: '#1e3555', padding: sidebarCollapsed ? '16px 14px' : '16px 16px' }}
      >
        <div
          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0078d4 0%, #00aaff 100%)', boxShadow: '0 2px 8px rgba(0,120,212,0.4)' }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2"/>
            <path d="M9 5L13 7.5V10.5L9 13L5 10.5V7.5L9 5Z" fill="white"/>
          </svg>
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <div className="font-bold text-sm text-white leading-none tracking-tight">TokenTrek</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#4da6ff' }}>AI Intelligence</div>
          </div>
        )}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors flex-shrink-0"
            style={{ color: '#4a6a8a' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#162d4a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronLeft size={14} />
          </button>
        )}
        {sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
            style={{ color: '#4a6a8a', marginLeft: 'auto' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#162d4a')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <ChevronRight size={14} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: sidebarCollapsed ? '12px 8px' : '12px 10px' }}>
        {NAV_GROUPS.map(group => (
          <div key={group.label} className="mb-4">
            {!sidebarCollapsed && (
              <div
                className="text-xs font-semibold mb-1.5 px-2.5 tracking-widest"
                style={{ color: '#3a5a7a', fontSize: '10px' }}
              >
                {group.label}
              </div>
            )}
            {group.items.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                title={sidebarCollapsed ? label : undefined}
                className={({ isActive }) =>
                  `flex items-center gap-2.5 rounded-lg mb-0.5 text-sm transition-all duration-150 cursor-pointer select-none ${
                    isActive ? 'text-white' : ''
                  }`
                }
                style={({ isActive }) => ({
                  padding: sidebarCollapsed ? '8px 10px' : '7px 10px',
                  background: isActive ? '#1a3a5c' : 'transparent',
                  color: isActive ? '#ffffff' : '#8ba3be',
                })}
                onMouseEnter={e => {
                  const el = e.currentTarget;
                  if (!el.classList.contains('active') && el.getAttribute('aria-current') !== 'page') {
                    el.style.background = '#162d4a';
                    el.style.color = '#c8dcf0';
                  }
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget;
                  if (el.getAttribute('aria-current') !== 'page') {
                    el.style.background = '';
                    el.style.color = '';
                  }
                }}
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      size={15}
                      className="flex-shrink-0"
                      style={{ color: isActive ? '#4da6ff' : undefined }}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate font-medium text-sm">{label}</span>
                    )}
                    {!sidebarCollapsed && isActive && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ background: '#4da6ff' }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: '#1e3555' }}>
        <button
          className="w-full flex items-center gap-2.5 text-sm transition-colors"
          style={{
            padding: sidebarCollapsed ? '10px 14px' : '10px 14px',
            color: '#8ba3be',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#162d4a'; e.currentTarget.style.color = '#c8dcf0'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8ba3be'; }}
        >
          <HelpCircle size={15} className="flex-shrink-0" />
          {!sidebarCollapsed && <span className="font-medium">Help & Support</span>}
        </button>

        <div
          className="flex items-center gap-2.5 border-t cursor-pointer transition-colors"
          style={{
            borderColor: '#1e3555',
            padding: sidebarCollapsed ? '10px 12px' : '10px 14px',
          }}
          onMouseEnter={e => (e.currentTarget.style.background = '#162d4a')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #e07b39, #c4601a)', fontSize: '11px' }}
          >
            DP
          </div>
          {!sidebarCollapsed && (
            <>
              <div className="flex-1 min-w-0">
                <div className="text-white text-xs font-semibold truncate">Debabrata Panigrahi</div>
                <div className="text-xs truncate" style={{ color: '#5a7a9a', fontSize: '10px' }}>Admin</div>
              </div>
              <ChevronDown size={12} style={{ color: '#4a6a8a' }} className="flex-shrink-0" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
