import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { learnerLoginSuccess } from '../../store/authLearnerSlice';

const DigilockerCallback = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [status, setStatus] = useState('Verifying with DigiLocker...');

    useEffect(() => {
        const accessToken = searchParams.get('accessToken');
        const refreshToken = searchParams.get('refreshToken');
        const isNewUser = searchParams.get('isNewUser') === 'true';
        const learnerData = searchParams.get('learner');
        const certificatesCount = searchParams.get('certificatesCount');
        const error = searchParams.get('error');

        console.log('DigilockerCallback - URL params:', {
            hasAccessToken: !!accessToken,
            hasRefreshToken: !!refreshToken,
            isNewUser,
            hasLearnerData: !!learnerData,
            certificatesCount,
            error
        });

        // Check for error
        if (error) {
            console.log('DigilockerCallback - Error from backend:', error);
            navigate(`/login?error=${encodeURIComponent(error)}`);
            return;
        }

        // Check if we have all required data
        if (!accessToken || !refreshToken || !learnerData) {
            console.log('DigilockerCallback - Missing required data, redirecting to login');
            navigate('/login?error=Authentication failed');
            return;
        }

        try {
            const learner = JSON.parse(learnerData);
            console.log('DigilockerCallback - Login successful, dispatching to store');

            dispatch(learnerLoginSuccess({
                learner,
                accessToken,
                refreshToken
            }));

            setStatus('Login successful! Redirecting...');

            // Redirect to dashboard with a small delay or immediately
            // If new user or documents fetched, functionality might differ, but for now Dashboard
            setTimeout(() => {
                navigate('/dashboard', {
                    state: {
                        digilockerLogin: true,
                        certificatesFetched: parseInt(certificatesCount || '0')
                    }
                });
            }, 1000);

        } catch (parseError) {
            console.error('DigilockerCallback - Failed to parse learner data:', parseError);
            navigate('/login?error=Authentication data invalid');
        }
    }, [searchParams, navigate, dispatch]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
                <div className="mb-4">
                    <div className="w-16 h-16 border-4 border-blue-chill-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
                <h2 className="text-2xl font-semibold text-gray-900">{status}</h2>
                <p className="mt-2 text-gray-600">Please wait while we complete the secure login process.</p>
            </div>
        </div>
    );
};

export default DigilockerCallback;
