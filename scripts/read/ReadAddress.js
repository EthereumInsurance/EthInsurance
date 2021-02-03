const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants } = require("ethers");

async function main() {
  const INSURANCE_ADDRESS = "0x6E36a59b4b4dBD1d47ca2A6D22A1A45d26765601";
  const INS = await ethers.getContractAt("Insurance", INSURANCE_ADDRESS);
  console.log("INSURANCE", INSURANCE_ADDRESS);
  console.log("PROTOCOLS");
  for (let i = 0; i < (await INS.amountOfProtocolsCovered()); i++) {
    console.log("PROTOCOL", i, ":", await INS.protocols(i));
  }
  const SM = await ethers.getContractAt(
    "StrategyManager",
    await INS.strategyManager()
  );
  console.log("SM", SM.address);
  console.log("STRATEGIES");
  for (let i = 0; i < (await SM.amountOfStrategies()); i++) {
    const token = await SM.tokens(i);
    const strat = await SM.strategies(token);
    console.log("STRATEGY", i, ": TOKEN", token, "STRAT", strat);
  }
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
