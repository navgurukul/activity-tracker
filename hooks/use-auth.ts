"use client";

import { useAuthContext } from "@/app/_components/AuthProvider";

/**
 * useAuth Hook
 * Custom hook to access authentication context
 */
export function useAuth() {
  return useAuthContext();
}
