const { ethers, artifacts } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  let dusdAddress;

  const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
  console.log("Chain ID:", chainId);

  switch (chainId) {
    case 31337: // hardhat local node
      const MockDUSD = await ethers.getContractFactory("MockDUSD");
      const mockDUSD = await MockDUSD.deploy();
      await mockDUSD.deployed();
      console.log("MockDUSD deployed to:", mockDUSD.address);
      dusdAddress = mockDUSD.address;
      await mockDUSD.faucet(deployer.address, ethers.utils.parseEther("1000"));
      console.log("Minted 1000 DUSD to", deployer.address);
      break;

    case 1130: // DMC mainnet
      dusdAddress = "0xff0000000000000000000000000000000000000f";
      break;

    case 1131: // DMC devnet
    case 1132: // DMC testnet3
    case 1133: // DMC changi testnet
      dusdAddress = "0xff0000000000000000000000000000000000000b";
      break;

    default:
      console.error("Unsupported chain ID");
      return;
  }

  // Deploy the Roulette contract
  const ROULETTE = await ethers.getContractFactory("Roulette");
  const roulette = await ROULETTE.deploy();
  await roulette.deployed();
  console.log("Roulette deployed to:", roulette.address);

  // Deploy the Casino contract
  const CASINO = await ethers.getContractFactory("Casino");
  const casino = await CASINO.deploy(dusdAddress, roulette.address);
  await casino.deployed();
  console.log("Casino deployed to:", casino.address);

  // Set the CAS token address in the Roulette contract
  const casTokenAddress = await casino.casToken();
  await roulette.setCasTokenAddress(casTokenAddress);
  console.log("CAS token address set in Roulette:", casTokenAddress);

  // 5. Authorize Roulette contract in Casino
  await casino.authorizeAddressForTokenTransfer(roulette.address);
  console.log("Roulette authorized for direct transfers in Casino");

  // Save copies of each contracts abi and address to the frontend.
  saveFrontendFiles(casino, "Casino");
  saveFrontendFiles(roulette, "Roulette"); // Save the Roulette contract's ABI and address
}

function saveFrontendFiles(contract, name) {
  const fs = require("fs");
  const contractsDir = __dirname + "/../../backend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(contractsDir + `/${name}-address.json`, JSON.stringify({ address: contract.address }, undefined, 2));

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(contractsDir + `/${name}.json`, JSON.stringify(contractArtifact, null, 2));
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
