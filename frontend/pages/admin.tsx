import React, { useState } from 'react';

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
      const response = await fetch(`http://localhost:3002/api/admin/user-data/${wallet}`);
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
    <div className="min-h-screen bg-gray-900 text-white p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-blue-400">AegisGate Admin Dashboard</h1>
          <p className="text-gray-400 mt-2 text-lg">Inspect decrypted on-chain identity verification data.</p>
        </div>

        {/* Search Box */}
        <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 shadow-xl space-y-4">
          <label className="block text-sm font-medium text-gray-300">Target User Wallet Address</label>
          <div className="flex space-x-4">
            <input 
              type="text"
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
              placeholder="0x..."
              className="flex-1 bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
            />
            <button 
              onClick={fetchBlockchainData}
              disabled={loading || !wallet}
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Searching Ledger...' : 'Lookup Data'}
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-900/40 border border-red-500 text-red-200 px-6 py-4 rounded-xl flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {/* Debug State: Show other recent transactions if 404 */}
        {debugData.length > 0 && !data && (
            <div className="bg-orange-900/20 border border-orange-500/50 p-6 rounded-xl shadow-xl space-y-4">
                <h3 className="text-xl font-semibold text-orange-400">Wait, I found these transactions instead:</h3>
                <p className="text-gray-400 text-sm">We couldn't find your specific wallet address, but these are the most recent registrations on the Smart Contract. Did the Relayer accidentally register itself instead of the user?</p>
                <div className="space-y-4 mt-4">
                    {debugData.map((tx, idx) => (
                        <div key={idx} className="bg-gray-900 p-4 rounded-lg border border-gray-700 space-y-2">
                            <div className="flex justify-between items-center border-b border-gray-800 pb-2">
                                <span className="text-xs text-gray-500 font-mono">From: <span className="text-orange-300">{tx.fromAddress}</span></span>
                                <span className="text-xs text-green-400 font-mono px-2 py-1 bg-gray-800 rounded">{tx.functionCalled}</span>
                            </div>
                            <div className="pt-2">
                                <span className="text-xs text-gray-500">Arguments found inside transaction:</span>
                                <pre className="text-xs text-gray-300 font-mono mt-1 overflow-x-auto">
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
          <div className="bg-gray-800 p-8 rounded-xl border border-gray-700 shadow-xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between border-b border-gray-700 pb-4">
              <h2 className="text-2xl font-semibold text-white flex items-center space-x-3">
                <span className="h-3 w-3 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></span>
                <span>Blockchain Record Found</span>
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Transaction Hash</h3>
                <a 
                  href={`https://sepolia.etherscan.io/tx/${data.transactionHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all transition-colors underline decoration-blue-500/30 underline-offset-4"
                >
                  {data.transactionHash.substring(0, 12)}...{data.transactionHash.substring(54)}
                </a>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</h3>
                <span className={`inline-flex items-center space-x-1.5 px-3 py-1 text-xs font-semibold rounded-full border ${data.status === 'Success' ? 'bg-green-900/30 text-green-400 border-green-500/50' : 'bg-red-900/30 text-red-400 border-red-500/50'}`}>
                  {data.status === 'Success' && <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>}
                  {data.status === 'Failed' && <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>}
                  <span>{data.status || 'Success'}</span>
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Timestamp</h3>
                <p className="text-gray-200 text-sm font-mono">{data.timestamp ? new Date(data.timestamp * 1000).toLocaleString() : 'N/A'}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Block Number</h3>
                <p className="text-gray-200 font-mono text-sm">{data.blockNumber}</p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Relayer Address</h3>
                <a 
                  href={`https://sepolia.etherscan.io/address/${data.fromAddress}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-400 hover:text-blue-300 font-mono text-sm break-all transition-colors"
                >
                  {data.fromAddress ? `${data.fromAddress.substring(0, 8)}...${data.fromAddress.substring(36)}` : 'N/A'}
                </a>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Network Fee (Gas)</h3>
                <p className="text-gray-200 font-mono text-sm">
                  {data.gasUsed && data.effectiveGasPrice ? (Number(data.gasUsed) * Number(data.effectiveGasPrice) / 1e18).toFixed(6) + ' ETH' : 'N/A'}
                </p>
              </div>

              <div className="space-y-2 md:col-span-2 lg:col-span-3 pt-4 border-t border-gray-700/50">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Smart Contract Function Called</h3>
                <span className="inline-block mt-2 px-4 py-1.5 bg-gray-900 text-green-400 text-sm font-mono rounded-lg border border-gray-700 shadow-inner">
                  {data.submittedData.functionCalled}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-gray-700/50">
              <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider flex items-center space-x-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
                </svg>
                <span>Decrypted Raw Input (Arguments)</span>
              </h3>
              <div className="bg-gray-950 rounded-xl p-6 border border-gray-700 shadow-inner overflow-x-auto">
                <pre className="text-sm text-green-400 font-mono leading-relaxed">
                  {JSON.stringify(data.submittedData.arguments, null, 2)}
                </pre>
              </div>
              <p className="text-xs text-gray-500 text-right mt-2">*This is the exact data pulled and decoded directly from the blockchain block.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
