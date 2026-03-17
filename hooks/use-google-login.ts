"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { authService } from "@/lib/auth-service";
import { useAuth } from "./use-auth";

import type { GoogleCredentialResponse } from "@/lib/auth-service";

interface UseGoogleLoginReturn {
  handleGoogleLogin: (
    credentialResponse: GoogleCredentialResponse
  ) => Promise<void>;
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

  const getErrorMessage = useCallback((err: unknown): string => {
    const apiMessage =
      (
        err as {
          response?: { data?: { message?: string } };
        }
      ).response?.data?.message || "";

    if (apiMessage.trim()) {
      return apiMessage;
    }

    const genericMessage = (err as { message?: string }).message || "";
    if (genericMessage.trim()) {
      return genericMessage;
    }

    return "Authentication failed. Please try again.";
  }, []);

  const handleGoogleLogin = useCallback(
    async (credentialResponse: GoogleCredentialResponse): Promise<void> => {
      setIsLoading(true);
      setError(null);

      try {
        await authService.handleGoogleSuccess(credentialResponse);

        // Update auth context with fresh user data from backend
        await login();

        // Get return URL or default to root dashboard
        const returnUrl = sessionStorage.getItem("returnUrl") || "/";
        sessionStorage.removeItem("returnUrl");

        // Redirect to the intended page
        router.push(returnUrl);
      } catch (err) {
        const errorMessage = getErrorMessage(err);
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Google login error:", err);
      } finally {
        setIsLoading(false);
      }
    },
    [router, login, getErrorMessage]
  );

  const handleGoogleError = useCallback((): void => {
    const errorMessage = "Google sign-in was cancelled or failed. Please try again.";
    setError(errorMessage);
    toast.error(errorMessage);
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
