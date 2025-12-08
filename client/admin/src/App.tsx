import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store/index.ts';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Issuers from './pages/Issuers.tsx';
import Employers from './pages/Employers.tsx';
import Credentials from './pages/Credentials.tsx';
import Layout from './components/Layout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function App() {
  return (
    <Provider store={store}>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#10b981',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="issuers" element={<Issuers />} />
            <Route path="employers" element={<Employers />} />
            <Route path="credentials" element={<Credentials />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
