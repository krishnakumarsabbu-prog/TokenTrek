import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Overview from './pages/Overview';
import Dashboards from './pages/Dashboards';
import Developers from './pages/Developers';
import Teams from './pages/Teams';
import PromptAnalytics from './pages/PromptAnalytics';
import ModelAnalytics from './pages/ModelAnalytics';
import CostCenter from './pages/CostCenter';
import Settings from './pages/Settings';
import UploadParser from './pages/UploadParser';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="dashboards" element={<Dashboards />} />
          <Route path="developers" element={<Developers />} />
          <Route path="teams" element={<Teams />} />
          <Route path="prompt-analytics" element={<PromptAnalytics />} />
          <Route path="model-analytics" element={<ModelAnalytics />} />
          <Route path="cost-center" element={<CostCenter />} />
          <Route path="upload" element={<UploadParser />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/overview" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
