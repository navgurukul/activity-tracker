/**
 * Application-wide Constants
 * Centralized configuration for API endpoints, validation rules, and default values
 */

// =============================================================================
// API Configuration
// =============================================================================

export const API = {
  BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  TIMEOUT_MS: 10000,
} as const;

export const DEV_PROXY = {
  BACKEND_URL: process.env.BACKEND_PROXY_TARGET || "http://localhost:9900",
  FRONTEND_API_PREFIX: "/api",
} as const;

// =============================================================================
// API Endpoints
// =============================================================================

export const API_PATHS = {
  AUTH_LOGIN: "/v1/auth/login",
  AUTH_REFRESH: "/v1/auth/refresh",
  ACTIVITIES_SUBMIT: "/v1/activities/submit",
  LEAVES_APPLICATION: "/v1/leaves/application",
  LEAVES_HISTORY: "/v1/leaves/history",
  EMPLOYEES: "/v1/employees",
  COMPOFF_REQUEST: "/v1/compoff/request",
} as const;

export type ApiPathKey = keyof typeof API_PATHS;

// =============================================================================
// Application Routes
// =============================================================================

export const AUTH_ROUTES = {
  LOGIN: "/auth/login",
} as const;

// Auth endpoint substrings for checking if URL is an auth endpoint
export const AUTH_ENDPOINT_SUBSTRINGS = {
  LOGIN: "/auth/login",
  REFRESH: "/auth/refresh",
} as const;

// =============================================================================
// Date Formats
// =============================================================================

export const DATE_FORMATS = {
  /** Display format for user-facing dates (e.g., "January 1, 2024") */
  DISPLAY: "PPP",
  /** API format for backend communication (e.g., "2024-01-01") */
  API: "yyyy-MM-dd",
} as const;

// =============================================================================
// Validation Rules
// =============================================================================

export const VALIDATION = {
  /** Minimum hours allowed per activity entry */
  MIN_HOURS_PER_ENTRY: 0.5,
  /** Maximum hours allowed per activity entry */
  MAX_HOURS_PER_ENTRY: 15,
  /** Step value for hours input field */
  HOURS_INPUT_STEP: 0.5,
  /** Minimum characters for task description */
  MIN_TASK_DESCRIPTION_LENGTH: 10,
  /** Maximum characters for task title */
  MAX_TASK_TITLE_LENGTH: 200,
  /** Minimum characters for leave reason */
  MIN_LEAVE_REASON_LENGTH: 10,
} as const;

// =============================================================================
// HTTP Headers
// =============================================================================

export const HEADERS = {
  CONTENT_TYPE_JSON: "application/json",
  CROSS_ORIGIN_OPENER_POLICY: "same-origin-allow-popups",
} as const;

// =============================================================================
// UI Constants
// =============================================================================

export const RESPONSIVE_WIDTHS = {
  /** Maximum width for two-column layout container */
  MAX_CONTAINER_WIDTH: "1600px",
  /** Minimum width for cards */
  MIN_CARD_WIDTH: "180px",
} as const;

// =============================================================================
// Mock Data Defaults (to be replaced with API data)
// =============================================================================

export const DEFAULT_USER_EMAIL = "john.doe@company.com";
