import { useAppSelector } from '../store/hooks.ts';

interface IssuerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const IssuerDetailsModal = ({ isOpen, onClose }: IssuerDetailsModalProps) => {
    const { selectedIssuer } = useAppSelector((state) => state.issuer);

    if (!isOpen || !selectedIssuer) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Issuer Details</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 transition-colors"
                            >
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>

                        {/* Content */}
                        <div className="space-y-6">
                            {/* Logo and Basic Info */}
                            <div className="flex items-center space-x-4">
                                {selectedIssuer.logo_url ? (
                                    <img
                                        src={selectedIssuer.logo_url}
                                        alt={selectedIssuer.name}
                                        className="h-20 w-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                                        <span className="text-gray-600 font-medium text-2xl">
                                            {selectedIssuer.name.charAt(0)}
                                        </span>
                                    </div>
                                )}
                                <div>
                                    <h4 className="text-xl font-semibold text-gray-900">{selectedIssuer.name}</h4>
                                    <p className="text-gray-600">{selectedIssuer.email}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Type</label>
                                    <p className="mt-1 text-sm text-gray-900 capitalize">
                                        {selectedIssuer.type.replace('_', ' ')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Status</label>
                                    <div className="mt-1">
                                        <span
                                            className={`badge ${selectedIssuer.status === 'pending'
                                                ? 'badge-pending'
                                                : selectedIssuer.status === 'approved'
                                                    ? 'badge-approved'
                                                    : 'badge-rejected'
                                                }`}
                                        >
                                            {selectedIssuer.status}
                                        </span>
                                        {selectedIssuer.is_blocked && (
                                            <span className="badge badge-blocked ml-2">Blocked</span>
                                        )}
                                    </div>
                                </div>

                                {selectedIssuer.phone && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">Phone</label>
                                        <p className="mt-1 text-sm text-gray-900">{selectedIssuer.phone}</p>
                                    </div>
                                )}

                                {selectedIssuer.contact_person_name && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500">
                                            Contact Person
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900">
                                            {selectedIssuer.contact_person_name}
                                        </p>
                                    </div>
                                )}

                                {selectedIssuer.website_url && (
                                    <div className="col-span-2">
                                        <label className="block text-sm font-medium text-gray-500">Website</label>
                                        <a
                                            href={selectedIssuer.website_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="mt-1 text-sm text-primary-600 hover:text-primary-700"
                                        >
                                            {selectedIssuer.website_url}
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Created At</label>
                                    <p className="mt-1 text-sm text-gray-900">
                                        {new Date(selectedIssuer.created_at).toLocaleString()}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-500">Issuer ID</label>
                                    <p className="mt-1 text-sm text-gray-900">{selectedIssuer.id}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button onClick={onClose} className="btn-primary w-full sm:w-auto">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default IssuerDetailsModal;
