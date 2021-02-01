const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants } = require("ethers");

async function main() {
  StrategyManager = "0x02DEEBD5879Ff9ad87eA6dEf9d8d83C1A42943e4";
  AAVE = "0x85821C543d5773cA19b91F5b37e39FeC308C6FA7";

  OWNER = "0x553BF7Cfd38e09C3fb6a8d9B59C1f49b23630Ba8";
  const DAI = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const aDAI = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
  const lpAddressProvider = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";

  const SM = await ethers.getContractAt("StrategyManager", StrategyManager);
  const ATokenV2StrategyToAave = await ethers.getContractFactory(
    "ATokenV2StrategyToAave"
  );
  // const strat = await ATokenV2StrategyToAave.deploy(
  //   DAI,
  //   aDAI,
  //   lpAddressProvider,
  //   StrategyManager,
  //   AAVE
  // );
  // console.log("Atoken strat", strat.address);
  // await run("verify:verify", {
  //   address: strat.address,
  //   constructorArguments: [DAI, aDAI, lpAddressProvider, StrategyManager, AAVE],
  // });
  const strat = "0x082E4a8A63c3DB1A13d27FC70A3e5A0DA3a39d5A";

  await SM.updateStrategy(DAI, strat, constants.AddressZero);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
