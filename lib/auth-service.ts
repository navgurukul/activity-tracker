/**
 * Authentication Service
 * Core authentication logic for Google OAuth and backend integration
 */

import { jwtDecode } from "jwt-decode";
import apiClient from "./api-client";
import { tokenService, UserData } from "./token-service";

export interface GoogleCredentialResponse {
  credential: string;
  clientId?: string;
  select_by?: string;
}

export interface DecodedGoogleToken {
  email: string;
  email_verified: boolean;
  name?: string;
  picture?: string;
  given_name?: string;
  family_name?: string;
  sub: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn?: string;
  user?: {
    id: number;
    email: string;
    name?: string;
    orgId: number;
    roles: string[];
    permissions: string[];
    managerId: number | null;
    avatarUrl?: string;
  };
}

export const authService = {
  /**
   * Initialize Google OAuth library
   * This should be called when the app loads
   */
  initializeGoogleOAuth(clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === "undefined") {
        reject(new Error("Window is not defined"));
        return;
      }

      // Check if Google Identity Services script is already loaded
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: () => {}, // Callback will be handled in component
        });
        resolve();
        return;
      }

      // Load Google Identity Services script
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = () => {
        if (window.google?.accounts?.id) {
          window.google.accounts.id.initialize({
            client_id: clientId,
            callback: () => {}, // Callback will be handled in component
          });
          resolve();
        } else {
          reject(new Error("Google Identity Services not loaded"));
        }
      };
      script.onerror = () => {
        reject(new Error("Failed to load Google Identity Services"));
      };
      document.head.appendChild(script);
    });
  },

  /**
   * Decode Google ID token to extract user information
   */
  decodeGoogleToken(token: string): DecodedGoogleToken {
    try {
      return jwtDecode<DecodedGoogleToken>(token);
    } catch (error) {
      throw new Error("Failed to decode Google token");
    }
  },

  /**
   * Handle successful Google OAuth response
   */
  async handleGoogleSuccess(
    credentialResponse: GoogleCredentialResponse
  ): Promise<AuthResponse> {
    try {
      const { credential } = credentialResponse;

      console.log("Google credential received:", {
        hasCredential: !!credential,
        credentialLength: credential?.length,
      });

      if (!credential) {
        throw new Error("No credential received from Google");
      }

      // Decode token to get user email
      const decoded = this.decodeGoogleToken(credential);
      console.log("Decoded Google token:", {
        email: decoded.email,
        emailVerified: decoded.email_verified,
        name: decoded.name,
      });

      if (!decoded.email_verified) {
        throw new Error("Email not verified");
      }

      // Send to backend for authentication
      const response = await this.login(credential, decoded.email);

      // Store user data if provided
      if (response.user) {
        const userData: UserData = {
          id: response.user.id,
          email: response.user.email,
          name: response.user.name,
          avatarUrl: response.user.avatarUrl,
          orgId: response.user.orgId,
          roles: response.user.roles,
          permissions: response.user.permissions,
          managerId: response.user.managerId,
        };
        tokenService.setUserData(userData);
      } else {
        // Fallback: Create user data from decoded token
        const userData: UserData = {
          email: decoded.email,
          name: decoded.name,
          avatarUrl: decoded.picture,
        };
        tokenService.setUserData(userData);
      }

      console.log("Google authentication complete, user data stored");
      return response;
    } catch (error) {
      console.error("Google authentication error:", error);
      throw error;
    }
  },

  /**
   * Authenticate with backend using Google ID token
   */
  async login(idToken: string, email: string): Promise<AuthResponse> {
    try {
      console.log("Attempting backend login with:", {
        email,
        idTokenLength: idToken?.length,
      });

      const response = await apiClient.post<AuthResponse>("/v1/auth/login", {
        idToken,
        email,
      });

      console.log("Backend login successful:", {
        hasAccessToken: !!response.data.accessToken,
        hasRefreshToken: !!response.data.refreshToken,
        hasUser: !!response.data.user,
      });

      const { accessToken, refreshToken } = response.data;

      // Validate tokens before storing
      if (!accessToken || !refreshToken) {
        console.error("Missing tokens in response:", response.data);
        throw new Error("Invalid token response from server");
      }

      // Store tokens
      tokenService.setTokens(accessToken, refreshToken);

      return response.data;
    } catch (error: any) {
      console.error("Backend login error:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
      });
      throw error;
    }
  },

  /**
   * Logout user - clear all tokens and user data
   */
  logout(): void {
    tokenService.clearAll();

    // Revoke Google session if available
    if (typeof window !== "undefined" && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Redirect to login page
    if (typeof window !== "undefined") {
      window.location.href = "/auth/login";
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenService.isAuthenticated();
  },

  /**
   * Get current access token
   */
  getAccessToken(): string | null {
    return tokenService.getAccessToken();
  },

  /**
   * Get current user data
   */
  getUserData(): UserData | null {
    return tokenService.getUserData();
  },

  /**
   * Refresh access token
   */
  async refreshAccessToken(): Promise<string> {
    const refreshToken = tokenService.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const response = await apiClient.post<{
        accessToken: string;
        refreshToken?: string;
      }>("/v1/auth/refresh", {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // Validate token before storing
      if (!accessToken) {
        throw new Error("Invalid token response from server");
      }

      // Update tokens
      tokenService.setTokens(accessToken, newRefreshToken || refreshToken);

      return accessToken;
    } catch (error) {
      // Refresh failed, clear tokens
      tokenService.clearAll();
      throw error;
    }
  },
};

// Global type declaration for Google Identity Services
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: string;
              size?: string;
              type?: string;
              shape?: string;
              text?: string;
              logo_alignment?: string;
            }
          ) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
