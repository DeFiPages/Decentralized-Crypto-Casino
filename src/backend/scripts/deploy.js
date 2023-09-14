const DST20Abi = require("../contractsData/DST20.json");
const hre = require("hardhat");
const { ethers, artifacts } = hre;
const fs = require("fs");

async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", ethers.utils.formatEther(await deployer.getBalance()).toString());

  let dusdAddress;

  const chainId = await ethers.provider.getNetwork().then((network) => network.chainId);
  console.log("Chain ID:", chainId);

  // Check if the previous Casino contract exists and was deployed by you
  //const oldCasinoExists = await isCasinoDeployedByMe(chainId, deployer);
  let casTokenAddress;
  let oldCasinoContract = await getContract(chainId, deployer, "Casino");

  if (oldCasinoContract) {
    // If Casino was deployed by you, get the associated CAS token address
    //oldCasinoContract = await ethers.getContractAt("Casino", getCasinoAddress(chainId));
    casTokenAddress = await oldCasinoContract.casToken();
    console.log("old casTokenAddress:", casTokenAddress);
  }
  console.log("casTokenAddress used:", casTokenAddress);

  let contractName;
  let dusdToken;  // This will be your contract instance for all chains

  switch (chainId) {
      case 31337: // hardhat local node
          const mockDUSDInstance = await getContract(chainId, null, "MockDUSD");
          
          if (mockDUSDInstance) {
              console.log("Using existing MockDUSD at:", mockDUSDInstance.address);
              dusdToken = mockDUSDInstance;
          } else {
              const MockDUSD = await ethers.getContractFactory("MockDUSD");
              dusdToken = await MockDUSD.deploy();
              await dusdToken.deployed();
              console.log("MockDUSD deployed to:", dusdToken.address);
              saveFrontendFiles(dusdToken, "MockDUSD", chainId);
              await dusdToken.faucet(deployer.address, ethers.utils.parseEther("1000"));
              console.log("Minted 1000 DUSD to", deployer.address);
          }
          dusdAddress = dusdToken.address
          break;
  
      case 1130: // DMC mainnet
      case 1131: // DMC devnet
      case 1132: // DMC testnet3
      case 1133: // DMC changi testnet
          if (chainId === 1130) {
              dusdAddress = "0xff0000000000000000000000000000000000000f";
          } else {
              dusdAddress = "0xff0000000000000000000000000000000000000b";
          }
          
          dusdToken = await ethers.getContractAt(DST20Abi, dusdAddress);
          break;
  
      default:
          console.error("Unsupported chain ID");
          return;
  }

  // Fetch the old Roulette contract address
  const oldRouletteContract = await getContract(chainId, deployer, "Roulette");
  // If the old Roulette contract address exists, disable it
  if (oldRouletteContract) {
    //const oldRouletteContract = await ethers.getContractAt("Roulette", oldRouletteAddress);
    await oldRouletteContract.setEnabled(false);
    console.log(`Old Roulette contract at ${oldRouletteContract.address} has been disabled.`);
  }

  // Deploy the Roulette contract
  const ROULETTE = await ethers.getContractFactory("Roulette");
  const roulette = await ROULETTE.deploy();
  await roulette.deployed();
  console.log("Roulette deployed to:", roulette.address);

  // Deploy the Casino contract
  const CASINO = await ethers.getContractFactory("Casino");
  // if casTokenAddress not exist, casToken will created in Casino
  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
  const casino = await CASINO.deploy(dusdAddress, roulette.address, casTokenAddress || ZERO_ADDRESS);
  await casino.deployed();
  console.log("Casino deployed to:", casino.address);

  // If you didn't have a CAS token address earlier, get it now
  if (!casTokenAddress) {
    casTokenAddress = await casino.casToken();
    // Authorize Roulette contract in Casino
    await casino.authorizeAddressForTokenTransfer(roulette.address);
    console.log("Roulette authorized for direct transfers in Casino");
  }
  if (oldCasinoContract) {
    // Have the old Casino authorize the Roulette contract for the CAS token
    await oldCasinoContract.authorizeAddressForTokenTransfer(roulette.address);
    console.log("Authorized Roulette contract to manage CAS token by old Casino");

    // Transfer DUSD balance from old Casino to new Casino
    const oldDUSDBalance = await dusdToken.balanceOf(oldCasinoContract.address);
    if (oldDUSDBalance.gt(ethers.constants.Zero)) {
      await oldCasinoContract.transferDUSDToAddress(casino.address, oldDUSDBalance);
      console.log(`Transferred ${ethers.utils.formatEther(oldDUSDBalance)} DUSD from old Casino to new Casino.`);
    }

    // Transfer CAS balance from old Casino to new Casino
    const MintableTokenContract = await ethers.getContractFactory("MintableToken");
    const casToken = MintableTokenContract.attach(casTokenAddress);
    
    const oldCASBalance = await casToken.balanceOf(oldCasinoContract.address);
    if (oldCASBalance.gt(ethers.constants.Zero)) {
      await oldCasinoContract.transferCASToAddress(casino.address, oldCASBalance);
      console.log(`Transferred ${oldCASBalance.toString()} CAS from old Casino to new Casino.`);
    }

    // Transfer CAS token ownership from old Casino to new Casino
    await oldCasinoContract.transferCASTokenOwnership(casino.address);
    console.log(`Transferred CAS token ownership from old Casino to new Casino.`);

    // Disable the old Casino contract
    await oldCasinoContract.setEnabled(false);
    console.log(`Old Casino contract at ${oldCasinoContract.address} has been disabled.`);
  }

  // Set the CAS token address in the Roulette contract
  await roulette.setCasTokenAddress(casTokenAddress);
  console.log("CAS token address set in Roulette:", casTokenAddress);

  // Save copies of each contracts abi and address to the frontend.
  saveFrontendFiles(casino, "Casino", chainId);
  saveFrontendFiles(roulette, "Roulette", chainId);
}

function saveFrontendFiles(contract, name, chainId) {
  const contractsDir = __dirname + "/../../backend/contractsData";

  if (!fs.existsSync(contractsDir)) {
    fs.mkdirSync(contractsDir);
  }

  fs.writeFileSync(contractsDir + `/${name}-address-${chainId}.json`, JSON.stringify({ address: contract.address }, undefined, 2));

  const contractArtifact = artifacts.readArtifactSync(name);

  fs.writeFileSync(contractsDir + `/${name}-${chainId}.json`, JSON.stringify(contractArtifact, null, 2));
}

/**
 * Retrieves the contract instance for a given contract name if it exists on the specified chain.
 * If a deployer is provided, it checks if the contract is owned by the deployer.
 *
 * @param {Number} chainId - The ID of the blockchain network (e.g., Ethereum mainnet, Ropsten).
 * @param {Object} [deployer] - An optional object representing the deployer, which must have an 'address' property.
 * @param {String} contractName - The name of the contract (e.g., "Casino" or "Roulette").
 *
 * @returns {Object|null} - Returns the contract instance if found; if deployer is provided and is not the owner, returns null.
 */
async function getContract(chainId, deployer, contractName) {
  const path = `${__dirname}/../../backend/contractsData/${contractName}-address-${chainId}.json`;

  if (!fs.existsSync(path)) {
    console.log(`Not exists: ${path}`);
    return null;
  }

  const { address } = JSON.parse(fs.readFileSync(path, "utf8"));

  if ((await ethers.provider.getCode(address)) === "0x") {
    console.log(`${contractName} Contract doesn't exist at the address ${address}`);
    return null;
  }

  const contractInstance = (await ethers.getContractFactory(contractName)).attach(address);

  if (deployer && typeof contractInstance.owner === "function" && (await contractInstance.owner()) !== deployer.address) {
    console.log(`Owner of ${contractName} Contract at ${address} is not deployer ${deployer.address}`);
    return null;
  }

  return contractInstance;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

