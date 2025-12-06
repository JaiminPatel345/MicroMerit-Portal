import { useSelector, useDispatch } from 'react-redux';
import LearnerHeader from './pages/learner/LearnerHeader';
// import IssuerHeader from './pages/issuer/IssuerHeader';
import Header from './components/MainHeader';

const AppHeader = () => {
  const authLearner = useSelector(state => state.authLearner);
  const authIssuer = useSelector(state => state.authIssuer);
  const authEmployer = useSelector(state => state.authEmployer);


  if (authLearner?.isAuthenticated) {
    return <LearnerHeader />;
  }

  if (authIssuer?.isAuthenticated) {
    return;
  }

  if (authEmployer?.isAuthenticated) {
    return;
  }

  // Default header for unauthenticated users
  return <Header />;
};

export default AppHeader;
