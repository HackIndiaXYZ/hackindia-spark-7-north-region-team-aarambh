import React, { useState, useEffect } from 'react';
import SumsubWebSdk from '@sumsub/websdk-react';
import { CheckCircle, ShieldAlert } from 'lucide-react';
import { ethers } from 'ethers';

const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [
    "function registerIdentity(bytes32 _hash) external",
    "function checkVerification(address _user) external view returns (bool)"
];

interface KYCUploadProps {
    walletAddress: string;
}

export default function KYCUpload({ walletAddress }: KYCUploadProps) {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('loading');
    const [errorMessage, setErrorMessage] = useState('');
    const [proofHash, setProofHash] = useState<string | null>(null);

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
        try {
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider((window as any).ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

                if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    console.log("Mock transaction successful. Biometric Hash:", hash);
                } else {
                    const tx = await contract.registerIdentity(hash);
                    await tx.wait();
                }
            } else {
                throw new Error("MetaMask is not installed.");
            }
        } catch (error: any) {
            console.error("Blockchain error:", error);
            // Optionally set error status
        }
    };

    // Called when Sumsub WebSDK gives a message (e.g. status changes)
    const messageHandler = async (type: string, payload: any) => {
        console.log('onMessage', type, payload);
        if (type === 'idCheck.applicantStatus') {
            if (payload.reviewResult?.reviewAnswer === 'GREEN') {
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

                if (hash) {
                   await registerOnChain(hash);
                }
            } else if (payload.reviewResult?.reviewAnswer === 'RED') {
                setStatus('error');
                setErrorMessage('KYC Verification Rejected.');
            }
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

            {status === 'success' && (
                <div className="text-center py-12 animate-in zoom-in-95">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Verification Complete</h3>
                    <p className="text-gray-400 mb-4">Your biometric proof has been securely verified.</p>
                    {proofHash && (
                        <div className="bg-gray-800 p-4 rounded-xl font-mono text-xs text-blue-400 break-all border border-gray-700">
                            Proof Hash: {proofHash}
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
                </div>
            )}
        </div>
    );
}
