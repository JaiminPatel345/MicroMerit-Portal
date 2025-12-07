import { useAppSelector } from '../store/hooks.ts';
import { formatDate } from '../utils/dateUtils';

interface EmployerDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const EmployerDetailsModal = ({ isOpen, onClose }: EmployerDetailsModalProps) => {
    const { selectedEmployer } = useAppSelector((state) => state.employer);

    if (!isOpen || !selectedEmployer) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                {/* Background overlay */}
                <div
                    className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75 backdrop-blur-sm"
                    onClick={onClose}
                ></div>

                {/* Modal panel */}
                <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-2xl transform transition-all sm:max-w-2xl sm:w-full border border-gray-100">
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Employer Details</h3>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-500 transition-colors p-1 rounded-full hover:bg-gray-100"
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
                            {/* Basic Info */}
                            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                                <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                                    <span className="text-blue-700 font-bold text-2xl">
                                        {selectedEmployer.company_name.charAt(0)}
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-xl font-bold text-gray-900">{selectedEmployer.company_name}</h4>
                                    <p className="text-gray-600">{selectedEmployer.email}</p>
                                </div>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={`badge ${selectedEmployer.status === 'pending'
                                                ? 'badge-pending'
                                                : selectedEmployer.status === 'approved'
                                                    ? 'badge-approved'
                                                    : 'badge-rejected'
                                                }`}
                                        >
                                            {selectedEmployer.status}
                                        </span>
                                    </div>
                                </div>

                                {selectedEmployer.phone && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Phone</label>
                                        <p className="text-sm text-gray-900">{selectedEmployer.phone}</p>
                                    </div>
                                )}

                                {selectedEmployer.contact_person && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Contact Person</label>
                                        <p className="text-sm text-gray-900">{selectedEmployer.contact_person}</p>
                                    </div>
                                )}

                                {selectedEmployer.industry_type && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Industry</label>
                                        <p className="text-sm text-gray-900">{selectedEmployer.industry_type}</p>
                                    </div>
                                )}

                                {selectedEmployer.company_size && (
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Company Size</label>
                                        <p className="text-sm text-gray-900">{selectedEmployer.company_size}</p>
                                    </div>
                                )}

                                {selectedEmployer.company_website && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Website</label>
                                        <a
                                            href={selectedEmployer.company_website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                                        >
                                            {selectedEmployer.company_website}
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                )}

                                {selectedEmployer.company_address && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Address</label>
                                        <p className="text-sm text-gray-900 whitespace-pre-wrap">{selectedEmployer.company_address}</p>
                                    </div>
                                )}

                                {selectedEmployer.company_doc_url && (
                                    <div className="col-span-2">
                                        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Registration Document</label>
                                        <a
                                            href={selectedEmployer.company_doc_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
                                        >
                                            View Document
                                            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                            </svg>
                                        </a>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Created At</label>
                                    <p className="text-sm text-gray-900">
                                        {formatDate(selectedEmployer.created_at)}
                                    </p>
                                </div>

                                {selectedEmployer.rejected_reason && (
                                    <div className="col-span-2 bg-red-50 p-3 rounded-lg border border-red-100">
                                        <label className="block text-xs font-semibold text-red-800 uppercase tracking-wider mb-1">Rejection Reason</label>
                                        <p className="text-sm text-red-700">
                                            {selectedEmployer.rejected_reason}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                        <button onClick={onClose} className="btn-primary w-full sm:w-auto shadow-sm">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmployerDetailsModal;
