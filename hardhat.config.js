require("@nomiclabs/hardhat-waffle");

const fs = require('fs')
const privateKey = fs.readFileSync(".secret").toString().trim();

module.exports = {
  solidity: "0.8.4",
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
		accounts: [privateKey]
	},
    ganache: {
      url: "http://127.0.0.1:7545"
    },
    polygon: {
      url: "https://rpc-mumbai.maticvigil.com/v1/99a99d15ac2ad3b526aa97401fdbe30ee724ba38",
      accounts: [privateKey]
    },
    testnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      gasPrice: 20000000000,
      accounts: [privateKey]
    },
    dmcTestnet: {
      url: "https://testnet-dmc.mydefichain.com:20551/",
	  chainId: 1133,
      gas: 30_000_000,
      accounts: [privateKey]
    },
    bsc: {
      url: "https://bsc-dataseed.binance.org/",
      chainId: 56,
      gasPrice: 20000000000,
      accounts: [privateKey]
    },
    hardhat: {
    },
  },
};