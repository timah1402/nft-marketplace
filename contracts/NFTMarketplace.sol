// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title NFTMarketplace - Supports listing and buying ERC-721 and ERC-1155 NFTs
contract NFTMarketplace is ERC1155Holder, ReentrancyGuard {
    enum TokenType { ERC721, ERC1155 }

    struct Listing {
        uint256 listingId;
        address nftContract;
        uint256 tokenId;
        address payable seller;
        uint256 price;       // price per unit (in wei)
        uint256 amount;      // 1 for ERC-721, N for ERC-1155
        uint256 remaining;   // units still available
        TokenType tokenType;
        bool active;
    }

    uint256 private _listingIdCounter;
    // listingId => Listing
    mapping(uint256 => Listing) public listings;
    // track all listing IDs
    uint256[] public allListingIds;

    event NFTListed(
        uint256 indexed listingId,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        uint256 price,
        uint256 amount,
        TokenType tokenType
    );

    event NFTSold(
        uint256 indexed listingId,
        address indexed buyer,
        uint256 quantity,
        uint256 totalPaid
    );

    event ListingCancelled(uint256 indexed listingId);

    // ─────────────────────────────────────────────
    //  List ERC-721
    // ─────────────────────────────────────────────

    /// @notice List a single ERC-721 token for sale
    function listERC721(
        address nftContract,
        uint256 tokenId,
        uint256 price
    ) external nonReentrant returns (uint256) {
        require(price > 0, "Price must be > 0");
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(
            nft.isApprovedForAll(msg.sender, address(this)) ||
            nft.getApproved(tokenId) == address(this),
            "Marketplace not approved"
        );

        // Transfer NFT to marketplace for escrow
        nft.transferFrom(msg.sender, address(this), tokenId);

        uint256 listingId = _listingIdCounter++;
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: price,
            amount: 1,
            remaining: 1,
            tokenType: TokenType.ERC721,
            active: true
        });
        allListingIds.push(listingId);

        emit NFTListed(listingId, nftContract, tokenId, msg.sender, price, 1, TokenType.ERC721);
        return listingId;
    }

    // ─────────────────────────────────────────────
    //  List ERC-1155
    // ─────────────────────────────────────────────

    /// @notice List ERC-1155 tokens for sale
    function listERC1155(
        address nftContract,
        uint256 tokenId,
        uint256 amount,
        uint256 pricePerUnit
    ) external nonReentrant returns (uint256) {
        require(amount > 0, "Amount must be > 0");
        require(pricePerUnit > 0, "Price must be > 0");
        IERC1155 nft = IERC1155(nftContract);
        require(nft.balanceOf(msg.sender, tokenId) >= amount, "Insufficient balance");
        require(nft.isApprovedForAll(msg.sender, address(this)), "Marketplace not approved");

        // Transfer tokens to marketplace for escrow
        nft.safeTransferFrom(msg.sender, address(this), tokenId, amount, "");

        uint256 listingId = _listingIdCounter++;
        listings[listingId] = Listing({
            listingId: listingId,
            nftContract: nftContract,
            tokenId: tokenId,
            seller: payable(msg.sender),
            price: pricePerUnit,
            amount: amount,
            remaining: amount,
            tokenType: TokenType.ERC1155,
            active: true
        });
        allListingIds.push(listingId);

        emit NFTListed(listingId, nftContract, tokenId, msg.sender, pricePerUnit, amount, TokenType.ERC1155);
        return listingId;
    }

    // ─────────────────────────────────────────────
    //  Buy
    // ─────────────────────────────────────────────

    /// @notice Buy an NFT (quantity = 1 for ERC-721, any for ERC-1155)
    function buyNFT(uint256 listingId, uint256 quantity) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(quantity > 0, "Quantity must be > 0");
        require(listing.remaining >= quantity, "Not enough supply");
        if (listing.tokenType == TokenType.ERC721) {
            require(quantity == 1, "ERC-721: can only buy 1");
        }

        uint256 totalPrice = listing.price * quantity;
        require(msg.value == totalPrice, "Incorrect ETH amount");
        require(msg.sender != listing.seller, "Seller cannot buy own NFT");

        listing.remaining -= quantity;
        if (listing.remaining == 0) {
            listing.active = false;
        }

        // Pay seller
        listing.seller.transfer(totalPrice);

        // Transfer NFT to buyer
        if (listing.tokenType == TokenType.ERC721) {
            IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        } else {
            IERC1155(listing.nftContract).safeTransferFrom(
                address(this), msg.sender, listing.tokenId, quantity, ""
            );
        }

        emit NFTSold(listingId, msg.sender, quantity, totalPrice);
    }

    // ─────────────────────────────────────────────
    //  Cancel Listing
    // ─────────────────────────────────────────────

    /// @notice Cancel an active listing and return NFT to seller
    function cancelListing(uint256 listingId) external nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "Listing not active");
        require(listing.seller == msg.sender, "Not the seller");

        listing.active = false;

        if (listing.tokenType == TokenType.ERC721) {
            IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        } else {
            IERC1155(listing.nftContract).safeTransferFrom(
                address(this), msg.sender, listing.tokenId, listing.remaining, ""
            );
        }

        emit ListingCancelled(listingId);
    }

    // ─────────────────────────────────────────────
    //  Views
    // ─────────────────────────────────────────────

    /// @notice Get all active listings
    function getActiveListings() external view returns (Listing[] memory) {
        uint256 count;
        for (uint256 i = 0; i < allListingIds.length; i++) {
            if (listings[allListingIds[i]].active) count++;
        }
        Listing[] memory active = new Listing[](count);
        uint256 idx;
        for (uint256 i = 0; i < allListingIds.length; i++) {
            if (listings[allListingIds[i]].active) {
                active[idx++] = listings[allListingIds[i]];
            }
        }
        return active;
    }

    /// @notice Get a single listing by ID
    function getListing(uint256 listingId) external view returns (Listing memory) {
        return listings[listingId];
    }

    /// @notice Total number of listings ever created
    function totalListings() external view returns (uint256) {
        return _listingIdCounter;
    }
}
