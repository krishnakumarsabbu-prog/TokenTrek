import { NavLink } from 'react-router-dom';
import { LayoutDashboard, ChartBar as BarChart3, Users, GitBranch, MessageSquare, Cpu, DollarSign, Shield, Trash2, ShoppingBag, Zap, Bell, CirclePlay as PlayCircle, FileText, Settings, Circle as HelpCircle, ChevronLeft, ChevronRight, ChevronDown, Upload } from 'lucide-react';
import { useStore } from '../store/useStore';

const NAV = [
  { icon: LayoutDashboard, label: 'Overview', to: '/overview' },
  { icon: BarChart3, label: 'Dashboards', to: '/dashboards' },
  { icon: Users, label: 'Developers', to: '/developers' },
  { icon: GitBranch, label: 'Teams', to: '/teams' },
  { icon: MessageSquare, label: 'Prompt Analytics', to: '/prompt-analytics' },
  { icon: Cpu, label: 'Model Analytics', to: '/model-analytics' },
  { icon: DollarSign, label: 'Cost Center', to: '/cost-center' },
  { icon: Shield, label: 'Security & Compliance', to: '/security' },
  { icon: Trash2, label: 'AI Waste Detector', to: '/waste' },
  { icon: ShoppingBag, label: 'Prompt Marketplace', to: '/marketplace' },
  { icon: Zap, label: 'Productivity', to: '/productivity' },
  { icon: Bell, label: 'Alerts & Insights', to: '/alerts' },
  { icon: PlayCircle, label: 'Replay Center', to: '/replay' },
  { icon: FileText, label: 'Reports', to: '/reports' },
  { icon: Upload, label: 'Upload & Parse', to: '/upload' },
  { icon: Settings, label: 'Settings', to: '/settings' },
];

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useStore();
  const w = sidebarCollapsed ? 56 : 210;

  return (
    <aside
      className="sidebar-scroll flex flex-col overflow-y-auto overflow-x-hidden flex-shrink-0 transition-all duration-200"
      style={{ width: w, background: '#0b1427', borderRight: '1px solid #1e2d4a' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 py-3.5 border-b flex-shrink-0" style={{ borderColor: '#1e2d4a' }}>
        <div
          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0078d4 0%, #00b4d8 100%)' }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="white" opacity="0.15"/>
            <polygon points="8,1 15,5 15,11 8,15 1,11 1,5" fill="none" stroke="white" strokeWidth="1.2"/>
            <polygon points="8,4 12,6.5 12,9.5 8,12 4,9.5 4,6.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
        {!sidebarCollapsed && (
          <div className="flex-1 min-w-0 animate-fade-in">
            <div className="text-white font-semibold text-sm leading-none">TokenTrek</div>
            <div className="text-xs font-medium mt-0.5" style={{ color: '#0078d4' }}>AI Intelligence</div>
          </div>
        )}
        {!sidebarCollapsed && (
          <button onClick={toggleSidebar} className="p-1 rounded hover:bg-white/10 transition-colors flex-shrink-0">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="12" height="12" rx="2" stroke="#8b9ab7" strokeWidth="1.2"/>
              <rect x="1" y="1" width="4" height="12" rx="2" fill="#8b9ab7" opacity="0.4"/>
            </svg>
          </button>
        )}
      </div>

      {/* Nav items */}
      <nav className="flex-1 px-2 py-2 overflow-y-auto">
        {NAV.map(({ icon: Icon, label, to }) => (
          <NavLink key={to} to={to} className={({ isActive }) =>
            `flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-0.5 text-sm transition-colors duration-150 cursor-pointer ${
              isActive
                ? 'text-white'
                : 'text-[#8b9ab7] hover:text-[#c8d4e8] hover:bg-white/5'
            }`
          }
          style={({ isActive }) => isActive ? { background: '#1a2847' } : {}}
          >
            {({ isActive }) => (
              <>
                <Icon size={15} className="flex-shrink-0" style={{ color: isActive ? '#0078d4' : undefined }} />
                {!sidebarCollapsed && <span className="truncate font-medium">{label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: '#1e2d4a' }}>
        <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[#8b9ab7] hover:text-[#c8d4e8] hover:bg-white/5 transition-colors text-sm font-medium">
          <HelpCircle size={15} className="flex-shrink-0" />
          {!sidebarCollapsed && <span>Help</span>}
        </button>
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center gap-2.5 px-3.5 py-2 text-[#8b9ab7] hover:text-[#c8d4e8] hover:bg-white/5 transition-colors"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          {!sidebarCollapsed && <span className="text-xs">Collapse</span>}
        </button>
        <div
          className="flex items-center gap-2 px-3 py-3 border-t cursor-pointer hover:bg-white/5 transition-colors"
          style={{ borderColor: '#1e2d4a' }}
        >
          <div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #e07b39, #c4601a)' }}
          >
            DP
          </div>
          {!sidebarCollapsed && (
            <>
              <span className="text-white text-xs font-medium flex-1 truncate">Debabrata Panigrahi</span>
              <ChevronDown size={12} className="text-[#8b9ab7] flex-shrink-0" />
            </>
          )}
        </div>
      </div>
    </aside>
  );
}
