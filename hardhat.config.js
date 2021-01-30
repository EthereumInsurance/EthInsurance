require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("dotenv").config();

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
const INFURA_API_KEY = process.env.INFURA_API_KEY || "";
const KOVAN_PRIVATE_KEY = process.env.KOVAN_PRIVATE_KEY || "";
const ETHERSCAN_API = process.env.ETHERSCAN_API || "";

task("accounts", "Prints the list of accounts", async () => {
  const accounts = await ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

task("env", "Prints env keys").setAction(async (taskArgs, { ethers, run }) => {
  console.log("infura:", INFURA_API_KEY);
  console.log("kovan:", KOVAN_PRIVATE_KEY);
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.7.6",
  networks: {
    fork: {
      url: `http://127.0.0.1:8545/`,
      gasPrice: 86000000000,
      accounts: [KOVAN_PRIVATE_KEY].filter((item) => item !== ""),
      timeout: 2483647,
    },
    kovan: {
      url:
        `https://kovan.infura.io/v3/${INFURA_API_KEY}`,
      gasPrice: 2000000000,
      accounts: [KOVAN_PRIVATE_KEY].filter((item) => item !== ""),
      timeout: 2483647,
    },
  },
  etherscan: {
    // Your API key for Etherscan
    // Obtain one at https://etherscan.io/
    apiKey: ETHERSCAN_API,
  },
};
