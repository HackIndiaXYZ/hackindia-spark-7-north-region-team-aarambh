'use strict';

// src/errors/index.ts
var AegisAuthError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
};
var UnsupportedChainError = class extends AegisAuthError {
  constructor(expectedChainId, actualChainId) {
    super(`Unsupported chain: Expected ${expectedChainId}, but got ${actualChainId}.`);
  }
};
var InvalidAddressError = class extends AegisAuthError {
  constructor(address) {
    super(`Invalid Ethereum address provided: ${address}`);
  }
};
var RPCError = class extends AegisAuthError {
  constructor(originalError) {
    super(`RPC connection failed: ${originalError.message}`);
    this.cause = originalError;
  }
};
var VerificationError = class extends AegisAuthError {
  constructor(message) {
    super(`On-chain verification failed: ${message}`);
  }
};

// src/core/client.ts
var DEFAULT_ABI = [
  "function checkVerification(address _user) external view returns (bool)"
];
var AegisAuth = class {
  config;
  cache;
  ethersContract;
  isEthersV6;
  constructor(config) {
    if (!config.provider) {
      throw new Error("A provider is required for AegisAuth client initialization.");
    }
    if (!config.contractAddress) {
      throw new Error("A contractAddress is required for AegisAuth client initialization.");
    }
    this.config = {
      cacheTTL: 6e4,
      // default 1 minute
      abiOverride: DEFAULT_ABI,
      ...config
    };
    this.cache = /* @__PURE__ */ new Map();
    this.isEthersV6 = !!this.config.provider.getNetwork;
  }
  async validateChain() {
    try {
      let network;
      if (typeof this.config.provider.getNetwork === "function") {
        network = await this.config.provider.getNetwork();
      } else if (this.config.provider.network) {
        network = this.config.provider.network;
      }
      const chainId = network?.chainId ? Number(network.chainId) : 0;
      if (chainId !== 0 && chainId !== this.config.chainId) {
        throw new UnsupportedChainError(this.config.chainId, chainId);
      }
    } catch (err) {
      if (err instanceof UnsupportedChainError) throw err;
      throw new RPCError(err);
    }
  }
  async getContract() {
    if (!this.ethersContract) {
      await this.validateChain();
      let ContractClass;
      try {
        const ethers = await import('ethers');
        ContractClass = ethers.Contract;
      } catch (e) {
        throw new Error("Ethers library is required. Please install 'ethers' as a dependency.");
      }
      this.ethersContract = new ContractClass(
        this.config.contractAddress,
        this.config.abiOverride,
        this.config.provider
      );
    }
    return this.ethersContract;
  }
  /**
   * Clear the local RPC cache for specific wallet or entirely
   */
  clearCache(address) {
    if (address) {
      this.cache.delete(address.toLowerCase());
    } else {
      this.cache.clear();
    }
  }
  validateAddress(address) {
    if (!address || typeof address !== "string" || !address.startsWith("0x") || address.length !== 42) {
      throw new InvalidAddressError(address);
    }
  }
  /**
   * Verifies if a wallet address has on-chain KYC via AegisID contract
   */
  async checkVerification(address) {
    this.validateAddress(address);
    const normalizedAddress = address.toLowerCase();
    const cached = this.cache.get(normalizedAddress);
    const now = Date.now();
    if (cached && (this.config.cacheTTL !== void 0 && now - cached.timestamp < this.config.cacheTTL)) {
      return {
        isVerified: cached.isVerified,
        address: normalizedAddress,
        timestamp: cached.timestamp,
        fromCache: true
      };
    }
    try {
      const contract = await this.getContract();
      const isVerified = await contract.checkVerification(address);
      this.cache.set(normalizedAddress, {
        isVerified,
        timestamp: now
      });
      return {
        isVerified,
        address: normalizedAddress,
        timestamp: now,
        fromCache: false
      };
    } catch (err) {
      if (err instanceof AegisAuthError) throw err;
      throw new VerificationError(err.message || "Unknown verification error occurred.");
    }
  }
};
function createAegisAuth(config) {
  return new AegisAuth(config);
}

exports.AegisAuth = AegisAuth;
exports.AegisAuthError = AegisAuthError;
exports.InvalidAddressError = InvalidAddressError;
exports.RPCError = RPCError;
exports.UnsupportedChainError = UnsupportedChainError;
exports.VerificationError = VerificationError;
exports.createAegisAuth = createAegisAuth;
//# sourceMappingURL=chunk-VRP2WGNR.cjs.map
//# sourceMappingURL=chunk-VRP2WGNR.cjs.map