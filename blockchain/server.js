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

// ABI (Subset needed for relayer)
const CONTRACT_ABI = [
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

app.listen(PORT, () => {
    console.log(`AegisID Blockchain Relayer running on port ${PORT}`);
    console.log(`RPC URL: ${RPC_URL}`);
    console.log(`Contract Address: ${CONTRACT_ADDRESS || "Not Set (Mock Mode)"}`);
});
