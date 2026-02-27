import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  azureAdMode: false,

  setAuth: (user, token) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
    set({ user, token, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  setAzureAdMode: (enabled) => set({ azureAdMode: enabled }),
}));

export const useThemeStore = create((set) => ({
  darkMode: localStorage.getItem('theme') === 'dark' || (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),

  toggleTheme: () => {
    set((state) => {
      const newMode = !state.darkMode;
      localStorage.setItem('theme', newMode ? 'dark' : 'light');
      document.documentElement.classList.toggle('dark', newMode);
      return { darkMode: newMode };
    });
  },

  initTheme: () => {
    set((state) => {
      document.documentElement.classList.toggle('dark', state.darkMode);
      return state;
    });
  },
}));

export const useSidebarStore = create((set) => ({
  isCollapsed: false,
  isMobileOpen: false,

  toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  toggleMobile: () => set((state) => ({ isMobileOpen: !state.isMobileOpen })),
  closeMobile: () => set({ isMobileOpen: false }),
}));

export const useSyncStore = create((set) => ({
  lastSynced: null,
  isSyncing: false,
  syncError: null,

  setSyncing: (syncing) => set({ isSyncing: syncing }),
  setSynced: (timestamp) => set({ lastSynced: timestamp, isSyncing: false, syncError: null }),
  setSyncError: (error) => set({ syncError: error, isSyncing: false }),
}));
