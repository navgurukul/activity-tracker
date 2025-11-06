"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

import { authService } from "@/lib/auth-service";
import { useAuth } from "./use-auth";

import type { GoogleCredentialResponse } from "@/lib/auth-service";

interface UseGoogleLoginReturn {
  handleGoogleLogin: (credentialResponse: GoogleCredentialResponse) => Promise<void>;
  handleGoogleError: () => void;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * useGoogleLogin Hook
 * Custom hook for Google OAuth login functionality
 */
export function useGoogleLogin(): UseGoogleLoginReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { login } = useAuth();

  const handleGoogleLogin = useCallback(
    async (credentialResponse: GoogleCredentialResponse): Promise<void> => {
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

  const handleGoogleError = useCallback((): void => {
    setError("Google sign-in was cancelled or failed. Please try again.");
    setIsLoading(false);
  }, []);

  return {
    handleGoogleLogin,
    handleGoogleError,
    isLoading,
    error,
    clearError: (): void => setError(null),
  };
}
