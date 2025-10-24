"use client";

/**
 * Login Page
 * Google OAuth authentication page
 */

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Command } from "lucide-react";
import { GoogleLoginButton } from "@/app/_components/GoogleLoginButton";
import { useAuth } from "@/hooks/use-auth";
import { useGoogleLogin } from "@/hooks/use-google-login";

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { error } = useGoogleLogin();

  // Redirect to dashboard if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, authLoading, router]);

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
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-secondary-background border-2 border-border rounded-base shadow-shadow p-8 flex flex-col gap-6">
        {/* Branding Section */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex items-center gap-2">
            <Command className="size-8 text-main" />
            <h1 className="font-heading text-2xl text-foreground">NavTrack</h1>
          </div>
        </div>

        {/* Welcome Section */}
        <div className="flex flex-col items-center gap-2 text-center">
          <h2 className="font-heading text-xl text-foreground">
            Welcome to NavTrack
          </h2>
          <p className="text-sm text-foreground opacity-70">
            Track your daily activities and manage your time effectively
          </p>
        </div>

        {/* Google Sign-In Button */}
        <div className="flex flex-col gap-4">
          <GoogleLoginButton />

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-500 rounded-base p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}
        </div>

        {/* Additional Info */}
        <div className="text-center">
          <p className="text-xs text-foreground opacity-60">
            By signing in, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
