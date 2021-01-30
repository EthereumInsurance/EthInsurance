const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");

async function main() {
  const DAI_ADDRESS = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const DAI = await ethers.getContractAt("IERC20", DAI_ADDRESS);
  await DAI.approve(
    "0x42921447749bae8abece08edf36559dc3ca27e29",
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
