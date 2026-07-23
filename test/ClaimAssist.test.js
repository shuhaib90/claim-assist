const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ClaimAssist Non-Custodial Airdrop Claim + Fee Contract", function () {
  let claimAssist;
  let mockToken;
  let mockAirdrop;
  let owner;
  let feeRecipient;
  let userWallet;

  beforeEach(async function () {
    [owner, feeRecipient, userWallet] = await ethers.getSigners();

    // 1. Deploy ClaimAssist with feeRecipient
    const ClaimAssist = await ethers.getContractFactory("ClaimAssist");
    claimAssist = await ClaimAssist.deploy(feeRecipient.address);
    await claimAssist.waitForDeployment();

    // 2. Deploy Mock ERC-20 Token
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    mockToken = await MockERC20.deploy(ethers.parseEther("1000000"));
    await mockToken.waitForDeployment();

    // 3. Deploy Mock Airdrop Contract
    const MockAirdrop = await ethers.getContractFactory("MockAirdrop");
    mockAirdrop = await MockAirdrop.deploy(await mockToken.getAddress());
    await mockAirdrop.waitForDeployment();

    // Fund MockAirdrop with native ETH and ERC20 tokens
    await owner.sendTransaction({
      to: await mockAirdrop.getAddress(),
      value: ethers.parseEther("10.0")
    });

    await mockToken.transfer(await mockAirdrop.getAddress(), ethers.parseEther("50000"));
  });

  it("1. Native Claim: User receives 97% and Fee Recipient receives 3%", async function () {
    const claimAssistAddr = await claimAssist.getAddress();
    const mockAirdropAddr = await mockAirdrop.getAddress();

    // Calldata for claimNativeAirdrop()
    const claimCalldata = mockAirdrop.interface.encodeFunctionData("claimNativeAirdrop");

    const feeRecipientBalBefore = await ethers.provider.getBalance(feeRecipient.address);
    const userBalBefore = await ethers.provider.getBalance(userWallet.address);

    // User calls claimNative directly
    const tx = await claimAssist.connect(userWallet).claimNative(mockAirdropAddr, claimCalldata);
    const receipt = await tx.wait();
    const gasSpent = receipt.fee;

    const feeRecipientBalAfter = await ethers.provider.getBalance(feeRecipient.address);
    const userBalAfter = await ethers.provider.getBalance(userWallet.address);

    // 1.0 ETH total claimed -> 0.03 ETH fee (3%), 0.97 ETH net to user (97%)
    const expectedFee = ethers.parseEther("0.03");
    const expectedNet = ethers.parseEther("0.97");

    expect(feeRecipientBalAfter - feeRecipientBalBefore).to.equal(expectedFee);
    expect(userBalAfter - userBalBefore + gasSpent).to.equal(expectedNet);
  });

  it("2. ERC-20 Claim: User receives 97% and Fee Recipient receives 3%", async function () {
    const claimAssistAddr = await claimAssist.getAddress();
    const mockAirdropAddr = await mockAirdrop.getAddress();
    const tokenAddr = await mockToken.getAddress();

    // Calldata for claimERC20Airdrop()
    const claimCalldata = mockAirdrop.interface.encodeFunctionData("claimERC20Airdrop");

    // User calls claimERC20 directly
    await claimAssist.connect(userWallet).claimERC20(mockAirdropAddr, claimCalldata, tokenAddr);

    const userTokenBal = await mockToken.balanceOf(userWallet.address);
    const feeRecipientTokenBal = await mockToken.balanceOf(feeRecipient.address);

    // 1000 tokens claimed -> 30 tokens fee (3%), 970 tokens net to user (97%)
    const expectedFee = ethers.parseEther("30");
    const expectedNet = ethers.parseEther("970");

    expect(feeRecipientTokenBal).to.equal(expectedFee);
    expect(userTokenBal).to.equal(expectedNet);
  });

  it("3. Reverts cleanly if target contract claim call fails (e.g. already claimed)", async function () {
    const mockAirdropAddr = await mockAirdrop.getAddress();
    const claimCalldata = mockAirdrop.interface.encodeFunctionData("claimNativeAirdrop");

    // First claim succeeds
    await claimAssist.connect(userWallet).claimNative(mockAirdropAddr, claimCalldata);

    // Second claim fails (already claimed) and reverts with ClaimCallFailed
    await expect(
      claimAssist.connect(userWallet).claimNative(mockAirdropAddr, claimCalldata)
    ).to.be.revertedWithCustomError(claimAssist, "ClaimCallFailed");
  });
});
