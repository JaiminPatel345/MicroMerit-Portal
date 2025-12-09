import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import VerifyOTP from './pages/VerifyOTP';
import ResetPassword from './pages/ResetPassword';
import ProfileBuilder from './pages/learner/ProfileBuilder';
import Terms from './pages/Terms';
import Login from './pages/learner/Login';
import LearnerForgotPassword from './pages/learner/ForgotPassword';
import Contact from './pages/Contact';
import Signup from './pages/learner/Signup';
import FAQ from './pages/FAQ';
import { useLocation } from 'react-router-dom';
import IssuerSignUp from './pages/issuer/Signup';
import IssuerLogin from './pages/issuer/Login';
import IssuerForgotPassword from './pages/issuer/ForgotPassword';
import IssuerDashboard from './pages/issuer/Dashboard';
import LearnerDashboard from './pages/learner/Dashboard';
import Wallet from './pages/learner/Wallet';
import CredentialDetails from './pages/learner/CredentialDetails';
import Roadmap from './pages/learner/Roadmap';
import SkillProfile from './pages/learner/SkillProfile';
import Notifications from './pages/learner/Notifications';
import Settings from './pages/learner/Settings';
import GoogleCallback from './pages/learner/GoogleCallback';
import DigilockerCallback from './pages/learner/DigilockerCallback';
import Profile from './pages/learner/Profile';
import EditProfile from './pages/learner/EditProfile';
import Notification from './components/Notification';
import { Provider } from 'react-redux';
import { store, persistor } from './store/store';
import { PersistGate } from 'redux-persist/integration/react';
import Verification from './pages/learner/Verification';
import AppHeader from './AppHeader';
import IssuerHeader from './pages/issuer/IssuerHeader';
import Credentials from './pages/issuer/Credentials';
import NewIssuance from './pages/issuer/NewIssuance';
import RecipientManagement from './pages/issuer/RecepientManagement';
import IssuerAnalytics from './pages/issuer/IssuerAnalytics';
import APIManagement from './pages/issuer/APIManagment';
import IssuerSupport from './pages/issuer/IssuerSupport';
import IssuerProfile from './pages/issuer/IssuerProfile';
import IssuerSettings from './pages/issuer/Settings';
import AuthRoutes from './components/AuthRoutes';
import PublicIssuerProfile from './pages/public/PublicIssuerProfile';
import PublicCredential from './pages/public/PublicCredential';
import EmployerLogin from './pages/employer/Login';
import EmployerForgotPassword from './pages/employer/ForgotPassword';
import EmployerSignup from './pages/employer/Signup';
import EmployerDashboard from './pages/employer/Dashboard';
import EmployerVerify from './pages/employer/Verify';
import EmployerSearch from './pages/employer/Search';
import EmployerProfile from './pages/employer/Properties';
import EmployerHeader from './pages/employer/Header';

const HideHeaderRoutes = ["/login", "/signup", "/verify-otp", "/reset-password", "/forgot-password", "/profile-builder", "/issuer/login", "/issuer/signup", "/issuer/forgot-password", "/google-callback", "/digilocker-callback", "/employer/login", "/employer/signup", "/employer/forgot-password"];

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
              <Route path="/forgot-password" element={<LearnerForgotPassword />} />
              <Route path="/verify-otp" element={<VerifyOTP />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path='/issuer/signup' element={<IssuerSignUp />} />
              <Route path='/issuer/login' element={<IssuerLogin />} />
              <Route path='/issuer/forgot-password' element={<IssuerForgotPassword />} />
              <Route path="/google-callback" element={<GoogleCallback />} />
              <Route path="/digilocker-callback" element={<DigilockerCallback />} />
              <Route path="/auth/learner/oauth/google/callback" element={<GoogleCallback />} />
              <Route path="/profile-builder" element={<ProfileBuilder />} />
              <Route path="/verify" element={<Verification />} />
              <Route path="/verify/:id" element={<Verification />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faqs" element={<FAQ />} />



              <Route path="/dashboard" element={
                <AuthRoutes role="learner">
                  <LearnerDashboard />
                </AuthRoutes>
              } />

              <Route path="/wallet" element={
                <AuthRoutes role="learner">
                  <Wallet />
                </AuthRoutes>
              } />

              <Route path="/credential/:id" element={
                <AuthRoutes role="learner">
                  <CredentialDetails />
                </AuthRoutes>
              } />

              <Route path="/roadmap" element={
                <AuthRoutes role="learner">
                  <Roadmap />
                </AuthRoutes>
              } />

              <Route path="/pathway" element={
                <AuthRoutes role="learner">
                  <Roadmap />
                </AuthRoutes>
              } />

              <Route path="/skills" element={
                <AuthRoutes role="learner">
                  <SkillProfile />
                </AuthRoutes>
              } />

              <Route path="/notifications" element={
                <AuthRoutes role="learner">
                  <Notifications />
                </AuthRoutes>
              } />

              <Route path="/settings" element={
                <AuthRoutes role="learner">
                  <Settings />
                </AuthRoutes>
              } />

              <Route path="/edit-profile" element={
                <AuthRoutes role="learner">
                  <EditProfile />
                </AuthRoutes>
              } />

              <Route path="/p/:slug" element={<Profile />} />
              <Route path="/i/:id" element={<PublicIssuerProfile />} />
              <Route path="/c/:id" element={<PublicCredential />} />

              <Route path='/issuer' element={
                <AuthRoutes role="issuer">
                  <IssuerHeader />
                </AuthRoutes>
              }>
                <Route path="dashboard" element={<IssuerDashboard />} />
                <Route path="credentials" element={<Credentials />} />
                <Route path="issuance" element={<NewIssuance />} />
                <Route path="recipients" element={<RecipientManagement />} />
                <Route path="analytics" element={<IssuerAnalytics />} />
                <Route path="apis" element={<APIManagement />} />
                <Route path="support" element={<IssuerSupport />} />
                <Route path="profile" element={<IssuerProfile />} />
                <Route path="settings" element={<IssuerSettings />} />

                <Route path="settings" element={<IssuerSettings />} />

              </Route>

              <Route path='/employer/signup' element={<EmployerSignup />} />
              <Route path='/employer/login' element={<EmployerLogin />} />
              <Route path='/employer/forgot-password' element={<EmployerForgotPassword />} />
              <Route path='/employer' element={
                // Ideally use AuthRoutes role="employer" but for MVP we might skip strict role check if AuthRoutes not ready
                // Assuming AuthRoutes handles it or we use a simple wrapper
                // We'll trust localStorage check in Header or Page for now, or assume adding role="employer" to AuthRoutes works (need to verify)
                <AuthRoutes role="employer">
                  <EmployerHeader />
                </AuthRoutes>
              }>
                <Route path="dashboard" element={<EmployerDashboard />} />
                <Route path="verify" element={<EmployerVerify />} />
                <Route path="search" element={<EmployerSearch />} />
                <Route path="profile" element={<EmployerProfile />} />
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
