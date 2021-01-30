const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");

async function main() {
  AAVE = "0x85821C543d5773cA19b91F5b37e39FeC308C6FA7";
  STAKE = "0x8db295b766d53D1e234D6c65D3cb33D0B8B426c9";
  StrategyManager = "0x02DEEBD5879Ff9ad87eA6dEf9d8d83C1A42943e4";
  Insurance = "0x42921447749BAe8AbeCe08Edf36559dc3CA27E29";
  ATokenStrat = "0xbb84559D90687B68Fd39E73A75e243b1CeE3ff52";
  mockAaveGovernance = "0x47aEEE430eD69F6A9309c37D05fb1D45c734f5B3";
  AAVEStrat = "0x79A3AFC68e87062242515d7A7A69EDf7810673b5";
  MockOracle = "0x1678f97C2E675Fe5228304a00DB8cD09959CD1B3";

  OWNER = "0x553BF7Cfd38e09C3fb6a8d9B59C1f49b23630Ba8";
  const DAI = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const aDAI = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
  const lpAddressProvider = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";

  await run("verify:verify", {
    address: AAVE,
    constructorArguments: [OWNER, parseEther("1000000")],
    contract: "contracts/mocks/AaveToken.sol:AaveToken",
  });

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
