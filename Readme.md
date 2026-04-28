# 🛡️ AegisID: Web3 KYC & Decentralized Identity Platform

AegisID is a secure, private, and decentralized Web3 KYC platform. It allows users to prove their identity and device uniqueness *once*, minting a zero-knowledge cryptographic proof to the blockchain. This ensures users never have to expose their sensitive personal data to individual dApps repeatedly, while providing dApps with a Sybil-resistant, verified user base.

## 🏗️ Architecture & Tech Stack

AegisID is built using a modern, containerized microservices architecture:

1. **Frontend (Next.js, Tailwind CSS, Ethers.js)**
   - Connects to Web3 wallets (MetaMask).
   - Manages the UI for the dual-verification flow.
   - Integrates **Sumsub WebSDK** for document and liveness KYC.
   - Integrates **World ID (IDKit)** for device uniqueness and personhood verification.

2. **Backend API (Express.js, MongoDB)**
   - Securely generates Sumsub access tokens without exposing secrets to the frontend.
   - Receives Webhooks from Sumsub upon KYC completion.
   - Generates a secure `proofHash` (SHA-256 hash of the user's ID, wallet address, and a secret salt).
   - Exposes an API endpoint (`/api/verify/:wallet`) for dApps to query verification status off-chain.

3. **Blockchain Gasless Relayer (Express.js, Ethers.js)**
   - A dedicated relayer service that removes friction for users entering Web3.
   - Accepts the `proofHash` and the user's `walletAddress`.
   - Uses a funded backend wallet to broadcast the transaction to the blockchain, meaning the user pays **zero gas fees** to mint their KYC proof.

4. **Smart Contract (Solidity)**
   - Deployed on Ethereum/EVM-compatible networks (e.g., Sepolia).
   - Stores an on-chain `mapping(address => Identity)`.
   - The `Identity` struct holds the `identityHash`, a boolean `isVerified`, and a `timestamp`.
   - Exposes `checkVerification(address)` for external dApps to instantly verify a user's status.

5. **Infrastructure**
   - Fully dockerized environment using `docker-compose.yml`.

## 🔄 The Verification Flow

1. **Connect Wallet:** The user connects their MetaMask wallet on the frontend.
2. **Step 1: Real-World KYC:** The user completes a traditional KYC check (Document + Liveness) embedded via the Sumsub WebSDK.
3. **Step 2: Proof of Personhood:** The user validates their physical device uniqueness using Worldcoin's IDKit.
4. **Zero-Knowledge Hash Generation:** The backend receives the successful verification and generates an irreversible `proofHash`. No Personally Identifiable Information (PII) is stored.
5. **Gasless Minting:** The frontend requests the Relayer to save the proof on-chain. The Relayer pays the gas fee and updates the smart contract mapping.
6. **dApp Verification:** Any DeFi protocol, NFT mint, or airdrop contract can query `AegisID.checkVerification(user)` to ensure the user is real and unique.

## 🚀 Setup & Installation

### Prerequisites
- Docker and Docker Compose installed.
- Node.js (if running locally without Docker).

### Environment Variables
You need to configure the `.env` files in the respective directories.

**Backend (`backend/.env`)**
```env
PORT=3001
MONGODB_URI=mongodb://mongodb:27017/aegisid
SUMSUB_APP_TOKEN=your_sumsub_app_token
SUMSUB_SECRET_KEY=your_sumsub_secret_key
SECRET_SALT=your_secure_random_salt
```

**Blockchain Relayer (`blockchain/.env`)**
```env
PORT=3002
RPC_URL=your_ethereum_rpc_url
PRIVATE_KEY=your_relayer_wallet_private_key
CONTRACT_ADDRESS=deployed_aegisid_contract_address
```

**Frontend (`frontend/.env.local` or via docker-compose build args)**
```env
NEXT_PUBLIC_WLD_APP_ID=your_world_id_app_id
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_BLOCKCHAIN_URL=http://localhost:3002
```

### Running with Docker

The easiest way to run the entire stack is using Docker Compose from the root directory:

```bash
docker-compose up --build
```

This will spin up:
- MongoDB database on port `27017`
- Backend API on port `3001`
- Blockchain Relayer on port `3002`
- Frontend UI on port `3000`

Access the application by navigating to `http://localhost:3000` in your browser.

## 📜 Smart Contract Functions

- `registerIdentityFor(address _user, bytes32 _hash)`: Callable only by the relayer to register an identity without the user paying gas.
- `registerIdentity(bytes32 _hash)`: Callable by the user if they wish to pay their own gas.
- `revokeIdentity()`: Allows a user to revoke their verification status (e.g., if their wallet is compromised).
- `checkVerification(address _user) returns (bool)`: Public view function for integrating dApps.