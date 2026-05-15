import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import AIInsightsPanel from './AIInsightsPanel';
import { useStore } from '../store/useStore';

const pageVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const } },
  exit: { opacity: 0, y: -6, transition: { duration: 0.2, ease: 'easeIn' as const } },
};

function AnimatedOutlet() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        className="flex-1 overflow-hidden flex flex-col"
        variants={pageVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  );
}

export default function Layout() {
  const { insightsPanelOpen, setInsightsPanelOpen } = useStore();

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f0f4f8' }}>
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto flex flex-col min-h-0">
          <AnimatedOutlet />
        </main>
      </div>
      <AIInsightsPanel open={insightsPanelOpen} onClose={() => setInsightsPanelOpen(false)} />
    </div>
  );
}
