const hre = require("hardhat");

async function main() {
  console.log("=======================================================");
  console.log("🚀 DEPLOYING CLAIM ASSIST CONTRACTS TO X LAYER TESTNET");
  console.log("=======================================================");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer Wallet Address:", deployer.address);

  // Set Agent Fee Recipient Wallet Address (Agent #6809 wallet address)
  const feeRecipient = process.env.FEE_RECIPIENT_ADDRESS || "0x907955240bc7821150b79014c59329e4ad1f6a5f";
  console.log("Fee Recipient Address  :", feeRecipient);

  // 1. Deploy ClaimAssist Contract
  const ClaimAssist = await hre.ethers.getContractFactory("ClaimAssist");
  const claimAssist = await ClaimAssist.deploy(feeRecipient);
  await claimAssist.waitForDeployment();
  const claimAssistAddress = await claimAssist.getAddress();
  console.log("✅ ClaimAssist Deployed at :", claimAssistAddress);

  // 2. Deploy Mock ERC-20 Token
  const MockERC20 = await hre.ethers.getContractFactory("MockERC20");
  const mockToken = await MockERC20.deploy(hre.ethers.parseEther("1000000"));
  await mockToken.waitForDeployment();
  const tokenAddress = await mockToken.getAddress();
  console.log("✅ MockERC20 Deployed at   :", tokenAddress);

  // 3. Deploy Mock Airdrop Contract
  const MockAirdrop = await hre.ethers.getContractFactory("MockAirdrop");
  const mockAirdrop = await MockAirdrop.deploy(tokenAddress);
  await mockAirdrop.waitForDeployment();
  const airdropAddress = await mockAirdrop.getAddress();
  console.log("✅ MockAirdrop Deployed at :", airdropAddress);

  // Fund MockAirdrop with native token and ERC20 tokens for claiming
  const fundTx = await deployer.sendTransaction({
    to: airdropAddress,
    value: hre.ethers.parseEther("10.0")
  });
  await fundTx.wait();

  const tokenFundTx = await mockToken.transfer(airdropAddress, hre.ethers.parseEther("50000"));
  await tokenFundTx.wait();

  console.log("=======================================================");
  console.log("🎯 DEPLOYMENT SUMMARY:");
  console.log(`  - ClaimAssist Contract : ${claimAssistAddress}`);
  console.log(`  - MockERC20 Token      : ${tokenAddress}`);
  console.log(`  - MockAirdrop Contract : ${airdropAddress}`);
  console.log(`  - Fee Recipient Wallet : ${feeRecipient}`);
  console.log(`  - Chain ID             : 195 (X Layer Testnet)`);
  console.log("=======================================================\n");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
