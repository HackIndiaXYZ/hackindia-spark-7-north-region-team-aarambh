export interface AegisAuthConfig {
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

export interface VerificationResult {
  isVerified: boolean;
  address: string;
  timestamp: number;
  fromCache: boolean;
}

export interface CacheEntry {
  isVerified: boolean;
  timestamp: number;
}

export interface MiddlewareOptions {
  client: import('../core/client').AegisAuth;
  extractWallet: (req: import('express').Request) => string | undefined;
  onFailedVerification?: (req: import('express').Request, res: import('express').Response, next: import('express').NextFunction) => void;
  blockUnverified?: boolean;
}
