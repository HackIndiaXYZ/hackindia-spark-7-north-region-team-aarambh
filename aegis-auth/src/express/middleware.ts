import { Request, Response, NextFunction, RequestHandler } from 'express';
import { AegisAuth } from '../core/client';
import { MiddlewareOptions } from '../types';
import { InvalidAddressError } from '../errors';

// Extend Express Request Type
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

export function aegisAuthMiddleware(options: MiddlewareOptions): RequestHandler {
  if (!options?.client || !(options.client instanceof AegisAuth)) {
    throw new Error('AegisAuth middleware requires a valid AegisAuth client instance.');
  }

  const {
    client,
    extractWallet,
    onFailedVerification,
    blockUnverified = true, // by default, auto-block 403
  } = options;

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const walletAddress = extractWallet(req);

      if (!walletAddress || typeof walletAddress !== 'string' || walletAddress.length !== 42) {
        throw new InvalidAddressError(walletAddress || 'undefined');
      }

      // Core SDK call (automatically handles TTL Caching)
      const result = await client.checkVerification(walletAddress);

      // Attach context to request for inner routes
      req.aegis = {
        ...result,
      };

      if (!result.isVerified && blockUnverified) {
        if (onFailedVerification) {
          onFailedVerification(req, res, next);
        } else {
          res.status(403).json({
            error: 'Authorization Failed',
            message: 'Wallet address has not passed AegisID KYC verification on-chain.'
          });
        }
        return; // Prevent next from running on 403
      }

      next();
    } catch (err: any) {
      if (err instanceof InvalidAddressError && blockUnverified) {
        res.status(400).json({ error: 'Bad Request', message: err.message });
      } else {
        // Internal Server Error / RPC Error
        res.status(500).json({ error: 'Internal Server Error', message: err.message || String(err) });
      }
    }
  };
}
