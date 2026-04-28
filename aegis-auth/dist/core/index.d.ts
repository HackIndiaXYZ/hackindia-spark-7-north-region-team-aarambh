import * as express from 'express';

interface AegisAuthConfig {
    /** The Ethers provider to use. Type loosely to allow generic Web3 Providers (v5 or v6). */
    provider: any;
    /** Address of the AegisID contract. */
    contractAddress: string;
    /** Expected Network Chain ID. */
    chainId: number;
    /** Optional default ABI override. */
    abiOverride?: any[];
    /** Fallback RPC URLs. */
    rpcUrls?: string[];
    /** Local in-memory caching time (in milliseconds) to prevent RPC spam. Default: 60000ms. */
    cacheTTL?: number;
}
interface VerificationResult {
    isVerified: boolean;
    address: string;
    timestamp: number;
    fromCache: boolean;
}
interface CacheEntry {
    isVerified: boolean;
    timestamp: number;
}
interface MiddlewareOptions {
    client: AegisAuth;
    extractWallet: (req: express.Request) => string | undefined;
    onFailedVerification?: (req: express.Request, res: express.Response, next: express.NextFunction) => void;
    blockUnverified?: boolean;
}

declare class AegisAuth {
    private config;
    private cache;
    private ethersContract;
    private isEthersV6;
    constructor(config: AegisAuthConfig);
    private validateChain;
    private getContract;
    /**
     * Clear the local RPC cache for specific wallet or entirely
     */
    clearCache(address?: string): void;
    private validateAddress;
    /**
     * Verifies if a wallet address has on-chain KYC via AegisID contract
     */
    checkVerification(address: string): Promise<VerificationResult>;
}
declare function createAegisAuth(config: AegisAuthConfig): AegisAuth;

declare class AegisAuthError extends Error {
    constructor(message: string);
}
declare class UnsupportedChainError extends AegisAuthError {
    constructor(expectedChainId: number, actualChainId: number | string);
}
declare class InvalidAddressError extends AegisAuthError {
    constructor(address: string);
}
declare class RPCError extends AegisAuthError {
    constructor(originalError: Error);
}
declare class VerificationError extends AegisAuthError {
    constructor(message: string);
}

export { AegisAuth, type AegisAuthConfig, AegisAuthError, type CacheEntry, InvalidAddressError, type MiddlewareOptions, RPCError, UnsupportedChainError, VerificationError, type VerificationResult, createAegisAuth };
