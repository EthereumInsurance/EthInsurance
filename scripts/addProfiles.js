const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants, utils } = require("ethers");
const { util } = require("chai");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const insurance = await ethers.getContractAt(
    "Insurance",
    "0x6E36a59b4b4dBD1d47ca2A6D22A1A45d26765601"
  );
  const fivePercent = ethers.BigNumber.from("10").pow(16).mul(5);
  const maker = utils.hashMessage("protocol.maker");
  const yearn = utils.hashMessage("protocol.yearn");
  const piedao = utils.hashMessage("protocol.piedao");

  const blocksPerYear = 2103795;
  //   await insurance.updateProfiles(
  //     maker,
  //     parseEther("11000000"),
  //     fivePercent.div(blocksPerYear),
  //     constants.MaxUint256,
  //     false
  //   );

  //   await insurance.updateProfiles(
  //     yearn,
  //     parseEther("9000000"),
  //     fivePercent.div(blocksPerYear),
  //     constants.MaxUint256,
  //     false
  //   );

  await insurance.updateProfiles(
    piedao,
    parseEther("5000000"),
    fivePercent.div(blocksPerYear),
    constants.MaxUint256,
    false
  );
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
