import { AegisAuth, InvalidAddressError } from '../chunk-2IJSXFJB.js';
export { AegisAuth, AegisAuthError, InvalidAddressError, RPCError, UnsupportedChainError, VerificationError, createAegisAuth } from '../chunk-2IJSXFJB.js';

// src/express/middleware.ts
function aegisAuthMiddleware(options) {
  if (!options?.client || !(options.client instanceof AegisAuth)) {
    throw new Error("AegisAuth middleware requires a valid AegisAuth client instance.");
  }
  const {
    client,
    extractWallet,
    onFailedVerification,
    blockUnverified = true
    // by default, auto-block 403
  } = options;
  return async (req, res, next) => {
    try {
      const walletAddress = extractWallet(req);
      if (!walletAddress || typeof walletAddress !== "string" || walletAddress.length !== 42) {
        throw new InvalidAddressError(walletAddress || "undefined");
      }
      const result = await client.checkVerification(walletAddress);
      req.aegis = {
        ...result
      };
      if (!result.isVerified && blockUnverified) {
        if (onFailedVerification) {
          onFailedVerification(req, res, next);
        } else {
          res.status(403).json({
            error: "Authorization Failed",
            message: "Wallet address has not passed AegisID KYC verification on-chain."
          });
        }
        return;
      }
      next();
    } catch (err) {
      if (err instanceof InvalidAddressError && blockUnverified) {
        res.status(400).json({ error: "Bad Request", message: err.message });
      } else {
        res.status(500).json({ error: "Internal Server Error", message: err.message || String(err) });
      }
    }
  };
}

export { aegisAuthMiddleware };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map