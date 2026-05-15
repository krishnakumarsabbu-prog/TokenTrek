import { create } from 'zustand';

interface AppState {
  selectedPlatform: string;
  sidebarCollapsed: boolean;
  insightsPanelOpen: boolean;
  setSelectedPlatform: (p: string) => void;
  toggleSidebar: () => void;
  toggleInsightsPanel: () => void;
  setInsightsPanelOpen: (open: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  selectedPlatform: 'All Platforms',
  sidebarCollapsed: false,
  insightsPanelOpen: false,
  setSelectedPlatform: (p) => set({ selectedPlatform: p }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleInsightsPanel: () => set((s) => ({ insightsPanelOpen: !s.insightsPanelOpen })),
  setInsightsPanelOpen: (open) => set({ insightsPanelOpen: open }),
}));
