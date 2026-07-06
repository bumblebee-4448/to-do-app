import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark';

export const themeStorageKey = 'theme-storage';

type ThemeState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
};

const applyThemeToDocument = (theme: Theme) => {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.remove('light', 'dark');
  document.documentElement.classList.add(theme);
  document.documentElement.style.colorScheme = theme;
};

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      setTheme: (theme: Theme) => {
        applyThemeToDocument(theme);
        set({ theme });
      },
      toggleTheme: () => {
        const nextTheme = get().theme === 'light' ? 'dark' : 'light';

        applyThemeToDocument(nextTheme);
        set({ theme: nextTheme });
      },
    }),
    {
      name: themeStorageKey,
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        if (state?.theme) {
          applyThemeToDocument(state.theme);
        }
      },
    },
  ),
);
