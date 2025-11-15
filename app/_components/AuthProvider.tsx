"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { authService } from "@/lib/auth-service";
import { UserData } from "@/lib/token-service";

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

/**
 * Authentication Provider
 * Global authentication state management using React Context
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state
  const initializeAuth = useCallback(async () => {
    setIsLoading(true);

    try {
      // Check if we have an access token
      const hasToken = authService.isAuthenticated();

      if (!hasToken) {
        // No token, user is not authenticated
        setIsAuthenticated(false);
        setUser(null);
        return;
      }

      // Token exists, fetch current user from backend
      try {
        const userData = await authService.getCurrentUser();
        setIsAuthenticated(true);
        setUser(userData);
      } catch (error: any) {
        // If /auth/me fails with 401, try to refresh the token
        if (error.response?.status === 401) {
          try {
            await authService.refreshAccessToken();
            // Retry fetching user after refresh
            const userData = await authService.getCurrentUser();
            setIsAuthenticated(true);
            setUser(userData);
          } catch (refreshError) {
            // Refresh failed, logout user
            console.error(
              "Token refresh failed during initialization:",
              refreshError
            );
            authService.logout();
            setIsAuthenticated(false);
            setUser(null);
          }
        } else {
          // Other error, logout user
          console.error("Failed to fetch user during initialization:", error);
          authService.logout();
          setIsAuthenticated(false);
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // Optionally handle error by logging out
    }
  }, []);

  // Login handler - fetch user from backend after authentication
  const login = useCallback(async () => {
    try {
      const userData = await authService.getCurrentUser();
      setIsAuthenticated(true);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user after login:", error);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Logout handler
  const logout = useCallback(() => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null);
  }, []);

  // Initialize on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Initialize Google OAuth on mount
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (clientId && typeof window !== "undefined") {
      authService.initializeGoogleOAuth(clientId).catch((error) => {
        console.error("Failed to initialize Google OAuth:", error);
      });
    }
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    user,
    isLoading,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
}
