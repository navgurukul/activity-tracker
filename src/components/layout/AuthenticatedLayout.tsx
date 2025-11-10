import { ReactNode } from "react";
import { Outlet } from "react-router-dom";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./Sidebar";
import { ProtectedRoute } from "./ProtectedRoute";

interface AuthenticatedLayoutProps {
  children?: ReactNode;
}

/**
 * Authenticated Layout
 * Layout for all authenticated routes
 * Includes sidebar navigation and route protection
 */
export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <ProtectedRoute>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>{children || <Outlet />}</SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  );
}