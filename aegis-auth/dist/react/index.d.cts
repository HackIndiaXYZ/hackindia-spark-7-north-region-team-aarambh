import { AegisAuthConfig } from '../core/index.cjs';
export { AegisAuth, AegisAuthError, CacheEntry, InvalidAddressError, MiddlewareOptions, RPCError, UnsupportedChainError, VerificationError, VerificationResult, createAegisAuth } from '../core/index.cjs';
import 'express';

interface UseAegisAuthResult {
    isVerified: boolean | null;
    loading: boolean;
    error: Error | null;
    refresh: () => Promise<void>;
}
declare function useAegisAuth(address: string | null | undefined, config: AegisAuthConfig): UseAegisAuthResult;

export { AegisAuthConfig, useAegisAuth };
