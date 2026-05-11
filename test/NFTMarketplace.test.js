const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NFT Marketplace", function () {
  let erc721, erc1155, marketplace;
  let seller, buyer;

  beforeEach(async function () {
    [, seller, buyer] = await ethers.getSigners();

    const MyERC721 = await ethers.getContractFactory("MyERC721");
    erc721 = await MyERC721.deploy();

    const MyERC1155 = await ethers.getContractFactory("MyERC1155");
    erc1155 = await MyERC1155.deploy();

    const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
    marketplace = await NFTMarketplace.deploy();
  });

  // ─────────────────────────────────────────────
  //  ERC-721 Tests
  // ─────────────────────────────────────────────

  describe("MyERC721", function () {
    it("should mint a unique NFT and assign ownership", async function () {
      await erc721.connect(seller).mintNFT("ipfs://test-uri-721");
      expect(await erc721.ownerOf(0)).to.equal(seller.address);
    });

    it("should increment token IDs correctly", async function () {
      await erc721.connect(seller).mintNFT("ipfs://uri-1");
      await erc721.connect(seller).mintNFT("ipfs://uri-2");
      expect(await erc721.totalSupply()).to.equal(2);
    });

    it("should store the correct tokenURI", async function () {
      await erc721.connect(seller).mintNFT("ipfs://my-nft-meta");
      expect(await erc721.tokenURI(0)).to.equal("ipfs://my-nft-meta");
    });

    it("should record the creator correctly", async function () {
      await erc721.connect(seller).mintNFT("ipfs://creator-test");
      expect(await erc721.creators(0)).to.equal(seller.address);
    });
  });

  // ─────────────────────────────────────────────
  //  ERC-1155 Tests
  // ─────────────────────────────────────────────

  describe("MyERC1155", function () {
    it("should mint multiple copies and assign balance", async function () {
      await erc1155.connect(seller).mintNFT(10, "ipfs://test-uri-1155", "ArtPack");
      expect(await erc1155.balanceOf(seller.address, 0)).to.equal(10);
    });

    it("should store token supply", async function () {
      await erc1155.connect(seller).mintNFT(5, "ipfs://supply-test", "TestNFT");
      expect(await erc1155.tokenSupply(0)).to.equal(5);
    });

    it("should reject mint with amount = 0", async function () {
      await expect(
        erc1155.connect(seller).mintNFT(0, "ipfs://zero", "Zero")
      ).to.be.revertedWith("Amount must be at least 1");
    });

    it("should store the correct URI", async function () {
      await erc1155.connect(seller).mintNFT(3, "ipfs://uri-1155", "Pack");
      expect(await erc1155.uri(0)).to.equal("ipfs://uri-1155");
    });
  });

  // ─────────────────────────────────────────────
  //  Marketplace – ERC-721
  // ─────────────────────────────────────────────

  describe("Marketplace – ERC-721", function () {
    beforeEach(async function () {
      await erc721.connect(seller).mintNFT("ipfs://market-721");
      await erc721.connect(seller).approve(await marketplace.getAddress(), 0);
    });

    it("should list an ERC-721 NFT", async function () {
      await marketplace
        .connect(seller)
        .listERC721(await erc721.getAddress(), 0, ethers.parseEther("1"));

      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(true);
      expect(listing.price).to.equal(ethers.parseEther("1"));
    });

    it("should transfer NFT to marketplace on listing", async function () {
      await marketplace
        .connect(seller)
        .listERC721(await erc721.getAddress(), 0, ethers.parseEther("1"));

      expect(await erc721.ownerOf(0)).to.equal(await marketplace.getAddress());
    });

    it("should allow buyer to purchase ERC-721", async function () {
      await marketplace
        .connect(seller)
        .listERC721(await erc721.getAddress(), 0, ethers.parseEther("1"));

      await marketplace
        .connect(buyer)
        .buyNFT(0, 1, { value: ethers.parseEther("1") });

      expect(await erc721.ownerOf(0)).to.equal(buyer.address);
    });

    it("should deactivate listing after sale", async function () {
      await marketplace
        .connect(seller)
        .listERC721(await erc721.getAddress(), 0, ethers.parseEther("1"));
      await marketplace
        .connect(buyer)
        .buyNFT(0, 1, { value: ethers.parseEther("1") });

      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(false);
    });

    it("should reject incorrect ETH amount", async function () {
      await marketplace
        .connect(seller)
        .listERC721(await erc721.getAddress(), 0, ethers.parseEther("1"));

      await expect(
        marketplace.connect(buyer).buyNFT(0, 1, { value: ethers.parseEther("0.5") })
      ).to.be.revertedWith("Incorrect ETH amount");
    });

    it("should allow seller to cancel listing", async function () {
      await marketplace
        .connect(seller)
        .listERC721(await erc721.getAddress(), 0, ethers.parseEther("1"));
      await marketplace.connect(seller).cancelListing(0);

      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(false);
      expect(await erc721.ownerOf(0)).to.equal(seller.address);
    });
  });

  // ─────────────────────────────────────────────
  //  Marketplace – ERC-1155
  // ─────────────────────────────────────────────

  describe("Marketplace – ERC-1155", function () {
    beforeEach(async function () {
      await erc1155.connect(seller).mintNFT(10, "ipfs://market-1155", "Pack");
      await erc1155
        .connect(seller)
        .setApprovalForAll(await marketplace.getAddress(), true);
    });

    it("should list ERC-1155 tokens", async function () {
      await marketplace
        .connect(seller)
        .listERC1155(await erc1155.getAddress(), 0, 5, ethers.parseEther("0.1"));

      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(true);
      expect(listing.amount).to.equal(5);
    });

    it("should allow buyer to purchase a quantity", async function () {
      await marketplace
        .connect(seller)
        .listERC1155(await erc1155.getAddress(), 0, 10, ethers.parseEther("0.1"));

      await marketplace
        .connect(buyer)
        .buyNFT(0, 3, { value: ethers.parseEther("0.3") });

      expect(await erc1155.balanceOf(buyer.address, 0)).to.equal(3);
    });

    it("should reduce remaining supply after partial purchase", async function () {
      await marketplace
        .connect(seller)
        .listERC1155(await erc1155.getAddress(), 0, 10, ethers.parseEther("0.1"));
      await marketplace
        .connect(buyer)
        .buyNFT(0, 4, { value: ethers.parseEther("0.4") });

      const listing = await marketplace.getListing(0);
      expect(listing.remaining).to.equal(6);
      expect(listing.active).to.equal(true);
    });

    it("should deactivate listing when all supply is sold", async function () {
      await marketplace
        .connect(seller)
        .listERC1155(await erc1155.getAddress(), 0, 5, ethers.parseEther("0.1"));
      await marketplace
        .connect(buyer)
        .buyNFT(0, 5, { value: ethers.parseEther("0.5") });

      const listing = await marketplace.getListing(0);
      expect(listing.active).to.equal(false);
    });

    it("should return active listings", async function () {
      await marketplace
        .connect(seller)
        .listERC1155(await erc1155.getAddress(), 0, 5, ethers.parseEther("0.1"));

      const active = await marketplace.getActiveListings();
      expect(active.length).to.equal(1);
    });
  });
});
