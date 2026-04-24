// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AegisID
 * @dev Secure, gas-optimized smart contract for Web3 KYC biometric proof storage.
 */
contract AegisID {
    struct Identity {
        bytes32 identityHash; // Biometric proof
        bool isVerified;      // Status
        uint256 timestamp;    // Verification time
    }

    // Mapping from user address to their KYC identity
    mapping(address => Identity) private identities;

    // Events
    event IdentityRegistered(address indexed user, uint256 timestamp);
    event IdentityRevoked(address indexed user, uint256 timestamp);

    error AlreadyVerified();
    error NotVerified();

    /**
     * @dev Allows a user to store their generated proof on-chain.
     * @param _hash The biometric hash (SHA-256) returned by the AI microservice.
     */
    function registerIdentity(bytes32 _hash) external {
        if (identities[msg.sender].isVerified) {
            revert AlreadyVerified();
        }

        identities[msg.sender] = Identity({
            identityHash: _hash,
            isVerified: true,
            timestamp: block.timestamp
        });

        emit IdentityRegistered(msg.sender, block.timestamp);
    }

    /**
     * @dev Revokes a user's verification status. 
     * In a real-world scenario, this might be restricted to an admin or the user themselves.
     */
    function revokeIdentity() external {
        if (!identities[msg.sender].isVerified) {
            revert NotVerified();
        }

        identities[msg.sender].isVerified = false;
        identities[msg.sender].identityHash = bytes32(0);
        
        emit IdentityRevoked(msg.sender, block.timestamp);
    }

    /**
     * @dev Public, read-only function that any dApp can call.
     * @param _user The address of the user to check.
     * @return bool True if the user is verified, false otherwise.
     */
    function checkVerification(address _user) external view returns (bool) {
        return identities[_user].isVerified;
    }
}
