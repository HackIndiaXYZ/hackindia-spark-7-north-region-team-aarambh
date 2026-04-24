const mongoose = require('mongoose');

const KycSessionSchema = new mongoose.Schema({
    sessionId: {
        type: String,
        required: true,
        unique: true
    },
    walletAddress: {
        type: String,
        required: true,
        index: true
    },
    encryptedIdImage: {
        type: String, // Base64 or Hex string of the encrypted blob
        required: true
    },
    encryptedSelfieImage: {
        type: String, // Base64 or Hex string of the encrypted blob
        required: true
    },
    iv: {
        type: String, // Initialization vector used for AES-256
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'VERIFIED', 'FAILED'],
        default: 'PENDING'
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // Automatically delete after 24 hours (optional, for security)
    }
});

module.exports = mongoose.model('KycSession', KycSessionSchema);
