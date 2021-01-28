const { expect } = require("chai");
const { parseEther } = require("ethers/lib/utils");
const { constants } = require("ethers");
const { block } = require("./utils.js");

const PLACEHOLDER_PROTOCOL =
  "0x561ca898cce9f021c15a441ef41899706e923541cee724530075d1a1144761c7";
const onePercent = ethers.BigNumber.from("10").pow(16);

describe("Happy flow", function () {
  let insurance;
  let ERC20;
  let blockNumber;

  let debt;
  let premium;
  let paid;

  before(async function () {
    [owner] = await ethers.getSigners();
    const WETH = await ethers.getContractFactory("ExampleToken");
    ERC20 = await WETH.deploy(owner.getAddress(), parseEther("1000000"));

    const STAKE = await ethers.getContractFactory("Stake");
    StakeToken = await STAKE.deploy();

    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy();

    const Insurance = await ethers.getContractFactory("Insurance");
    insurance = await Insurance.deploy(
      ERC20.address,
      StakeToken.address,
      strategyManager.address
    );

    await insurance.setTimeLock(10);
    await strategyManager.setPool(insurance.address);
    await ERC20.approve(insurance.address, constants.MaxUint256);
    await StakeToken.approve(insurance.address, constants.MaxUint256);
    await StakeToken.transferOwnership(insurance.address);
  });
  it("Stake", async function () {
    await insurance.stakeFunds(parseEther("250"));
    expect(await insurance.getFunds(await owner.getAddress())).to.eq(
      parseEther("250")
    );
    expect(await ERC20.balanceOf(insurance.address)).to.eq(parseEther("250"));
    expect(await StakeToken.totalSupply()).to.eq(parseEther("250"));
    expect(await insurance.getTotalStakedFunds()).to.eq(parseEther("250"));
  });
  it("Add protocol", async function () {
    blockNumber = await block(
      insurance.updateProfiles(
        PLACEHOLDER_PROTOCOL,
        parseEther("500"),
        onePercent,
        constants.MaxUint256,
        false
      )
    );

    expect(await insurance.coveredFunds(PLACEHOLDER_PROTOCOL)).to.eq(
      parseEther("250")
    );
    expect(await insurance.premiumPerBlock(PLACEHOLDER_PROTOCOL)).to.eq(
      parseEther("250").div(100)
    );
  });
  it("Stake more", async function () {
    await insurance.stakeFunds(parseEther("1000"));
    expect(await insurance.getFunds(await owner.getAddress())).to.eq(
      parseEther("1250")
    );
    expect(await StakeToken.totalSupply()).to.eq(parseEther("1250"));
    expect(await insurance.getTotalStakedFunds()).to.eq(parseEther("1250"));
  });
  it("Verify protocol changes", async function () {
    expect(await insurance.coveredFunds(PLACEHOLDER_PROTOCOL)).to.eq(
      parseEther("500")
    );
    expect(await insurance.premiumPerBlock(PLACEHOLDER_PROTOCOL)).to.eq(
      parseEther("500").div(100)
    );
  });
  it("Add profile balance", async function () {
    await insurance.addProfileBalance(PLACEHOLDER_PROTOCOL, parseEther("100"));
    expect(await insurance.profileBalances(PLACEHOLDER_PROTOCOL)).to.eq(
      parseEther("100")
    );
  });
  it("Verify debt", async function () {
    debt = await insurance.accruedDebt(PLACEHOLDER_PROTOCOL);
    premium = await insurance.premiumPerBlock(PLACEHOLDER_PROTOCOL);
    const currentBlock = ethers.BigNumber.from(
      await ethers.provider.getBlockNumber()
    );
    const blockToPay = currentBlock.sub(blockNumber);
    expect(debt).to.eq(premium.mul(blockToPay));
  });
  it("Payoff debt", async function () {
    await insurance.payOffDebt(PLACEHOLDER_PROTOCOL);
    const debtAfter = await insurance.accruedDebt(PLACEHOLDER_PROTOCOL);
    expect(debtAfter).to.eq(0);
  });
  it("Verify profile balances", async function () {
    paid = debt.add(premium); // include one block
    expect(await insurance.profileBalances(PLACEHOLDER_PROTOCOL)).to.eq(
      parseEther("100").sub(paid)
    );
  });
  it("Verfiy user stake", async function () {
    expect(await insurance.getFunds(await owner.getAddress())).to.eq(
      parseEther("1250").add(paid)
    );
    expect(await StakeToken.totalSupply()).to.eq(parseEther("1250"));
    expect(await insurance.getTotalStakedFunds()).to.eq(
      parseEther("1250").add(paid)
    );
  });
  it("Verify pool token", async function () {
    expect(await ERC20.balanceOf(insurance.address)).to.eq(parseEther("1350"));
  });
  it("Withdraw stake", async function () {
    expect(await StakeToken.balanceOf(await owner.getAddress())).to.eq(
      parseEther("1250")
    );

    await insurance.withdrawStake(parseEther("300"));
    expect(await StakeToken.balanceOf(await owner.getAddress())).to.eq(
      parseEther("950")
    );
    expect(await StakeToken.balanceOf(insurance.address)).to.eq(
      parseEther("300")
    );

    expect(await ERC20.balanceOf(insurance.address)).to.eq(parseEther("1350"));
    expect(await StakeToken.totalSupply()).to.eq(parseEther("1250"));
  });
  it("Cancel withdraw", async function () {
    await insurance.cancelWithdraw();
    expect(await StakeToken.balanceOf(await owner.getAddress())).to.eq(
      parseEther("1250")
    );
    expect(await StakeToken.balanceOf(insurance.address)).to.eq(
      parseEther("0")
    );
    expect(await ERC20.balanceOf(insurance.address)).to.eq(parseEther("1350"));
    expect(await StakeToken.totalSupply()).to.eq(parseEther("1250"));
  });
  it("Withdraw stake again", async function () {
    await insurance.withdrawStake(parseEther("625"));
  });
  it("Claim withdraw", async function () {
    for (var i = 1; i <= 10; i++) {
      await ethers.provider.send("evm_mine", []);
    }
    const currentDebtPlusNextBlock = (
      await insurance.accruedDebt(PLACEHOLDER_PROTOCOL)
    ).add(premium);

    await insurance.claimFunds(await owner.getAddress());
    expect(await StakeToken.balanceOf(await owner.getAddress())).to.eq(
      parseEther("625")
    );
    expect(await StakeToken.balanceOf(insurance.address)).to.eq(
      parseEther("0")
    );

    // 50% of the pool
    const paidout = parseEther("1250")
      .add(paid)
      .add(currentDebtPlusNextBlock)
      .div(2);

    expect(await ERC20.balanceOf(insurance.address)).to.eq(
      parseEther("1350").sub(paidout)
    );
  });
});

describe("Join after, other user", function () {
  let insurance;
  let ERC20;
  let StakeToken;
  let payout;
  let blockNumber;

  let debt;
  let premium;
  let paid;

  before(async function () {
    [owner, user] = await ethers.getSigners();
    const WETH = await ethers.getContractFactory("ExampleToken");
    ERC20 = await WETH.deploy(owner.getAddress(), parseEther("1000000"));
    const STAKE = await ethers.getContractFactory("Stake");
    StakeToken = await STAKE.deploy();
    const StrategyManager = await ethers.getContractFactory("StrategyManager");
    strategyManager = await StrategyManager.deploy();

    const Insurance = await ethers.getContractFactory("Insurance");
    insurance = await Insurance.deploy(
      ERC20.address,
      StakeToken.address,
      strategyManager.address
    );

    const Payout = await ethers.getContractFactory("PayOut");
    payout = await Payout.deploy();

    await insurance.setTimeLock(10);
    await strategyManager.setPool(insurance.address);
    await ERC20.approve(insurance.address, constants.MaxUint256);
    await StakeToken.approve(insurance.address, constants.MaxUint256);
    await StakeToken.transferOwnership(insurance.address);

    await ERC20.transfer(await user.getAddress(), parseEther("10000"));
    await ERC20.connect(user).approve(insurance.address, constants.MaxUint256);

    await insurance.stakeFunds(parseEther("1000"));
    await insurance.updateProfiles(
      PLACEHOLDER_PROTOCOL,
      parseEther("500"),
      onePercent,
      constants.MaxUint256,
      false
    );
  });
  it("Payout", async function () {
    // TODO something like
    // await balances(token,
    //  owner: parseEther("1"),
    //  insurace: parseEther("10"),
    //)
    // that asserts that the sum of these balances == totalSupply()
    await insurance.insurancePayout(
      PLACEHOLDER_PROTOCOL,
      parseEther("500"),
      payout.address
    );
    const ownerStake = await StakeToken.balanceOf(await owner.getAddress());
    const ownerFunds = await insurance.getFunds(await owner.getAddress());
    expect(ownerStake).to.eq(parseEther("1000"));
    expect(ownerFunds).to.eq(parseEther("500"));
  });
  it("Join", async function () {
    await insurance.connect(user).stakeFunds(parseEther("500"));

    const userStake = await StakeToken.balanceOf(await user.getAddress());
    const userFunds = await insurance.getFunds(await user.getAddress());
    expect(userStake).to.eq(parseEther("1000"));
    expect(userFunds).to.eq(parseEther("500"));
  });
});
