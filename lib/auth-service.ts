/**
 * Authentication Service
 * Core authentication logic for Google OAuth and backend integration
 */

import { jwtDecode } from 'jwt-decode';
import apiClient from './api-client';
import { tokenService, UserData } from './token-service';

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
  access: string;
  refresh: string;
  user?: UserData;
}

export const authService = {
  /**
   * Initialize Google OAuth library
   * This should be called when the app loads
   */
  initializeGoogleOAuth(clientId: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined') {
        reject(new Error('Window is not defined'));
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
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
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
          reject(new Error('Google Identity Services not loaded'));
        }
      };
      script.onerror = () => {
        reject(new Error('Failed to load Google Identity Services'));
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
      throw new Error('Failed to decode Google token');
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

      if (!credential) {
        throw new Error('No credential received from Google');
      }

      // Decode token to get user email
      const decoded = this.decodeGoogleToken(credential);

      if (!decoded.email_verified) {
        throw new Error('Email not verified');
      }

      // Send to backend for authentication
      const response = await this.login(credential, decoded.email);

      // Store user data if provided
      if (response.user) {
        tokenService.setUserData(response.user);
      } else {
        // Create user data from decoded token
        const userData: UserData = {
          email: decoded.email,
          name: decoded.name,
          avatar: decoded.picture,
        };
        tokenService.setUserData(userData);
      }

      return response;
    } catch (error) {
      console.error('Google authentication error:', error);
      throw error;
    }
  },

  /**
   * Authenticate with backend using Google ID token
   */
  async login(googleIdToken: string, email: string): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<AuthResponse>('/v1/auth/login', {
        googleIdToken,
        email,
      });

      const { access, refresh } = response.data;

      // Store tokens
      tokenService.setTokens(access, refresh);

      return response.data;
    } catch (error) {
      console.error('Backend login error:', error);
      throw error;
    }
  },

  /**
   * Logout user - clear all tokens and user data
   */
  logout(): void {
    tokenService.clearAll();

    // Revoke Google session if available
    if (typeof window !== 'undefined' && window.google?.accounts?.id) {
      window.google.accounts.id.disableAutoSelect();
    }

    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/auth/login';
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
      throw new Error('No refresh token available');
    }

    try {
      const response = await apiClient.post<{ access: string; refresh?: string }>(
        '/v1/auth/refresh',
        {
          refresh: refreshToken,
        }
      );

      const { access, refresh } = response.data;

      // Update tokens
      tokenService.setTokens(access, refresh || refreshToken);

      return access;
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
          initialize: (config: { client_id: string; callback: (response: GoogleCredentialResponse) => void }) => void;
          renderButton: (parent: HTMLElement, options: { theme?: string; size?: string; type?: string; shape?: string; text?: string; logo_alignment?: string }) => void;
          prompt: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}
