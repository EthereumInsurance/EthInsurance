const { utils } = require("ethers/lib");
const { BigNumber } = require("ethers");

module.exports = {
  block: async (tx) => {
    tx = await tx;
    tx = await tx.wait();
    return ethers.BigNumber.from(tx.blockNumber);
  },
  timestamp: async (tx) => {
    tx = await tx;
    tx = await tx.wait();
    return (await ethers.provider.getBlock(tx.blockNumber)).timestamp;
  },
};
