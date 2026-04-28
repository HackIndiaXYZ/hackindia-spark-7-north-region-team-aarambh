import React, { useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import { Shield, Wallet } from 'lucide-react';
import KYCUpload from '../components/KYCUpload';
import Link from 'next/link';

export default function Dashboard() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);

    const connectWallet = async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                const provider = new ethers.providers.Web3Provider(window.ethereum as any);
                const accounts = await provider.send("eth_requestAccounts", []);
                setWalletAddress(accounts[0]);
            } catch (error) {
                console.error("User denied account access or error occurred:", error);
            }
        } else {
            alert("Please install MetaMask to use this application.");
        }
    };

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
                        <Link href="/aethereal" className="group relative rounded-full text-[#1a1a1a] font-sans text-[14px] px-6 py-2.5 outline-1 outline-black/10 -outline-offset-1 overflow-hidden transition-all flex items-center justify-center hover:bg-black/5 hidden md:flex">
                            <span className="relative z-10">Aethereal</span>
                        </Link>
                        <Link href="/admin" className="group relative rounded-full text-[#1a1a1a] font-sans text-[14px] px-6 py-2.5 outline-1 outline-black/10 -outline-offset-1 overflow-hidden transition-all flex items-center justify-center hover:bg-black/5 hidden md:flex">
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
