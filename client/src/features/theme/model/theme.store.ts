import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { Theme } from "./theme.types";
import { useEffect } from "react";

interface ThemeStore {
  theme: Theme;
  toggleTheme: () => void;
}

function getSystemTheme(): Theme {
  const isDarkTheme = window.matchMedia("(prefers-color-scheme: dark)").matches;
  return isDarkTheme ? "dark" : "light";
}

const useThemeStore = create<ThemeStore>()(
  devtools(
    persist(
      (set) => ({
        theme: getSystemTheme(),
        toggleTheme: () => {
          set(
            (state) => {
              const nextTheme = state.theme === "light" ? "dark" : "light";
              document.documentElement.dataset.theme = nextTheme;
              return { theme: nextTheme };
            },
            false,
            "theme/toggleTheme",
          );
        },
      }),
      {
        name: "theme-store",
      },
    ),
  ),
);

export const useThemeInit = () => {
  const theme = useThemeStore((state) => state.theme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  return theme;
};

export const useTheme = () => useThemeStore((state) => state.theme);
export const useToggleTheme = () => useThemeStore((state) => state.toggleTheme);
