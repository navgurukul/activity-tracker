import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

import { useAuth } from "@/hooks/use-auth";
import { AUTH_ROUTES } from "@/lib/constants";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protected Route Component
 * Wrapper component to protect routes from unauthorized access
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Save the intended destination for post-login redirect
      const returnUrl = location.pathname !== "/" ? location.pathname : "/";
      sessionStorage.setItem("returnUrl", returnUrl);
      navigate(AUTH_ROUTES.LOGIN);
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
