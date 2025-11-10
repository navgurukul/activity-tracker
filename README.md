# Activity Tracker

A modern HR management web application built with React 19, featuring Google OAuth authentication, activity tracking, leave management, and admin capabilities.

## Tech Stack

- **Framework**: React 19 with Vite
- **Routing**: React Router v6
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: Radix UI primitives
- **Forms**: React Hook Form with Zod validation
- **Authentication**: Google OAuth
- **HTTP Client**: Axios
- **Icons**: Lucide React

## Prerequisites

- Node.js 20+ 
- pnpm (enforced via preinstall script)

## Getting Started

1. **Clone the repository**

2. **Install dependencies**

```bash
pnpm install
```

3. **Set up environment variables**

Copy `.env.example` to `.env` and configure:

```bash
VITE_API_BASE_URL=http://localhost:8000
VITE_BACKEND_PROXY_TARGET=http://localhost:9900
```

4. **Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build for production
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint
- `pnpm type-check` - Run TypeScript type checking

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components (Radix-based)
│   └── layout/          # Layout components (Sidebar, Auth, Theme)
├── pages/               # Page components for each route
│   ├── Admin/          # Admin pages
│   ├── Leaves/         # Leave management pages
│   └── ...             # Other feature pages
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── api-client.ts   # Axios instance and interceptors
│   ├── auth-service.ts # Authentication logic
│   ├── constants.ts    # App constants
│   └── utils.ts        # Helper functions
├── routes/             # React Router configuration
├── App.tsx             # Root app component
├── main.tsx            # Application entry point
└── index.css           # Global styles and Tailwind directives
```

## Features

- **Authentication**: Google OAuth login with JWT token management
- **Activity Tracker**: Track daily work activities and submit timesheets
- **Leave Management**: Apply for leaves, view allocation, and check history
- **Compensatory Off**: Request and manage comp-off days
- **Project Management**: View and manage projects
- **Admin Panel**: Dashboard and access control for administrators
- **Theme Support**: Light/dark mode with system preference detection
- **Responsive Design**: Mobile-friendly interface

## Development

### Adding New Routes

1. Create a page component in `src/pages/`
2. Add the route in `src/routes/AppRoutes.tsx`
3. Update sidebar navigation in `src/components/layout/Sidebar.tsx` if needed

### API Integration

The app uses a development proxy configured in `vite.config.ts` to avoid CORS issues:
- Frontend calls `/api/*` 
- Proxied to backend at `VITE_BACKEND_PROXY_TARGET`

## Deployment

Build the production bundle:

```bash
pnpm build
```

The `dist/` folder contains static files ready for deployment to:
- Vercel
- Netlify  
- AWS S3 + CloudFront
- Any static hosting service

## License

Private project
