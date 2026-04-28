'use strict';

var chunkVRP2WGNR_cjs = require('../chunk-VRP2WGNR.cjs');

// src/express/middleware.ts
function aegisAuthMiddleware(options) {
  if (!options?.client || !(options.client instanceof chunkVRP2WGNR_cjs.AegisAuth)) {
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
        throw new chunkVRP2WGNR_cjs.InvalidAddressError(walletAddress || "undefined");
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
      if (err instanceof chunkVRP2WGNR_cjs.InvalidAddressError && blockUnverified) {
        res.status(400).json({ error: "Bad Request", message: err.message });
      } else {
        res.status(500).json({ error: "Internal Server Error", message: err.message || String(err) });
      }
    }
  };
}

Object.defineProperty(exports, "AegisAuth", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.AegisAuth; }
});
Object.defineProperty(exports, "AegisAuthError", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.AegisAuthError; }
});
Object.defineProperty(exports, "InvalidAddressError", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.InvalidAddressError; }
});
Object.defineProperty(exports, "RPCError", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.RPCError; }
});
Object.defineProperty(exports, "UnsupportedChainError", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.UnsupportedChainError; }
});
Object.defineProperty(exports, "VerificationError", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.VerificationError; }
});
Object.defineProperty(exports, "createAegisAuth", {
  enumerable: true,
  get: function () { return chunkVRP2WGNR_cjs.createAegisAuth; }
});
exports.aegisAuthMiddleware = aegisAuthMiddleware;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map