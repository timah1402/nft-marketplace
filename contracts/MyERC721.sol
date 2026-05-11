// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title MyERC721 - Unique NFT (one-of-one) contract
contract MyERC721 is ERC721URIStorage {
    uint256 private _tokenIdCounter;

    // tokenId => creator address
    mapping(uint256 => address) public creators;

    event NFTMinted(uint256 indexed tokenId, address indexed creator, string tokenURI);

    constructor() ERC721("UniqueNFT", "UNFT") {}

    /// @notice Mint a unique ERC-721 NFT
    /// @param tokenURI IPFS URI containing the NFT metadata
    /// @return tokenId The ID of the newly minted token
    function mintNFT(string memory tokenURI) external returns (uint256) {
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        creators[tokenId] = msg.sender;

        emit NFTMinted(tokenId, msg.sender, tokenURI);
        return tokenId;
    }

    /// @notice Returns the total number of tokens minted so far
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}
