import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VerifyOTP from './pages/VerifyOTP';
import ProfileBuilder from './pages/ProfileBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import { useLocation } from 'react-router-dom';
import IssuerSignUp from './pages/issuer/Signup';
import IssuerLogin from './pages/issuer/Login';
import IssuerDashboard from './pages/issuer/Dashboard';
import Dashboard from './pages/Dashboard';
import GoogleCallback from './pages/GoogleCallback';
import Profile from './pages/Profile';
import Notification from './components/Notification';
const HideHeaderRoutes = ["/login", "/signup", "/verify-otp", "/profile-builder", "/issuer/login", "/issuer/signup", "/google-callback"];
import { Provider } from 'react-redux';
import { store, persistor } from './store/store';
import { PersistGate } from 'redux-persist/integration/react';
import AppHeader from './AppHeader';
import IssuerHeader from './pages/issuer/IssuerHeader';
import CredentialTemplates from './pages/issuer/CredentialTemplates';
import NewIssuance from './pages/issuer/NewIssuance';
import RecipientManagement from './pages/issuer/RecepientManagement';
import IssuerAnalytics from './pages/issuer/IssuerAnalytics';
import APIManagement from './pages/issuer/APIManagment';
import IssuerSupport from './pages/issuer/IssuerSupport';
import IssuerProfile from './pages/issuer/IssuerProfile';
function Layout() {

  const location = useLocation();
  const hideHeader = HideHeaderRoutes.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <Notification />
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          {!hideHeader && <AppHeader />}

          <main className="flex-grow">
            <Routes>

              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path='/issuer/signup' element={<IssuerSignUp />} />
              <Route path='/issuer/login' element={<IssuerLogin />} />
              <Route path="/google-callback" element={<GoogleCallback />} />
              <Route path="/profile-builder" element={<ProfileBuilder />} />



              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/p/:slug" element={<Profile />} />

              <Route path='/issuer' element={<IssuerHeader />}>
                <Route path="dashboard" element={<IssuerDashboard />} />
                <Route path="templates" element={<CredentialTemplates />} />
                <Route path="issuance" element={<NewIssuance />} />
                <Route path="recipients" element={<RecipientManagement />} />
                <Route path="analytics" element={<IssuerAnalytics />} />
                <Route path="apis" element={<APIManagement />} />
                <Route path="support" element={<IssuerSupport />} />
                <Route path="profile" element={<IssuerProfile />} />

              </Route>

            </Routes>
          </main>
        </PersistGate>
      </Provider>
    </div>

  );
}


function App() {
  return (
    <Router>
      <Layout />
    </Router>
  );
}

export default App;
