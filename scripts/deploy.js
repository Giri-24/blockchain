const hre = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
  console.log("🚀 Deploying TrustChain to", hre.network.name, "...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("📝 Deploying with account:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("💰 Account balance:", hre.ethers.formatEther(balance), "ETH\n");

  // Deploy contract
  const TrustChain = await hre.ethers.getContractFactory("TrustChain");
  const trustChain = await TrustChain.deploy();
  await trustChain.waitForDeployment();

  const address = await trustChain.getAddress();
  console.log("✅ TrustChain deployed to:", address);

  // Get ABI from artifacts
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/TrustChain.sol/TrustChain.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8"));

  // Save deployment info to frontend
  const deploymentInfo = {
    contractAddress: address,
    network: hre.network.name,
    chainId: hre.network.config.chainId || 31337,
    deployedAt: new Date().toISOString(),
    deployer: deployer.address,
    abi: artifact.abi,
  };

  // Write to frontend src directory
  const frontendConfigDir = path.join(__dirname, "../frontend/src/utils");
  if (!fs.existsSync(frontendConfigDir)) {
    fs.mkdirSync(frontendConfigDir, { recursive: true });
  }

  fs.writeFileSync(
    path.join(frontendConfigDir, "contract.json"),
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("\n📄 Contract info saved to frontend/src/utils/contract.json");
  console.log("\n📋 Deployment Summary:");
  console.log("─────────────────────────────────────────");
  console.log("  Contract Address :", address);
  console.log("  Network          :", hre.network.name);
  console.log("  Chain ID         :", hre.network.config.chainId || 31337);
  console.log("  Deployer         :", deployer.address);
  console.log("─────────────────────────────────────────");

  // Verify on Etherscan (only for non-local networks)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n⏳ Waiting for block confirmations...");
    await trustChain.deploymentTransaction().wait(5);

    console.log("🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan!");
    } catch (err) {
      console.log("⚠️  Etherscan verification failed:", err.message);
    }
  }

  console.log("\n🎉 Deployment complete!\n");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
