import { AegisAuthConfig, VerificationResult, CacheEntry } from "../types";
import { UnsupportedChainError, InvalidAddressError, RPCError, VerificationError, AegisAuthError } from "../errors";

// Minimal default ABI to reduce bundle size if not overridden
const DEFAULT_ABI = [
  "function checkVerification(address _user) external view returns (bool)"
];

export class AegisAuth {
  private config: AegisAuthConfig;
  private cache: Map<string, CacheEntry>;
  private ethersContract: any;
  private isEthersV6: boolean;

  constructor(config: AegisAuthConfig) {
    if (!config.provider) {
      throw new Error("A provider is required for AegisAuth client initialization.");
    }
    if (!config.contractAddress) {
      throw new Error("A contractAddress is required for AegisAuth client initialization.");
    }
    
    this.config = {
      cacheTTL: 60000, // default 1 minute
      abiOverride: DEFAULT_ABI,
      ...config
    };
    this.cache = new Map();

    // Dynamically check ethers type/version to support v5 & v6 smoothly
    // We instantiate lazily during getContract()
    this.isEthersV6 = !!this.config.provider.getNetwork;
  }

  private async validateChain(): Promise<void> {
    try {
      let network;
      
      // Handle ethers v6 vs ethers v5
      if (typeof this.config.provider.getNetwork === 'function') {
        network = await this.config.provider.getNetwork();
      } else if (this.config.provider.network) {
        network = this.config.provider.network;
      }

      const chainId = network?.chainId ? Number(network.chainId) : 0;
      
      // If we could determine the chain ID and it doesn't match the expected config
      if (chainId !== 0 && chainId !== this.config.chainId) {
        throw new UnsupportedChainError(this.config.chainId, chainId);
      }
    } catch (err: any) {
      if (err instanceof UnsupportedChainError) throw err;
      throw new RPCError(err);
    }
  }

  private async getContract(): Promise<any> {
    if (!this.ethersContract) {
      await this.validateChain();
      
      // Fallback require ethers just for parsing (we rely on provider passed in to avoid direct ethers imports if possible,
      // but in core SDK we assume standard ethers setup logic). 
      let ContractClass: any;
      try {
          const ethers = await import('ethers');
          ContractClass = ethers.Contract;
      } catch (e: any) {
          throw new Error("Ethers library is required. Please install 'ethers' as a dependency.");
      }

      this.ethersContract = new ContractClass(
        this.config.contractAddress,
        this.config.abiOverride!,
        this.config.provider
      );
    }
    return this.ethersContract;
  }

  /**
   * Clear the local RPC cache for specific wallet or entirely
   */
  public clearCache(address?: string) {
    if (address) {
      this.cache.delete(address.toLowerCase());
    } else {
      this.cache.clear();
    }
  }

  private validateAddress(address: string) {
    if (!address || typeof address !== 'string' || !address.startsWith('0x') || address.length !== 42) {
      throw new InvalidAddressError(address);
    }
  }

  /**
   * Verifies if a wallet address has on-chain KYC via AegisID contract
   */
  public async checkVerification(address: string): Promise<VerificationResult> {
    this.validateAddress(address);
    const normalizedAddress = address.toLowerCase();

    // Check hit in TTL Cache
    const cached = this.cache.get(normalizedAddress);
    const now = Date.now();
    if (cached && (this.config.cacheTTL !== undefined && (now - cached.timestamp < this.config.cacheTTL))) {
      return {
        isVerified: cached.isVerified,
        address: normalizedAddress,
        timestamp: cached.timestamp,
        fromCache: true
      };
    }

    // Cache Miss or Expired
    try {
      const contract = await this.getContract();
      
      // Standard call
      const isVerified = await contract.checkVerification(address);

      // Store in cache
      this.cache.set(normalizedAddress, {
        isVerified,
        timestamp: now,
      });

      return {
        isVerified,
        address: normalizedAddress,
        timestamp: now,
        fromCache: false
      };
    } catch (err: any) {
      if (err instanceof AegisAuthError) throw err;
      throw new VerificationError(err.message || 'Unknown verification error occurred.');
    }
  }
}

export function createAegisAuth(config: AegisAuthConfig): AegisAuth {
  return new AegisAuth(config);
}
