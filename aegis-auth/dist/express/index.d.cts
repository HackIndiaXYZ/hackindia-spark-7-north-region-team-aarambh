import { RequestHandler } from 'express';
import { MiddlewareOptions } from '../core/index.cjs';
export { AegisAuth, AegisAuthConfig, AegisAuthError, CacheEntry, InvalidAddressError, RPCError, UnsupportedChainError, VerificationError, VerificationResult, createAegisAuth } from '../core/index.cjs';

declare global {
    namespace Express {
        interface Request {
            aegis?: {
                address: string;
                isVerified: boolean;
                timestamp: number;
                fromCache: boolean;
            };
        }
    }
}
declare function aegisAuthMiddleware(options: MiddlewareOptions): RequestHandler;

export { MiddlewareOptions, aegisAuthMiddleware };
