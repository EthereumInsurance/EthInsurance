const hre = require("hardhat");
const { parseEther } = require("ethers/lib/utils");
const { constants } = require("ethers");

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const time = 20000;
async function main() {
  const [owner] = await ethers.getSigners();

  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');
  const DAI = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const aDAI = "0xdcf0af9e59c002fa3aa091a46196b37530fd48a8";
  const lpAddressProvider = "0x88757f2f99175387ab4c6a4b3067c77a695b0349";

  const ERC20 = await ethers.getContractFactory("AaveToken");
  AAVE = await ERC20.deploy(owner.getAddress(), parseEther("1000000"));
  console.log("AAVE", AAVE.address);
  await sleep(time);

  const STAKE = await ethers.getContractFactory("Stake");
  StakeToken = await STAKE.deploy();
  console.log("STAKE", StakeToken.address);
  await sleep(time);

  const StrategyManager = await ethers.getContractFactory("StrategyManager");
  strategyManager = await StrategyManager.deploy();
  console.log("Strategy Manager", strategyManager.address);
  await sleep(time);

  const Insurance = await ethers.getContractFactory("Insurance");
  insurance = await Insurance.deploy(
    DAI,
    StakeToken.address,
    strategyManager.address
  );
  console.log("Insurance", insurance.address);
  await sleep(time);

  //await insurance.setTimeLock(10);
  await strategyManager.setPool(insurance.address);
  await sleep(time);
  //await ERC20.approve(insurance.address, constants.MaxUint256);
  await StakeToken.approve(insurance.address, constants.MaxUint256);
  await sleep(time);
  await StakeToken.transferOwnership(insurance.address);
  await sleep(time);
  console.log("deploying strat");
  const ATokenV2StrategyToAave = await ethers.getContractFactory(
    "ATokenV2StrategyToAave"
  );
  const strat = await ATokenV2StrategyToAave.deploy(
    DAI,
    aDAI,
    lpAddressProvider,
    strategyManager.address,
    AAVE.address
  );
  await sleep(time);
  console.log("Atoken strat", strat.address);
  await strategyManager.updateStrategy(
    DAI,
    strat.address,
    constants.AddressZero
  );
  await sleep(time);
  const MockAaveGovernanceV2 = await ethers.getContractFactory(
    "MockAaveGovernanceV2"
  );
  const mock = await MockAaveGovernanceV2.deploy(AAVE.address);
  console.log("mock aave governance", mock.address);
  await sleep(time);

  const AaveStrategyToUniswap = await ethers.getContractFactory(
    "AaveStrategyToUniswap"
  );
  const strat2 = await AaveStrategyToUniswap.deploy(
    AAVE.address,
    DAI,
    mock.address,
    strategyManager.address
  );
  await sleep(time);
  console.log("strat2", strat2.address);

  const MockOracle = await ethers.getContractFactory("MockOracle");
  const mockOracle = await MockOracle.deploy();
  await sleep(time);
  console.log("Mock oracle", mockOracle.address);
  await strategyManager.updateStrategy(
    AAVE.address,
    strat2.address,
    mockOracle.address
  );

  console.log("approving data");
  const D = await ethers.getContractAt("IERC20", DAI);
  await D.approve(
    "0x22Ff21fEC8D7Fec933BC721ea2Dfda694217a942",
    parseEther("10000000000")
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
