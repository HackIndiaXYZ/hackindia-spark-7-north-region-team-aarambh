import { AegisAuth } from '../chunk-2IJSXFJB.js';
export { AegisAuth, AegisAuthError, InvalidAddressError, RPCError, UnsupportedChainError, VerificationError, createAegisAuth } from '../chunk-2IJSXFJB.js';
import { useState, useRef, useEffect, useCallback } from 'react';

function useAegisAuth(address, config) {
  const [isVerified, setIsVerified] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const clientRef = useRef(null);
  useEffect(() => {
    if (!clientRef.current) {
      clientRef.current = new AegisAuth(config);
    }
  }, [config.provider, config.contractAddress, config.chainId]);
  const checkStatus = useCallback(async (wallet) => {
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
  const refresh = useCallback(async () => {
    if (!address || !clientRef.current) return;
    clientRef.current.clearCache(address);
    await checkStatus(address);
  }, [address, checkStatus]);
  useEffect(() => {
    if (address && address.length === 42) {
      checkStatus(address);
    } else {
      setIsVerified(null);
      setError(null);
    }
  }, [address, checkStatus]);
  return { isVerified, loading, error, refresh };
}

export { useAegisAuth };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map