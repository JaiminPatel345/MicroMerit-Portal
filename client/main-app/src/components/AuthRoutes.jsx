import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

const AuthRoutes = ({ role, children }) => {
    const location = useLocation();

    const { isAuthenticated: isIssuerAuth } = useSelector((state) => state.authIssuer);
    const { isAuthenticated: isLearnerAuth } = useSelector((state) => state.authLearner);

    if (role === 'issuer') {
        if (!isIssuerAuth) {
            return <Navigate to="/issuer/login" state={{ from: location }} replace />;
        }
        // If learner tries to access issuer routes, redirect to learner dashboard? 
        // Or just let them be if they are also an issuer? 
        // Requirement says "issuer can't go in to learner and vice - versa"
        // Ideally if logged in as issuer, we stay in issuer land.
        return children;
    }

    if (role === 'learner') {
        if (!isLearnerAuth) {
            return <Navigate to="/login" state={{ from: location }} replace />;
        }
        return children;
    }

    return <Navigate to="/" replace />;
};

export default AuthRoutes;
