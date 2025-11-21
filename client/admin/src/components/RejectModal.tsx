import { useState } from 'react';
import { useAppDispatch } from '../store/hooks.ts';
import { rejectIssuer, fetchIssuers } from '../store/issuerSlice.ts';
import type { IssuerProfile } from '../api/issuerAPI.ts';

interface RejectModalProps {
    isOpen: boolean;
    onClose: () => void;
    issuer: IssuerProfile;
}

const RejectModal = ({ isOpen, onClose, issuer }: RejectModalProps) => {
    const dispatch = useAppDispatch();
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!reason.trim()) {
            setError('Reason is required');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await dispatch(rejectIssuer({ id: issuer.id, payload: { reason } })).unwrap();
            await dispatch(fetchIssuers());
            setReason('');
            onClose();
        } catch (err: any) {
            setError(err || 'Failed to reject issuer');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                    <form onSubmit={handleSubmit}>
                        <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                            {/* Header */}
                            <div className="flex items-center mb-4">
                                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <svg
                                        className="h-6 w-6 text-red-600"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </div>
                                <div className="ml-4">
                                    <h3 className="text-lg font-medium text-gray-900">Reject Issuer</h3>
                                    <p className="text-sm text-gray-500">
                                        You are about to reject <strong>{issuer.name}</strong>
                                    </p>
                                </div>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <p className="text-red-800 text-sm">{error}</p>
                                </div>
                            )}

                            {/* Reason Input */}
                            <div>
                                <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
                                    Reason for Rejection <span className="text-red-500">*</span>
                                </label>
                                <textarea
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    rows={4}
                                    maxLength={500}
                                    className="input-field resize-none"
                                    placeholder="Please provide a detailed reason for rejection..."
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">
                                    {reason.length}/500 characters
                                </p>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-danger w-full sm:w-auto disabled:opacity-50"
                            >
                                {loading ? 'Rejecting...' : 'Reject Issuer'}
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="btn-secondary w-full sm:w-auto mt-3 sm:mt-0"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RejectModal;
