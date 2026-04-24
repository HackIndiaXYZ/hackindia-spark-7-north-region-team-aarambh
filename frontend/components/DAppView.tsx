import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ethers } from 'ethers';
import { QrCode, ScanLine, ShieldCheck, ShieldX } from 'lucide-react';

// Use a zero address as placeholder to avoid ethers.js INVALID_ARGUMENT ENS resolution errors
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000";
const CONTRACT_ABI = [
    "function checkVerification(address _user) external view returns (bool)"
];

interface DAppViewProps {
    walletAddress: string;
}

export default function DAppView({ walletAddress }: DAppViewProps) {
    const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'granted' | 'denied'>('idle');

    // Generate a payload for the QR code
    const qrPayload = JSON.stringify({
        app: "AegisID",
        action: "authenticate",
        address: walletAddress,
        timestamp: Date.now()
    });

    const simulateScan = async () => {
        setScanStatus('scanning');
        
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum as any);
            const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider);

            let isVerified = false;
            // Ping blockchain or mock if using placeholder address
            if (CONTRACT_ADDRESS === "0x0000000000000000000000000000000000000000") {
                isVerified = true;
            } else {
                isVerified = await contract.checkVerification(walletAddress);
            }

            // Simulate network delay for UI
            await new Promise(resolve => setTimeout(resolve, 1500));

            if (isVerified) {
                setScanStatus('granted');
            } else {
                setScanStatus('denied');
            }
        } catch (error) {
            console.error("Scan error:", error);
            setScanStatus('denied');
        }
    };

    return (
        <div className="max-w-md mx-auto bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-center gap-3 mb-8">
                <QrCode className="w-8 h-8 text-blue-500" />
                <h2 className="text-2xl font-bold text-white">dApp Authentication</h2>
            </div>

            <div className="bg-white p-6 rounded-xl w-fit mx-auto mb-8 shadow-lg">
                <QRCodeSVG value={qrPayload} size={200} level="H" />
            </div>

            <p className="text-gray-400 text-center mb-8 text-sm">
                Scan this QR code with a compatible dApp to verify your identity without sharing personal data.
            </p>

            <div className="relative">
                <button 
                    onClick={simulateScan}
                    disabled={scanStatus === 'scanning'}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white font-semibold py-4 rounded-xl transition-all flex items-center justify-center gap-2 group"
                >
                    <ScanLine className={`w-5 h-5 ${scanStatus === 'scanning' ? 'animate-pulse' : 'group-hover:scale-110 transition-transform'}`} />
                    {scanStatus === 'scanning' ? 'Verifying on Blockchain...' : 'Simulate Partner dApp Scan'}
                </button>

                {/* Status Overlays */}
                {scanStatus === 'granted' && (
                    <div className="absolute inset-0 bg-green-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-green-500 animate-in zoom-in">
                        <div className="flex items-center gap-2 text-green-400 font-bold text-lg">
                            <ShieldCheck className="w-6 h-6" />
                            ACCESS GRANTED
                        </div>
                    </div>
                )}
                {scanStatus === 'denied' && (
                    <div className="absolute inset-0 bg-red-500/20 backdrop-blur-sm rounded-xl flex items-center justify-center border border-red-500 animate-in zoom-in">
                        <div className="flex items-center gap-2 text-red-400 font-bold text-lg">
                            <ShieldX className="w-6 h-6" />
                            ACCESS DENIED
                        </div>
                    </div>
                )}
            </div>

            {(scanStatus === 'granted' || scanStatus === 'denied') && (
                <button 
                    onClick={() => setScanStatus('idle')}
                    className="w-full mt-4 text-sm text-gray-500 hover:text-white transition-colors"
                >
                    Reset Demo
                </button>
            )}
        </div>
    );
}
