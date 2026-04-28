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
                        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
                        const res = await fetch(`${API_URL}/api/verify/${address}`);
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
        <div className="min-h-screen bg-[#F3F4ED] text-[#1a1a1a] font-sans selection:bg-[#0871E7]/30">
            <Head>
                <title>Aethereal Finance | AegisAuth</title>
            </Head>

            {/* Premium Navbar matching landing page style */}
            <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
                <nav className="pointer-events-auto backdrop-blur-md rounded-full bg-white/60 border border-black/10 px-6 py-3 flex justify-between items-center shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="font-instrument text-[28px] tracking-tight text-[#1a1a1a] flex items-center gap-2">
                            Aethereal
                        </Link>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <Link href="/" className="hidden md:block font-sans text-[14px] text-[#1a1a1a] hover:opacity-70 transition-opacity">Home</Link>
                        <Link href="/admin" className="hidden md:block font-sans text-[14px] text-[#1a1a1a] hover:opacity-70 transition-opacity">Admin</Link>
                        {walletAddress && isVerified ? (
                            <>
                                <div className="px-4 py-2 bg-[#0871E7]/10 border border-[#0871E7]/20 rounded-full flex items-center gap-2">
                                    <ShieldCheck className="w-4 h-4 text-[#0871E7]" />
                                    <span className="text-sm text-[#0871E7] font-medium">Aegis Verified</span>
                                </div>
                                <div className="px-4 py-2 bg-white border border-black/10 rounded-full font-mono text-sm text-[#1a1a1a]/70 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                                </div>
                            </>
                        ) : (
                            <div className="px-4 py-2 bg-white border border-black/10 rounded-full text-sm text-[#1a1a1a]/50">
                                Unauthenticated
                            </div>
                        )}
                    </div>
                </nav>
            </div>

            <main className="pt-40 pb-20 px-6 max-w-7xl mx-auto min-h-screen flex flex-col items-center justify-center">
                
                {authStep === 'idle' && (
                    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <div className="text-center mb-10">
                            <h1 className="text-5xl font-instrument font-bold mb-4 tracking-tight text-[#1a1a1a]">Institutional <br/><span className="text-[#0871E7]">DeFi</span></h1>
                            <p className="text-[#1a1a1a]/70 text-lg">Aethereal Finance requires a verified identity to access premium liquidity pools.</p>
                        </div>

                        <div className="bg-white/60 border border-black/10 rounded-3xl p-8 backdrop-blur-xl relative overflow-hidden group shadow-lg">
                            <div className="absolute inset-0 bg-gradient-to-br from-[#0871E7]/5 to-[#0871E7]/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                            
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="w-20 h-20 rounded-2xl bg-[#0871E7]/10 border border-[#0871E7]/20 flex items-center justify-center mb-6">
                                    <Lock className="w-8 h-8 text-[#0871E7]" />
                                </div>
                                <h2 className="text-2xl font-instrument font-bold mb-2">Login with AegisAuth</h2>
                                <p className="text-[#1a1a1a]/60 text-center text-sm mb-8">One-click secure login using your on-chain ZK-identity proof.</p>
                                
                                <button 
                                    onClick={handleAegisAuth}
                                    className="w-full bg-[#0871E7] hover:bg-[#0871E7]/90 text-white font-semibold py-4 px-6 rounded-2xl transition-all shadow-[0_4px_14px_rgba(8,113,231,0.3)] hover:shadow-[0_6px_20px_rgba(8,113,231,0.4)] hover:-translate-y-0.5 flex items-center justify-center gap-3"
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
                        <div className="bg-white/60 border border-black/10 rounded-3xl p-12 backdrop-blur-xl flex flex-col items-center shadow-lg">
                            <div className="relative w-24 h-24 mb-8">
                                <div className="absolute inset-0 border-4 border-[#0871E7]/20 rounded-full"></div>
                                <div className="absolute inset-0 border-4 border-[#0871E7] rounded-full border-t-transparent animate-spin"></div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {authStep === 'connecting' ? <Wallet className="w-8 h-8 text-[#0871E7]" /> : <ShieldCheck className="w-8 h-8 text-[#0871E7]" />}
                                </div>
                            </div>
                            <h2 className="text-2xl font-instrument font-bold mb-2 text-[#1a1a1a]">
                                {authStep === 'connecting' ? 'Connecting Wallet...' : 'Verifying Identity...'}
                            </h2>
                            <p className="text-[#1a1a1a]/60 text-sm">
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
                                <h1 className="text-4xl font-instrument font-bold mb-2 text-[#1a1a1a]">Aethereal Liquidity Protocol</h1>
                                <p className="text-[#1a1a1a]/70">Institutional Access Granted. You can now interact with premium zero-slippage pools.</p>
                            </div>
                            <div className="flex gap-4">
                                <button className="bg-[#0871E7] hover:bg-[#0871E7]/90 text-white font-medium px-6 py-2 rounded-xl transition-colors shadow-sm">
                                    Deposit
                                </button>
                                <button className="bg-white border border-black/10 hover:bg-black/5 text-[#1a1a1a] font-medium px-6 py-2 rounded-xl transition-colors">
                                    Withdraw
                                </button>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-6">
                            {/* Main Interactive Panel */}
                            <div className="lg:col-span-2 bg-white border border-black/10 rounded-3xl p-8 shadow-sm">
                                <h3 className="text-xl font-instrument font-bold mb-6 text-[#1a1a1a]">Provide Liquidity</h3>
                                
                                <div className="space-y-4">
                                    <div className="bg-[#F3F4ED] border border-black/5 rounded-2xl p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#0871E7]/10 flex items-center justify-center">
                                                <DollarSign className="text-[#0871E7] w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#1a1a1a]">USDC</p>
                                                <p className="text-xs text-[#1a1a1a]/60">USD Coin</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <input 
                                                type="text" 
                                                placeholder="0.00" 
                                                className="bg-transparent text-right text-2xl font-mono focus:outline-none w-32 placeholder-[#1a1a1a]/30 text-[#1a1a1a]"
                                            />
                                            <p className="text-xs text-[#1a1a1a]/50 mt-1">Balance: Max</p>
                                        </div>
                                    </div>

                                    <div className="flex justify-center -my-2 relative z-10">
                                        <div className="bg-white p-2 rounded-full border border-black/10 shadow-sm">
                                            <Activity className="w-4 h-4 text-[#1a1a1a]/50" />
                                        </div>
                                    </div>

                                    <div className="bg-[#F3F4ED] border border-black/5 rounded-2xl p-4 flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#0871E7]/10 flex items-center justify-center">
                                                <Activity className="text-[#0871E7] w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-[#1a1a1a]">aETH</p>
                                                <p className="text-xs text-[#1a1a1a]/60">Aethereal Token</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-2xl font-mono text-[#1a1a1a]/50">0.00</p>
                                        </div>
                                    </div>

                                    <button className="w-full mt-4 bg-[#0871E7] hover:bg-[#0871E7]/90 text-white font-bold py-4 rounded-xl shadow-[0_4px_14px_rgba(8,113,231,0.3)] transition-all transform hover:-translate-y-0.5">
                                        Supply Liquidity
                                    </button>
                                </div>
                            </div>

                            {/* Market Stats Panel */}
                            <div className="space-y-6">
                                <div className="bg-[#DEF0FC]/50 border border-[#0871E7]/20 rounded-3xl p-6 relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-[#0871E7]/10 blur-3xl rounded-full"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-2 mb-4">
                                            <ShieldCheck className="text-[#0871E7] w-5 h-5" />
                                            <h3 className="text-lg font-instrument font-bold text-[#0871E7]">Zero-Risk Pool</h3>
                                        </div>
                                        <p className="text-sm text-[#1a1a1a]/70 mb-4">Because all users are KYC-verified via AegisID, this pool is protected from malicious actors and flash-loan attacks.</p>
                                        <div className="bg-white/80 rounded-xl p-3 flex justify-between items-center border border-[#0871E7]/10">
                                            <span className="text-xs text-[#1a1a1a]/60">Current APY</span>
                                            <span className="text-green-600 font-bold">14.2%</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white border border-black/10 rounded-3xl p-6 shadow-sm">
                                    <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 mb-4 uppercase tracking-wider">Market Overview</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center pb-3 border-b border-black/5">
                                            <span className="text-[#1a1a1a]/70 text-sm">Total Value Locked</span>
                                            <span className="font-mono text-[#1a1a1a] font-medium">$42.8M</span>
                                        </div>
                                        <div className="flex justify-between items-center pb-3 border-b border-black/5">
                                            <span className="text-[#1a1a1a]/70 text-sm">24h Volume</span>
                                            <span className="font-mono text-[#1a1a1a] font-medium">$1.2M</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[#1a1a1a]/70 text-sm">Active Verified Users</span>
                                            <span className="font-mono text-[#1a1a1a] font-medium">1,204</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {authStep === 'failed' && (
                    <div className="w-full max-w-md text-center animate-in zoom-in-95 duration-500">
                        <div className="bg-red-50 border border-red-200 rounded-3xl p-10 backdrop-blur-xl shadow-lg">
                            <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
                                <ShieldAlert className="w-10 h-10 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-instrument font-bold mb-3 text-red-900">Access Denied</h2>
                            <p className="text-red-700/80 mb-8 text-sm leading-relaxed">
                                AegisAuth verification failed. We could not find a valid KYC proof for this wallet address on the blockchain.
                            </p>
                            
                            <div className="space-y-4">
                                <Link href="/dashboard">
                                    <button className="w-full bg-[#1a1a1a] text-white hover:bg-[#1a1a1a]/90 font-bold py-3 px-6 rounded-xl transition-all shadow-md">
                                        Complete KYC on AegisID
                                    </button>
                                </Link>
                                <button 
                                    onClick={() => setAuthStep('idle')}
                                    className="w-full bg-white border border-black/10 hover:bg-black/5 text-[#1a1a1a] font-medium py-3 px-6 rounded-xl transition-all shadow-sm"
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
