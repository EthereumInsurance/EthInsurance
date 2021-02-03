const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");

async function main() {
  const AAVE = "0x85821C543d5773cA19b91F5b37e39FeC308C6FA7";
  STAKE = "0x2610C11aB6f7DCa1d8915f328c6995E0c16f5d94";
  StrategyManager = "0x93540d68b2447F924E51caE24c3EAa3AB5516e32";
  Insurance = "0x6E36a59b4b4dBD1d47ca2A6D22A1A45d26765601";
  ATokenStrat = "0x5852A4a9687dAFFCd5464a2790d3F4d5E5001A69";
  mockAaveGovernance = "0x8967a5f5eEcCF3b60Dd299502f8BEbD217268956";
  AAVEStrat = "0xBb8974C5F93ED2935E4E0d9abC95551310c48F62";
  MockOracle = "0xb3Ef934755f162e2Aa1c7Aae4CD6167aE2694d25";

  OWNER = "0x553BF7Cfd38e09C3fb6a8d9B59C1f49b23630Ba8";
  const DAI = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const aDAI = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
  const lpAddressProvider = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";

  // await run("verify:verify", {
  //   address: AAVE,
  //   constructorArguments: [OWNER, parseEther("1000000")],
  //   contract: "contracts/mocks/AaveToken.sol:AaveToken",
  // });

  await run("verify:verify", {
    address: STAKE,
  });

  await run("verify:verify", {
    address: StrategyManager,
  });

  await run("verify:verify", {
    address: Insurance,
    constructorArguments: [DAI, STAKE, StrategyManager],
  });

  await run("verify:verify", {
    address: ATokenStrat,
    constructorArguments: [DAI, aDAI, lpAddressProvider, StrategyManager, AAVE],
  });

  await run("verify:verify", {
    address: mockAaveGovernance,
    constructorArguments: [AAVE],
  });

  await run("verify:verify", {
    address: AAVEStrat,
    constructorArguments: [AAVE, DAI, mockAaveGovernance, StrategyManager],
  });

  await run("verify:verify", {
    address: MockOracle,
    constructorArguments: [],
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
