import { useState } from 'react';
import { useAppDispatch } from '../store/hooks.ts';
import { unblockIssuer, fetchIssuers } from '../store/issuerSlice.ts';
import type { IssuerProfile } from '../api/issuerAPI.ts';

interface UnblockModalProps {
    isOpen: boolean;
    onClose: () => void;
    issuer: IssuerProfile;
}

const UnblockModal = ({ isOpen, onClose, issuer }: UnblockModalProps) => {
    const dispatch = useAppDispatch();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleUnblock = async () => {
        setLoading(true);
        setError('');

        try {
            await dispatch(unblockIssuer(issuer.id)).unwrap();
            await dispatch(fetchIssuers());
            onClose();
        } catch (err: any) {
            setError(err || 'Failed to unblock issuer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-lg sm:w-full border border-gray-100">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header */}
                        <div className="flex items-center mb-4">
                            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100 sm:mx-0 sm:h-10 sm:w-10">
                                <svg
                                    className="h-6 w-6 text-green-600"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-4">
                                <h3 className="text-lg font-medium text-gray-900">Unblock Issuer</h3>
                                <p className="text-sm text-gray-500">
                                    You are about to unblock <strong>{issuer.name}</strong>
                                </p>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-blue-800 text-sm">
                                This issuer will regain the ability to issue credentials immediately.
                            </p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                <p className="text-red-800 text-sm">{error}</p>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                        <button
                            type="button"
                            onClick={handleUnblock}
                            disabled={loading}
                            className="btn-success w-full sm:w-auto disabled:opacity-50 shadow-sm"
                        >
                            {loading ? 'Unblocking...' : 'Confirm Unblock'}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0 shadow-sm"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UnblockModal;
