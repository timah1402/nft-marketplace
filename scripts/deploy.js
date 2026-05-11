const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy ERC-721 contract
  const MyERC721 = await ethers.getContractFactory("MyERC721");
  const erc721 = await MyERC721.deploy();
  await erc721.waitForDeployment();
  console.log("MyERC721 deployed to:", await erc721.getAddress());

  // Deploy ERC-1155 contract
  const MyERC1155 = await ethers.getContractFactory("MyERC1155");
  const erc1155 = await MyERC1155.deploy();
  await erc1155.waitForDeployment();
  console.log("MyERC1155 deployed to:", await erc1155.getAddress());

  // Deploy Marketplace contract
  const NFTMarketplace = await ethers.getContractFactory("NFTMarketplace");
  const marketplace = await NFTMarketplace.deploy();
  await marketplace.waitForDeployment();
  console.log("NFTMarketplace deployed to:", await marketplace.getAddress());

  // Save deployed addresses to a JSON file for the frontend
  const addresses = {
    MyERC721: await erc721.getAddress(),
    MyERC1155: await erc1155.getAddress(),
    NFTMarketplace: await marketplace.getAddress(),
  };

  const frontendConfigPath = path.join(__dirname, "../frontend/contracts/addresses.json");
  fs.mkdirSync(path.dirname(frontendConfigPath), { recursive: true });
  fs.writeFileSync(frontendConfigPath, JSON.stringify(addresses, null, 2));
  console.log("\nContract addresses saved to frontend/src/contracts/addresses.json");
  console.log(addresses);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
