const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Funding SpectraExchange with account:", deployer.address);

  const addressPath = path.join(__dirname, "deployed-addresses.json");
  const addresses = JSON.parse(fs.readFileSync(addressPath, "utf8"));

  const exchangeAddress = addresses.spectraExchange;
  const mockUSDAddress = addresses.mockUSD;

  if (!exchangeAddress || !mockUSDAddress) {
    throw new Error("Missing contract addresses in deployed-addresses.json");
  }

  console.log("Target Exchange:", exchangeAddress);
  console.log("Mock USD Address:", mockUSDAddress);

  // 1. Send ETH Liquidity
  const ethAmount = hre.ethers.parseEther("0.05");
  console.log(`Sending ${hre.ethers.formatEther(ethAmount)} ETH to Exchange...`);
  
  const tx1 = await deployer.sendTransaction({
    to: exchangeAddress,
    value: ethAmount,
  });
  await tx1.wait();
  console.log("ETH Funding confirmed.");

  // 2. Send TYI (Mock USD) Liquidity
  const tyiAmount = hre.ethers.parseUnits("500", 18);
  console.log(`Transferring 500 TYI to Exchange...`);

  const mockUSD = await hre.ethers.getContractAt("MockUSD", mockUSDAddress);
  const tx2 = await mockUSD.transfer(exchangeAddress, tyiAmount);
  await tx2.wait();
  console.log("TYI Funding confirmed.");

  // 3. Verify Balances
  const ethBalance = await hre.ethers.provider.getBalance(exchangeAddress);
  const tyiBalance = await mockUSD.balanceOf(exchangeAddress);

  console.log("\n--- Exchange Status ---");
  console.log("ETH Balance:", hre.ethers.formatEther(ethBalance), "ETH");
  console.log("TYI Balance:", hre.ethers.formatUnits(tyiBalance, 18), "TYI");
  console.log("------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
