
import { createContext, useContext, useEffect, useState, useCallback } from "react";

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
  const initializeAuth = useCallback(() => {
    const authenticated = authService.isAuthenticated();
    const userData = authService.getUserData();

    setIsAuthenticated(authenticated);
    setUser(userData);
    setIsLoading(false);
  }, []);

  // Refresh user data from storage
  const refreshUser = useCallback(() => {
    const userData = authService.getUserData();
    setUser(userData);
  }, []);

  // Login handler (for manual login trigger if needed)
  const login = useCallback(() => {
    const authenticated = authService.isAuthenticated();
    const userData = authService.getUserData();

    setIsAuthenticated(authenticated);
    setUser(userData);
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
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
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
