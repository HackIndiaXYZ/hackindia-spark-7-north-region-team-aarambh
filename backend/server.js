require('dotenv').config();
const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
const mongoose = require('mongoose');
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');

const KycSession = require('./models/KycSession');

const app = express();
app.use(cors());
app.use(express.json());

// Configure Multer for in-memory file handling
const storage = multer.memoryStorage();
const upload = multer({ storage });

// AES-256 Encryption Setup
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // Must be 256 bits (32 characters)
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    console.error("CRITICAL: Invalid or missing ENCRYPTION_KEY in environment variables.");
    process.exit(1);
}

const ALGORITHM = 'aes-256-cbc';

function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(buffer);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
}

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

// Verification Endpoint
app.post('/api/kyc/verify', upload.fields([{ name: 'idImage', maxCount: 1 }, { name: 'selfie', maxCount: 1 }]), async (req, res) => {
    try {
        const { walletAddress } = req.body;
        const idImage = req.files['idImage'] ? req.files['idImage'][0] : null;
        const selfie = req.files['selfie'] ? req.files['selfie'][0] : null;

        if (!walletAddress || !idImage || !selfie) {
            return res.status(400).json({ error: 'Wallet address, ID image, and selfie are required.' });
        }

        // 1. Immediately Encrypt Images
        const encryptedId = encryptBuffer(idImage.buffer);
        const encryptedSelfie = encryptBuffer(selfie.buffer);
        
        const encIdStr = encryptedId.iv + ':' + encryptedId.encryptedData;
        const encSelfieStr = encryptedSelfie.iv + ':' + encryptedSelfie.encryptedData;

        // 2. Store off-chain in MongoDB
        const sessionId = uuidv4();
        const newSession = new KycSession({
            sessionId,
            walletAddress,
            encryptedIdImage: encIdStr,
            encryptedSelfieImage: encSelfieStr,
            iv: encryptedId.iv // legacy field, kept for schema compliance
        });
        await newSession.save();

        // 3. Call Python AI Microservice
        // Security note: Node and Python microservices must communicate over a secure internal network.
        const aiPayload = {
            idImageBase64: idImage.buffer.toString('base64'),
            selfieBase64: selfie.buffer.toString('base64')
        };

        const aiResponse = await axios.post(process.env.PYTHON_AI_URL || 'http://localhost:8000/process_biometrics', aiPayload, {
            headers: { 'Content-Type': 'application/json' }
        });

        const { biometricHash, verified, error } = aiResponse.data;

        if (!verified) {
            newSession.status = 'FAILED';
            await newSession.save();
            return res.status(400).json({ error: 'Biometric verification failed: ' + (error || 'Mismatch') });
        }

        // 4. Update session status
        newSession.status = 'VERIFIED';
        await newSession.save();

        // 5. Return success and the hash
        return res.json({
            success: true,
            message: 'KYC Verification Successful',
            biometricHash: biometricHash
        });

    } catch (error) {
        console.error('KYC Verification Error:', error);
        res.status(500).json({ error: 'Internal server error during verification.' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
});
