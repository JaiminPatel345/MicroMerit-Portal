# MicroMerit Portal - Admin Dashboard

A modern, feature-rich admin dashboard for managing the MicroMerit Portal platform.

## Features

- **Secure Authentication** - JWT-based authentication with automatic token refresh
- **Dashboard** - Overview of platform statistics and recent activity
- **Issuer Management** - Approve, reject, block, and unblock issuers with filtering
- **Employer Management** - Approve and reject employer registrations
- **Credentials** - View and manage issued credentials across the platform
- **External Sync** - Monitor and control external credential provider sync (trigger jobs, start/stop scheduler, view provider status)
- **Responsive Design** - Works seamlessly on desktop and mobile devices
- **Modern UI** - Built with Tailwind CSS v4 and Heroicons

## Tech Stack

- **React 19** - Latest React with TypeScript
- **Redux Toolkit** - State management
- **React Router v7** - Client-side routing
- **Axios** - HTTP client with automatic token refresh
- **Tailwind CSS v4** - Utility-first CSS framework
- **Heroicons v2** - Icon library
- **react-hot-toast** - Toast notifications
- **Vite 7** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+ and Yarn
- Backend API running on `http://localhost:3000`

### Installation

1. Install dependencies:
```bash
yarn install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Update the `.env` file with your API URL:
```
VITE_API_BASE_URL=http://localhost:3000
```

### Development

```bash
yarn dev
```

The app will be available at `http://localhost:5174`

### Build

```bash
yarn build
```

### Preview production build

```bash
yarn preview
```

## Project Structure

```
src/
├── api/                       # API service layer
│   ├── axiosInstance.ts       # Axios instance with token refresh interceptor
│   ├── authAPI.ts             # Authentication endpoints
│   ├── issuerAPI.ts           # Issuer management endpoints
│   ├── employerAPI.ts         # Employer management endpoints
│   └── externalSyncAPI.ts     # External credential sync endpoints
├── components/                # Reusable components
│   ├── Layout.tsx             # Main layout wrapper with sidebar
│   ├── ProtectedRoute.tsx     # Route guard
│   ├── IssuerDetailsModal.tsx # Issuer detail view
│   ├── ApproveModal.tsx       # Approve confirmation modal
│   ├── RejectModal.tsx        # Reject with reason modal
│   ├── BlockModal.tsx         # Block with reason modal
│   ├── UnblockModal.tsx       # Unblock confirmation modal
│   ├── EmployerDetailsModal.tsx
│   ├── EmployerApproveModal.tsx
│   └── EmployerRejectModal.tsx
├── pages/                     # Page components
│   ├── Login.tsx              # Login page
│   ├── Dashboard.tsx          # Platform statistics overview
│   ├── Issuers.tsx            # Issuer management page
│   ├── Employers.tsx          # Employer management page
│   └── Credentials.tsx        # Credentials overview page
├── store/                     # Redux store
│   ├── index.ts               # Store configuration
│   ├── hooks.ts               # Typed Redux hooks
│   ├── authSlice.ts           # Auth state management
│   ├── issuerSlice.ts         # Issuer state management
│   ├── employerSlice.ts       # Employer state management
│   └── externalSyncSlice.ts   # External sync state management
├── utils/
│   └── dateUtils.ts           # Date formatting helpers
├── config/
│   └── appConfig.ts           # App-wide configuration
├── App.tsx                    # Main app component with routing
├── main.tsx                   # Entry point
└── index.css                  # Global styles and Tailwind
```

## Routes

| Path | Page | Auth Required |
|------|------|---------------|
| `/login` | Login | No |
| `/dashboard` | Dashboard | Yes |
| `/issuers` | Issuer Management | Yes |
| `/employers` | Employer Management | Yes |
| `/credentials` | Credentials | Yes |

## API Integration

### Authentication
- `POST /auth/admin/login` - Admin login
- `POST /auth/admin/refresh` - Refresh access token
- `GET /admin/profile` - Get admin profile

### Issuer Management
- `GET /admin/issuers` - List all issuers (with filters)
- `POST /admin/issuers/:id/approve` - Approve issuer
- `POST /admin/issuers/:id/reject` - Reject issuer
- `POST /admin/issuers/:id/block` - Block issuer
- `POST /admin/issuers/:id/unblock` - Unblock issuer

### Employer Management
- `GET /admin/employers` - List all employers (with filters)
- `POST /admin/employers/:id/approve` - Approve employer
- `POST /admin/employers/:id/reject` - Reject employer

### External Credential Sync
- `GET /admin/external-sync/status` - Get sync status
- `GET /admin/external-sync/providers` - List providers
- `POST /admin/external-sync/trigger` - Trigger manual sync
- `POST /admin/external-sync/scheduler/start` - Start auto-scheduler
- `POST /admin/external-sync/scheduler/stop` - Stop auto-scheduler

## Key Features

### Automatic Token Refresh

The axios instance automatically handles token refresh when the access token expires:
- Intercepts 401 responses
- Calls the refresh endpoint with the refresh token
- Retries the original request with the new access token
- Queues multiple failed requests during refresh
- Redirects to login if refresh fails

### State Management

Redux Toolkit is used for state management with four main slices:
- **authSlice** - Authentication state and admin profile
- **issuerSlice** - Issuer data, filters, and CRUD operations
- **employerSlice** - Employer data and approval workflow
- **externalSyncSlice** - External sync status, provider info, and scheduler control

### Protected Routes

All authenticated routes are wrapped with the `ProtectedRoute` component that:
- Checks authentication status
- Redirects to login if not authenticated
- Fetches admin profile on mount

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000` |

## License

Private - MicroMerit Portal
