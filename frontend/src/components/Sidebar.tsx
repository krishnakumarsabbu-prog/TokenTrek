import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, GitBranch, MessageSquare, Cpu, DollarSign, Trash2, ShoppingBag, PlayCircle, FileText, Settings, HelpCircle, ChevronLeft, ChevronRight, ChevronDown, Upload, Trophy, Zap, Swords } from 'lucide-react';
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
      { icon: Zap, label: 'Developer XP', to: '/developer-xp' },
      { icon: GitBranch, label: 'Teams', to: '/teams' },
      { icon: Swords, label: 'Team Battle', to: '/team-battle' },
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
    <motion.aside
      className="sidebar-scroll flex flex-col overflow-y-auto overflow-x-hidden flex-shrink-0"
      animate={{ width: w }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      style={{ background: '#0B1F3A', borderRight: '1px solid #1e3555' }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-3 flex-shrink-0 border-b"
        style={{ borderColor: '#1e3555', padding: sidebarCollapsed ? '16px 14px' : '16px 16px' }}
      >
        <motion.div
          className="w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #0078d4 0%, #00aaff 100%)', boxShadow: '0 2px 8px rgba(0,120,212,0.4)' }}
          whileHover={{ scale: 1.08, boxShadow: '0 4px 16px rgba(0,120,212,0.6)' }}
          transition={{ duration: 0.2 }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="1.2"/>
            <path d="M9 5L13 7.5V10.5L9 13L5 10.5V7.5L9 5Z" fill="white"/>
          </svg>
        </motion.div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              className="flex-1 min-w-0"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <div className="font-bold text-sm text-white leading-none tracking-tight">TokenTrek</div>
              <div className="text-xs font-medium mt-0.5" style={{ color: '#4da6ff' }}>AI Intelligence</div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          onClick={toggleSidebar}
          className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0"
          style={{ color: '#4a6a8a', marginLeft: sidebarCollapsed ? 'auto' : undefined }}
          whileHover={{ background: '#162d4a', color: '#c8dcf0' }}
          whileTap={{ scale: 0.9 }}
          transition={{ duration: 0.15 }}
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </motion.button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto" style={{ padding: sidebarCollapsed ? '12px 8px' : '12px 10px' }}>
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className="mb-4">
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div
                  className="text-xs font-semibold mb-1.5 px-2.5 tracking-widest"
                  style={{ color: '#3a5a7a', fontSize: '10px' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {group.label}
                </motion.div>
              )}
            </AnimatePresence>
            {group.items.map(({ icon: Icon, label, to }, ii) => (
              <NavLink
                key={to}
                to={to}
                title={sidebarCollapsed ? label : undefined}
              >
                {({ isActive }) => (
                  <motion.div
                    className="flex items-center gap-2.5 rounded-lg mb-0.5 text-sm cursor-pointer select-none relative overflow-hidden"
                    style={{
                      padding: sidebarCollapsed ? '8px 10px' : '7px 10px',
                      background: isActive ? '#1a3a5c' : 'transparent',
                      color: isActive ? '#ffffff' : '#8ba3be',
                    }}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: (gi * 0.05) + (ii * 0.03) }}
                    whileHover={{
                      background: isActive ? '#1a3a5c' : '#162d4a',
                      color: isActive ? '#ffffff' : '#c8dcf0',
                      x: isActive ? 0 : 2,
                    }}
                  >
                    {/* Hover glow effect */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 rounded-lg"
                        style={{ background: 'linear-gradient(90deg, rgba(0,120,212,0.15) 0%, transparent 100%)' }}
                        layoutId="activeNavGlow"
                        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      />
                    )}
                    <motion.div
                      animate={isActive ? { color: '#4da6ff' } : { color: '#8ba3be' }}
                      transition={{ duration: 0.15 }}
                      className="flex-shrink-0 relative z-10"
                    >
                      <Icon size={15} />
                    </motion.div>
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.span
                          className="truncate font-medium text-sm relative z-10"
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <AnimatePresence>
                      {!sidebarCollapsed && isActive && (
                        <motion.div
                          className="ml-auto w-1.5 h-1.5 rounded-full flex-shrink-0 relative z-10"
                          style={{ background: '#4da6ff' }}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0 }}
                          transition={{ duration: 0.2, type: 'spring', stiffness: 400 }}
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="flex-shrink-0 border-t" style={{ borderColor: '#1e3555' }}>
        <motion.button
          className="w-full flex items-center gap-2.5 text-sm"
          style={{ padding: sidebarCollapsed ? '10px 14px' : '10px 14px', color: '#8ba3be' }}
          whileHover={{ background: '#162d4a', color: '#c8dcf0' }}
          transition={{ duration: 0.15 }}
        >
          <HelpCircle size={15} className="flex-shrink-0" />
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.span
                className="font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                Help &amp; Support
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.div
          className="flex items-center gap-2.5 border-t cursor-pointer"
          style={{ borderColor: '#1e3555', padding: sidebarCollapsed ? '10px 12px' : '10px 14px' }}
          whileHover={{ background: '#162d4a' }}
          transition={{ duration: 0.15 }}
        >
          <motion.div
            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
            style={{ background: 'linear-gradient(135deg, #e07b39, #c4601a)', fontSize: '11px' }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.2 }}
          >
            DP
          </motion.div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                className="flex-1 min-w-0 flex items-center gap-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold truncate">Debabrata Panigrahi</div>
                  <div className="text-xs truncate" style={{ color: '#5a7a9a', fontSize: '10px' }}>Admin</div>
                </div>
                <ChevronDown size={12} style={{ color: '#4a6a8a' }} className="flex-shrink-0" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.aside>
  );
}
