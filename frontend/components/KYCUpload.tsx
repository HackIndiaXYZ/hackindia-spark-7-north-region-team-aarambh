import React, { useState, useEffect } from 'react';
import SumsubWebSdk from '@sumsub/websdk-react';
import { CheckCircle, ShieldAlert, Database, Link as LinkIcon } from 'lucide-react';
import { IDKitWidget, VerificationLevel } from '@worldcoin/idkit';

interface KYCUploadProps {
    walletAddress: string;
}

export default function KYCUpload({ walletAddress }: KYCUploadProps) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [proofHash, setProofHash] = useState<string | null>(null);
    const [worldIdStatus, setWorldIdStatus] = useState<'idle' | 'success'>('idle');
    const [blockchainStatus, setBlockchainStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
    const [txData, setTxData] = useState<{hash: string, block: number, network: string} | null>(null);

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/kyc/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ walletAddress })
                });
                const data = await res.json();
                if (!res.ok) {
                    const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Failed to fetch token';
                    throw new Error(errorMsg);
                }
                setAccessToken(data.token);
                setStatus('idle');
            } catch (err: any) {
                setStatus('error');
                setErrorMessage(err.message);
            }
        };

        if (walletAddress) {
            fetchToken();
        }
    }, [walletAddress]);

    const registerOnChain = async (hash: string) => {
        setBlockchainStatus('saving');
        try {
            const backendUrl = process.env.NEXT_PUBLIC_BLOCKCHAIN_URL || 'http://localhost:3002';
            const res = await fetch(`${backendUrl}/api/save-proof`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, proofHash: hash })
            });
            const data = await res.json();
            
            if (!res.ok) {
                throw new Error(data.error || 'Failed to relay to blockchain');
            }

            setTxData({
                hash: data.txHash,
                block: data.block,
                network: data.network
            });
            setBlockchainStatus('success');
        } catch (error: any) {
            console.error("Blockchain error:", error);
            setErrorMessage(error.message || "Failed to save to blockchain");
            setBlockchainStatus('error');
            setStatus('error');
        }
    };

    // Called when Sumsub WebSDK gives a message (e.g. status changes)
    const messageHandler = async (type: string, payload: any) => {
        console.log('onMessage', type, payload);
        if (type === 'idCheck.onApplicantSubmitted' || (type === 'idCheck.applicantStatus' && payload.reviewResult?.reviewAnswer === 'GREEN')) {
            setStatus('success');
                // The webhook would have been called on the backend.
                // We should poll the backend to get the generated proofHash, or simulate it.
                // For demonstration, let's fetch it from /api/verify
                let hash = null;
                for (let i = 0; i < 5; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const res = await fetch(`http://localhost:3001/api/verify/${walletAddress}`);
                    const data = await res.json();
                    if (data.isVerified && data.proofHash) {
                        hash = data.proofHash;
                        setProofHash(hash);
                        break;
                    }
                }
                
                // Fallback for local testing (since Sumsub cannot hit localhost webhooks)
                if (!hash) {
                    console.warn("Webhook didn't fire (likely local testing). Using mock proof hash.");
                    hash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
                    setProofHash(hash);
                }
            } else if (type === 'idCheck.applicantStatus' && payload.reviewResult?.reviewAnswer === 'RED') {
                setStatus('error');
                setErrorMessage('KYC Verification Rejected.');
            }
    };

    const errorHandler = (error: any) => {
        console.error('onError', error);
        setStatus('error');
        setErrorMessage('Sumsub SDK Error.');
    };

    return (
        <div className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl min-h-[500px] flex flex-col justify-center">
            {status === 'loading' && (
                 <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-gray-400">Initializing Secure Session...</p>
                 </div>
            )}

            {status === 'success' && worldIdStatus === 'idle' && (
                <div className="text-center py-12 animate-in zoom-in-95">
                    <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Step 1 Complete</h3>
                    <p className="text-gray-400 mb-6">Identity verified via Sumsub. Now, proceed with Device Verification via World ID.</p>
                    
                    <IDKitWidget
                        app_id={(process.env.NEXT_PUBLIC_WLD_APP_ID || "app_staging_df61b0c0bc135b91bdf1a88b209d7cf7") as `app_${string}`}
                        action="verify-device"
                        onSuccess={() => {
                            setWorldIdStatus('success');
                        }}
                        onError={(error) => {
                            console.error("World ID Verification failed:", error);
                            setErrorMessage(`World ID Error: Please check your App ID and Action in the Developer Portal.`);
                            setStatus('error');
                        }}
                        handleVerify={async (proof) => {
                            return;
                        }}
                        verification_level={VerificationLevel.Device}
                    >
                        {({ open }) => (
                            <button 
                                onClick={open}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                            >
                                Verify with World ID
                            </button>
                        )}
                    </IDKitWidget>
                </div>
            )}

            {status === 'success' && worldIdStatus === 'success' && (
                <div className="text-center py-12 animate-in zoom-in-95 flex flex-col items-center w-full">
                    {blockchainStatus === 'idle' && (
                        <>
                            <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                            <h3 className="text-2xl font-bold text-white mb-2">All Verifications Complete</h3>
                            <p className="text-gray-400 mb-4">Your identity and device have been securely verified.</p>
                            {proofHash && (
                                <div className="bg-gray-800 p-4 rounded-xl font-mono text-xs text-blue-400 break-all border border-gray-700 w-full mb-6">
                                    Proof Hash: {proofHash}
                                </div>
                            )}
                            <button 
                                onClick={() => proofHash && registerOnChain(proofHash)}
                                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-purple-500/30 transition-all transform hover:scale-105 flex items-center gap-2"
                            >
                                <Database className="w-5 h-5" />
                                Save Proof in Blockchain (Free)
                            </button>
                        </>
                    )}

                    {blockchainStatus === 'saving' && (
                        <div className="flex flex-col items-center justify-center py-8">
                            <div className="w-16 h-16 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-6"></div>
                            <h3 className="text-xl font-bold text-white mb-2">Securing Data on Chain</h3>
                            <p className="text-gray-400">Minting gasless transaction to the blockchain...</p>
                        </div>
                    )}

                    {blockchainStatus === 'success' && txData && (
                        <div className="w-full bg-gray-800/80 border border-gray-700 rounded-2xl p-6 shadow-xl animate-in fade-in slide-in-from-bottom-4">
                            <div className="flex items-center justify-center mb-6">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center">
                                    <CheckCircle className="w-8 h-8 text-green-500" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Data Secured Successfully</h3>
                            <p className="text-gray-400 mb-6">Your zero-knowledge identity proof is now immutable.</p>
                            
                            <div className="bg-gray-900 rounded-xl p-4 space-y-3 text-left">
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 text-sm">Network</span>
                                    <span className="text-blue-400 font-medium text-sm flex items-center gap-1">
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                        {txData.network}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 text-sm">Status</span>
                                    <span className="text-green-400 text-sm font-semibold">Confirmed</span>
                                </div>
                                <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                    <span className="text-gray-500 text-sm">Block</span>
                                    <span className="text-gray-300 text-sm font-mono">{txData.block}</span>
                                </div>
                                <div className="flex flex-col gap-1 pt-1">
                                    <span className="text-gray-500 text-sm">Transaction Hash</span>
                                    <a 
                                        href={`https://sepolia.etherscan.io/tx/${txData.hash}`} 
                                        target="_blank" 
                                        rel="noreferrer"
                                        className="text-blue-500 hover:text-blue-400 text-xs font-mono break-all flex items-center gap-1"
                                    >
                                        {txData.hash}
                                        <LinkIcon className="w-3 h-3" />
                                    </a>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {status === 'error' && (
                <div className="mt-4 p-6 bg-red-900/20 border border-red-500/30 rounded-xl text-center">
                    <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">Verification Error</h3>
                    <p className="text-red-400 text-sm">{errorMessage}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-white transition-colors"
                    >
                        Try Again
                    </button>
                    <div className="mt-4 text-center">
                        <button 
                            onClick={() => {
                                setStatus('success');
                                setBlockchainStatus('idle');
                                if (!proofHash) {
                                    setProofHash("0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
                                }
                            }}
                            className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                        >
                            [Hackathon Dev Mode] Bypass Sumsub Error & Proceed to World ID
                        </button>
                    </div>
                </div>
            )}

            {status === 'idle' && accessToken && (
                <div className="animate-in fade-in h-full w-full">
                    <SumsubWebSdk
                        accessToken={accessToken}
                        expirationHandler={async () => accessToken} // Normally you'd fetch a new token here
                        config={{
                            lang: 'en',
                            theme: 'dark' // Matches our UI!
                        }}
                        options={{ addViewportTag: false, adaptIframeHeight: true }}
                        onMessage={messageHandler}
                        onError={errorHandler}
                    />
                    <div className="mt-6 text-center">
                        <button 
                            onClick={() => {
                                console.log("Manually skipping to Step 2");
                                setStatus('success');
                                if (!proofHash) {
                                    setProofHash("0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
                                }
                            }}
                            className="text-xs text-gray-500 hover:text-gray-300 underline transition-colors"
                        >
                            [Dev Mode] Skip Sumsub & Proceed to World ID
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
