import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { oauthGoogleLogin } from '../services/authServices';
import { learnerLoginSuccess } from '../store/authLearnerSlice';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const code = searchParams.get('code');
        if (!code) {
            navigate('/login');
            return;
        }

        const handleCallback = async () => {
            try {
                const response = await oauthGoogleLogin.callback(code);
                if (response.data.success) {
                    dispatch(learnerLoginSuccess({
                        learner: response.data.data.learner,
                        accessToken: response.data.data.accessToken,
                        refreshToken: response.data.data.refreshToken
                    }));

                    // Check if new user or existing
                    if (response.data.data.isNewUser) {
                        // Maybe redirect to profile builder if needed, or just dashboard
                        // The API returns isNewUser boolean.
                        // If profile is incomplete, maybe profile builder?
                        // For now, let's go to dashboard.
                        navigate('/dashboard');
                    } else {
                        navigate('/dashboard');
                    }
                } else {
                    navigate('/login?error=Google login failed');
                }
            } catch (error) {
                console.error('Google callback error:', error);
                navigate('/login?error=Google login failed');
            }
        };

        handleCallback();
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <h2 className="text-2xl font-semibold text-gray-900">Logging in with Google...</h2>
                <p className="mt-2 text-gray-600">Please wait while we verify your credentials.</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
