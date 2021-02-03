const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants } = require("ethers");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  //https://etherscan.io/address/0x547a514d5e3769680Ce22B2361c10Ea13619e8a9#readContract
  MockOracle = "0xb3Ef934755f162e2Aa1c7Aae4CD6167aE2694d25";
  const price = 30000000000;

  const mock = await ethers.getContractAt("MockOracle", MockOracle);
  await mock.setPrice(price);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
