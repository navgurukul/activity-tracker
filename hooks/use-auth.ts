'use client';

/**
 * useAuth Hook
 * Custom hook to access authentication context
 */

import { useAuthContext } from '@/app/_components/AuthProvider';

export function useAuth() {
  return useAuthContext();
}
