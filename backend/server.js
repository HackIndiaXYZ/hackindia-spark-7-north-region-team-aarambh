require('dotenv').config();
const express = require('express');
const crypto = require('crypto');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');

const User = require('./models/User');

const app = express();
app.use(cors());

// Webhook requires raw body for signature verification sometimes, but assuming json for now
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/aegisid', { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const SUMSUB_APP_TOKEN = process.env.SUMSUB_APP_TOKEN || 'dummy_token';
const SUMSUB_SECRET_KEY = process.env.SUMSUB_SECRET_KEY || 'dummy_secret';
const SECRET_SALT = process.env.SECRET_SALT || 'supersafesalt123';

// Helper function to create Sumsub API signature
function createSignature(method, path, body = '') {
    const ts = Math.floor(Date.now() / 1000);
    const signature = crypto.createHmac('sha256', SUMSUB_SECRET_KEY);
    signature.update(ts + method.toUpperCase() + path + (body ? body : ''));
    return {
        'X-App-Token': SUMSUB_APP_TOKEN,
        'X-App-Access-Sig': signature.digest('hex'),
        'X-App-Access-Ts': ts,
    };
}

// 1. Generate Access Token for WebSDK
app.post('/api/kyc/start', async (req, res) => {
    try {
        const { walletAddress } = req.body;
        if (!walletAddress) {
            return res.status(400).json({ error: 'Wallet address required' });
        }

        // Check if user exists, else create PENDING user
        let user = await User.findOne({ walletAddress });
        if (!user) {
            user = new User({ walletAddress, status: 'PENDING' });
            await user.save();
        }

        // Provide an externalUserId to Sumsub (we use walletAddress + timestamp for infinite hackathon testing)
        const externalUserId = `${walletAddress}_${Date.now()}`;
        const levelName = 'basic-kyc-level'; // Assume this level exists in Sumsub

        // The path to generate an access token
        const path = `/resources/accessTokens?userId=${externalUserId}&levelName=${levelName}`;
        const headers = {
            ...createSignature('POST', path),
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };

        const response = await axios({
            method: 'post',
            url: `https://api.sumsub.com${path}`,
            headers: headers
        });
        
        return res.json({ token: response.data.token, userId: externalUserId });
    } catch (error) {
        const sumsubError = error.response?.data?.description || error.response?.data?.errorName || error.message;
        console.error('Error generating Sumsub token:', sumsubError);
        res.status(error.response?.status || 500).json({ 
            error: 'Failed to generate access token',
            details: sumsubError
        });
    }
});

// 2. Webhook to receive verification result
app.post('/api/kyc/webhook', async (req, res) => {
    try {
        // Here we should verify webhook signature. For brevity/mock, we assume it's valid.
        const payload = req.body;

        // Example payload type: 'applicantReviewed'
        if (payload.type === 'applicantReviewed') {
            // externalUserId looks like 0x123_1700000, we split to get the real wallet
            const walletAddress = payload.externalUserId.split('_')[0]; 
            const applicantId = payload.applicantId;
            const reviewResult = payload.reviewResult;

            if (reviewResult.reviewAnswer === 'GREEN') {
                // KYC Passed

                // Generate proofHash
                const proofHashInput = applicantId + walletAddress + SECRET_SALT;
                const proofHash = '0x' + crypto.createHash('sha256').update(proofHashInput).digest('hex');

                // Update user
                await User.findOneAndUpdate(
                    { walletAddress },
                    { 
                        kycId: applicantId, 
                        status: 'VERIFIED',
                        proofHash: proofHash
                    },
                    { upsert: true }
                );

                console.log(`User ${walletAddress} verified! ProofHash: ${proofHash}`);
            } else {
                // KYC Failed
                await User.findOneAndUpdate(
                    { walletAddress },
                    { status: 'FAILED' },
                    { upsert: true }
                );
            }
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('Webhook error:', error.message || error);
        res.status(500).json({ error: 'Internal Server Error processing webhook' });
    }
});

// Verification Endpoint for dApps
app.get('/api/verify/:wallet', async (req, res) => {
    try {
        const user = await User.findOne({ walletAddress: req.params.wallet });
        if (!user || user.status !== 'VERIFIED') {
            return res.json({ isVerified: false });
        }
        return res.json({ isVerified: true, proofHash: user.proofHash });
    } catch (error) {
        console.error('Error verifying wallet:', error.message || error);
        res.status(500).json({ error: 'Server error during verification' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
