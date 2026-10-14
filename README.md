# NFT Marketplace

A full-stack NFT marketplace: mint ERC-721 and ERC-1155 tokens, list them for sale and buy them with ETH, through a web interface connected to your wallet.

🔗 **Live:** https://nft-marketplace-dun.vercel.app

## Features

- **Mint** single NFTs (ERC-721) or multi-edition tokens (ERC-1155)
- **List** NFTs for sale, with quantities for ERC-1155
- **Buy** listed NFTs, or **cancel** your own listings
- Personal **dashboard** of owned and listed NFTs
- Wallet connection (MetaMask) and NFT detail pages

## Smart contracts

| Contract | Role |
|----------|------|
| `MyERC721.sol` | ERC-721 collection with per-token metadata URI |
| `MyERC1155.sol` | ERC-1155 multi-token collection |
| `NFTMarketplace.sol` | Listings, purchases and cancellations for both standards, protected against reentrancy |

Built on OpenZeppelin contracts.

## Tech stack

Solidity · Hardhat · OpenZeppelin · ethers.js · Next.js · React · Tailwind CSS

## Getting started

```bash
# Contracts
npm install
npm run compile
npm test
npm run node            # local blockchain, in a separate terminal
npm run deploy:local

# Frontend
cd frontend
npm install
npm run dev
```

Deployed contract addresses are read from `frontend/contracts/addresses.json`.

## Author

Fatoumata Diouf — [@timah1402](https://github.com/timah1402)
