// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ZeitMint Creative Kit Registry
/// @notice Records creator-owned content commitments. It does not deploy tokens or hold funds.
contract ZeitMintCreativeKitRegistry {
    struct CreativeKit {
        address creator;
        bytes32 contentHash;
        string concept;
        string uri;
        uint64 createdAt;
    }

    error EmptyContentHash();
    error EmptyConcept();
    error ConceptTooLong();
    error UriTooLong();

    event CreativeKitRegistered(
        bytes32 indexed kitId,
        address indexed creator,
        bytes32 indexed contentHash,
        string concept,
        string uri
    );

    mapping(bytes32 kitId => CreativeKit kit) public kits;
    mapping(address creator => uint256 nonce) public creatorNonces;

    function registerCreativeKit(bytes32 contentHash, string calldata concept, string calldata uri)
        external
        returns (bytes32 kitId)
    {
        if (contentHash == bytes32(0)) revert EmptyContentHash();

        uint256 conceptLength = bytes(concept).length;
        if (conceptLength == 0) revert EmptyConcept();
        if (conceptLength > 80) revert ConceptTooLong();
        if (bytes(uri).length > 240) revert UriTooLong();

        uint256 nonce = creatorNonces[msg.sender];
        creatorNonces[msg.sender] = nonce + 1;

        kitId = keccak256(abi.encode(msg.sender, contentHash, nonce, block.chainid));
        kits[kitId] = CreativeKit({
            creator: msg.sender,
            contentHash: contentHash,
            concept: concept,
            uri: uri,
            createdAt: uint64(block.timestamp)
        });

        emit CreativeKitRegistered(kitId, msg.sender, contentHash, concept, uri);
    }
}
