import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import VerifyOTP from './pages/VerifyOTP';
import ProfileBuilder from './pages/ProfileBuilder';
import Login from './pages/Login';
import Signup from './pages/Signup';
import OTPVerification from './pages/OTPVerification';
import { useLocation } from 'react-router-dom';
import IssuerSignUp from './pages/issuer/Signup';
import IssuerLogin from './pages/issuer/Login';
const HideHeaderRoutes = ["/login", "/signup", "/verify-otp", "/otp-verification", "/profile-builder", "/issuer/login", "/issuer/signup"];


function Layout() {

  const location = useLocation();
  const hideHeader = HideHeaderRoutes.includes(location.pathname);

  return (
      <div className="flex flex-col min-h-screen">
         {!hideHeader && <Header />}
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/otp-verification" element={<OTPVerification />} />
            <Route path="/profile-builder" element={<ProfileBuilder />} />
            <Route path="/verify-otp" element={<VerifyOTP />} />
            <Route path='/issuer/signup' element={ <IssuerSignUp  />} />
            <Route path='/issuer/login' element={ <IssuerLogin  />} />
          </Routes>
        </main>
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
