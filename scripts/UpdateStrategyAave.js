const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants } = require("ethers");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  StrategyManager = "0x02DEEBD5879Ff9ad87eA6dEf9d8d83C1A42943e4";
  AAVE = "0x85821C543d5773cA19b91F5b37e39FeC308C6FA7";

  OWNER = "0x553BF7Cfd38e09C3fb6a8d9B59C1f49b23630Ba8";
  const DAI = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const aDAI = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
  const aaveGovernanceV2 = "0x47aEEE430eD69F6A9309c37D05fb1D45c734f5B3";
  const mockOracle = "0x1678f97C2E675Fe5228304a00DB8cD09959CD1B3";

  const SM = await ethers.getContractAt("StrategyManager", StrategyManager);
  const AaveStrategyToUniswap = await ethers.getContractFactory(
    "AaveStrategyToUniswap"
  );
  // address _want,
  // address _swap,
  // address _aaveGovernanceV2,
  // address _strategyManager
  const strat = await AaveStrategyToUniswap.deploy(
    AAVE,
    DAI,
    aaveGovernanceV2,
    StrategyManager
  );
  console.log("strat", strat.address);
  await sleep(20000);

  await SM.updateStrategy(AAVE, strat.address, mockOracle);
  // console.log("Atoken strat", strat.address);
  await sleep(20000);
  await run("verify:verify", {
    address: strat.address,
    constructorArguments: [AAVE, DAI, aaveGovernanceV2, StrategyManager],
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
