import { useAuthContext } from "@/components/layout/AuthProvider";

/**
 * useAuth Hook
 * Custom hook to access authentication context
 */
export function useAuth() {
  return useAuthContext();
}