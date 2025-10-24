'use client';

/**
 * useTokenRefresh Hook
 * Custom hook for handling token refresh logic
 * Note: Token refresh is primarily handled by API client interceptors
 * This hook can be used for manual refresh triggers if needed
 */

import { useState, useCallback } from 'react';
import { authService } from '@/lib/auth-service';

export function useTokenRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshToken = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);

    try {
      await authService.refreshAccessToken();
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to refresh token';
      setError(errorMessage);
      console.error('Token refresh error:', err);
      return false;
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  return {
    refreshToken,
    isRefreshing,
    error,
    clearError: () => setError(null),
  };
}
