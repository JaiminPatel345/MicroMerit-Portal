// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CredentialRegistry
 * @dev Smart contract for storing and verifying credential hashes on Ethereum
 */
contract CredentialRegistry {
    struct Credential {
        bytes32 dataHash;
        string ipfsCid;
        address issuer;
        uint256 timestamp;
        bool exists;
    }

    // Mapping from credential ID to credential data
    mapping(string => Credential) private credentials;

    // Events
    event CredentialIssued(
        string indexed credentialId,
        bytes32 dataHash,
        string ipfsCid,
        address indexed issuer,
        uint256 timestamp
    );

    event CredentialVerified(
        string indexed credentialId,
        bool isValid,
        uint256 timestamp
    );

    /**
     * @dev Issue a new credential to the blockchain
     * @param credentialId Unique identifier for the credential
     * @param dataHash SHA256 hash of the credential data
     * @param ipfsCid IPFS content identifier for the credential document
     */
    function issueCredential(
        string memory credentialId,
        bytes32 dataHash,
        string memory ipfsCid
    ) external {
        require(bytes(credentialId).length > 0, "Credential ID cannot be empty");
        require(dataHash != bytes32(0), "Data hash cannot be empty");
        require(bytes(ipfsCid).length > 0, "IPFS CID cannot be empty");
        require(!credentials[credentialId].exists, "Credential already exists");

        credentials[credentialId] = Credential({
            dataHash: dataHash,
            ipfsCid: ipfsCid,
            issuer: msg.sender,
            timestamp: block.timestamp,
            exists: true
        });

        emit CredentialIssued(
            credentialId,
            dataHash,
            ipfsCid,
            msg.sender,
            block.timestamp
        );
    }

    /**
     * @dev Get credential data by ID
     * @param credentialId The credential ID to query
     * @return dataHash The credential's data hash
     * @return ipfsCid The IPFS content identifier
     * @return issuer The address that issued the credential
     * @return timestamp When the credential was issued
     * @return exists Whether the credential exists
     */
    function getCredential(string memory credentialId)
        external
        view
        returns (
            bytes32 dataHash,
            string memory ipfsCid,
            address issuer,
            uint256 timestamp,
            bool exists
        )
    {
        Credential memory cred = credentials[credentialId];
        return (
            cred.dataHash,
            cred.ipfsCid,
            cred.issuer,
            cred.timestamp,
            cred.exists
        );
    }

    /**
     * @dev Verify a credential by checking if the provided hash matches
     * @param credentialId The credential ID to verify
     * @param dataHash The hash to verify against
     * @return isValid Whether the credential exists and hash matches
     */
    function verifyCredential(
        string memory credentialId,
        bytes32 dataHash
    ) external returns (bool isValid) {
        Credential memory cred = credentials[credentialId];
        isValid = cred.exists && cred.dataHash == dataHash;

        emit CredentialVerified(credentialId, isValid, block.timestamp);
        return isValid;
    }

    /**
     * @dev Check if a credential exists
     * @param credentialId The credential ID to check
     * @return Whether the credential exists
     */
    function credentialExists(string memory credentialId)
        external
        view
        returns (bool)
    {
        return credentials[credentialId].exists;
    }
}
