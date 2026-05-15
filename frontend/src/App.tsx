import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Developers from './pages/Developers';
import Teams from './pages/Teams';
import PromptAnalytics from './pages/PromptAnalytics';
import ModelAnalytics from './pages/ModelAnalytics';
import CostCenter from './pages/CostCenter';
import AIWasteDetector from './pages/AIWasteDetector';
import PromptMarketplace from './pages/PromptMarketplace';
import ReplayCenter from './pages/ReplayCenter';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UploadCenter from './pages/UploadCenter';
import AILeague from './pages/AILeague';
import DeveloperXP from './pages/DeveloperXP';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="upload" element={<UploadCenter />} />
          <Route path="developers" element={<Developers />} />
          <Route path="teams" element={<Teams />} />
          <Route path="league" element={<AILeague />} />
          <Route path="developer-xp" element={<DeveloperXP />} />
          <Route path="prompt-analytics" element={<PromptAnalytics />} />
          <Route path="model-analytics" element={<ModelAnalytics />} />
          <Route path="cost-center" element={<CostCenter />} />
          <Route path="waste" element={<AIWasteDetector />} />
          <Route path="marketplace" element={<PromptMarketplace />} />
          <Route path="replay" element={<ReplayCenter />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
