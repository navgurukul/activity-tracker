import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_PROXY_TARGET || "http://localhost:9900";

const nextConfig: NextConfig = {
  async headers() {
    return [
      // Ensure Google Identity popup can postMessage back
      {
        source: "/auth/login",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
        ],
      },
      // Apply globally to all routes (safe for most apps)
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
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
        source: "/api/:path*",
        destination: `${BACKEND_URL}/:path*`,
      },
    ];
  },
};

export default nextConfig;
