// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ZeitMintCreativeKitRegistry} from "../src/ZeitMintCreativeKitRegistry.sol";

contract ZeitMintCreativeKitRegistryTest {
    ZeitMintCreativeKitRegistry private registry;

    function setUp() public {
        registry = new ZeitMintCreativeKitRegistry();
    }

    function testRegistersCreatorOwnedKit() public {
        bytes32 contentHash = keccak256("zeitmint-creative-kit");
        bytes32 kitId =
            registry.registerCreativeKit(contentHash, "Artificial Doge", "https://zeitmint.com");

        (
            address creator,
            bytes32 storedHash,
            string memory concept,
            string memory uri,
            uint64 createdAt
        ) = registry.kits(kitId);

        require(creator == address(this), "wrong creator");
        require(storedHash == contentHash, "wrong content hash");
        require(keccak256(bytes(concept)) == keccak256(bytes("Artificial Doge")), "wrong concept");
        require(keccak256(bytes(uri)) == keccak256(bytes("https://zeitmint.com")), "wrong uri");
        require(createdAt > 0, "missing timestamp");
        require(registry.creatorNonces(address(this)) == 1, "nonce not incremented");
    }

    function testSameContentProducesUniqueKitIds() public {
        bytes32 contentHash = keccak256("same-content");
        bytes32 first = registry.registerCreativeKit(contentHash, "First", "");
        bytes32 second = registry.registerCreativeKit(contentHash, "Second", "");

        require(first != second, "kit ids should be unique");
    }

    function testRejectsEmptyContentHash() public {
        bool reverted;
        try registry.registerCreativeKit(bytes32(0), "Concept", "") {
            reverted = false;
        } catch {
            reverted = true;
        }

        require(reverted, "empty content hash accepted");
    }

    function testRejectsEmptyConcept() public {
        bool reverted;
        try registry.registerCreativeKit(keccak256("content"), "", "") {
            reverted = false;
        } catch {
            reverted = true;
        }

        require(reverted, "empty concept accepted");
    }
}
