import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, FileText, Lock } from 'lucide-react';

const Terms = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center text-gray-600 hover:text-blue-chill-600 mb-8 transition-colors"
                >
                    <ArrowLeft className="w-5 h-5 mr-2" />
                    Back
                </button>

                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    <div className="bg-blue-chill-600 px-8 py-10 text-white">
                        <h1 className="text-3xl font-bold mb-2">Terms of Service & Privacy Policy</h1>
                        <p className="text-blue-chill-100">Last updated: November 2025</p>
                    </div>

                    <div className="p-8 space-y-8">
                        <section>
                            <div className="flex items-center mb-4">
                                <Shield className="w-6 h-6 text-blue-chill-600 mr-3" />
                                <h2 className="text-xl font-bold text-gray-900">1. Data Privacy & Security</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed pl-9">
                                MicroMerit takes your privacy seriously. We collect only the minimum necessary information to provide our credentialing services. Your personal data is encrypted both in transit and at rest. We do not sell your personal data to third parties.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center mb-4">
                                <FileText className="w-6 h-6 text-blue-chill-600 mr-3" />
                                <h2 className="text-xl font-bold text-gray-900">2. Blockchain Storage</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed pl-9">
                                By using MicroMerit, you consent to the storage of cryptographic proofs of your credentials on a public blockchain. This ensures the immutability and verifiability of your achievements. Note that your actual personal data is NOT stored on the blockchain; only a secure hash is recorded.
                            </p>
                        </section>

                        <section>
                            <div className="flex items-center mb-4">
                                <Lock className="w-6 h-6 text-blue-chill-600 mr-3" />
                                <h2 className="text-xl font-bold text-gray-900">3. User Responsibilities</h2>
                            </div>
                            <p className="text-gray-600 leading-relaxed pl-9">
                                You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate and complete information during the registration process. Any fraudulent activity or misrepresentation of credentials may result in account termination.
                            </p>
                        </section>

                        <div className="border-t border-gray-200 pt-8 mt-8">
                            <p className="text-sm text-gray-500 text-center">
                                For any questions regarding these terms, please contact us at support@micromerit.com
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Terms;
