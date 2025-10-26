"use client";

import React, { createContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type EffectiveTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  effectiveTheme: EffectiveTheme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined
);

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [effectiveTheme, setEffectiveTheme] = useState<EffectiveTheme>("light");

  // Get system preference
  const getSystemTheme = (): EffectiveTheme => {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }
    return "light";
  };

  // Calculate effective theme based on current theme and system preference
  const calculateEffectiveTheme = (currentTheme: Theme): EffectiveTheme => {
    if (currentTheme === "system") {
      return getSystemTheme();
    }
    return currentTheme as EffectiveTheme;
  };

  // Apply theme to HTML element
  const applyTheme = (themeToApply: EffectiveTheme) => {
    if (typeof window !== "undefined") {
      const root = document.documentElement;
      if (themeToApply === "dark") {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
  };

  // Initialize theme on mount
  useEffect(() => {
    try {
      // Read from localStorage
      const storedTheme = localStorage.getItem("theme-preference") as Theme;
      const initialTheme = storedTheme || "system";
      setThemeState(initialTheme);

      // Calculate and apply effective theme
      const effective = calculateEffectiveTheme(initialTheme);
      setEffectiveTheme(effective);
      applyTheme(effective);
    } catch (error) {
      // Fallback if localStorage is unavailable
      console.warn("localStorage unavailable, using system theme");
      const systemTheme = getSystemTheme();
      setEffectiveTheme(systemTheme);
      applyTheme(systemTheme);
    }
  }, []);

  // Listen for system preference changes
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      if (theme === "system") {
        const newEffectiveTheme = e.matches ? "dark" : "light";
        setEffectiveTheme(newEffectiveTheme);
        applyTheme(newEffectiveTheme);
      }
    };

    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme]);

  // Listen for storage changes (cross-tab synchronization)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "theme-preference" && e.newValue) {
        const newTheme = e.newValue as Theme;
        setThemeState(newTheme);
        const effective = calculateEffectiveTheme(newTheme);
        setEffectiveTheme(effective);
        applyTheme(effective);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    
    // Persist to localStorage
    try {
      localStorage.setItem("theme-preference", newTheme);
    } catch (error) {
      console.warn("Failed to save theme preference to localStorage");
    }

    // Calculate and apply effective theme
    const effective = calculateEffectiveTheme(newTheme);
    setEffectiveTheme(effective);
    applyTheme(effective);
  };

  const toggleTheme = () => {
    // Toggle between light and dark (ignore system preference when toggling)
    const newTheme = effectiveTheme === "light" ? "dark" : "light";
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider
      value={{
        theme,
        effectiveTheme,
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}
