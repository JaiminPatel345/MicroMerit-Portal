import React, { useState } from 'react';

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spinner = ({ className = '' }) => (
    <svg
        className={`animate-spin ${className}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
    >
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
    </svg>
);

// ── CheckCircle SVG ───────────────────────────────────────────────────────────
const CheckCircleIcon = ({ className = '' }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
);

// ── XCircle SVG ───────────────────────────────────────────────────────────────
const XCircleIcon = ({ className = '' }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
);

// ── Copy button ───────────────────────────────────────────────────────────────
const CopyBtn = ({ text }) => {
    const [copied, setCopied] = useState(false);
    const copy = () => {
        if (!text) return;
        navigator.clipboard.writeText(text).catch(() => {});
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    return (
        <button
            onClick={copy}
            className="ml-1.5 inline-flex items-center p-1 rounded text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Copy"
        >
            {copied
                ? <svg className="h-3 w-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><polyline points="20 6 9 17 4 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                : <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            }
        </button>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
/**
 * CredentialIssuedResult — shared success screen used by both:
 *   - Issuer issuance page (NewIssuance.jsx)
 *   - Learner credential-added page (CredentialAdded.jsx)
 *
 * Props:
 *   credentialId      string   — unique ID shown in UI
 *   certificateTitle  string
 *   learnerEmail      string   (optional, shown for issuer)
 *   issuerName        string   (optional, shown for learner)
 *   issuedAt          string   (optional, ISO date)
 *   claimStatus       string   'claimed' | 'unclaimed' (for issuer view)
 *   blockchainStatus  string   'pending' | 'confirmed' | 'failed'
 *   ipfsStatus        string   'pending' | 'confirmed' | 'failed'
 *   txHash            string
 *   ipfsCid           string
 *   pdfUrl            string
 *   refreshing        bool
 *   onRefresh         fn()     — manual refresh callback
 *   onPrimaryAction   fn()     — bottom primary button callback
 *   primaryActionLabel string  — e.g. "Issue Another" or "Go to Wallet"
 *   onSecondaryAction fn()     (optional)
 *   secondaryActionLabel string(optional)
 *   onDownloadJSON    fn()     (optional) — shows download icon top-right
 *   showClaimStatus   bool     (default false) — show Claimed/Unclaimed pill
 *   title             string   (optional) override success heading
 */
const CredentialIssuedResult = ({
    credentialId,
    certificateTitle,
    learnerEmail,
    issuerName,
    issuedAt,
    claimStatus,
    blockchainStatus = 'pending',
    ipfsStatus = 'pending',
    txHash,
    ipfsCid,
    pdfUrl,
    refreshing = false,
    onRefresh,
    onPrimaryAction,
    primaryActionLabel = 'Done',
    onSecondaryAction,
    secondaryActionLabel,
    onDownloadJSON,
    showClaimStatus = false,
    title,
}) => {
    const allConfirmed = blockchainStatus === 'confirmed' && ipfsStatus === 'confirmed';
    const anyPending   = blockchainStatus === 'pending' || ipfsStatus === 'pending';

    const headingText = title || (allConfirmed
        ? 'Credential Issued Successfully!'
        : 'Credential Being Processed…');

    const subText = allConfirmed
        ? 'The credential has been confirmed on the blockchain and uploaded to IPFS.'
        : 'Blockchain confirmation and IPFS upload are running in the background.';

    return (
        <div className="max-w-4xl mx-auto space-y-8 p-8 border rounded-xl shadow-lg bg-gray-50 relative">
            {/* ── Download JSON icon (top-right) ── */}
            {onDownloadJSON && (
                <button
                    onClick={onDownloadJSON}
                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all group"
                    title="Download JSON"
                >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span className="absolute right-0 top-12 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        Download JSON
                    </span>
                </button>
            )}

            {/* Refreshing top strip */}
            {refreshing && (
                <div className="absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r from-blue-400 via-purple-400 to-blue-400 animate-pulse" />
            )}

            {/* ── Hero ── */}
            <div className="text-center space-y-4 pt-2">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                    <CheckCircleIcon className="h-10 w-10 text-green-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">{headingText}</h3>
                <p className="text-gray-600">{subText}</p>
            </div>

            {/* ── Detail rows ── */}
            <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4 text-sm">

                {/* Credential ID */}
                {credentialId && (
                    <div className="grid grid-cols-3 gap-4 items-start">
                        <span className="font-semibold text-gray-600">Credential ID:</span>
                        <div className="col-span-2 flex items-start gap-1">
                            <span className="font-mono text-gray-800 break-all">{credentialId}</span>
                            <CopyBtn text={credentialId} />
                        </div>
                    </div>
                )}

                {/* Learner Email (issuer view) */}
                {learnerEmail && (
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Learner Email:</span>
                        <span className="col-span-2 text-gray-800">{learnerEmail}</span>
                    </div>
                )}

                {/* Issuer (learner view) */}
                {issuerName && (
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Issuer:</span>
                        <span className="col-span-2 text-gray-800">{issuerName}</span>
                    </div>
                )}

                {/* Certificate Title */}
                {certificateTitle && (
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Certificate Title:</span>
                        <span className="col-span-2 text-gray-800">{certificateTitle}</span>
                    </div>
                )}

                {/* Issued At (learner view) */}
                {issuedAt && (
                    <div className="grid grid-cols-3 gap-4">
                        <span className="font-semibold text-gray-600">Issued:</span>
                        <span className="col-span-2 text-gray-700">
                            {new Date(issuedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                        </span>
                    </div>
                )}

                {/* Claim status pill (issuer view) */}
                {showClaimStatus && (
                    <div className="grid grid-cols-3 gap-4 items-center">
                        <span className="font-semibold text-gray-600">Status:</span>
                        <div className="col-span-2">
                            {claimStatus === 'claimed' ? (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    <CheckCircleIcon className="w-3 h-3 mr-1" /> Claimed
                                </span>
                            ) : (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                                    </svg>
                                    Unclaimed
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Blockchain status row */}
                <div className="grid grid-cols-3 gap-4 items-center">
                    <span className="font-semibold text-gray-600">Blockchain:</span>
                    <div className="col-span-2 flex items-center space-x-2">
                        {blockchainStatus === 'pending' && (
                            <div className="flex items-center space-x-2">
                                <Spinner className="h-4 w-4 text-yellow-600" />
                                <span className="text-yellow-700 font-medium">Confirming on blockchain…</span>
                            </div>
                        )}
                        {blockchainStatus === 'confirmed' && (
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 font-medium">Confirmed on blockchain</span>
                            </div>
                        )}
                        {blockchainStatus === 'failed' && (
                            <div className="flex items-center space-x-2">
                                <XCircleIcon className="h-4 w-4 text-red-600" />
                                <span className="text-red-700 font-medium">Failed</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* IPFS status row */}
                <div className="grid grid-cols-3 gap-4 items-center">
                    <span className="font-semibold text-gray-600">IPFS Upload:</span>
                    <div className="col-span-2 flex items-center space-x-2">
                        {ipfsStatus === 'pending' && (
                            <div className="flex items-center space-x-2">
                                <Spinner className="h-4 w-4 text-yellow-600" />
                                <span className="text-yellow-700 font-medium">
                                    {blockchainStatus === 'pending' ? 'Waiting for blockchain…' : 'Uploading to IPFS…'}
                                </span>
                            </div>
                        )}
                        {ipfsStatus === 'confirmed' && (
                            <div className="flex items-center space-x-2">
                                <CheckCircleIcon className="h-4 w-4 text-green-600" />
                                <span className="text-green-700 font-medium">Uploaded to IPFS</span>
                            </div>
                        )}
                        {ipfsStatus === 'failed' && (
                            <div className="flex items-center space-x-2">
                                <XCircleIcon className="h-4 w-4 text-red-600" />
                                <span className="text-red-700 font-medium">IPFS Upload Failed</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Refresh / auto-poll hint */}
                {anyPending && onRefresh && (
                    <div className="flex items-center justify-between pt-1">
                        <p className="text-xs text-gray-400">Auto-refreshing every 15 s</p>
                        <button
                            onClick={onRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 transition-all disabled:opacity-50"
                        >
                            <svg
                                className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`}
                                fill="none" viewBox="0 0 24 24" stroke="currentColor"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {refreshing ? 'Checking…' : 'Check Now'}
                        </button>
                    </div>
                )}

                {/* Transaction Hash */}
                <div className="grid grid-cols-3 gap-4 items-start">
                    <span className="font-semibold text-gray-600">Transaction Hash:</span>
                    {txHash ? (
                        <div className="col-span-2 flex items-start gap-1">
                            <span className="font-mono text-purple-600 break-all text-xs">{txHash}</span>
                            <CopyBtn text={txHash} />
                        </div>
                    ) : (
                        <span className="col-span-2 text-xs text-gray-500 italic">Pending blockchain confirmation…</span>
                    )}
                </div>

                {/* IPFS CID */}
                <div className="grid grid-cols-3 gap-4 items-start">
                    <span className="font-semibold text-gray-600">IPFS CID:</span>
                    {ipfsStatus === 'confirmed' && ipfsCid ? (
                        <div className="col-span-2 flex items-start gap-1">
                            <span className="font-mono text-blue-600 break-all text-xs">{ipfsCid}</span>
                            <CopyBtn text={ipfsCid} />
                        </div>
                    ) : (
                        <span className="col-span-2 text-xs text-gray-500 italic">
                            {ipfsStatus === 'failed' ? 'Upload failed' : 'Pending upload…'}
                        </span>
                    )}
                </div>
            </div>

            {/* ── Action buttons ── */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {/* View on IPFS */}
                {ipfsStatus === 'confirmed' && pdfUrl ? (
                    <a
                        href={pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        View on IPFS
                    </a>
                ) : (
                    <button
                        disabled
                        className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-200 cursor-not-allowed opacity-60"
                        title="Waiting for IPFS upload"
                    >
                        <Spinner className="w-4 h-4" />
                        View on IPFS
                    </button>
                )}

                {/* View on Blockchain */}
                {blockchainStatus === 'confirmed' && txHash ? (
                    <a
                        href={`https://sepolia.etherscan.io/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors"
                    >
                        View on Blockchain
                    </a>
                ) : (
                    <button
                        disabled
                        className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-gray-400 bg-gray-200 cursor-not-allowed opacity-60"
                        title="Waiting for blockchain confirmation"
                    >
                        <Spinner className="w-4 h-4" />
                        View on Blockchain
                    </button>
                )}

                {/* Secondary action */}
                {onSecondaryAction && (
                    <button
                        onClick={onSecondaryAction}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                    >
                        {secondaryActionLabel || 'Back'}
                    </button>
                )}

                {/* Primary action */}
                {onPrimaryAction && (
                    <button
                        onClick={onPrimaryAction}
                        className="flex-1 inline-flex justify-center items-center px-4 py-2.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                    >
                        {primaryActionLabel}
                    </button>
                )}
            </div>
        </div>
    );
};

export default CredentialIssuedResult;
