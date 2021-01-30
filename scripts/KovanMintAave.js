const { parseEther } = require("ethers/lib/utils");
const hre = require("hardhat");

async function main() {
  const [owner] = await ethers.getSigners();
  console.log(await owner.getAddress());
  const aDAI_ADDRESS = "0xff795577d9ac8bd7d90ee22b6c1703490b6512fd";
  const MINT_ADDRESS = "0x600103d518cc5e8f3319d532eb4e5c268d32e604";
  const AAVE_ADDRESS = "0xB597cd8D3217ea6477232F9217fa70837ff667Af";
  // aave uses same interface
  const MINT = await ethers.getContractAt("MockAave", MINT_ADDRESS);
  const DAI = await ethers.getContractAt("IERC20", aDAI_ADDRESS);
  const balance = await DAI.balanceOf(await owner.getAddress());
  console.log(balance.toString());
  tx = await MINT.mint(AAVE_ADDRESS, parseEther("50000"), {
    gasLimit: 500000,
  });
  tx = await tx.wait();
  console.log(tx);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
