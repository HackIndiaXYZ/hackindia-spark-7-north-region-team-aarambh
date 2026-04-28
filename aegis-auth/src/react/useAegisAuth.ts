import { useState, useEffect, useCallback, useRef } from 'react';
import { AegisAuth } from '../core/client';
import { AegisAuthConfig } from '../types';

interface UseAegisAuthResult {
  isVerified: boolean | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

export function useAegisAuth(
  address: string | null | undefined, 
  config: AegisAuthConfig
): UseAegisAuthResult {
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  // Keep single instance of client to reuse cache
  const clientRef = useRef<AegisAuth | null>(null);

  useEffect(() => {
    if (!clientRef.current) {
        clientRef.current = new AegisAuth(config);
    }
  }, [config.provider, config.contractAddress, config.chainId]);

  const checkStatus = useCallback(async (wallet: string) => {
    if (!clientRef.current) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await clientRef.current.checkVerification(wallet);
      setIsVerified(result.isVerified);
    } catch (err: any) {
      setError(err instanceof Error ? err : new Error(String(err)));
      setIsVerified(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!address || !clientRef.current) return;
    // Clear local cache for this wallet to force an RPC call
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
