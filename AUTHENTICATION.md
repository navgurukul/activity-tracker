# Google OAuth Login Implementation

This document provides instructions for setting up and using the Google OAuth authentication feature in the NavTrack application.

## Overview

The application now includes complete Google OAuth 2.0 authentication with the following features:

- Google Sign-In integration
- JWT token-based authentication
- Automatic token refresh
- Protected routes
- Session persistence
- User profile management

## Setup Instructions

### 1. Google OAuth Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Configure the OAuth consent screen
6. Select "Web application" as the application type
7. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (e.g., `https://yourapp.com`)
8. Add authorized redirect URIs (if needed):
   - `http://localhost:3000/auth/callback`
   - Your production callback URL
9. Copy the Client ID

### 2. Environment Variables

Create or update the `.env.local` file in the project root:

```bash
# Google OAuth Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id-here

# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# OAuth Redirect URI (optional, defaults to /auth/callback)
NEXT_PUBLIC_OAUTH_REDIRECT_URI=/auth/callback
```

Replace `your-google-client-id-here` with your actual Google OAuth Client ID.

### 3. Backend API Requirements

Your backend API must implement the following endpoints:

#### Login Endpoint

**POST** `/v1/auth/login`

Request:

```json
{
  "idToken": "string",
  "email": "string"
}
```

Response (200 OK):

```json
{
  "access": "string",
  "refresh": "string",
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "avatar": "string"
  }
}
```

#### Token Refresh Endpoint

**POST** `/v1/auth/refresh`

Request:

```json
{
  "refresh": "string"
}
```

Response (200 OK):

```json
{
  "access": "string",
  "refresh": "string"
}
```

### 4. Install Dependencies

Dependencies have already been installed. If you need to reinstall:

```bash
pnpm install
```

## Project Structure

### New Files Created

```
activity-tracker/
├── app/
│   ├── _components/
│   │   ├── AuthProvider.tsx          # Authentication context provider
│   │   ├── GoogleLoginButton.tsx     # Google Sign-In button component
│   │   └── ProtectedRoute.tsx        # Route protection wrapper
│   └── auth/
│       └── login/
│           └── page.tsx               # Login page
├── hooks/
│   ├── use-auth.ts                    # Authentication hook
│   ├── use-google-login.ts            # Google OAuth hook
│   └── use-token-refresh.ts           # Token refresh hook
├── lib/
│   ├── auth-service.ts                # Core authentication logic
│   ├── api-client.ts                  # HTTP client with interceptors
│   └── token-service.ts               # Token management utilities
└── .env.local                         # Environment variables
```

### Modified Files

```
activity-tracker/
├── app/
│   ├── _components/
│   │   └── Sidebar.tsx                # Enhanced with real user data & logout
│   ├── layout.tsx                     # Wrapped with AuthProvider
│   ├── page.tsx                       # Protected route
│   ├── dashboard/page.tsx             # Protected route
│   ├── tracker/page.tsx               # Protected route
│   ├── leaves/
│   │   ├── application/page.tsx       # Protected route
│   │   └── history/page.tsx           # Protected route
│   └── compoff/page.tsx               # Protected route
└── package.json                       # Added dependencies
```

## Usage

### Running the Application

```bash
pnpm dev
```

Navigate to `http://localhost:3000`

### Authentication Flow

1. **Unauthenticated Access**: When accessing protected routes without authentication, users are redirected to `/auth/login`
2. **Google Sign-In**: Click the "Sign in with Google" button on the login page
3. **OAuth Flow**: Complete the Google authentication in the popup/redirect
4. **Token Storage**: Access and refresh tokens are stored in localStorage
5. **Redirection**: After successful login, users are redirected to their intended destination or dashboard
6. **Authenticated Access**: Users can now access all protected routes

### Token Management

- **Access Token**: Short-lived token (typically 15-60 minutes) used for API requests
- **Refresh Token**: Long-lived token (typically 7-30 days) used to obtain new access tokens
- **Automatic Refresh**: When an API request returns 401, the system automatically attempts to refresh the token
- **Logout**: Clears all tokens and redirects to login page

### Protected Routes

All application routes except `/auth/login` are protected:

- `/` - Root dashboard
- `/dashboard` - Dashboard page
- `/tracker` - Activity tracker
- `/leaves/application` - Leave application form
- `/leaves/history` - Leave history
- `/compoff` - Comp-off requests

### User Profile

The sidebar displays authenticated user information:

- Avatar (from Google profile picture)
- Name
- Email
- Logout option in dropdown menu

## API Integration

### Making Authenticated Requests

Use the provided `apiClient` for all backend API calls:

```typescript
import apiClient from "@/lib/api-client";

// Example: Fetch user data
const response = await apiClient.get("/v1/user/profile");
const userData = response.data;

// Example: Submit leave request
const leaveData = {
  type: "annual",
  startDate: "2024-01-01",
  endDate: "2024-01-05",
};
const response = await apiClient.post("/v1/leaves", leaveData);
```

The API client automatically:

- Injects the Authorization header with the access token
- Handles 401 errors by refreshing the token
- Retries the original request after successful refresh
- Redirects to login if refresh fails

## Security Considerations

### Current Implementation

- Tokens stored in localStorage (vulnerable to XSS)
- HTTPS required for production
- Google token verification on backend
- Automatic token refresh
- Session timeout on token expiration

### Recommended Enhancements

1. **HTTPOnly Cookies**: Move tokens to HTTPOnly cookies for better XSS protection
2. **Content Security Policy**: Implement CSP headers
3. **Token Rotation**: Implement refresh token rotation
4. **Rate Limiting**: Add client-side rate limiting for login attempts
5. **Multi-Factor Authentication**: Add optional 2FA
6. **Audit Logging**: Log all authentication events

## Troubleshooting

### Google Sign-In Button Not Appearing

1. Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`
2. Verify the Client ID is correct
3. Check browser console for errors
4. Ensure the domain is authorized in Google Cloud Console

### 401 Errors After Login

1. Verify backend API is running and accessible
2. Check that backend is validating Google tokens correctly
3. Ensure backend is returning tokens in the correct format
4. Check API base URL in `.env.local`

### Token Refresh Failures

1. Check that refresh token is being sent correctly
2. Verify backend refresh endpoint is working
3. Ensure refresh token hasn't expired
4. Check for errors in browser console

### Infinite Redirect Loop

1. Check that `/auth/login` route is not wrapped with ProtectedRoute
2. Verify AuthProvider is properly wrapping the app
3. Check browser console for authentication errors

## Development Notes

### Testing Without Backend

If you don't have a backend ready:

1. Mock the API endpoints using tools like [MSW](https://mswjs.io/) or create mock service workers
2. Return mock tokens and user data
3. The frontend will work with any valid JWT-like string for tokens

### Environment-Specific Configuration

Create different environment files:

- `.env.local` - Local development
- `.env.development` - Development environment
- `.env.production` - Production environment

## Next Steps

### Recommended Features

1. **Email Verification**: Ensure Google emails are verified before allowing access
2. **Role-Based Access Control**: Implement user roles and permissions
3. **Remember Me**: Add persistent session option
4. **Session Management**: Allow users to view and revoke active sessions
5. **Social Login Options**: Add Microsoft, GitHub, etc.
6. **Account Linking**: Allow linking multiple authentication providers

### Testing

1. **Unit Tests**: Add tests for authentication services and hooks
2. **Integration Tests**: Test complete authentication flow
3. **E2E Tests**: Test user journeys with Playwright or Cypress

## Support

For issues or questions:

1. Check this README
2. Review the design document
3. Check browser console for errors
4. Verify environment variables
5. Ensure backend API is properly configured

## License

[Your License Here]
