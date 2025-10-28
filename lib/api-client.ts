/**
 * API Client
 * Configured Axios instance with request/response interceptors
 */

import axios, {
  AxiosInstance,
  InternalAxiosRequestConfig,
  AxiosResponse,
  AxiosError,
} from "axios";
import { tokenService } from "./token-service";
import {
  API,
  API_PATHS,
  AUTH_ROUTES,
  AUTH_ENDPOINT_SUBSTRINGS,
  HEADERS,
} from "./constants";

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API.BASE_URL,
  headers: {
    "Content-Type": HEADERS.CONTENT_TYPE_JSON,
  },
  timeout: API.TIMEOUT_MS,
});

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor - inject access token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Don't add Authorization header for login and refresh endpoints
    const isAuthEndpoint =
      config.url?.includes(AUTH_ENDPOINT_SUBSTRINGS.LOGIN) ||
      config.url?.includes(AUTH_ENDPOINT_SUBSTRINGS.REFRESH);

    if (!isAuthEndpoint) {
      const accessToken = tokenService.getAccessToken();
      if (accessToken && config.headers) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Don't handle 401 for auth endpoints (login/refresh) - let them fail naturally
    const isAuthEndpoint =
      originalRequest.url?.includes(AUTH_ENDPOINT_SUBSTRINGS.LOGIN) ||
      originalRequest.url?.includes(AUTH_ENDPOINT_SUBSTRINGS.REFRESH);
    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = tokenService.getRefreshToken();

      if (!refreshToken) {
        // No refresh token, redirect to login
        processQueue(new Error("No refresh token"), null);
        isRefreshing = false;
        if (typeof window !== "undefined") {
          window.location.href = AUTH_ROUTES.LOGIN;
        }
        return Promise.reject(error);
      }

      try {
        // Attempt to refresh token
        const response = await axios.post(
          `${API.BASE_URL}${API_PATHS.AUTH_REFRESH}`,
          {
            refresh: refreshToken,
          }
        );

        const { access, refresh } = response.data;

        // Store new tokens
        tokenService.setTokens(access, refresh || refreshToken);

        // Update authorization header
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${access}`;
        }

        processQueue(null, access);
        isRefreshing = false;

        // Retry original request
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError as Error, null);
        isRefreshing = false;

        // Refresh failed, clear tokens and redirect to login
        tokenService.clearAll();
        if (typeof window !== "undefined") {
          window.location.href = AUTH_ROUTES.LOGIN;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
