# MicroMerit Portal - Admin Dashboard

A modern, feature-rich admin dashboard for managing the MicroMerit Portal platform.

## Features

- 🔐 **Secure Authentication** - JWT-based authentication with automatic token refresh
- 📊 **Dashboard** - Overview of platform statistics and recent activity
- 👥 **Issuer Management** - Approve, reject, block, and unblock issuers
- 🔍 **Advanced Filtering** - Filter issuers by status, blocked state, and search
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- 🎨 **Modern UI** - Built with Tailwind CSS for a beautiful, consistent design

## Tech Stack

- **React 19** - Latest React with TypeScript
- **Redux Toolkit** - State management
- **React Router** - Client-side routing
- **Axios** - HTTP client with automatic token refresh
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server

## Getting Started

### Prerequisites

- Node.js 18+ or Yarn
- Backend API running on `http://localhost:3000/api`

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
VITE_API_BASE_URL=http://localhost:3000/api
```

### Development

Start the development server:
```bash
yarn dev
```

The app will be available at `http://localhost:5173`

### Build

Build for production:
```bash
yarn build
```

Preview production build:
```bash
yarn preview
```

## Project Structure

```
src/
├── api/                    # API service layer
│   ├── axiosInstance.ts   # Axios instance with token refresh
│   ├── authAPI.ts         # Authentication endpoints
│   └── issuerAPI.ts       # Issuer management endpoints
├── components/            # Reusable components
│   ├── Layout.tsx         # Main layout wrapper
│   ├── ProtectedRoute.tsx # Route guard
│   ├── IssuerDetailsModal.tsx
│   ├── RejectModal.tsx
│   └── BlockModal.tsx
├── pages/                 # Page components
│   ├── Login.tsx          # Login page
│   ├── Dashboard.tsx      # Dashboard page
│   └── Issuers.tsx        # Issuer management page
├── store/                 # Redux store
│   ├── index.ts           # Store configuration
│   ├── hooks.ts           # Typed Redux hooks
│   ├── authSlice.ts       # Auth state management
│   └── issuerSlice.ts     # Issuer state management
├── App.tsx                # Main app component with routing
├── main.tsx               # Entry point
└── index.css              # Global styles and Tailwind
```

## API Integration

The app integrates with the following API endpoints:

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

## Features in Detail

### Automatic Token Refresh

The axios instance automatically handles token refresh when the access token expires:
- Intercepts 401 responses
- Calls the refresh endpoint with the refresh token
- Retries the original request with the new access token
- Queues multiple failed requests during refresh
- Redirects to login if refresh fails

### State Management

Redux Toolkit is used for state management with two main slices:
- **authSlice** - Manages authentication state and user profile
- **issuerSlice** - Manages issuer data, filters, and CRUD operations

### Protected Routes

All authenticated routes are wrapped with the `ProtectedRoute` component that:
- Checks authentication status
- Redirects to login if not authenticated
- Fetches user profile on mount

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:3000/api` |

## License

Private - MicroMerit Portal
