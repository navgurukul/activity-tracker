"use client";

import { useContext } from "react";
import { ThemeContext } from "@/app/_components/ThemeProvider";

export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  
  return context;
}
