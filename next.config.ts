import type { NextConfig } from "next";
import { DEV_PROXY, HEADERS, AUTH_ROUTES } from "./lib/constants";

const BACKEND_URL = DEV_PROXY.BACKEND_URL;

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Ensure Google Identity popup can postMessage back
      {
        source: AUTH_ROUTES.LOGIN,
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: HEADERS.CROSS_ORIGIN_OPENER_POLICY,
          },
        ],
      },
      // Apply globally to all routes (safe for most apps)
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: HEADERS.CROSS_ORIGIN_OPENER_POLICY,
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      // Dev proxy to avoid CORS: call /api/* from the frontend,
      // which will be proxied to your backend at BACKEND_URL.
      {
        source: `${DEV_PROXY.FRONTEND_API_PREFIX}/:path*`,
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
