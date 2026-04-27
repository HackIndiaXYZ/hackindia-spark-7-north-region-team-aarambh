require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { ethers } = require('ethers');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const PORT = process.env.PORT || 3002;
const CONTRACT_ADDRESS = process.env.CONTRACT_ADDRESS; 
const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545"; // Default local hardhat node
const PRIVATE_KEY = process.env.PRIVATE_KEY; // Relayer wallet

// ABI (Subset needed for relayer and admin dashboard)
const CONTRACT_ABI = [
    "event IdentityRegistered(address indexed user, uint256 timestamp)",
    "function registerIdentity(bytes32 _hash) external",
    "function registerIdentityFor(address _user, bytes32 _hash) external",
    "function checkVerification(address _user) external view returns (bool)"
];

let provider, signer, contract;

if (PRIVATE_KEY && CONTRACT_ADDRESS) {
    provider = new ethers.JsonRpcProvider(RPC_URL);
    signer = new ethers.Wallet(PRIVATE_KEY, provider);
    contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
} else {
    console.warn("WARNING: PRIVATE_KEY or CONTRACT_ADDRESS not set. Running in mock simulation mode.");
}

// Endpoint to save proof gasless
app.post('/api/save-proof', async (req, res) => {
    const { walletAddress, proofHash } = req.body;

    if (!walletAddress || !proofHash) {
        return res.status(400).json({ error: "walletAddress and proofHash are required." });
    }

    try {
        if (!contract) {
            // Mock mode if not configured
            console.log(`[Mock Relayer] Relaying tx for user: ${walletAddress}, hash: ${proofHash}`);
            await new Promise(r => setTimeout(r, 2000));
            const mockTxHash = "0x" + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
            return res.json({ 
                success: true, 
                txHash: mockTxHash,
                block: Math.floor(Math.random() * 1000000) + 15000000,
                network: "Mock Relayer Network"
            });
        }

        // Real Relayer mode
        console.log(`[Relayer] Sending transaction for ${walletAddress}...`);
        
        // Check if already verified to prevent revert errors causing loss of gas
        const isVerified = await contract.checkVerification(walletAddress);
        if (isVerified) {
            return res.status(400).json({ error: "User is already verified on-chain." });
        }

        const tx = await contract.registerIdentityFor(walletAddress, proofHash);
        console.log(`[Relayer] Transaction broadcasted: ${tx.hash}`);
        
        const receipt = await tx.wait();
        console.log(`[Relayer] Transaction confirmed in block ${receipt.blockNumber}`);

        res.json({
            success: true,
            txHash: receipt.hash,
            block: receipt.blockNumber,
            network: "Ethereum/Polygon Node"
        });

    } catch (error) {
        console.error("[Relayer Error]", error);
        res.status(500).json({ error: "Failed to relay transaction to blockchain.", details: error.message });
    }
});

// Admin Dashboard Endpoint: Get transaction and decode inputs for a wallet
app.get('/api/admin/user-data/:walletAddress', async (req, res) => {
    try {
        const walletAddress = req.params.walletAddress;

        // Ensure the provided string is a valid Ethereum address, not a hash
        if (!ethers.isAddress(walletAddress)) {
            return res.status(400).json({ error: "Invalid Wallet Address format. Please ensure you are pasting the user's public wallet address (0x...), not a transaction hash." });
        }

        if (!contract) {
             return res.status(503).json({ error: "Blockchain connection not configured (running in mock mode)." });
        }

        // Since the smart contract was likely deployed with a bug that emits `msg.sender` (relayer) 
        // instead of the actual `_user` in the IdentityRegistered event, we must fetch ALL recent
        // registration events and inspect the raw transaction data to find the matching user.
        
        // Public RPCs usually limit queries to 50,000 blocks. We search the last 49,000.
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = currentBlock > 49000 ? currentBlock - 49000 : 0;
        
        // Filter WITHOUT the specific user wallet (fetch all registrations)
        const filter = contract.filters.IdentityRegistered();
        const logs = await contract.queryFilter(filter, fromBlock, 'latest');

        let targetTxHash = null;
        let parsedTx = null;
        let targetTx = null;

        // Loop backwards (most recent first) to find the one matching the wallet
        const allRecentTransactions = [];

        for (let i = logs.length - 1; i >= 0; i--) {
            const log = logs[i];
            const tx = await provider.getTransaction(log.transactionHash);
            
            let decoded = null;
            try {
                decoded = contract.interface.parseTransaction({ data: tx.data });
                
                // Add to debug list
                allRecentTransactions.push({
                    transactionHash: log.transactionHash,
                    functionCalled: decoded ? decoded.name : "Unknown",
                    arguments: decoded ? decoded.args.map(a => a.toString()) : [],
                    fromAddress: tx.from
                });
            } catch(e) {
                 allRecentTransactions.push({
                    transactionHash: log.transactionHash,
                    functionCalled: "Failed to decode",
                    arguments: [],
                    fromAddress: tx ? tx.from : "Unknown"
                });
            }
            
            if (decoded) {
                let foundMatch = false;
                if (decoded.name === "registerIdentityFor" && decoded.args[0].toLowerCase() === walletAddress.toLowerCase()) {
                    foundMatch = true;
                } else if (decoded.name === "registerIdentity" && tx.from.toLowerCase() === walletAddress.toLowerCase()) {
                    foundMatch = true;
                }

                if (foundMatch && !targetTxHash) {
                    targetTxHash = log.transactionHash;
                    parsedTx = decoded;
                    targetTx = tx;
                    // We don't break anymore so we can collect all recent txs for the debug payload
                }
            }
        }

        if (!targetTxHash) {
            return res.status(404).json({ 
                message: "No data found specifically for your wallet address in the recent blocks.",
                recentTransactions: allRecentTransactions // Send this back so the UI can display what IS there
            });
        }

        // 5. Send the formatted rows back to admin dashboard
        res.json({
            success: true,
            walletId: walletAddress,
            transactionHash: targetTxHash,
            blockNumber: targetTx.blockNumber,
            submittedData: {
                functionCalled: parsedTx.name,
                arguments: parsedTx.args.map(arg => arg.toString())
            }
        });

    } catch (error) {
        console.error("[Admin Error] fetching blockchain data:", error);
        res.status(500).json({ error: "Failed to decode blockchain data", details: error.message });
    }
});

// Debug Endpoint: Get raw transaction input data
app.get('/api/admin/debug-tx/:txHash', async (req, res) => {
    try {
        const txHash = req.params.txHash;
        const tx = await provider.getTransaction(txHash);
        if (!tx) return res.status(404).json({ error: "Tx not found" });
        
        let decoded = null;
        try {
            decoded = contract.interface.parseTransaction({ data: tx.data });
        } catch(e) {}
        
        res.json({
            hash: txHash,
            from: tx.from,
            to: tx.to,
            data: tx.data,
            decoded: decoded ? {
                name: decoded.name,
                args: decoded.args.map(a => a.toString())
            } : "Could not decode"
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.listen(PORT, () => {
    console.log(`AegisID Blockchain Relayer running on port ${PORT}`);
    console.log(`RPC URL: ${RPC_URL}`);
    console.log(`Contract Address: ${CONTRACT_ADDRESS || "Not Set (Mock Mode)"}`);
});
