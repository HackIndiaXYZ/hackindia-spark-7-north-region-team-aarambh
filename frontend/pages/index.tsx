import React, { useState } from 'react';
import Head from 'next/head';
import { ethers } from 'ethers';
import { Shield, Wallet } from 'lucide-react';
import KYCUpload from '../components/KYCUpload';
import DAppView from '../components/DAppView';

export default function Home() {
    const [walletAddress, setWalletAddress] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'kyc' | 'dapp'>('kyc');

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
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans selection:bg-blue-500/30">
            <Head>
                <title>AegisID | Web3 KYC</title>
                <meta name="description" content="Decentralized Identity and KYC" />
            </Head>

            {/* Navbar */}
            <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Shield className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-2xl font-bold tracking-tight">AegisID</span>
                    </div>

                    {!walletAddress ? (
                        <button 
                            onClick={connectWallet}
                            className="bg-gray-800 hover:bg-gray-700 border border-gray-700 px-6 py-2.5 rounded-full font-medium flex items-center gap-2 transition-all hover:shadow-lg"
                        >
                            <Wallet className="w-4 h-4 text-blue-400" />
                            Connect Wallet
                        </button>
                    ) : (
                        <div className="bg-gray-800/50 border border-gray-700 px-4 py-2 rounded-full font-mono text-sm text-gray-300 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                            {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                        </div>
                    )}
                </div>
            </nav>

            <main className="max-w-6xl mx-auto px-4 py-12">
                {/* Hero Section */}
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight">
                        Own Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-600">Identity</span>
                    </h1>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        Secure, private, and decentralized KYC. Prove you are human without exposing your personal data to every dApp.
                    </p>
                </div>

                {!walletAddress ? (
                    <div className="max-w-md mx-auto text-center p-8 border border-gray-800 rounded-2xl bg-gray-900/30 backdrop-blur-sm">
                        <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-6" />
                        <h2 className="text-2xl font-semibold mb-2">Connect to Start</h2>
                        <p className="text-gray-400 mb-8">Please connect your Web3 wallet to verify your identity or access dApps.</p>
                        <button 
                            onClick={connectWallet}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20"
                        >
                            Connect MetaMask
                        </button>
                    </div>
                ) : (
                    <>
                        {/* Tabs */}
                        <div className="flex justify-center mb-8">
                            <div className="bg-gray-900 border border-gray-800 p-1 rounded-xl flex gap-1">
                                <button 
                                    onClick={() => setActiveTab('kyc')}
                                    className={`px-8 py-3 rounded-lg font-medium transition-all ${activeTab === 'kyc' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Get Verified
                                </button>
                                <button 
                                    onClick={() => setActiveTab('dapp')}
                                    className={`px-8 py-3 rounded-lg font-medium transition-all ${activeTab === 'dapp' ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Test Authentication
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="transition-all duration-300 ease-in-out">
                            {activeTab === 'kyc' ? (
                                <KYCUpload walletAddress={walletAddress} />
                            ) : (
                                <DAppView walletAddress={walletAddress} />
                            )}
                        </div>
                    </>
                )}
            </main>
        </div>
    );
}
