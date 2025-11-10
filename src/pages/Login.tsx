import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { Command } from "lucide-react";

import { GoogleLoginButton } from "@/components/layout/GoogleLoginButton";
import {
  PageDescription,
  PageHeader,
  PageHeading,
  PageWrapper,
} from "@/components/layout/wrapper";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleLogin } from "@/hooks/use-google-login";

/**
 * Login Page
 * Google OAuth authentication page
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { error } = useGoogleLogin();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-4 text-sm text-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  return (
    <PageWrapper>
      <div className="flex h-screen items-center justify-center">
    <div>
        <PageHeader>
          <div className="flex items-center gap-2 justify-center">
            <Command className="size-10 text-main" />
            <PageHeading>NavTrack</PageHeading>
          </div>
          <PageDescription>
            Sign in with your Google account to get started.
          </PageDescription>
        </PageHeader>
        <div className="flex justify-center">
          <GoogleLoginButton />
        </div>
        </div>
      </div>
    </PageWrapper>
  );
}