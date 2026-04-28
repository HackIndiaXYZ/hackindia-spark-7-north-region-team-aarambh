export class AegisAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class UnsupportedChainError extends AegisAuthError {
  constructor(expectedChainId: number, actualChainId: number | string) {
    super(`Unsupported chain: Expected ${expectedChainId}, but got ${actualChainId}.`);
  }
}

export class InvalidAddressError extends AegisAuthError {
  constructor(address: string) {
    super(`Invalid Ethereum address provided: ${address}`);
  }
}

export class RPCError extends AegisAuthError {
  constructor(originalError: Error) {
    super(`RPC connection failed: ${originalError.message}`);
    this.cause = originalError;
  }
}

export class VerificationError extends AegisAuthError {
  constructor(message: string) {
    super(`On-chain verification failed: ${message}`);
  }
}
