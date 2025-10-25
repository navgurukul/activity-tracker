"use client";

/**
 * useGoogleLogin Hook
 * Custom hook for Google OAuth login functionality
 */

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authService, GoogleCredentialResponse } from "@/lib/auth-service";
import { useAuth } from "./use-auth";

export function useGoogleLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleGoogleLogin = useCallback(
    async (credentialResponse: GoogleCredentialResponse) => {
      setIsLoading(true);
      setError(null);

      try {
        await authService.handleGoogleSuccess(credentialResponse);

        // Update auth context
        login();

        // Get return URL or default to root dashboard
        const returnUrl = sessionStorage.getItem("returnUrl") || "/";
        sessionStorage.removeItem("returnUrl");

        // Redirect to the intended page
        router.push(returnUrl);
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : "Authentication failed. Please try again.";
        setError(errorMessage);
        console.error("Google login error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [router, login]
  );

  const handleGoogleError = useCallback(() => {
    setError("Google sign-in was cancelled or failed. Please try again.");
    setIsLoading(false);
  }, []);

  return {
    handleGoogleLogin,
    handleGoogleError,
    isLoading,
    error,
    clearError: () => setError(null),
  };
}
