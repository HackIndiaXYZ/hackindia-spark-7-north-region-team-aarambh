import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import { Shield, Wallet, ShieldCheck, ShieldAlert, Trash2 } from 'lucide-react';
import KYCUpload from '../components/KYCUpload';
import Link from 'next/link';

const AEGIS_ID_ABI = [
    "function checkVerification(address _user) external view returns (bool)",
    "function revokeIdentity() external"
];

export default function Dashboard() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isRevoking, setIsRevoking] = useState(false);

    const checkVerificationStatus = async (address: string, provider: ethers.providers.Web3Provider) => {
        try {
            setIsLoading(true);
            const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x10B313a1191357aC7Af99e140a81eaC3742A8A73";
            const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com";
            
            let verified = false;
            try {
                // Try with user's injected provider first
                const contract = new ethers.Contract(CONTRACT_ADDRESS, AEGIS_ID_ABI, provider);
                verified = await contract.checkVerification(address);
            } catch (e) {
                console.warn("Wallet provider check failed, falling back to configured RPC:", e);
                // Fallback to configured RPC in case they are on the wrong network in MetaMask
                const fallbackProvider = new ethers.providers.JsonRpcProvider(RPC_URL);
                const fallbackContract = new ethers.Contract(CONTRACT_ADDRESS, AEGIS_ID_ABI, fallbackProvider);
                verified = await fallbackContract.checkVerification(address);
            }
            
            setIsVerified(verified);
        } catch (e) {
            console.error("All blockchain verification checks failed:", e);
            setIsVerified(false);
        } finally {
            setIsLoading(false);
        }
    };

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum as any);
                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);
                checkVerificationStatus(accounts[0], provider);
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
            }
        } else {
            alert("Please install MetaMask to use this application.");
        }
    };

    const revokeIdentity = async () => {
        if (typeof window.ethereum !== 'undefined' && walletAddress) {
            try {
                setIsRevoking(true);
                const provider = new ethers.providers.Web3Provider(window.ethereum as any);
                const signer = provider.getSigner();
                const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || "0x10B313a1191357aC7Af99e140a81eaC3742A8A73";
                const contract = new ethers.Contract(CONTRACT_ADDRESS, AEGIS_ID_ABI, signer);
                
                const tx = await contract.revokeIdentity();
                await tx.wait(); // Wait for transaction to be mined
                
                setIsVerified(false);
                alert("Identity successfully revoked from the blockchain.");
            } catch (error) {
                console.error("Error revoking identity:", error);
                alert("Failed to revoke identity. See console for details.");
            } finally {
                setIsRevoking(false);
            }
        }
    };

    // Keep checking if wallet changes
    useEffect(() => {
        if (walletAddress && window.ethereum) {
            const provider = new ethers.providers.Web3Provider(window.ethereum as any);
            checkVerificationStatus(walletAddress, provider);
        }
    }, [walletAddress]);

    return (
        <div className="min-h-screen bg-[#F3F4ED] text-[#1a1a1a] font-sans selection:bg-[#0871E7]/30">
            <Head>
                <title>Dashboard | AegisID</title>
                <meta name="description" content="Decentralized Identity and KYC" />
            </Head>

            {/* Navbar */}
            <nav className="border-b border-black/10 bg-[#F3F4ED]/80 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <span className="font-instrument text-4xl tracking-tight text-[#1a1a1a]">AegisID</span>
                    </Link>

                    <div className="flex gap-4">
                        <Link href="/aethereal" className="group relative rounded-full text-[#1a1a1a] font-sans text-[14px] px-4 py-2.5 outline-1 outline-black/10 -outline-offset-1 overflow-hidden transition-all flex items-center justify-center hover:bg-black/5 hidden md:flex">
                            <span className="relative z-10">Aethereal</span>
                        </Link>
                        <Link href="/dapp" className="group relative rounded-full text-[#1a1a1a] font-sans text-[14px] px-4 py-2.5 outline-1 outline-black/10 -outline-offset-1 overflow-hidden transition-all flex items-center justify-center hover:bg-black/5 hidden md:flex">
                            <span className="relative z-10">YieldSwap</span>
                        </Link>
                        <Link href="/admin" className="group relative rounded-full text-[#1a1a1a] font-sans text-[14px] px-4 py-2.5 outline-1 outline-black/10 -outline-offset-1 overflow-hidden transition-all flex items-center justify-center hover:bg-black/5 hidden md:flex">
                            <span className="relative z-10">Admin</span>
                        </Link>
                        {!walletAddress ? (
                            <button 
                                onClick={connectWallet}
                                className="bg-[#0871E7] hover:opacity-90 px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] text-white text-[14px]"
                            >
                                <Wallet className="w-4 h-4 text-white" />
                                Connect Wallet
                            </button>
                        ) : (
                            <div className="bg-white/50 border border-black/10 px-4 py-2 rounded-full font-mono text-sm text-[#1a1a1a] flex items-center gap-2 shadow-sm">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="font-instrument text-5xl md:text-7xl tracking-tight">
                        Own Your Identity
                    </h1>
                    <p className="text-[#1a1a1a]/70 max-w-2xl mx-auto">
                        Secure, private, and decentralized KYC. Prove you are human without exposing your personal data to every dApp.
                    </p>
                </div>

                {!walletAddress ? (
                    <div className="max-w-md mx-auto text-center p-8 border border-black/10 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm">
                        <Wallet className="w-16 h-16 text-[#1a1a1a]/40 mx-auto mb-6" />
                        <h2 className="text-2xl font-semibold mb-2">Connect to Start</h2>
                        <p className="text-[#1a1a1a]/60 mb-8">Please connect your Web3 wallet to verify your identity or access dApps.</p>
                        <button 
                            onClick={connectWallet}
                            className="w-full bg-[#0871E7] text-white font-semibold py-4 rounded-xl transition-all shadow-md hover:shadow-lg"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : isLoading ? (
                    <div className="text-center py-12 max-w-md mx-auto p-8 border border-black/10 rounded-2xl bg-white/50 backdrop-blur-sm shadow-sm">
                        <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-[#1a1a1a]/70 text-lg">Checking Verification Status...</p>
                    </div>
                ) : isVerified ? (
                    <div className="max-w-2xl mx-auto text-center p-12 border border-black/10 rounded-3xl bg-white/50 backdrop-blur-xl shadow-lg relative overflow-hidden">
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl mix-blend-multiply"></div>
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl mix-blend-multiply"></div>
                        
                        <div className="relative z-10">
                            <ShieldCheck className="w-24 h-24 text-emerald-500 mx-auto mb-6" />
                            <h2 className="text-4xl font-instrument font-bold mb-4 tracking-tight">Identity Verified</h2>
                            <p className="text-[#1a1a1a]/70 mb-10 text-lg max-w-md mx-auto">
                                Your zero-knowledge proof is securely minted on the blockchain. You have unlimited access to our partner ecosystem.
                            </p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                                <Link href="/dapp">
                                    <div className="p-4 rounded-xl border border-black/5 bg-white shadow-sm hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col items-center justify-center">
                                        <span className="font-semibold text-[#1a1a1a] group-hover:text-blue-600 transition-colors">YieldSwap Finance</span>
                                        <span className="text-xs text-[#1a1a1a]/50 mt-1">Claim Airdrop</span>
                                    </div>
                                </Link>
                                <Link href="/aethereal">
                                    <div className="p-4 rounded-xl border border-black/5 bg-white shadow-sm hover:border-blue-500/50 transition-all cursor-pointer group flex flex-col items-center justify-center">
                                        <span className="font-semibold text-[#1a1a1a] group-hover:text-blue-600 transition-colors">Aethereal DeFi</span>
                                        <span className="text-xs text-[#1a1a1a]/50 mt-1">Institutional Liquidity</span>
                                    </div>
                                </Link>
                            </div>

                            <div className="pt-6 border-t border-black/10">
                                <p className="text-sm text-[#1a1a1a]/50 mb-4">Want to reset your identity status?</p>
                                <button 
                                    onClick={revokeIdentity}
                                    disabled={isRevoking}
                                    className="bg-white hover:bg-red-50 border border-red-200 text-red-600 font-medium py-3 px-6 rounded-xl transition-all hover:border-red-300 flex items-center gap-2 mx-auto disabled:opacity-50"
                                >
                                    {isRevoking ? (
                                        <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin"></div>
                                    ) : (
                                        <Trash2 className="w-5 h-5" />
                                    )}
                                    {isRevoking ? 'Revoking On-Chain...' : 'Revoke Identity Proof'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="transition-all duration-300 ease-in-out">
                            <KYCUpload walletAddress={walletAddress} />
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
