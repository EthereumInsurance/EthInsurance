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

    const Insurance = await ethers.getContractFactory("Insurance");
    insurance = await Insurance.deploy(ERC20.address);
    await ERC20.approve(insurance.address, constants.MaxUint256);
  });
  it("Stake", async function () {
    await insurance.stakeFunds(parseEther("250"));
    expect(await insurance.getFunds(await owner.getAddress())).to.eq(
      parseEther("250")
    );
    expect(await insurance.totalStake()).to.eq(parseEther("250"));
    expect(await insurance.totalStakeFunds()).to.eq(parseEther("250"));
  });
  it("Add protocol", async function () {
    blockNumber = await block(
      insurance.updateProfiles(
        PLACEHOLDER_PROTOCOL,
        parseEther("500"),
        onePercent,
        constants.MaxUint256
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
    expect(await insurance.totalStake()).to.eq(parseEther("1250"));
    expect(await insurance.totalStakeFunds()).to.eq(parseEther("1250"));
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
    expect(await insurance.totalStake()).to.eq(parseEther("1250"));
    expect(await insurance.totalStakeFunds()).to.eq(parseEther("1250").add(paid));
  });
});