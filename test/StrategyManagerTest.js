const { expect } = require("chai");
const { parseEther, parseUnits } = require("ethers/lib/utils");
const { constants } = require("ethers");
const { block } = require("./utils.js");

describe("Strategy Manager, single strategy", function () {
  let MockStrategy;
  before(async function () {
    [owner] = await ethers.getSigners();
    WETH = await ethers.getContractFactory("ExampleToken");
    ERC20 = await WETH.deploy(owner.getAddress(), parseEther("10000"));

    const MockPool = await ethers.getContractFactory("MockPool");
    mockPool = await MockPool.deploy();
    await mockPool.setToken(ERC20.address);

    MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy();
    await mockStrategy.setWant(ERC20.address);

    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy();
    await mockPool.setSm(strategyManager.address);
    await strategyManager.setPool(mockPool.address);
    await strategyManager.updateStrategy(
      ERC20.address,
      mockStrategy.address,
      constants.AddressZero
    );
  });

  it("Deposit", async function () {
    await ERC20.transfer(strategyManager.address, parseEther("1000"));
    await strategyManager.deposit(ERC20.address);

    expect(await strategyManager.balanceOf(ERC20.address)).to.eq(
      parseEther("1000")
    );
    expect(await strategyManager.balanceOfNative()).to.eq(parseEther("1000"));
    expect(await ERC20.balanceOf(mockStrategy.address)).to.eq(
      parseEther("1000")
    );
    expect(await ERC20.balanceOf(strategyManager.address)).to.eq(
      parseEther("0")
    );
    expect(await ERC20.balanceOf(mockPool.address)).to.eq(parseEther("0"));
  });
  it("Withdraw", async function () {
    await mockPool.withdraw(ERC20.address, parseEther("400"));

    expect(await strategyManager.balanceOf(ERC20.address)).to.eq(
      parseEther("600")
    );
    expect(await strategyManager.balanceOfNative()).to.eq(parseEther("600"));
    expect(await ERC20.balanceOf(mockStrategy.address)).to.eq(
      parseEther("600")
    );
    expect(await ERC20.balanceOf(strategyManager.address)).to.eq(
      parseEther("0")
    );
    expect(await ERC20.balanceOf(mockPool.address)).to.eq(parseEther("400"));
  });
  it("Update strategy", async function () {
    mockStrategyNew = await MockStrategy.deploy();
    await mockStrategyNew.setWant(ERC20.address);

    await strategyManager.updateStrategy(
      ERC20.address,
      mockStrategyNew.address,
      constants.AddressZero
    );

    expect(await ERC20.balanceOf(mockStrategy.address)).to.eq(parseEther("0"));
    expect(await ERC20.balanceOf(mockStrategyNew.address)).to.eq(
      parseEther("600")
    );
  });
  it("Validate storage", async function () {
    expect(await strategyManager.strategies(ERC20.address)).to.eq(
      mockStrategyNew.address
    );
    expect(await strategyManager.priceOracle(ERC20.address)).to.eq(
      constants.AddressZero
    );
    expect(await strategyManager.tokens(0)).to.eq(ERC20.address);
  });
});

describe("Strategy Manager, multi strategy", function () {
  let MockStrategy;
  before(async function () {
    [owner] = await ethers.getSigners();
    WETH = await ethers.getContractFactory("ExampleToken");
    ERC20 = await WETH.deploy(owner.getAddress(), parseEther("10000"));
    AAVE = await WETH.deploy(owner.getAddress(), parseEther("10000"));

    const MockPool = await ethers.getContractFactory("MockPool");
    mockPool = await MockPool.deploy();
    await mockPool.setToken(ERC20.address);

    MockStrategy = await ethers.getContractFactory("MockStrategy");
    mockStrategy = await MockStrategy.deploy();
    await mockStrategy.setWant(ERC20.address);
    mockStrategyAave = await MockStrategy.deploy();
    await mockStrategyAave.setWant(AAVE.address);

    const MockOracle = await ethers.getContractFactory("MockOracle");
    mockOracleAave = await MockOracle.deploy();
    // gwei = 9, mockOracle = 8. so 1 == 10
    await mockOracleAave.setPrice(parseUnits("1", "gwei"));

    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy();
    await mockPool.setSm(strategyManager.address);
    await strategyManager.setPool(mockPool.address);
    await strategyManager.updateStrategy(
      ERC20.address,
      mockStrategy.address,
      constants.AddressZero
    );
    await strategyManager.updateStrategy(
      AAVE.address,
      mockStrategyAave.address,
      mockOracleAave.address
    );
  });
  it("Deposit", async function () {
    await ERC20.transfer(strategyManager.address, parseEther("1000"));
    await strategyManager.deposit(ERC20.address);

    await AAVE.transfer(strategyManager.address, parseEther("300"));
    await strategyManager.deposit(AAVE.address);

    expect(await strategyManager.balanceOf(ERC20.address)).to.eq(
      parseEther("1000")
    );
    expect(await strategyManager.balanceOf(AAVE.address)).to.eq(
      parseEther("300")
    );
    expect(await strategyManager.balanceOfNative()).to.eq(parseEther("4000"));
  });
  it("Validate storage", async function () {
    expect(await strategyManager.strategies(ERC20.address)).to.eq(
      mockStrategy.address
    );
    expect(await strategyManager.priceOracle(ERC20.address)).to.eq(
      constants.AddressZero
    );
    expect(await strategyManager.tokens(0)).to.eq(ERC20.address);

    expect(await strategyManager.strategies(AAVE.address)).to.eq(
      mockStrategyAave.address
    );
    expect(await strategyManager.priceOracle(AAVE.address)).to.eq(
      mockOracleAave.address
    );
    expect(await strategyManager.tokens(1)).to.eq(AAVE.address);
  });
  it("Remove strategy", async function () {
    // ignore tokens
    await mockStrategyAave.setWithdrawAllReturn(0);
    await strategyManager.removeStrategy(AAVE.address, 1);
    expect(await strategyManager.balanceOf(ERC20.address)).to.eq(
      parseEther("1000")
    );
    expect(await strategyManager.balanceOf(AAVE.address)).to.eq(
      parseEther("0")
    );
    expect(await strategyManager.balanceOfNative()).to.eq(parseEther("1000"));
  });
  it("Validate storage again", async function () {
    expect(await strategyManager.strategies(ERC20.address)).to.eq(
      mockStrategy.address
    );
    expect(await strategyManager.priceOracle(ERC20.address)).to.eq(
      constants.AddressZero
    );
    expect(await strategyManager.tokens(0)).to.eq(ERC20.address);

    expect(await strategyManager.strategies(AAVE.address)).to.eq(
      constants.AddressZero
    );
    expect(await strategyManager.priceOracle(AAVE.address)).to.eq(
      constants.AddressZero
    );

    await expect(strategyManager.tokens(1)).to.be.reverted;
  });
});
