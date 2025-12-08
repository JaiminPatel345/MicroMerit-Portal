import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import {
    CheckCircle,
    Shield,
    Download,
    Share2,
    ExternalLink,
    Award,
    Cpu,
    ArrowRight,
    FileText,
    Hash,
    Check,
    User,
    Calendar,
    Globe,
    Copy,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { learnerApi } from '../../services/authServices';

const CopyButton = ({ text }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <button
            onClick={handleCopy}
            className="ml-2 inline-flex items-center justify-center p-1 rounded-md text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Copy to clipboard"
        >
            {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
        </button>
    );
};

const PublicCredential = () => {
    const { id } = useParams();
    const [credential, setCredential] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [copySuccess, setCopySuccess] = useState(false);
    const [isBlockchainProofOpen, setIsBlockchainProofOpen] = useState(false);

    useEffect(() => {
        const fetchCredential = async () => {
            try {
                const res = await learnerApi.getPublicCredential(id);
                if (res.data?.success) {
                    setCredential(res.data.data);
                } else {
                    setError("Credential not found");
                }
            } catch (err) {
                console.error(err);
                setError("Failed to load credential details");
            } finally {
                setLoading(false);
            }
        };
        if (id) {
            fetchCredential();
        }
    }, [id]);

    const handleDownloadPDF = async () => {
        if (credential?.pdf_url) {
            try {
                const response = await fetch(credential.pdf_url);
                const blob = await response.blob();

                // Get content type
                const contentType = blob.type.toLowerCase();

                let pdfBlob;
                
                if (contentType.includes('image/')) {
                    // Convert image to PDF
                    console.log('Converting image to PDF...');
                    
                    // Create image element to get dimensions
                    const img = new Image();
                    const imageUrl = URL.createObjectURL(blob);
                    
                    await new Promise((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = reject;
                        img.src = imageUrl;
                    });
                    
                    // Create PDF with jsPDF
                    const pdf = new jsPDF({
                        orientation: img.width > img.height ? 'landscape' : 'portrait',
                        unit: 'px',
                        format: [img.width, img.height]
                    });
                    
                    // Add image to PDF (fill entire page)
                    pdf.addImage(img, 'JPEG', 0, 0, img.width, img.height);
                    
                    // Get PDF as blob
                    pdfBlob = pdf.output('blob');
                    
                    // Clean up
                    URL.revokeObjectURL(imageUrl);
                } else if (contentType.includes('pdf')) {
                    // Already a PDF
                    pdfBlob = blob;
                } else {
                    // Unknown type, try as PDF
                    pdfBlob = blob;
                }

                const blobUrl = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = `${credential.certificate_title}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            } catch (error) {
                console.error('Download failed:', error);
                window.open(credential.pdf_url, '_blank');
            }
        }
    };

    const handleSharePublicLink = async () => {
        const publicLink = window.location.href;
        try {
            await navigator.clipboard.writeText(publicLink);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
            setCopySuccess(true);
            setTimeout(() => setCopySuccess(false), 2000);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    if (error) return <div className="min-h-screen flex items-center justify-center text-red-500">{error}</div>;
    if (!credential) return null;

    return (
        <div className="min-h-screen bg-gray-50 p-6 lg:p-10">
            <div className="max-w-5xl mx-auto">
                {/* Learner Profile Overview (Top Banner) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <img
                            src={credential.learner?.profileUrl || "https://ui-avatars.com/api/?name=" + credential.learner?.name}
                            alt={credential.learner?.name}
                            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">{credential.learner?.name}</h2>
                            <p className="text-sm text-gray-500">Learner Profile</p>
                        </div>
                    </div>
                    <Link
                        to={`/p/${credential.learner?.id}`}
                        className="px-4 py-2 bg-blue-chill-50 text-blue-chill-700 rounded-lg font-medium hover:bg-blue-chill-100 transition-colors flex items-center gap-2"
                    >
                        View Profile <ArrowRight size={16} />
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Certificate Preview & Actions */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white p-2 rounded-xl shadow-sm border border-gray-100">
                            {/* Document Preview (PDF or Image) */}
                            <div className="aspect-[1/1.414] bg-gray-100 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                {credential.pdf_url ? (
                                    (() => {
                                        // Check if URL suggests an image
                                        const url = credential.pdf_url.toLowerCase();
                                        const isImage = url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.webp');
                                        
                                        if (isImage) {
                                            return (
                                                <img 
                                                    src={credential.pdf_url} 
                                                    alt="Certificate Preview"
                                                    className="w-full h-full object-contain"
                                                />
                                            );
                                        } else {
                                            return (
                                                <iframe
                                                    src={`${credential.pdf_url}#view=FitH&toolbar=0&navpanes=0&scrollbar=0`}
                                                    className="w-full h-full border-0"
                                                    title="Certificate Preview"
                                                />
                                            );
                                        }
                                    })()
                                ) : (
                                    <div className="text-center p-6">
                                        <FileText size={48} className="text-gray-300 mx-auto mb-2" />
                                        <p className="text-gray-400 text-sm">Preview Unavailable</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleDownloadPDF}
                                className="w-full py-2.5 bg-blue-chill-600 text-white rounded-lg font-medium hover:bg-blue-chill-700 transition-colors flex items-center justify-center gap-2"
                            >
                                <Download size={18} /> Download PDF
                            </button>
                            <button
                                onClick={handleSharePublicLink}
                                className="w-full py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                {copySuccess ? (
                                    <>
                                        <Check size={18} className="text-green-600" /> Link Copied!
                                    </>
                                ) : (
                                    <>
                                        <Share2 size={18} /> Share Public Link
                                    </>
                                )}
                            </button>
                        </div>

                        {/* Trust Score */}
                        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                <Shield className="text-green-600" size={16} /> Trust Score
                            </h3>
                            <div className="flex items-end gap-2 mb-2">
                                <span className="text-3xl font-bold text-gray-900">98</span>
                                <span className="text-sm text-gray-500 mb-1">/ 100</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-green-500 h-full rounded-full" style={{ width: '98%' }}></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                Issuer <strong>{credential.issuer?.name}</strong> is highly trusted.
                            </p>
                        </div>


                    </div>

                    {/* Right Column: Details & AI Insights */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Header Info */}
                        <div>
                            <div className="flex items-start justify-between">
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{credential.certificate_title}</h1>
                                    <div className="flex flex-col gap-1 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <span className="text-sm">Issued to</span>
                                            <Link to={`/p/${credential.learner?.id}`} className="font-semibold text-gray-900 hover:text-blue-chill-600 hover:underline">
                                                {credential.learner?.name}
                                            </Link>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Link to={`/i/${credential.issuer?.id}`} className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-sm font-medium hover:bg-blue-100 transition-colors">
                                                {credential.issuer?.name}
                                            </Link>
                                            <span className="text-gray-300">•</span>
                                            <span className="text-sm">Issued {new Date(credential.issued_at).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 border border-green-100">
                                    <CheckCircle size={16} /> Verified
                                </div>
                            </div>
                        </div>

                        {/* Blockchain Proof */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <button
                                onClick={() => setIsBlockchainProofOpen(!isBlockchainProofOpen)}
                                className="w-full flex items-center justify-between p-6 bg-white hover:bg-gray-50 transition-colors"
                            >
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Shield size={18} className="text-purple-500" /> Proof of Authenticity
                                </h3>
                                {isBlockchainProofOpen ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                            </button>

                            {isBlockchainProofOpen && (
                                <div className="px-6 pb-6 space-y-4 border-t border-gray-100 pt-4">
                                    <div className="space-y-3">
                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg text-sm">
                                            <span className="text-gray-500 mb-1 sm:mb-0">Credential ID</span>
                                            <div className="flex items-center gap-2 max-w-full">
                                                <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 truncate max-w-[200px] sm:max-w-xs">
                                                    {credential.credential_id}
                                                </code>
                                                <CopyButton text={credential.credential_id} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg text-sm">
                                            <span className="text-gray-500 mb-1 sm:mb-0">Transaction Hash</span>
                                            <div className="flex items-center gap-2 max-w-full">
                                                <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 truncate max-w-[200px] sm:max-w-xs">
                                                    {credential.tx_hash || 'Pending...'}
                                                </code>
                                                <CopyButton text={credential.tx_hash} />
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg text-sm">
                                            <span className="text-gray-500 mb-1 sm:mb-0">IPFS CID</span>
                                            <div className="flex items-center gap-2 max-w-full">
                                                <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 truncate max-w-[200px] sm:max-w-xs">
                                                    {credential.ipfs_cid || 'N/A'}
                                                </code>
                                                {credential.ipfs_cid && <CopyButton text={credential.ipfs_cid} />}
                                            </div>
                                        </div>

                                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg text-sm">
                                            <span className="text-gray-500 mb-1 sm:mb-0">Data Hash</span>
                                            <div className="flex items-center gap-2 max-w-full">
                                                <code className="bg-white px-2 py-1 rounded border border-gray-200 text-xs font-mono text-gray-600 truncate max-w-[200px] sm:max-w-xs">
                                                    {credential.data_hash}
                                                </code>
                                                <CopyButton text={credential.data_hash} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        {credential.tx_hash && (
                                            <a
                                                href={`https://sepolia.etherscan.io/tx/${credential.tx_hash}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                <Globe size={16} className="mr-2 text-gray-500" />
                                                View on Blockchain
                                            </a>
                                        )}
                                        {credential.ipfs_cid && (
                                            <a
                                                href={`https://ipfs.io/ipfs/${credential.ipfs_cid}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                                            >
                                                <Hash size={16} className="mr-2 text-gray-500" />
                                                View on IPFS
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Skills & NSQF */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <Award size={18} className="text-orange-500" /> Skills & Standards
                            </h3>

                            {credential.metadata?.ai_extracted ? (
                                <>
                                    <div className="mb-6">
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">NSQF Mapping</h4>
                                        <div className="flex items-center gap-3">
                                            {(() => {
                                                const aiData = credential.metadata.ai_extracted;
                                                const alignment = aiData.nsqf_alignment;
                                                const rawNsqf = aiData.nsqf;

                                                if (alignment?.verified_by_issuer) {
                                                    if (alignment.aligned || alignment.verification_status === 'approved') {
                                                        return (
                                                            <>
                                                                <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-100">
                                                                    Level {alignment.nsqf_level || 'N/A'}
                                                                </span>
                                                                <span className="text-sm text-gray-500">
                                                                    {alignment.reasoning || 'Verified by Issuer'}
                                                                </span>
                                                            </>
                                                        );
                                                    } else {
                                                        return (
                                                            <span className="px-3 py-1.5 bg-gray-100 text-gray-600 text-sm font-medium rounded-lg border border-gray-200">
                                                                Not Aligned to NSQF
                                                            </span>
                                                        );
                                                    }
                                                }

                                                return (
                                                    <>
                                                        <span className="px-3 py-1.5 bg-purple-50 text-purple-700 text-sm font-medium rounded-lg border border-purple-100">
                                                            Level {rawNsqf?.level || 'N/A'}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {rawNsqf?.reasoning || 'AI Suggested Mapping'}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-700 mb-2">Verified Skills</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {credential.metadata.ai_extracted.skills?.length > 0 ? (
                                                credential.metadata.ai_extracted.skills.map((skill, index) => (
                                                    <span key={index} className="px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg flex items-center gap-2">
                                                        {skill.name}
                                                        {skill.proficiency_level && (
                                                            <span className="text-xs text-gray-500 bg-white px-1.5 py-0.5 rounded border border-gray-200">
                                                                {skill.proficiency_level}
                                                            </span>
                                                        )}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-sm text-gray-500 italic">No specific skills extracted.</span>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center py-8">
                                    <p className="text-gray-500 text-sm">AI analysis in progress or unavailable.</p>
                                </div>
                            )}
                        </div>

                        {/* AI Insights */}
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-xl shadow-lg text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-6 opacity-10">
                                <Cpu size={120} />
                            </div>

                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 relative z-10">
                                <Cpu size={20} className="text-blue-400" /> AI Career Insights
                            </h3>

                            <div className="space-y-6 relative z-10">
                                <p className="text-gray-300 text-sm">
                                    {credential.metadata?.ai_extracted?.description ? (
                                        <>
                                            <strong>Analysis:</strong> {credential.metadata.ai_extracted.description}
                                        </>
                                    ) : (
                                        <>
                                            This credential proves your competency in <strong>{credential.certificate_title}</strong>.
                                        </>
                                    )}
                                </p>

                                {/* Job Recommendations */}
                                {(credential.metadata?.job_recommendations || credential.metadata?.ai_extracted?.job_recommendations)?.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-bold text-blue-300 mb-3 uppercase tracking-wider">Recommended Roles</h4>
                                        <div className="space-y-3">
                                            {(credential.metadata?.job_recommendations || credential.metadata?.ai_extracted?.job_recommendations).map((job, idx) => (
                                                <div key={idx} className="bg-white/10 p-3 rounded-lg border border-white/10">
                                                    <div className="flex justify-between items-start">
                                                        <h5 className="font-bold text-sm text-white">{job.role}</h5>
                                                        <span className="text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                                                            {job.match_percentage}%
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1">{job.reasoning}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* NOS Data */}
                                {(credential.metadata?.nos_data || credential.metadata?.ai_extracted?.nos_data) && (
                                    <div>
                                        <h4 className="text-sm font-bold text-purple-300 mb-2 uppercase tracking-wider">NOS Alignment</h4>
                                        <div className="bg-white/5 p-3 rounded-lg border border-white/5 text-sm text-gray-300">
                                            <p><strong>QP Code:</strong> {(credential.metadata?.nos_data || credential.metadata?.ai_extracted?.nos_data).qp_code}</p>
                                            <p><strong>NOS Code:</strong> {(credential.metadata?.nos_data || credential.metadata?.ai_extracted?.nos_data).nos_code}</p>
                                            <p className="mt-1 text-xs text-gray-400">{(credential.metadata?.nos_data || credential.metadata?.ai_extracted?.nos_data).description}</p>
                                        </div>
                                    </div>
                                )}

                                <Link
                                    to="/roadmap"
                                    state={{
                                        skills: credential.metadata?.ai_extracted?.skills || [],
                                        title: credential.certificate_title
                                    }}
                                    className="block bg-white/10 backdrop-blur-sm p-4 rounded-lg border border-white/10 hover:bg-white/20 transition-colors cursor-pointer group"
                                >
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className="font-bold text-blue-300 group-hover:text-blue-200">
                                                View Career Pathways
                                            </h4>
                                            <p className="text-xs text-gray-400 mt-1">
                                                Explore opportunities based on your skills
                                            </p>
                                        </div>
                                        <ArrowRight size={18} className="text-gray-400 group-hover:text-white" />
                                    </div>
                                </Link>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicCredential;
