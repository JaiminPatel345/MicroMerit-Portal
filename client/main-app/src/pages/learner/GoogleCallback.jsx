import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { oauthGoogleLogin } from '../../services/authServices';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const code = searchParams.get('code');
        console.log('GoogleCallback - URL code:', code);
        console.log('GoogleCallback - All search params:', Object.fromEntries(searchParams));

        if (!code) {
            console.log('GoogleCallback - No code found, redirecting to login');
            navigate('/login');
            return;
        }

        const handleCallback = async () => {
            try {
                console.log('GoogleCallback - Calling backend with code:', code);
                const response = await oauthGoogleLogin.callback(code);
                console.log('GoogleCallback - Backend response:', response);

                if (response.data.success) {
                    console.log('GoogleCallback - Login successful, dispatching to store');
                    dispatch(learnerLoginSuccess({
                        learner: response.data.data.learner,
                        accessToken: response.data.data.accessToken,
                        refreshToken: response.data.data.refreshToken
                    }));

                    // Check if new user or existing
                    if (response.data.data.isNewUser) {
                        console.log('GoogleCallback - New user, redirecting to dashboard');
                        navigate('/dashboard');
                    } else {
                        console.log('GoogleCallback - Existing user, redirecting to dashboard');
                        navigate('/dashboard');
                    }
                } else {
                    console.log('GoogleCallback - Response not successful:', response);
                    navigate('/login?error=Google login failed');
                }
            } catch (error) {
                console.error('Google callback error:', error);
                console.error('Error response:', error?.response);
                console.error('Error data:', error?.response?.data);
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
