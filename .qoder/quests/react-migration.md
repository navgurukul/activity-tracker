# React Migration Design Document

## Overview

This design document outlines the migration strategy for converting the Activity Tracker application from Next.js 16 (App Router) to a standard React 19 single-page application (SPA). The migration will preserve all existing functionality while transitioning to a simpler, beginner-friendly architecture using Vite as the build tool and React Router for navigation.

## Goals and Objectives

### Primary Goals
- Convert the Next.js App Router application to a standard React SPA
- Maintain all existing features and functionality
- Remove Next.js-specific dependencies and patterns
- Eliminate redundant and unused files
- Use beginner-friendly tools and patterns

### Non-Goals
- Adding new features or functionality
- Changing the UI/UX design
- Modifying the backend API structure
- Implementing server-side rendering (SSR)

## Migration Strategy

### Build Tool Transition

**From:** Next.js build system with automatic code splitting and SSR
**To:** Vite - a fast, modern build tool optimized for React development

**Rationale:** Vite provides:
- Extremely fast hot module replacement (HMR) for better developer experience
- Simple configuration that's easy for beginners to understand
- Built-in support for TypeScript, CSS, and modern JavaScript
- Smaller learning curve compared to custom Webpack configurations

### Routing Migration

**From:** Next.js App Router (file-based routing with server/client components)
**To:** React Router v6 (declarative route configuration)

**Rationale:** React Router v6 is:
- Industry standard for React SPAs
- Well-documented with extensive community support
- Easy to understand with clear route declarations
- Similar mental model to Next.js routing

### Project Structure Transformation

#### Current Structure (Next.js)
```
app/
├── (authenticated)/       # Route group wrapper
│   ├── admin/
│   │   ├── access-control/page.tsx
│   │   └── dashboard/page.tsx
│   ├── leaves/
│   │   ├── application/page.tsx
│   │   └── history/page.tsx
│   ├── compoff/page.tsx
│   ├── tracker/page.tsx
│   ├── layout.tsx
│   └── page.tsx
├── auth/login/page.tsx
├── _components/
├── layout.tsx (Root)
└── globals.css
```

#### Target Structure (React)
```
src/
├── pages/                 # Page components (one per route)
│   ├── Dashboard.tsx
│   ├── Login.tsx
│   ├── Tracker.tsx
│   ├── Admin/
│   │   ├── AccessControl.tsx
│   │   └── AdminDashboard.tsx
│   ├── Leaves/
│   │   ├── LeaveApplication.tsx
│   │   └── LeaveHistory.tsx
│   └── CompOff.tsx
├── components/            # Shared components
│   ├── ui/               # Radix-based UI components (unchanged)
│   ├── layout/
│   │   ├── AuthProvider.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── Sidebar.tsx
│   │   ├── AppHeader.tsx
│   │   └── RootLayout.tsx
│   └── GoogleLoginButton.tsx
├── hooks/                 # Custom hooks (unchanged)
├── lib/                   # Utilities and services (minimal changes)
├── routes/
│   └── AppRoutes.tsx     # Route configuration
├── App.tsx               # Root component
├── main.tsx              # Application entry point
└── index.css             # Global styles (renamed from globals.css)
```

## Detailed Migration Plan

### Phase 1: Project Setup and Configuration

#### 1.1 Package Dependencies Update

**Dependencies to Remove:**
- `next` - Next.js framework
- `next-themes` - Next.js specific theme management
- `eslint-config-next` - Next.js ESLint config

**Dependencies to Add:**
- `vite` - Build tool
- `@vitejs/plugin-react` - Vite React plugin
- `react-router-dom` - Client-side routing

**Dependencies to Keep:**
All existing UI, form, and utility libraries remain unchanged:
- React 19 and React DOM
- All Radix UI components
- Tailwind CSS and styling utilities
- Form handling (react-hook-form, zod)
- Authentication (@react-oauth/google, jwt-decode)
- HTTP client (axios)
- Date utilities (date-fns)
- Icons (lucide-react)

#### 1.2 Configuration Files

**Files to Create:**

| File | Purpose | Key Configuration |
|------|---------|-------------------|
| `vite.config.ts` | Vite build configuration | React plugin, path aliases (@/), dev server proxy, TypeScript support |
| `index.html` | HTML entry point | Root div, script reference to main.tsx, font preload |
| `src/main.tsx` | Application entry | React.render call, router setup, providers |

**Files to Update:**

| File | Changes Required |
|------|------------------|
| `tsconfig.json` | Remove Next.js plugin, update paths to src/, change jsx to "react-jsx" |
| `package.json` | Update scripts (dev, build, preview), remove Next.js deps, add Vite deps |
| `postcss.config.mjs` | Keep as-is (Tailwind v4 compatible) |
| `eslint.config.mjs` | Remove Next.js rules, add React/Vite rules |

**Files to Remove:**
- `next.config.ts` - Next.js specific configuration
- `next-env.d.ts` - Next.js type definitions

#### 1.3 Environment Variables

**Migration Pattern:**
- Replace `NEXT_PUBLIC_*` prefix with `VITE_*`
- Example: `NEXT_PUBLIC_API_BASE_URL` → `VITE_API_BASE_URL`

**Access Pattern Change:**
- From: `process.env.NEXT_PUBLIC_API_BASE_URL`
- To: `import.meta.env.VITE_API_BASE_URL`

**Files Affected:**
- `lib/constants.ts` - Update API.BASE_URL and DEV_PROXY references

### Phase 2: Routing Implementation

#### 2.1 Route Structure Definition

**Route Mapping Table:**

| Next.js File Path | React Router Path | Component Name | Auth Required |
|-------------------|-------------------|----------------|---------------|
| `app/auth/login/page.tsx` | `/login` | `Login` | No |
| `app/(authenticated)/page.tsx` | `/` | `Dashboard` | Yes |
| `app/(authenticated)/tracker/page.tsx` | `/tracker` | `Tracker` | Yes |
| `app/(authenticated)/admin/dashboard/page.tsx` | `/admin/dashboard` | `AdminDashboard` | Yes |
| `app/(authenticated)/admin/access-control/page.tsx` | `/admin/access-control` | `AccessControl` | Yes |
| `app/(authenticated)/leaves/application/page.tsx` | `/leaves/application` | `LeaveApplication` | Yes |
| `app/(authenticated)/leaves/history/page.tsx` | `/leaves/history` | `LeaveHistory` | Yes |
| `app/(authenticated)/compoff/page.tsx` | `/compoff` | `CompOff` | Yes |

#### 2.2 Router Configuration Design

**AppRoutes.tsx Structure:**
- Root route wrapped with RootLayout (providers, theme, toaster)
- Protected routes wrapped with ProtectedRoute component
- Public routes (login) accessible without authentication
- Authenticated routes wrapped with AuthenticatedLayout (sidebar)
- Fallback route for 404 handling

**Layout Hierarchy:**
```
BrowserRouter
└── RootLayout (AuthProvider + ThemeProvider + Toaster)
    ├── Login (public)
    └── ProtectedRoute
        └── AuthenticatedLayout (Sidebar + SidebarInset)
            ├── Dashboard
            ├── Tracker
            ├── Admin/*
            ├── Leaves/*
            └── CompOff
```

#### 2.3 Navigation Updates

**Changes Required in Sidebar Component:**
- Replace Next.js `Link` from `next/link` with React Router `Link` from `react-router-dom`
- Replace `usePathname()` hook with `useLocation()` hook
- Update active route detection logic to use `location.pathname`

**Changes Required in Other Components:**
- Remove Next.js-specific navigation patterns
- Use `useNavigate()` hook for programmatic navigation
- Replace `redirect()` calls with `navigate()` calls

### Phase 3: Component Migration

#### 3.1 Page Component Transformation

**Transformation Pattern:**

**Before (Next.js page.tsx):**
- Export default function as page component
- May use Server Component patterns
- File location determines route

**After (React page component):**
- Export default function as regular React component
- Pure client-side component
- Imported and used in route configuration

**Files to Transform:**

| Current File | New Location | Type | Changes Required |
|--------------|-------------|------|------------------|
| `app/auth/login/page.tsx` | `src/pages/Login.tsx` | Public Page | Remove Next.js metadata, update imports |
| `app/(authenticated)/page.tsx` | `src/pages/Dashboard.tsx` | Protected Page | Remove route group wrapper, standard React component |
| `app/(authenticated)/tracker/page.tsx` | `src/pages/Tracker.tsx` | Protected Page | Standard migration |
| `app/(authenticated)/admin/dashboard/page.tsx` | `src/pages/Admin/AdminDashboard.tsx` | Protected Page | Nested folder structure |
| `app/(authenticated)/admin/access-control/page.tsx` | `src/pages/Admin/AccessControl.tsx` | Protected Page | Nested folder structure |
| `app/(authenticated)/leaves/application/page.tsx` | `src/pages/Leaves/LeaveApplication.tsx` | Protected Page | Move feature components |
| `app/(authenticated)/leaves/history/page.tsx` | `src/pages/Leaves/LeaveHistory.tsx` | Protected Page | Move feature components |
| `app/(authenticated)/compoff/page.tsx` | `src/pages/CompOff.tsx` | Protected Page | Move feature components |

#### 3.2 Layout Component Migration

**Root Layout Transformation:**

**Before (app/layout.tsx):**
- Next.js metadata export
- Next.js font optimization
- HTML structure with providers
- Script injection for theme

**After (src/components/layout/RootLayout.tsx):**
- Remove metadata (moved to index.html)
- Load fonts via CSS or fontsource
- Outlet for nested routes
- Inline script for theme in index.html

**Authenticated Layout Transformation:**

**Before (app/(authenticated)/layout.tsx):**
- Wrapper with ProtectedRoute and Sidebar
- File-based nested layout

**After (src/components/layout/AuthenticatedLayout.tsx):**
- Same wrapper logic
- Uses React Router Outlet for children
- Applied via route configuration

#### 3.3 Component Updates

**Shared Components (app/_components → src/components/layout):**

| Component | Migration Status | Changes Required |
|-----------|-----------------|------------------|
| `AuthProvider.tsx` | Minimal changes | Update import paths, remove Next.js specifics |
| `ProtectedRoute.tsx` | Update required | Replace Next.js redirect with React Router navigate |
| `Sidebar.tsx` | Update required | Replace Link and usePathname with React Router equivalents |
| `AppHeader.tsx` | Minimal changes | Update import paths |
| `GoogleLoginButton.tsx` | Minimal changes | Update import paths |
| `ThemeProvider.tsx` | Minimal changes | Update import paths |

**Feature-Specific Components:**
- All components in `_components` folders move with their parent pages
- Update import paths to use `@/` alias
- No functional changes required

**UI Components (components/ui):**
- No changes required
- Move to `src/components/ui/`
- All Radix-based components remain identical

### Phase 4: Service Layer Updates

#### 4.1 API Client Configuration

**File: lib/api-client.ts**

**Updates Required:**
- Replace environment variable access pattern
- Update base URL configuration for dev proxy
- No changes to axios interceptors or error handling

**Dev Server Proxy:**
- Move CORS proxy configuration from `next.config.ts` to `vite.config.ts`
- Configure Vite dev server proxy to forward `/api/*` to backend
- Maintain same proxy behavior for development

#### 4.2 Constants Updates

**File: lib/constants.ts**

**Changes:**
- Update `process.env.NEXT_PUBLIC_API_BASE_URL` to `import.meta.env.VITE_API_BASE_URL`
- Update `process.env.BACKEND_PROXY_TARGET` to `import.meta.env.VITE_BACKEND_PROXY_TARGET`
- Keep all API paths and validation constants unchanged

#### 4.3 Services - No Changes Required

**Files with minimal/no updates:**
- `lib/auth-service.ts` - Keep as-is
- `lib/token-service.ts` - Keep as-is
- `lib/utils.ts` - Keep as-is
- `lib/mock-data.ts` - Keep as-is

### Phase 5: Styling and Assets

#### 5.1 Global Styles

**Migration:**
- Rename `app/globals.css` to `src/index.css`
- Import in `src/main.tsx` instead of root layout
- Keep all Tailwind directives and custom CSS variables unchanged

**Tailwind Configuration:**
- Tailwind v4 configured via PostCSS - no changes needed
- Custom CSS variables (--subtle, etc.) remain in index.css
- Dark mode classes continue to work with theme provider

#### 5.2 Font Loading

**Current (Next.js):**
- `next/font/google` auto-optimization for DM Sans
- Automatic font file hosting and loading

**New Approach:**
- Add Google Fonts link to index.html head section
- Or use `@fontsource/dm-sans` npm package for self-hosting
- Apply font via CSS class on body element

**Recommended: Google Fonts CDN Link**
- Simpler for beginners
- No additional dependencies
- Loaded in index.html head

#### 5.3 Public Assets

**Migration:**
- `public/` folder contents move to `public/` in new structure
- Vite serves public folder as static assets
- No path changes required in code

### Phase 6: TypeScript Configuration

#### 6.1 TSConfig Updates

**Changes to tsconfig.json:**

| Setting | Current Value | New Value | Reason |
|---------|--------------|-----------|---------|
| `jsx` | `react-jsx` | Keep as-is | Standard React 19 JSX transform |
| `plugins` | `[{ "name": "next" }]` | Remove | No longer using Next.js |
| `paths` | `{ "@/*": ["./*"] }` | `{ "@/*": ["./src/*"] }` | New src directory |
| `include` | Includes `next-env.d.ts`, `.next/` | Remove Next.js references, add `src/` | Clean up Next.js artifacts |

#### 6.2 Type Declarations

**New Type Definitions Required:**

Create `src/vite-env.d.ts`:
- Reference Vite client types
- Define custom environment variable types
- Ensure TypeScript recognizes `import.meta.env`

### Phase 7: Testing and Verification

#### 7.1 Functionality Verification Checklist

**Authentication Flow:**
- Google OAuth login works correctly
- Token storage and retrieval functions
- Token refresh mechanism operational
- Protected routes redirect to login when unauthenticated
- Logged-in users can access protected routes

**Navigation:**
- All routes accessible via sidebar
- Active route highlighting works
- Browser back/forward buttons work correctly
- Direct URL access works for all routes

**Feature Modules:**
- Activity tracker displays and submits data
- Leave application form works
- Leave history loads correctly
- CompOff request submission functions
- Admin dashboard accessible
- Access control page functions

**UI/UX:**
- Theme switching (light/dark) works
- Responsive layout functions correctly
- All UI components render properly
- Forms validate correctly
- Toast notifications display

**API Integration:**
- API calls reach backend correctly
- Dev proxy forwards requests
- Authentication headers included
- Error handling works

#### 7.2 Performance Verification

**Metrics to Check:**
- Initial page load time
- Hot module replacement speed
- Build time
- Bundle size

### Phase 8: Cleanup and Documentation

#### 8.1 Files to Remove

**Next.js Specific Files:**
- `next.config.ts`
- `next-env.d.ts`
- `.next/` directory (build artifacts)
- Any `.next` related cache files

**Redundant Files:**
- Old `app/` directory structure (after migration to `src/`)
- Unused page components
- Deprecated configuration files

#### 8.2 Files to Keep

**Configuration:**
- `package.json` (updated)
- `tsconfig.json` (updated)
- `postcss.config.mjs` (unchanged)
- `eslint.config.mjs` (updated)
- `components.json` (unchanged)
- `.gitignore` (updated to exclude Vite build artifacts)

**Documentation:**
- `README.md` (update setup instructions)
- `AUTHENTICATION.md` (keep, may need minor updates)

#### 8.3 Updated Project Scripts

**New package.json scripts:**

| Script | Command | Purpose |
|--------|---------|---------|
| `dev` | `vite` | Start development server |
| `build` | `vite build` | Build production bundle |
| `preview` | `vite preview` | Preview production build locally |
| `lint` | `eslint src` | Lint source code |
| `type-check` | `tsc --noEmit` | Check TypeScript types |

## Migration Execution Sequence

### Step-by-Step Implementation Order

1. **Initialize Vite Project Structure**
   - Create `src/` directory
   - Create `index.html` at root
   - Set up basic Vite configuration

2. **Install and Configure Dependencies**
   - Update package.json with new dependencies
   - Run package installation
   - Configure TypeScript for Vite

3. **Create Application Entry Point**
   - Create `src/main.tsx`
   - Create `src/App.tsx`
   - Set up provider hierarchy

4. **Migrate Shared Components**
   - Move UI components to `src/components/ui/`
   - Move layout components to `src/components/layout/`
   - Update import paths

5. **Migrate Utility Layer**
   - Move `lib/` to `src/lib/`
   - Update environment variable access
   - Update constants

6. **Migrate Hooks**
   - Move `hooks/` to `src/hooks/`
   - Update import paths
   - Test custom hooks

7. **Set Up Routing Infrastructure**
   - Create route configuration
   - Implement route protection
   - Set up layouts

8. **Migrate Pages**
   - Transform each page component
   - Update imports and exports
   - Register routes

9. **Configure Styling**
   - Move global styles
   - Configure fonts
   - Test theme switching

10. **Set Up Dev Proxy**
    - Configure Vite proxy
    - Test API calls
    - Verify CORS handling

11. **Testing Phase**
    - Test all routes
    - Verify authentication
    - Check all features
    - Test responsiveness

12. **Cleanup**
    - Remove Next.js files
    - Update documentation
    - Clean up dependencies

13. **Final Verification**
    - Build production bundle
    - Test production preview
    - Verify all functionality

## Technical Considerations

### Cross-Origin Handling

**Current Setup:**
- Next.js handles CORS via headers configuration
- Dev proxy in next.config.ts

**New Setup:**
- Vite dev server proxy configuration
- Headers managed via Vite config
- Same-origin-allow-popups for Google OAuth

**Configuration Location:** `vite.config.ts` server.proxy and server.headers

### State Management

**No Changes Required:**
- Continue using React Context API
- AuthProvider manages authentication state
- ThemeProvider manages theme state
- No need for additional state management libraries

### Code Splitting

**Next.js Approach:**
- Automatic code splitting per page/route
- Dynamic imports handled by framework

**Vite/React Approach:**
- Manual code splitting via React.lazy()
- Suspense boundaries for loading states
- Vite automatically chunks vendor dependencies

**Recommendation for Beginners:**
- Start without code splitting
- Add React.lazy() for heavy pages if needed
- Use Suspense with loading fallbacks

### Build Output

**Development:**
- Vite dev server on port 5173 (default)
- Fast HMR with instant updates

**Production:**
- Static files in `dist/` directory
- Optimized and minified bundles
- Can be served by any static file server

## Risk Assessment and Mitigation

### Potential Risks

| Risk | Impact | Probability | Mitigation Strategy |
|------|--------|-------------|---------------------|
| Authentication flow breaks | High | Medium | Thorough testing of OAuth flow, token handling, and protected routes |
| Routing issues | High | Low | Comprehensive route testing, maintain route structure parity |
| API proxy fails | High | Low | Test dev proxy configuration early, verify CORS handling |
| Build configuration errors | Medium | Medium | Follow Vite documentation, test build early and often |
| Missing dependencies | Medium | Low | Careful dependency audit, incremental testing |
| Theme/styling breaks | Low | Low | CSS remains mostly unchanged, test theme switching |
| TypeScript errors | Medium | Medium | Incremental type checking, fix errors as they appear |

### Rollback Plan

**If migration encounters critical issues:**
1. Maintain Next.js codebase in separate branch
2. Can revert to Next.js if needed
3. Use Git to track all changes
4. Test thoroughly before deleting Next.js code

## Success Criteria

The migration is considered successful when:

1. **All Routes Functional**: Every page accessible and working as before
2. **Authentication Works**: Login, token management, and route protection operational
3. **API Integration Intact**: All backend calls successful, proxy working
4. **UI/UX Preserved**: Visual appearance and user experience unchanged
5. **Performance Acceptable**: Load times and responsiveness meet expectations
6. **Build Succeeds**: Production build completes without errors
7. **No Next.js Dependencies**: All Next.js packages removed from package.json
8. **Clean Codebase**: No redundant files or unused code
9. **Documentation Updated**: README and other docs reflect new setup
10. **Developer Experience**: Easy to understand for beginners, clear file structure

## Post-Migration Considerations

### Development Workflow

**New Commands:**
- `pnpm dev` - Start Vite dev server (instead of Next.js dev)
- `pnpm build` - Create production build
- `pnpm preview` - Preview production build locally

**Hot Reload:**
- Vite provides faster HMR than Next.js
- Changes reflect almost instantly
- Better developer experience

### Deployment Changes

**Static Hosting:**
- Build output is pure static files
- Can deploy to: Vercel, Netlify, GitHub Pages, AWS S3, etc.
- No need for Node.js server in production

**Environment Variables:**
- Set `VITE_*` variables in hosting platform
- No `NEXT_PUBLIC_*` prefix needed
- Build-time variables only (baked into bundle)

### Future Enhancements

**Optional Improvements After Migration:**
- Add React.lazy() for code splitting on heavy pages
- Implement Suspense boundaries for loading states
- Consider adding TanStack Query for better data fetching
- Add error boundaries for better error handling
- Consider Vitest for unit testing

**Not Included in This Migration:**
- Server-Side Rendering (SSR)
- Static Site Generation (SSG)
- API routes (backend remains separate)
- Advanced caching strategies

## Appendix

### Key Technology Differences

| Aspect | Next.js | React + Vite |
|--------|---------|--------------|
| Rendering | SSR + Client | Client-only (SPA) |
| Routing | File-based | Declarative (React Router) |
| Build Tool | Webpack/Turbopack | Vite (esbuild + Rollup) |
| Dev Server | Next.js dev server | Vite dev server |
| Deployment | Node.js or Static | Static files only |
| Learning Curve | Steeper | Gentler |

### Import Path Changes

**Before:**
```
import Component from '@/app/_components/Component'
import { useAuth } from '@/hooks/use-auth'
import { API_PATHS } from '@/lib/constants'
```

**After:**
```
import Component from '@/components/Component'
import { useAuth } from '@/hooks/use-auth'
import { API_PATHS } from '@/lib/constants'
```

### Environment Variable Examples

**Before (.env.local):**
```
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
BACKEND_PROXY_TARGET=http://localhost:9900
```

**After (.env):**
```
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_PROXY_TARGET=http://localhost:9900
```
