import { create } from 'zustand';

interface AppState {
  selectedPlatform: string;
  sidebarCollapsed: boolean;
  setSelectedPlatform: (p: string) => void;
  toggleSidebar: () => void;
}

export const useStore = create<AppState>((set) => ({
  selectedPlatform: 'All Platforms',
  sidebarCollapsed: false,
  setSelectedPlatform: (p) => set({ selectedPlatform: p }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
