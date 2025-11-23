import { createContext, useContext, useEffect, useState } from "react";
import { ColorScheme } from "@/types";
import { getSettings, updateSettings } from "@/services/storage";

type ThemeProviderProps = {
  children: React.ReactNode;
};

type ThemeProviderState = {
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
};

const initialState: ThemeProviderState = {
  colorScheme: "default-light",
  setColorScheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>(
    () => getSettings().colorScheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    // Remove all theme classes
    const themeClasses = [
      "theme-default-light",
      "theme-default-dark",
      "theme-gruvbox-light",
      "theme-gruvbox-dark",
      "theme-catppuccin-latte",
      "theme-catppuccin-frappe",
      "theme-catppuccin-macchiato",
      "theme-catppuccin-mocha",
      "theme-ayu-light",
      "theme-ayu-dark",
      "theme-ayu-mirage",
      "theme-nord",
      "theme-tokyo-night",
      "theme-dracula",
    ];

    root.classList.remove(...themeClasses);
    root.classList.add(`theme-${colorScheme}`);
  }, [colorScheme]);

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme);
    updateSettings({ colorScheme: scheme });
  };

  const value = {
    colorScheme,
    setColorScheme,
  };

  return (
    <ThemeProviderContext.Provider value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
