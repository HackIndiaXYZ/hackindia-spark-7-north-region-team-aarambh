import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import { ShieldCheck, ShieldAlert, Activity, TrendingUp, DollarSign, Wallet, Lock, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

// Minimal ABI just to read the verification status from the AegisID smart contract
const AEGIS_ID_ABI = [
    "function checkVerification(address _user) external view returns (bool)"
];

export default function AetherealFinance() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [authStep, setAuthStep] = useState<'idle' | 'connecting' | 'verifying' | 'success' | 'failed'>('idle');

    const handleAegisAuth = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                setAuthStep('connecting');
                setIsLoading(true);
                
                // 1. Connect Wallet
                const provider = new ethers.providers.Web3Provider(window.ethereum as any);
                const accounts = await provider.send("eth_requestAccounts", []);
                const address = accounts[0];
                setWalletAddress(address);
                
                setAuthStep('verifying');

                // 2. Verify with AegisID on Blockchain
                // Use a dedicated Sepolia provider to check the contract, so it works regardless of the user's active MetaMask network
                const SEPOLIA_RPC = "https://ethereum-sepolia-rpc.publicnode.com";
                const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x10B313a1191357aC7Af99e140a81eaC3742A8A73"; 
                
                let verified = false;
                try {
                    const readOnlyProvider = new ethers.providers.JsonRpcProvider(SEPOLIA_RPC);
                    const contract = new ethers.Contract(CONTRACT_ADDRESS, AEGIS_ID_ABI, readOnlyProvider);
                    verified = await contract.checkVerification(address);
                } catch (e) {
                    console.error("Blockchain verification check failed, falling back to API:", e);
                    try {
                        const res = await fetch(`http://localhost:3001/api/verify/${address}`);
                        const data = await res.json();
                        verified = data.isVerified;
                    } catch (apiError) {
                        console.error("Fallback API also failed:", apiError);
                        verified = false;
                    }
                }

                setIsVerified(verified);
                setAuthStep(verified ? 'success' : 'failed');
                setIsLoading(false);
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
                setAuthStep('failed');
                setIsLoading(false);
            }
        } else {
            alert("Please install MetaMask to use this application.");
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-indigo-500/30">
            <Head>
                <title>Aethereal Finance | AegisAuth</title>
            </Head>

            {/* Premium Navbar */}
            <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-black/50 backdrop-blur-2xl">
                <div className="max-w-7xl mx-auto px-6 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Activity className="text-white w-6 h-6" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
                            Aethereal
                        </span>
                    </div>
                    
                    {walletAddress && isVerified ? (
                        <div className="flex items-center gap-4">
                            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                                <span className="text-sm text-indigo-300 font-medium">Aegis Verified</span>
                            </div>
                            <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full font-mono text-sm text-gray-300 flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </div>
                        </div>
                    ) : (
                        <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-full text-sm text-gray-400">
                            Unauthenticated
                        </div>
                    )}
                </div>
            </nav>

            <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center">
                
                {authStep === 'idle' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center mb-10">
                            <h1 className="text-5xl font-extrabold mb-4 tracking-tight">Institutional <br/><span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">DeFi</span></h1>
                            <p className="text-gray-400 text-lg">Aethereal Finance requires a verified identity to access premium liquidity pools.</p>
                        </div>

                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-6">
                                    <Lock className="w-8 h-8 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-bold mb-2">Login with AegisAuth</h2>
                                <p className="text-gray-400 text-center text-sm mb-8">One-click secure login using your on-chain ZK-identity proof.</p>
                                
                                <button 
                                    onClick={handleAegisAuth}
                                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] hover:shadow-[0_0_60px_rgba(79,70,229,0.5)] hover:-translate-y-1 flex items-center justify-center gap-3"
                                >
                                    <ShieldCheck className="w-5 h-5" />
                                    AegisAuth Login
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {(authStep === 'connecting' || authStep === 'verifying') && (
                    <div className="w-full max-w-md text-center animate-in zoom-in-95 duration-500">
                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-indigo-500/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {authStep === 'connecting' ? <Wallet className="w-8 h-8 text-indigo-400" /> : <ShieldCheck className="w-8 h-8 text-indigo-400" />}
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold mb-2">
                                {authStep === 'connecting' ? 'Connecting Wallet...' : 'Verifying Identity...'}
                            </h2>
                            <p className="text-gray-400 text-sm">
                                {authStep === 'connecting' ? 'Please approve the connection in MetaMask.' : 'Querying AegisID Smart Contract for Proof of Humanity.'}
                            </p>
                        </div>
                    </div>
                )}

                {authStep === 'success' && (
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {/* Premium Dashboard UI */}
                        <div className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                            <div>
                                <h1 className="text-4xl font-bold mb-2">Aethereal Liquidity Protocol</h1>
                                <p className="text-gray-400">Institutional Access Granted. You can now interact with premium zero-slippage pools.</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-2 rounded-xl transition-colors">
                                    Deposit
                                </button>
                                <button className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-medium px-6 py-2 rounded-xl transition-colors">
                                    Withdraw
                                </button>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Main Interactive Panel */}
                            <div className="lg:col-span-2 bg-white/[0.02] border border-white/5 rounded-3xl p-8">
                                <h3 className="text-xl font-bold mb-6">Provide Liquidity</h3>
                                
                                <div className="space-y-4">
                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <DollarSign className="text-blue-400 w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">USDC</p>
                                                <p className="text-xs text-gray-500">USD Coin</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <input 
                                                type="text" 
                                                placeholder="0.00" 
                                                className="bg-transparent text-right text-2xl font-mono focus:outline-none w-32 placeholder-gray-700"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Balance: Max</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center -my-2 relative z-10">
                                        <div className="bg-[#050505] p-2 rounded-full border border-white/5">
                                            <Activity className="w-4 h-4 text-gray-500" />
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
                                                <Activity className="text-purple-400 w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold">aETH</p>
                                                <p className="text-xs text-gray-500">Aethereal Token</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-mono text-gray-500">0.00</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all transform hover:-translate-y-1">
                                        Supply Liquidity
                                    </button>
                                </div>
                            </div>

                            {/* Market Stats Panel */}
                            <div className="space-y-6">
                                <div className="bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-500/30 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 blur-3xl rounded-full"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldCheck className="text-indigo-400 w-5 h-5" />
                                            <h3 className="text-lg font-bold text-indigo-100">Zero-Risk Pool</h3>
                                        </div>
                                        <p className="text-sm text-indigo-200/70 mb-4">Because all users are KYC-verified via AegisID, this pool is protected from malicious actors and flash-loan attacks.</p>
                                        <div className="bg-black/30 rounded-xl p-3 flex justify-between items-center border border-indigo-500/20">
                                            <span className="text-xs text-indigo-300">Current APY</span>
                                            <span className="text-green-400 font-bold">14.2%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-6">
                                    <h3 className="text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">Market Overview</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                            <span className="text-gray-300">Total Value Locked</span>
                                            <span className="font-mono text-white">$42.8M</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-white/5">
                                            <span className="text-gray-300">24h Volume</span>
                                            <span className="font-mono text-white">$1.2M</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-gray-300">Active Verified Users</span>
                                            <span className="font-mono text-white">1,204</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {authStep === 'failed' && (
                    <div className="w-full max-w-md text-center animate-in zoom-in-95 duration-500">
                        <div className="bg-red-500/5 border border-red-500/20 rounded-3xl p-10 backdrop-blur-xl">
                            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
                                <ShieldAlert className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold mb-3 text-white">Access Denied</h2>
                            <p className="text-red-200/70 mb-8 text-sm leading-relaxed">
                                AegisAuth verification failed. We could not find a valid KYC proof for this wallet address on the blockchain.
                            </p>
                            
                            <div className="space-y-4">
                                <Link href="/dashboard">
                                    <button className="w-full bg-white text-black hover:bg-gray-200 font-bold py-3 px-6 rounded-xl transition-all">
                                        Complete KYC on AegisID
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => setAuthStep('idle')}
                                    className="w-full bg-transparent border border-white/10 hover:bg-white/5 text-white font-medium py-3 px-6 rounded-xl transition-all"
                                >
                                    Try Another Wallet
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
