import React, { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';

export default function AdminDashboard() {
  const [wallet, setWallet] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [debugData, setDebugData] = useState<any[]>([]);

  const fetchBlockchainData = async () => {
    if (!wallet) return;
    setLoading(true);
    setError('');
    setData(null);
    setDebugData([]);

    try {
      const RELAYER_URL = process.env.NEXT_PUBLIC_BLOCKCHAIN_URL || 'http://localhost:3002';
      const response = await fetch(`${RELAYER_URL}/api/admin/user-data/${wallet}`);
      const result = await response.json();

      if (!response.ok) {
        if (result.recentTransactions && result.recentTransactions.length > 0) {
            setDebugData(result.recentTransactions);
        }
        throw new Error(result.error || result.message || 'Failed to fetch data');
      }

      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4ED] text-[#1a1a1a] font-sans selection:bg-[#0871E7]/30">
      <Head>
        <title>AegisID Admin Dashboard</title>
      </Head>

      {/* Navbar matching Landing Page */}
      <div className="fixed top-6 left-1/2 -translate-x-1/2 w-[95%] max-w-5xl z-50 pointer-events-none">
        <nav className="pointer-events-auto backdrop-blur-md rounded-full bg-white/10 border border-black/10 px-6 py-3 flex justify-between items-center shadow-sm">
          <Link href="/" className="font-instrument text-[28px] tracking-tight text-[#1a1a1a]">AegisID</Link>
          <div className="hidden md:flex gap-10">
            <Link href="/" className="font-sans text-[14px] text-[#1a1a1a] hover:opacity-70 transition-opacity">Home</Link>
          </div>
          <div className="flex gap-4">
            <Link href="/aethereal" className="group relative rounded-full text-[#1a1a1a] font-sans text-[14px] px-6 py-2.5 outline-1 outline-black/10 -outline-offset-1 overflow-hidden transition-all flex items-center justify-center hover:bg-black/5 hidden md:flex">
              <span className="relative z-10">Aethereal</span>
            </Link>
            <Link href="/dashboard" className="group relative bg-[#0871E7] rounded-full text-white font-sans text-[14px] px-6 py-2.5 shadow-[inset_0_-4px_4px_rgba(255,255,255,0.39)] outline-1 outline-[#0871E7] -outline-offset-1 overflow-hidden transition-all flex items-center justify-center">
              <div className="absolute w-[80%] h-4 left-[10%] top-[1px] bg-gradient-to-b from-[#DEF0FC] to-transparent rounded-[12px] group-hover:scale-x-105 transition-transform duration-300"></div>
              <span className="relative z-10 flex items-center gap-2">Launch App <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></span>
            </Link>
          </div>
        </nav>
      </div>

      <main className="pt-40 pb-20 px-6 max-w-4xl mx-auto space-y-8">
        <div className="text-center md:text-left">
          <h1 className="font-instrument text-[38px] md:text-[56px] leading-[0.85] tracking-tight text-[#1a1a1a] mb-4">AegisGate Admin Dashboard</h1>
          <p className="font-sans text-[16px] md:text-[18px] text-[#1a1a1a]/80 leading-relaxed font-normal">Inspect decrypted on-chain identity verification data.</p>
        </div>

        {/* Search Box */}
        <div className="bg-white/60 p-6 rounded-2xl border border-black/10 shadow-sm space-y-4 backdrop-blur-sm">
          <label className="block text-sm font-medium text-[#1a1a1a]/70">Target User Wallet Address</label>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <input 
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-white border border-black/10 rounded-xl px-4 py-3 text-[#1a1a1a] focus:outline-none focus:border-[#0871E7] focus:ring-1 focus:ring-[#0871E7] font-mono shadow-inner"
            />
            <button 
              onClick={fetchBlockchainData}
              disabled={loading || !wallet}
              className="bg-[#0871E7] hover:bg-[#0871E7]/90 text-white px-8 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
            >
              {loading ? 'Searching Ledger...' : 'Lookup Data'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-2xl flex items-center space-x-3 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Debug State: Show other recent transactions if 404 */}
        {debugData.length > 0 && !data && (
            <div className="bg-orange-50 border border-orange-200 p-6 rounded-2xl shadow-sm space-y-4">
                <h3 className="text-xl font-instrument font-semibold text-orange-800">Wait, I found these transactions instead:</h3>
                <p className="text-orange-700/80 text-sm">We couldn't find your specific wallet address, but these are the most recent registrations on the Smart Contract. Did the Relayer accidentally register itself instead of the user?</p>
                <div className="space-y-4 mt-4">
                    {debugData.map((tx, idx) => (
                        <div key={idx} className="bg-white p-4 rounded-xl border border-orange-100 space-y-2 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center border-b border-orange-50 pb-2 gap-2 sm:gap-0">
                                <span className="text-xs text-orange-900/60 font-mono break-all">From: <span className="text-orange-800 font-semibold">{tx.fromAddress}</span></span>
                                <span className="text-xs text-[#0871E7] font-mono px-2 py-1 bg-[#0871E7]/10 rounded-lg whitespace-nowrap">{tx.functionCalled}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs text-orange-900/60">Arguments found inside transaction:</span>
                                <pre className="text-xs text-orange-800 font-mono mt-1 overflow-x-auto bg-orange-50/50 p-2 rounded">
                                    {JSON.stringify(tx.arguments, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {/* Results Box */}
        {data && (
          <div className="bg-white p-8 rounded-2xl border border-black/10 shadow-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-[#0871E7]"></div>
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <h2 className="text-2xl font-instrument font-semibold text-[#1a1a1a] flex items-center space-x-3">
                <span className="h-3 w-3 bg-green-500 rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)]"></span>
                <span>Blockchain Record Found</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Transaction Hash</h3>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${data.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0871E7] hover:text-[#0871E7]/80 font-mono text-sm break-all transition-colors underline decoration-[#0871E7]/30 underline-offset-4 block"
                >
                  {data.transactionHash.substring(0, 12)}...{data.transactionHash.substring(54)}
                </a>
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Status</h3>
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${data.status === 'Success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                  {data.status === 'Success' && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
                  {data.status === 'Failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
                  <span>{data.status || 'Success'}</span>
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Timestamp</h3>
                <p className="text-[#1a1a1a]/80 text-sm font-mono bg-black/5 px-2 py-1 rounded inline-block">{data.timestamp ? new Date(data.timestamp * 1000).toLocaleString() : 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Block Number</h3>
                <p className="text-[#1a1a1a]/80 font-mono text-sm bg-black/5 px-2 py-1 rounded inline-block">{data.blockNumber}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Relayer Address</h3>
                <a 
                  href={`https://sepolia.etherscan.io/address/${data.fromAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#0871E7] hover:text-[#0871E7]/80 font-mono text-sm break-all transition-colors block"
                >
                  {data.fromAddress ? `${data.fromAddress.substring(0, 8)}...${data.fromAddress.substring(36)}` : 'N/A'}
                </a>
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Network Fee (Gas)</h3>
                <p className="text-[#1a1a1a]/80 font-mono text-sm">
                  {data.gasUsed && data.effectiveGasPrice ? (Number(data.gasUsed) * Number(data.effectiveGasPrice) / 1e18).toFixed(6) + ' ETH' : 'N/A'}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3 pt-4 border-t border-black/5">
                <h3 className="text-[11px] font-semibold text-[#1a1a1a]/50 uppercase tracking-wider">Smart Contract Function Called</h3>
                <span className="inline-block mt-2 px-4 py-1.5 bg-[#0871E7]/10 text-[#0871E7] text-sm font-mono rounded-lg border border-[#0871E7]/20 font-semibold">
                  {data.submittedData.functionCalled}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-black/5">
              <h3 className="text-sm font-semibold text-[#1a1a1a]/70 uppercase tracking-wider flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#0871E7]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>Decrypted Raw Input (Arguments)</span>
              </h3>
              <div className="bg-[#f8f9f5] rounded-xl p-6 border border-black/10 shadow-inner overflow-x-auto">
                <pre className="text-sm text-[#2A3616] font-mono leading-relaxed">
                  {JSON.stringify(data.submittedData.arguments, null, 2)}
                </pre>
              </div>
              <p className="text-xs text-[#1a1a1a]/50 text-right mt-2">*This is the exact data pulled and decoded directly from the blockchain block.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
