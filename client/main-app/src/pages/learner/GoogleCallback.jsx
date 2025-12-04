import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';

const GoogleCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const learnerData = searchParams.get('learner');
        const error = searchParams.get('error');

        console.log('GoogleCallback - URL params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            isNewUser,
            hasLearnerData: !!learnerData,
            error
        });

        // Check for error
        if (error) {
            console.log('GoogleCallback - Error from backend:', error);
            navigate(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        // Check if we have all required data
        if (!accessToken || !refreshToken || !learnerData) {
            console.log('GoogleCallback - Missing required data, redirecting to login');
            navigate('/login?error=Authentication failed');
            return;
        }

        try {
            const learner = JSON.parse(learnerData);
            console.log('GoogleCallback - Login successful, dispatching to store');

            dispatch(learnerLoginSuccess({
                learner,
                accessToken,
                refreshToken
            }));

            // Redirect to dashboard
            console.log('GoogleCallback - Redirecting to dashboard');
            navigate('/dashboard');
        } catch (parseError) {
            console.error('GoogleCallback - Failed to parse learner data:', parseError);
            navigate('/login?error=Authentication data invalid');
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="mb-4">
                    <div className="w-16 h-16 border-4 border-blue-chill-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">Logging in with Google...</h2>
                <p className="mt-2 text-gray-600">Please wait while we verify your credentials.</p>
            </div>
        </div>
    );
};

export default GoogleCallback;
