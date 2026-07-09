const hre = require("hardhat");

const OUTDATED_EXCHANGE = '0xD1516568681e759859720d1d97FD4c416975bd10';
const TYI_ADDRESS = '0x27dc1c167aef232bb1e21073304b526726a8727e';

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Withdrawing TYI liquidity from outdated exchange using account:", deployer.address);

  // 1. Instance of outdated exchange
  const exchange = await hre.ethers.getContractAt("SpectraExchange", OUTDATED_EXCHANGE);
  const mockUSD = await hre.ethers.getContractAt("MockUSD", TYI_ADDRESS);

  const decimals = await mockUSD.decimals();
  const balance = await mockUSD.balanceOf(OUTDATED_EXCHANGE);
  
  console.log(`Outdated Exchange current TYI balance: ${hre.ethers.formatUnits(balance, decimals)} TYI`);

  if (balance > 0n) {
    console.log("Executing withdrawToken on outdated exchange...");
    const tx = await exchange.withdrawToken(TYI_ADDRESS, balance);
    await tx.wait();
    console.log("Withdrawal complete!");
  } else {
    console.log("No TYI balance in outdated exchange to withdraw.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
