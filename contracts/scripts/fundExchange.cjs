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

  // 1. Send ETH Liquidity if needed
  const currentEth = await hre.ethers.provider.getBalance(exchangeAddress);
  const neededEth = hre.ethers.parseEther("0.05");
  if (currentEth < neededEth) {
    const sendAmount = neededEth - currentEth;
    console.log(`Sending ${hre.ethers.formatEther(sendAmount)} ETH to Exchange...`);
    const tx1 = await deployer.sendTransaction({
      to: exchangeAddress,
      value: sendAmount,
    });
    await tx1.wait();
    console.log("ETH Funding confirmed.");
  } else {
    console.log("ETH Balance is already sufficient:", hre.ethers.formatEther(currentEth), "ETH");
  }

  // 2. Send TYI (Mock USD) Liquidity
  const mockUSD = await hre.ethers.getContractAt("MockUSD", mockUSDAddress);
  const decimals = await mockUSD.decimals();
  const tyiAmount = hre.ethers.parseUnits("500", decimals);
  console.log(`Transferring 500 TYI (decimals: ${decimals}) to Exchange...`);

  const tx2 = await mockUSD.transfer(exchangeAddress, tyiAmount);
  await tx2.wait();
  console.log("TYI Funding confirmed.");

  // 3. Verify Balances
  const ethBalance = await hre.ethers.provider.getBalance(exchangeAddress);
  const tyiBalance = await mockUSD.balanceOf(exchangeAddress);

  console.log("\n--- Exchange Status ---");
  console.log("ETH Balance:", hre.ethers.formatEther(ethBalance), "ETH");
  console.log("TYI Balance:", hre.ethers.formatUnits(tyiBalance, decimals), "TYI");
  console.log("------------------------");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
