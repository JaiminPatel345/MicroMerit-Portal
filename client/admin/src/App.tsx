import { BrowserRouter } from 'react-router-dom';
import { Routes, Route, Navigate } from 'react-router';
import { Provider } from 'react-redux';
import { store } from './store/index.ts';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import Issuers from './pages/Issuers.tsx';
import Employers from './pages/Employers.tsx';
import CredentialSync from './pages/CredentialSync.tsx';
import Layout from './components/Layout.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

function App() {
  return (
    <Provider store={store}>
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
            <Route path="credential-sync" element={<CredentialSync />} />
          </Route>

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
