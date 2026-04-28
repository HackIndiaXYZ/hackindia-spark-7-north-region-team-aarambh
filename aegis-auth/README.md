# AegisAuth — Web3 Verification SDK

`aegis-auth` is a production-ready Identity Verification SDK enabling frontend DApps and backend servers to quickly verify on-chain KYC identities issued by AegisID smart contracts.

The package focuses on providing secure, scalable on-chain status checking wrapped in strong error handling and intelligent RPC caching, completely abstracting complex contract instantiations.

**Privacy Note:** AegisAuth operates entirely through cryptographic attestations on-chain. It strictly guarantees you never interact with raw KYC data, Personal Identifiable Information (PII), or expose Private Keys out-of-bounds. It strictly returns a boolean verification result mapped to an address.

## Table of Contents
- [Installation](#installation)
- [Node.js (Core SDK)](#core-sdk-nodejs--agnostic)
- [React/Next.js (Hooks)](#frontend-react--nextjs)
- [Express Middleware](#backend-express-middleware)
- [Security & Rate Limiting](#security--rate-limiting)

## Installation

```bash
npm install aegis-auth ethers
```
*Note: `ethers` and `react` are peerDependencies allowing flexible support for v5/v6 structures.*

---

## Core SDK (Node.js / Agnostic)

The core client works anywhere and incorporates automatic TTL-caching to preserve your RPC rate limits.

```ts
import { createAegisAuth } from 'aegis-auth';
import { ethers } from 'ethers';

// Example: JSON RPC Provider
const provider = new ethers.providers.JsonRpcProvider(process.env.RPC_URL); // ethers v5
// const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // ethers v6 works too!

const aegisClient = createAegisAuth({
  provider,
  contractAddress: '0x1234567890ABCDEF1234567890abcdef12345678', // Your deployed AegisID contract
  chainId: 80001, // e.g., Polygon Mumbai (strictly validated)
  cacheTTL: 60000, // 1 minute local cache to prevent spamming RPC
});

// Check a wallet status directly
const { isVerified, timestamp, address } = await aegisClient.checkVerification('0xUserAddress...');
console.log(`User holds AegisID: ${isVerified}`);
```

---

## Frontend: React / Next.js

Import via the browser-safe `/react` subpath export. This assures Node APIs like `http` are dropped from frontend build artifacts via tree-shaking.

```tsx
import { useAegisAuth } from 'aegis-auth/react';
import { ethers } from 'ethers';

// A single static config to prevent constant React re-renders
const sdkConfig = {
  provider: new ethers.providers.Web3Provider(window.ethereum as any), 
  contractAddress: '0x123...',
  chainId: 80001,
};

export function Dashboard({ userWallet }) {
  const { isVerified, loading, error, refresh } = useAegisAuth(userWallet, sdkConfig);

  if (loading) return <p>Loading on-chain status...</p>;
  if (error) return <p>Network Error checking credentials: {error.message}</p>;

  return (
    <div>
      {isVerified ? (
        <SecureArea />
      ) : (
        <KYCPrompt onComplete={() => refresh()} />
      )}
    </div>
  );
}
```

---

## Backend: Express Middleware

Protect API routes by requiring a verified Web3 status. The middleware mounts `req.aegis` context.

```ts
import express from 'express';
import { createAegisAuth } from 'aegis-auth';
import { aegisAuthMiddleware } from 'aegis-auth/express';
import { ethers } from 'ethers';

const app = express();

// Instantiated globally using a backend provider
const client = createAegisAuth({
  provider: new ethers.providers.JsonRpcProvider(process.env.RPC_URL),
  contractAddress: process.env.CONTRACT_ADDRESS,
  chainId: parseInt(process.env.CHAIN_ID),
});

// Secure specific routes
// Checks the address (e.g., from an x-wallet-address HTTP header)
app.post('/api/protected', aegisAuthMiddleware({
  client,
  extractWallet: (req) => req.headers['x-wallet-address'] as string,
  blockUnverified: true // Automatically returns 403 HTTP status if not verified
}), (req, res) => {
  // Logic here only runs if the wallet has an on-chain AegisID!
  res.json({
    message: 'Welcome to the inner sanctum',
    aegisContext: req.aegis 
    // Contains: { address, isVerified: true, timestamp, fromCache } 
  });
});
```

---

## Error Handling

Custom specific errors to help you handle degraded networks and wrong Chain IDs.
```ts
import { UnsupportedChainError, InvalidAddressError } from 'aegis-auth';

try {
  await client.checkVerification('0x123');
} catch (err) {
  if (err instanceof UnsupportedChainError) {
    console.error('Wallet is connected to the wrong network! Switch to Polygon Mumbai.');
  }
}
```

## Security & Privacy Statement
`aegis-auth` operates statelessly on Web3 paradigms. It acts solely as an indexing verifier against public Ethereum-based ledgers. Ensure you only handle configuration containing Private Keys or Private RPCs within `.env` parameters explicitly restricted to Node contexts.

## License
MIT
