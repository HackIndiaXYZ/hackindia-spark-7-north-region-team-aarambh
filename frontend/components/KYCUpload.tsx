import React, { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import { ethers } from 'ethers';
import { Camera, Upload, CheckCircle, ShieldAlert } from 'lucide-react';

// Use a zero address as placeholder to avoid ethers.js INVALID_ARGUMENT ENS resolution errors
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [
    "function registerIdentity(bytes32 _hash) external",
    "function checkVerification(address _user) external view returns (bool)"
];

interface KYCUploadProps {
    walletAddress: string;
}

export default function KYCUpload({ walletAddress }: KYCUploadProps) {
    const [step, setStep] = useState(1);
    const [idImage, setIdImage] = useState<File | null>(null);
    const [idImagePreview, setIdImagePreview] = useState<string | null>(null);
    const [selfie, setSelfie] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const webcamRef = useRef<Webcam>(null);

    const handleIdUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIdImage(file);
            setIdImagePreview(URL.createObjectURL(file));
        }
    };

    const captureSelfie = useCallback(() => {
        if (webcamRef.current) {
            const imageSrc = webcamRef.current.getScreenshot();
            setSelfie(imageSrc);
        }
    }, [webcamRef]);

    const dataURLtoFile = (dataurl: string, filename: string) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)![1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, { type: mime });
    };

    const submitKYC = async () => {
        if (!idImage || !selfie || !walletAddress) return;
        
        setIsProcessing(true);
        setStatus('idle');

        try {
            const formData = new FormData();
            formData.append('walletAddress', walletAddress);
            formData.append('idImage', idImage);
            formData.append('selfie', dataURLtoFile(selfie, 'selfie.jpg'));

            // 1. Send to Backend
            const response = await fetch('http://localhost:3001/api/kyc/verify', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            const biometricHash = data.biometricHash;

            // 2. Interact with Smart Contract
            if (typeof window.ethereum !== 'undefined') {
                const provider = new ethers.providers.Web3Provider((window as any).ethereum);
                const signer = provider.getSigner();
                const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

                if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
                    // Simulate a network transaction delay for demo purposes
                    await new Promise(resolve => setTimeout(resolve, 2000));
                    console.log("Mock transaction successful. Biometric Hash:", biometricHash);
                } else {
                    // Prompt user to sign actual blockchain transaction
                    const tx = await contract.registerIdentity(biometricHash);
                    await tx.wait(); // Wait for confirmation
                }

                setStatus('success');
            } else {
                throw new Error("MetaMask is not installed.");
            }

        } catch (error: any) {
            console.error("KYC Error:", error);
            setStatus('error');
            setErrorMessage(error.message || "An unknown error occurred.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <h2 className="text-3xl font-bold text-white mb-8 text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-600">
                Identity Verification
            </h2>

            {status === 'success' ? (
                <div className="text-center py-12">
                    <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-white mb-2">Verification Complete</h3>
                    <p className="text-gray-400">Your biometric proof has been securely stored on-chain.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {/* Step Indicators */}
                    <div className="flex justify-center items-center space-x-4 mb-8">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>1</div>
                        <div className={`h-1 w-16 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-800'}`}></div>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-500'}`}>2</div>
                    </div>

                    {/* Step 1: ID Upload */}
                    {step === 1 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <label className="block w-full cursor-pointer">
                                <div className="border-2 border-dashed border-gray-700 hover:border-blue-500 rounded-xl p-12 text-center transition-colors">
                                    {idImagePreview ? (
                                        <img src={idImagePreview} alt="ID Preview" className="max-h-48 mx-auto rounded-lg" />
                                    ) : (
                                        <>
                                            <Upload className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                                            <p className="text-gray-400 text-lg">Click to upload Government ID</p>
                                            <p className="text-gray-600 text-sm mt-2">JPEG, PNG up to 10MB</p>
                                        </>
                                    )}
                                </div>
                                <input type="file" accept="image/*" className="hidden" onChange={handleIdUpload} />
                            </label>
                            <button 
                                onClick={() => setStep(2)} 
                                disabled={!idImage}
                                className="w-full mt-6 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-all"
                            >
                                Continue to Selfie
                            </button>
                        </div>
                    )}

                    {/* Step 2: Selfie */}
                    {step === 2 && (
                        <div className="animate-in fade-in slide-in-from-bottom-4">
                            <div className="rounded-xl overflow-hidden bg-black border border-gray-800 relative">
                                {!selfie ? (
                                    <>
                                        <Webcam
                                            audio={false}
                                            ref={webcamRef}
                                            screenshotFormat="image/jpeg"
                                            videoConstraints={{
                                                width: 1280,
                                                height: 720,
                                                facingMode: "user"
                                            }}
                                            className="w-full"
                                        />
                                        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                            <button onClick={captureSelfie} className="bg-white text-black rounded-full p-4 hover:scale-105 transition-transform shadow-lg">
                                                <Camera className="w-8 h-8" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="relative">
                                        <img src={selfie} alt="Selfie" className="w-full" />
                                        <button onClick={() => setSelfie(null)} className="absolute top-4 right-4 bg-gray-900/80 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-800">
                                            Retake
                                        </button>
                                    </div>
                                )}
                            </div>

                            {status === 'error' && (
                                <div className="mt-4 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-start gap-3">
                                    <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <p className="text-red-400 text-sm">{errorMessage}</p>
                                </div>
                            )}

                            <div className="flex gap-4 mt-6">
                                <button onClick={() => setStep(1)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-semibold py-3 rounded-xl transition-all">
                                    Back
                                </button>
                                <button 
                                    onClick={submitKYC} 
                                    disabled={!selfie || isProcessing}
                                    className="flex-[2] bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white font-semibold py-3 rounded-xl transition-all flex justify-center items-center"
                                >
                                    {isProcessing ? (
                                        <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        'Verify & Store Proof'
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
