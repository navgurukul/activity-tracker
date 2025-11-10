import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { AuthProvider } from "./AuthProvider";
import { ThemeProvider } from "./ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

interface RootLayoutProps {
  children?: ReactNode;
}

/**
 * Root Layout Component
 * Wraps the entire application with providers
 */
export function RootLayout({ children }: RootLayoutProps) {
  return (
    <AuthProvider>
      <ThemeProvider>
        {children || <Outlet />}
        <Toaster />
      </ThemeProvider>
    </AuthProvider>
  );
}
