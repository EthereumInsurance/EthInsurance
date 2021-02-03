const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");
const { constants } = require("ethers");

async function main() {
  const GOVERNANCE_ADDRESS = "0x8967a5f5eeccf3b60dd299502f8bebd217268956";
  const GOVERNANCE = await ethers.getContractAt(
    "MockAaveGovernanceV2",
    GOVERNANCE_ADDRESS
  );
  await GOVERNANCE.create(
    constants.AddressZero,
    [],
    [],
    [],
    [],
    [],
    constants.HashZero,
    { gasLimit: 200000 }
  );
  await GOVERNANCE.setProposalState(0, 1);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
