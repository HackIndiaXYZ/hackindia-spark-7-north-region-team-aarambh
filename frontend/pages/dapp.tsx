import React, { useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import { ShieldCheck, ShieldAlert, Coins, Wallet } from 'lucide-react';
import Link from 'next/link';

// Minimal ABI just to read the verification status from the AegisID smart contract
const AEGIS_ID_ABI = [
    "function checkVerification(address _user) external view returns (bool)"
];

export default function MockDApp() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [airdropClaimed, setAirdropClaimed] = useState(false);

    const connectAndCheck = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                setIsLoading(true);
                const provider = new ethers.providers.Web3Provider(window.ethereum as any);
                const accounts = await provider.send("eth_requestAccounts", []);
                const address = accounts[0];
                setWalletAddress(address);

                // For the hackathon, you can paste the real deployed contract address here in your .env
                const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
                const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x10B313a1191357aC7Af99e140a81eaC3742A8A73"; 
                
                try {
                    // Try to verify via Blockchain Contract first (True Decentralization)
                    const readOnlyProvider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC);
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, AEGIS_ID_ABI, readOnlyProvider);
                    const verified = await contract.checkVerification(address);
                    setIsVerified(verified);
                } catch (e) {
                    console.error("Blockchain verification check failed, falling back to API:", e);
                    try {
                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                        const res = await fetch(`${API_URL}/api/verify/${address}`);
                        const data = await res.json();
                        setIsVerified(data.isVerified);
                    } catch (apiError) {
                        console.error("Fallback API also failed:", apiError);
                        setIsVerified(false);
                    }
                }

                setIsLoading(false);
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
                setIsLoading(false);
            }
        } else {
            alert("Please install MetaMask to use this application.");
        }
    };

    return (
        <div className="min-h-screen bg-[#0f172a] text-white font-sans">
            <Head>
                <title>YieldSwap | Partner dApp</title>
            </Head>

            {/* dApp Navbar */}
            <nav className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-lg p-4 flex justify-between items-center sticky top-0 z-50">
                <div className="flex items-center gap-3 text-xl font-bold text-emerald-400">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <Coins className="text-emerald-500" />
                    </div>
                    YieldSwap Finance
                </div>
                {!walletAddress ? (
                    <button 
                        onClick={connectAndCheck} 
                        className="bg-slate-800 hover:bg-slate-700 border border-slate-700 px-5 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 transition-colors"
                    >
                        <Wallet className="w-4 h-4 text-emerald-400" /> Connect Wallet
                    </button>
                ) : (
                    <div className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm font-mono text-slate-300 flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </div>
                )}
            </nav>

            <main className="max-w-4xl mx-auto mt-20 px-4">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold mb-4 tracking-tight">
                        Exclusive <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">$YIELD</span> Airdrop
                    </h1>
                    <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                        To protect our community from bots and sybil attacks, this airdrop requires Proof of Humanity via the AegisID Protocol.
                    </p>
                </div>

                <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-8 max-w-md mx-auto shadow-2xl border border-slate-700/50">
                    {!walletAddress ? (
                        <div className="text-center py-6">
                            <Wallet className="w-20 h-20 text-slate-600 mx-auto mb-6" />
                            <h2 className="text-2xl font-semibold mb-4">Check Eligibility</h2>
                            <button 
                                onClick={connectAndCheck} 
                                className="bg-emerald-600 hover:bg-emerald-700 text-white w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-emerald-500/20"
                            >
                                Connect MetaMask
                            </button>
                        </div>
                    ) : isLoading ? (
                        <div className="text-center py-12">
                            <div className="w-16 h-16 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin mx-auto mb-6"></div>
                            <p className="text-slate-400 text-lg">Querying AegisID Verification Status...</p>
                        </div>
                    ) : isVerified ? (
                        <div className="text-center animate-in zoom-in-95 py-6">
                            <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" />
                            <h2 className="text-3xl font-bold text-white mb-2">Verification Confirmed</h2>
                            <p className="text-slate-300 mb-8">AegisID has confirmed your identity. You are eligible!</p>
                            
                            {!airdropClaimed ? (
                                <button 
                                    onClick={() => setAirdropClaimed(true)}
                                    className="bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white w-full py-4 rounded-xl font-bold text-xl shadow-xl shadow-emerald-500/30 transition-all transform hover:-translate-y-1"
                                >
                                    Claim 10,000 $YIELD
                                </button>
                            ) : (
                                <div className="bg-emerald-900/40 border border-emerald-500/50 p-6 rounded-2xl text-emerald-400 font-bold text-xl flex flex-col items-center gap-3">
                                    <span>🎉 Airdrop Claimed!</span>
                                    <span className="text-sm font-normal text-emerald-500/80">Tokens have been sent to your wallet.</span>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center animate-in zoom-in-95 py-6">
                            <ShieldAlert className="w-24 h-24 text-red-500 mx-auto mb-6 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
                            <h2 className="text-3xl font-bold text-white mb-2">Access Denied</h2>
                            <p className="text-slate-300 mb-8">You must complete Web3 KYC verification with AegisID to access this platform.</p>
                            
                            <Link href="/">
                                <button className="bg-blue-600 hover:bg-blue-700 text-white w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-blue-500/30 transition-all transform hover:-translate-y-1 flex items-center justify-center gap-2">
                                    <ShieldCheck className="w-5 h-5" />
                                    Go to AegisID to Verify
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
