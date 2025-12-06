import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { setNotification } from '../utils/notification';

const NotifyAndRedirect = ({ message, to, state }) => {
    useEffect(() => {
        setNotification(message, 'error');
    }, [message]);

    return <Navigate to={to} state={state} replace />;
};

const AuthRoutes = ({ role, children }) => {
    const location = useLocation();

    const { isAuthenticated: isIssuerAuth } = useSelector((state) => state.authIssuer);
    const { isAuthenticated: isLearnerAuth } = useSelector((state) => state.authLearner);
    const { isAuthenticated: isEmployerAuth } = useSelector((state) => state.authEmployer);

    if (role === 'issuer') {
        if (!isIssuerAuth) {
            return <NotifyAndRedirect message="You must be logged in as an issuer to access this page." to="/issuer/login" state={{ from: location }} />;
        }
        return children;
    }

    if (role === 'employer') {
        if (!isEmployerAuth) {
            return <NotifyAndRedirect message="You must be logged in as an employer to access this page." to="/employer/login" state={{ from: location }} />;
        }
        return children;
    }

    if (role === 'learner') {
        if (!isLearnerAuth) {
            return <NotifyAndRedirect message="You must be logged in to access this page." to="/login" state={{ from: location }} />;
        }
        return children;
    }

    return <Navigate to="/" replace />;
};

export default AuthRoutes;
