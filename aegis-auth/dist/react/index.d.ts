import { AegisAuthConfig } from '../core/index.js';
export { AegisAuth, AegisAuthError, CacheEntry, InvalidAddressError, MiddlewareOptions, RPCError, UnsupportedChainError, VerificationError, VerificationResult, createAegisAuth } from '../core/index.js';
import 'express';

interface UseAegisAuthResult {
    isVerified: boolean | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}
declare function useAegisAuth(address: string | null | undefined, config: AegisAuthConfig): UseAegisAuthResult;

export { AegisAuthConfig, useAegisAuth };
