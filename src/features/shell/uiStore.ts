import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type ArenaTheme = 'dark' | 'light';

interface UIState {
  theme: ArenaTheme;
  setTheme: (t: ArenaTheme) => void;
  toggleTheme: () => void;
}

export const useUI = create<UIState>()(
  persist(
    (set, get) => ({
      theme: 'dark',
      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
    }),
    { name: 'arena-ui' }
  )
);
