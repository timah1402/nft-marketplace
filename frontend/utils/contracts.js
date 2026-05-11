import { ethers } from "ethers";
import addresses from "../contracts/addresses.json";
import ERC721Artifact from "../src/artifacts/contracts/MyERC721.sol/MyERC721.json";
import ERC1155Artifact from "../src/artifacts/contracts/MyERC1155.sol/MyERC1155.json";
import MarketplaceArtifact from "../src/artifacts/contracts/NFTMarketplace.sol/NFTMarketplace.json";

export function getERC721Contract(signerOrProvider) {
  return new ethers.Contract(addresses.MyERC721, ERC721Artifact.abi, signerOrProvider);
}

export function getERC1155Contract(signerOrProvider) {
  return new ethers.Contract(addresses.MyERC1155, ERC1155Artifact.abi, signerOrProvider);
}

export function getMarketplaceContract(signerOrProvider) {
  return new ethers.Contract(addresses.NFTMarketplace, MarketplaceArtifact.abi, signerOrProvider);
}

export { addresses };

// Convert IPFS URI to HTTP gateway URL for image display
export function ipfsToHttp(uri) {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    return uri.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return uri;
}

// Fetch NFT metadata from IPFS
export async function fetchMetadata(tokenURI) {
  try {
    const url = ipfsToHttp(tokenURI);
    const res = await fetch(url);
    return await res.json();
  } catch {
    return null;
  }
}
