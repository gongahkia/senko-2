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
      "theme-solarized-light",
      "theme-solarized-dark",
      "theme-one-dark",
      "theme-one-light",
      "theme-monokai",
      "theme-everforest-light",
      "theme-everforest-dark",
      "theme-rose-pine",
      "theme-rose-pine-moon",
      "theme-kanagawa",
      "theme-github-light",
      "theme-github-dark",
      "theme-night-owl",
      "theme-palenight",
      "theme-synthwave-84",
      "theme-horizon",
      "theme-andromeda",
      "theme-cobalt2",
      "theme-shades-of-purple",
      "theme-oceanic-next",
      "theme-material-dark",
      "theme-panda",
      "theme-snazzy",
      "theme-darcula",
      "theme-moonlight",
      "theme-vitesse-dark",
      "theme-winter-is-coming",
      "theme-vesper",
      "theme-flexoki-light",
      "theme-flexoki-dark",
      "theme-arc-dark",
      "theme-iceberg",
      "theme-tomorrow-night",
      "theme-monokai-pro",
      "theme-bluloco-dark",
      "theme-laserwave",
      "theme-slack-dark",
      "theme-fairy-floss",
      "theme-aura-dark",
      "theme-catppuccin-rose",
      "theme-atom-one-dark-pro",
      "theme-sublime-material",
      "theme-twilight",
      "theme-zenburn",
      "theme-afterglow",
      "theme-spacegray",
      "theme-merbivore",
      "theme-apprentice",
      "theme-papercolor-light",
      "theme-base16-ocean",
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
