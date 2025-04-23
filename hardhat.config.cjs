require("@nomicfoundation/hardhat-toolbox");

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.24",
  networks: {
    ganache: {
      url: "http://127.0.0.1:7545",
      chainId: 1337,
      accounts: ["0xc57ad61c8507056431f37fca74e473bca9363e75516274db3be34f676e0bc64d"]
    }
  }
};