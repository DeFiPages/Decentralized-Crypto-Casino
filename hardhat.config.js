require("@nomiclabs/hardhat-waffle");

const fs = require('fs')
const privateKey = fs.readFileSync(".secret").toString().trim();

// Read the private key from .secret.local for the local network
const localPrivateKey = fs.readFileSync(".secret.local").toString().trim();


module.exports = {
  solidity: "0.8.19",
  paths: {
    artifacts: "./src/backend/artifacts",
    sources: "./src/backend/contracts",
    cache: "./src/backend/cache",
    tests: "./src/backend/test"
  },
  defaultNetwork: "local",
  networks: {
    local: {
      url: "http://127.0.0.1:8545/",
      chainId: 31337,
      accounts: [localPrivateKey]
    },
    dmcTestnet: {
      url: "https://testnet-dmc.mydefichain.com:20551/",
      chainId: 1133,
      gas: 30_000_000,
      accounts: [privateKey]
    },
    dmcTestnetlocal: {
      url: "http://127.0.0.1:20551/",
      chainId: 1133,
      gas: 30_000_000,
      accounts: [privateKey]
    },
    hardhat: {
    },
  },
};