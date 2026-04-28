'use strict';

var chunkVRP2WGNR_cjs = require('../chunk-VRP2WGNR.cjs');
var react = require('react');

function useAegisAuth(address, config) {
  const [isVerified, setIsVerified] = react.useState(null);
  const [loading, setLoading] = react.useState(false);
  const [error, setError] = react.useState(null);
  const clientRef = react.useRef(null);
  react.useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new chunkVRP2WGNR_cjs.AegisAuth(config);
    }
  }, [config.provider, config.contractAddress, config.chainId]);
  const checkStatus = react.useCallback(async (wallet) => {
    if (!clientRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const result = await clientRef.current.checkVerification(wallet);
      setIsVerified(result.isVerified);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsVerified(null);
    } finally {
      setLoading(false);
    }
  }, []);
  const refresh = react.useCallback(async () => {
    if (!address || !clientRef.current) return;
    clientRef.current.clearCache(address);
    await checkStatus(address);
  }, [address, checkStatus]);
  react.useEffect(() => {
    if (address && address.length === 42) {
      checkStatus(address);
    } else {
      setIsVerified(null);
      setError(null);
    }
  }, [address, checkStatus]);
  return { isVerified, loading, error, refresh };
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
exports.useAegisAuth = useAegisAuth;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map