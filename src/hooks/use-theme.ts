import { useContext } from "react";

import { ThemeContext } from "@/components/layout/ThemeProvider";

/**
 * useTheme Hook
 * Custom hook to access theme context
 */
export function useTheme() {
  const context = useContext(ThemeContext);

  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
}