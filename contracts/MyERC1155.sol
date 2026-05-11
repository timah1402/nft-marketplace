// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155URIStorage.sol";

/// @title MyERC1155 - Multi-copy NFT contract
contract MyERC1155 is ERC1155URIStorage {
    uint256 private _tokenIdCounter;

    // tokenId => max supply
    mapping(uint256 => uint256) public tokenSupply;
    // tokenId => creator
    mapping(uint256 => address) public creators;
    // tokenId => name
    mapping(uint256 => string) public tokenNames;

    event NFTMinted(
        uint256 indexed tokenId,
        address indexed creator,
        uint256 amount,
        string tokenURI
    );

    constructor() ERC1155("") {}

    /// @notice Mint multiple copies of an ERC-1155 NFT
    /// @param amount Number of copies to mint
    /// @param tokenURI IPFS URI containing the NFT metadata
    /// @return tokenId The ID of the newly minted token
    function mintNFT(
        uint256 amount,
        string memory tokenURI,
        string memory name
    ) external returns (uint256) {
        require(amount > 0, "Amount must be at least 1");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;

        _mint(msg.sender, tokenId, amount, "");
        _setURI(tokenId, tokenURI);
        tokenSupply[tokenId] = amount;
        creators[tokenId] = msg.sender;
        tokenNames[tokenId] = name;

        emit NFTMinted(tokenId, msg.sender, amount, tokenURI);
        return tokenId;
    }

    /// @notice Returns the total number of token types minted
    function totalTokenTypes() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /// @notice Returns the URI for a given token
    function uri(uint256 tokenId) public view override returns (string memory) {
        return super.uri(tokenId);
    }
}
