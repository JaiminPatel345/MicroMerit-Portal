import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import { LoginPage } from './pages/LoginPage';
import { LearnerDashboard } from './pages/LearnerDashboard';
import { IssuerDashboard } from './pages/IssuerDashboard';
import { EmployerDashboard } from './pages/EmployerDashboard';
import { CredentialDetails } from './pages/CredentialDetails';
import { Layout } from './components/Layout';

function App() {
  return (
    <Provider store={store}>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#1f2937',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
              borderRadius: '12px',
              padding: '16px',
            },
          }}
        />
        <Routes>
          <Route path="/" element={<LoginPage />} />
          <Route
            path="/learner/dashboard"
            element={
              <Layout>
                <LearnerDashboard />
              </Layout>
            }
          />
          <Route
            path="/learner/credentials/:credentialId"
            element={
              <Layout>
                <CredentialDetails />
              </Layout>
            }
          />
          <Route
            path="/issuer/dashboard"
            element={
              <Layout>
                <IssuerDashboard />
              </Layout>
            }
          />
          <Route
            path="/employer/dashboard"
            element={
              <Layout>
                <EmployerDashboard />
              </Layout>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </Provider>
  );
}

export default App;
