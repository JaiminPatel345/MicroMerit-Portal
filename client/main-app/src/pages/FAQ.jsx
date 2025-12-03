import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Search, HelpCircle, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const faqs = [
    {
        question: "What is MicroMerit?",
        answer: "MicroMerit is a platform that issues secure digital credentials, verifies them using blockchain-backed methods, and maps educational achievements to NSQF levels using automated AI-driven evaluation."
    },
    {
        question: "How does MicroMerit verify a credential?",
        answer: "Verification happens by checking the cryptographic signature, issuer identity, on-chain proof (if available), and the stored metadata in our verification module. The system validates whether the credential is tampered, revoked, or expired."
    },
    {
        question: "Can employers verify credentials without signing up?",
        answer: "Yes. Employers can upload or submit a credential file/URL on the verification page and instantly see authenticity, issuer details, and NSQF level mapping."
    },
    {
        question: "How does MicroMerit ensure credentials are tamper-proof?",
        answer: "Each credential is hashed, signed by the issuer, and stored with a verifiable proof. Any change in the document invalidates the signature instantly."
    },
    {
        question: "Does the issuer need the learner ID to issue a credential?",
        answer: "No. Issuers only need the learner’s email. The system automatically looks up the learner ID from the database, including checking alternative email fields."
    },
    {
        question: "What happens if the learner does not exist in the system?",
        answer: "The issuer is notified, and the system suggests creating a learner profile before issuing the credential."
    },
    {
        question: "How does NSQF level mapping work?",
        answer: "The platform analyzes the course/certificate metadata, compares it with NSQF descriptors, and assigns an appropriate level using predefined rules and AI-assisted evaluation."
    },
    {
        question: "Can institutions upload bulk credentials?",
        answer: "Yes. Issuers can upload bulk JSON/CSV files. The system processes each record, finds learners automatically, and issues credentials with validation logs."
    },
    {
        question: "What happens if a credential is revoked?",
        answer: "Revoked credentials are marked in the verification system. Anyone verifying them will see a \"Revoked\" status along with the reason."
    },
    {
        question: "Does MicroMerit integrate with DigiLocker?",
        answer: "Yes. The platform supports DigiLocker integration for storing and fetching government-recognized documents. (Sandbox mode available if real partner API keys are not accessible.)"
    },
    {
        question: "Can students store their credentials securely?",
        answer: "All issued credentials appear in the learner dashboard, where they can download, share, or store them in DigiLocker."
    },
    {
        question: "What technologies does MicroMerit use?",
        answer: "A Node.js monolithic backend with module-wise architecture handles issuance, verification, and dashboards. A Python AI service performs NSQF mapping. The app communicates via WebSockets."
    },
    {
        question: "How do I verify whether a credential belongs to a particular candidate?",
        answer: "Enter the credential ID or upload the credential. The system matches it with the original issued record and displays learner details."
    },
    {
        question: "What if someone tries to forge a credential?",
        answer: "Forgery is detected because the document hash, signature, and stored metadata won’t match. The system instantly flags it as invalid."
    },
    {
        question: "How does MicroMerit ensure data privacy?",
        answer: "Only minimal required data is stored. Sensitive fields are hashed or encrypted, and credential verification reveals only non-sensitive public information."
    },
    {
        question: "Why does MicroMerit use IPFS for credential storage?",
        answer: "IPFS provides content-addressed, decentralized storage. Each credential is stored as a hash, ensuring that even if a file is moved or replicated across nodes, its integrity remains verifiable."
    },
    {
        question: "How does IPFS make credentials tamper-proof?",
        answer: "Every file on IPFS is identified by its content hash (CID). If someone alters even a single byte, the CID changes instantly. During verification, MicroMerit recomputes and matches the hash, making tampering detectable."
    },
    {
        question: "Does IPFS store credentials on multiple computers?",
        answer: "Yes. IPFS breaks files into chunks and distributes them across multiple nodes. If one node becomes unavailable, the file can still be retrieved from other nodes that have the same chunks."
    },
    {
        question: "What happens if one of the IPFS nodes storing my credential goes offline?",
        answer: "Nothing breaks. Because IPFS is distributed, the system fetches the chunks from any node that still holds them. As long as at least one node has the file pinned, it remains available."
    },
    {
        question: "Is IPFS more expensive than cloud storage like AWS S3?",
        answer: "IPFS itself is free and decentralized, but you must pin files to ensure persistence. Pinned storage through a pinning service (e.g., Pinata, Web3.Storage) is generally cheaper for long-term archival but not always cheaper for high-throughput applications."
    },
    {
        question: "Why use IPFS instead of a traditional cloud storage service?",
        answer: "Because IPFS provides: Content-based addressing (cryptographic integrity), Decentralized retrieval, Built-in tamper detection, Low replication cost, Permanent URLs via CIDs. For credentials that must remain verifiable for years, these advantages outweigh standard object storage."
    },
    {
        question: "Can someone delete or modify a file stored on IPFS?",
        answer: "No one can modify a file because the hash would change. Deletion depends on pinning—if all nodes unpin the file, it may eventually be garbage collected. MicroMerit prevents this by pinning documents."
    },
    {
        question: "Is my credential public on IPFS?",
        answer: "By design, IPFS is a public network. MicroMerit mitigates this by: Encrypting sensitive metadata before upload, Storing only public credential artifacts, Keeping private fields off-chain and off-IPFS. Verification uses the hash, not the raw private data."
    },
    {
        question: "How does IPFS improve verification speed?",
        answer: "Since IPFS fetches data from any node globally, it can serve files from the nearest available peer. This reduces latency and improves reliability for high-traffic verification scenarios."
    },
    {
        question: "What if the credential file is very large?",
        answer: "IPFS automatically chunks and deduplicates content. Only changed chunks generate new hashes, making updates efficient and reducing storage overhead."
    }
];

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    const toggleFAQ = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const filteredFAQs = faqs.filter(faq =>
        faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            {/* Hero Section */}
            <section className="bg-gradient-to-br from-blue-chill-700 to-blue-chill-900 py-20 md:py-28 text-center text-white relative overflow-hidden">
                {/* Background blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-chill-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                    <div className="absolute top-0 -right-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
                    <div className="absolute -bottom-8 left-20 w-72 h-72 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-6 tracking-tight"
                    >
                        Frequently Asked Questions
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-blue-chill-100 mb-10 max-w-2xl mx-auto"
                    >
                        Everything you need to know about MicroMerit, our secure credentialing, and AI-powered verification.
                    </motion.p>

                    {/* Search Bar */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="relative max-w-lg mx-auto"
                    >
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-11 pr-4 py-4 border-none rounded-full leading-5 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-blue-chill-500/30 shadow-2xl transition-shadow"
                            placeholder="Search for answers (e.g., 'verification', 'NSQF')"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </motion.div>
                </div>
            </section>

            {/* FAQ List */}
            <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-8 relative z-20">
                <div className="space-y-4">
                    {filteredFAQs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 overflow-hidden"
                        >
                            <button
                                onClick={() => toggleFAQ(index)}
                                className="w-full px-6 py-5 text-left flex justify-between items-center focus:outline-none group"
                            >
                                <span className={`text-lg font-semibold transition-colors duration-200 ${activeIndex === index ? 'text-blue-chill-700' : 'text-gray-800 group-hover:text-blue-chill-600'}`}>
                                    {faq.question}
                                </span>
                                <span className={`ml-4 flex-shrink-0 transition-transform duration-300 ${activeIndex === index ? 'rotate-180' : ''}`}>
                                    {activeIndex === index ? (
                                        <ChevronUp className="w-5 h-5 text-blue-chill-600" />
                                    ) : (
                                        <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-blue-chill-500" />
                                    )}
                                </span>
                            </button>
                            <AnimatePresence>
                                {activeIndex === index && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                    >
                                        <div className="px-6 pb-6 text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                            {faq.answer}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}

                    {filteredFAQs.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100"
                        >
                            <HelpCircle className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                            <h3 className="text-lg font-bold text-gray-900 mb-1">No matching questions found</h3>
                            <p className="text-gray-500">Try adjusting your search terms or browsing the full list.</p>
                            <button
                                onClick={() => setSearchTerm('')}
                                className="mt-4 text-blue-chill-600 font-semibold hover:underline"
                            >
                                Clear Search
                            </button>
                        </motion.div>
                    )}
                </div>
            </section>

            {/* Contact Section */}
            <section className="py-16 bg-white border-t border-gray-100">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
                    <p className="text-gray-600 mb-8">Can't find the answer you're looking for? Please chat to our friendly team.</p>
                    <Link
                        to="/contact"
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-full text-white bg-blue-chill-600 hover:bg-blue-chill-700 md:py-4 md:text-lg shadow-lg hover:shadow-xl transition-all"
                    >
                        <MessageCircle className="w-5 h-5 mr-2" />
                        Contact Support
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default FAQ;
