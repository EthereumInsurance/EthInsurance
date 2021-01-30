const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants } = require("ethers");

async function main() {
  AAVE = "0x789F093cEC119Aa2b53fAAAE636F31027342E1C5";
  STAKE = "0xaC8a8996425f67d10953e54E3ffc908A4E0F74C5";
  StrategyManager = "0x6F69a97E1188feca7651167dd173cf08388c4402";
  Insurance = "0x22Ff21fEC8D7Fec933BC721ea2Dfda694217a942";
  ATokenStrat = "0xC823461c9C7EBcF505676088CfaAbeAeb491b91E";
  mockAaveGovernance = "0x4bce7a267A76905AE6e6a27333c36bF902A7bBa3";
  AAVEStrat = "0xc7284C0DdEDa05Ad41DE2E74191122Cf648De09d";
  MockOracle = "0x233F8095fef2988c3fBe341EF9eDAa7B1390B11e";

  OWNER = "0x553BF7Cfd38e09C3fb6a8d9B59C1f49b23630Ba8";
  const DAI = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const aDAI = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
  const lpAddressProvider = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";

  const SM = await ethers.getContractAt("StrategyManager", StrategyManager);
  await SM.removeStrategy(DAI, 0, { gasLimit: 800000 });
  const ATokenV2StrategyToAave = await ethers.getContractFactory(
    "ATokenV2StrategyToAave"
  );
  const strat = await ATokenV2StrategyToAave.deploy(
    DAI,
    aDAI,
    lpAddressProvider,
    StrategyManager,
    AAVE
  );
  console.log("Atoken strat", strat.address);

  await SM.updateStrategy(DAI, strat.address, constants.AddressZero);

  await run("verify:verify", {
    address: "0xC823461c9C7EBcF505676088CfaAbeAeb491b91E",
    constructorArguments: [DAI, aDAI, lpAddressProvider, StrategyManager, AAVE],
  });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
