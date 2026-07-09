const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  const [deployer] = await hre.ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  // 1. Use existing Mock USD (ERC20) from env if available, otherwise deploy
  let mockUSDAddress = process.env.MOCK_USD_ADDRESS;
  if (mockUSDAddress) {
    console.log("1. Using existing MockUSD from ENV:", mockUSDAddress);
  } else {
    const MockUSD = await hre.ethers.getContractFactory("MockUSD");
    const mockUSD = await MockUSD.deploy();
    await mockUSD.waitForDeployment();
    mockUSDAddress = await mockUSD.getAddress();
    console.log("1. MockUSD deployed to:", mockUSDAddress);
  }

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // 2. Deploy SpectraSaaS (passing Mock USD address)
  const SpectraSaaS = await hre.ethers.getContractFactory("SpectraSaaS");
  const spectraSaaS = await SpectraSaaS.deploy(mockUSDAddress);
  await spectraSaaS.waitForDeployment();
  const spectraSaaSAddress = await spectraSaaS.getAddress();
  console.log("2. SpectraSaaS deployed to:", spectraSaaSAddress);

  await sleep(3000);

  // 3. Deploy SpectraNFT (passing SpectraSaaS address)
  const SpectraNFT = await hre.ethers.getContractFactory("SpectraNFT");
  const spectraNFT = await SpectraNFT.deploy(spectraSaaSAddress);
  await spectraNFT.waitForDeployment();
  const spectraNFTAddress = await spectraNFT.getAddress();
  console.log("3. SpectraNFT deployed to:", spectraNFTAddress);

  await sleep(3000);

  // 4. Deploy SpectraExchange (passing SpectraSaaS address)
  // Note: SpectraExchange also needs MockUSD address for swaps
  const SpectraExchange = await hre.ethers.getContractFactory("SpectraExchange");
  const spectraExchange = await SpectraExchange.deploy(spectraSaaSAddress, mockUSDAddress);
  await spectraExchange.waitForDeployment();
  const spectraExchangeAddress = await spectraExchange.getAddress();
  console.log("4. SpectraExchange deployed to:", spectraExchangeAddress);

  await sleep(3000);

  // 5. Deploy SpectraProfile
  const SpectraProfile = await hre.ethers.getContractFactory("SpectraProfile");
  const spectraProfile = await SpectraProfile.deploy();
  await spectraProfile.waitForDeployment();
  const spectraProfileAddress = await spectraProfile.getAddress();
  console.log("5. SpectraProfile deployed to:", spectraProfileAddress);

  // Output all deployed addresses to a JSON file
  const addresses = {
    network: hre.network.name,
    mockUSD: mockUSDAddress,
    spectraSaaS: spectraSaaSAddress,
    spectraNFT: spectraNFTAddress,
    spectraExchange: spectraExchangeAddress,
    spectraProfile: spectraProfileAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const outputPath = path.join(__dirname, "deployed-addresses.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log("\nDeployment complete. Addresses saved to:", outputPath);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
