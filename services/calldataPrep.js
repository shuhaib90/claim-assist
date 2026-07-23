/**
 * Calldata Preparation Service for ClaimAssist Agent
 * Constructs unsigned transaction payloads for wallet owners to sign in MetaMask/OKX Wallet
 * NEVER accepts, requests, or touches private keys at any point.
 */

const { ethers } = require("ethers");

// Deployed ClaimAssist contract address on X Layer Testnet (chainId: 195)
const CLAIM_ASSIST_ADDRESS = process.env.CLAIM_ASSIST_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Minimal ABI of ClaimAssist
const CLAIM_ASSIST_ABI = [
  "function claimNative(address targetContract, bytes calldata claimCalldata) external returns (uint256 netAmount)",
  "function claimERC20(address targetContract, bytes calldata claimCalldata, address token) external returns (uint256 netAmount)"
];

const iface = new ethers.Interface(CLAIM_ASSIST_ABI);

/**
 * Prepares unsigned claim transaction payload
 * @param {string} walletAddress 
 * @param {Object} airdropEntry { protocol, targetContract, claimCalldata, claimType, tokenAddress? }
 */
function prepareClaimTransaction(walletAddress, airdropEntry) {
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    throw new Error("Valid owner wallet address is required.");
  }

  if (!airdropEntry || !airdropEntry.targetContract || !airdropEntry.claimCalldata) {
    throw new Error("Target contract address and claim calldata are required.");
  }

  const claimType = (airdropEntry.claimType || "native").toLowerCase();
  const targetContract = airdropEntry.targetContract;
  const rawCalldata = airdropEntry.claimCalldata;
  const protocol = airdropEntry.protocol || "DeFi Protocol";

  let encodedData;
  if (claimType === "erc20") {
    if (!airdropEntry.tokenAddress || !ethers.isAddress(airdropEntry.tokenAddress)) {
      throw new Error("ERC-20 token address is required for token claims.");
    }
    encodedData = iface.encodeFunctionData("claimERC20", [targetContract, rawCalldata, airdropEntry.tokenAddress]);
  } else {
    encodedData = iface.encodeFunctionData("claimNative", [targetContract, rawCalldata]);
  }

  const txPayload = {
    to: CLAIM_ASSIST_ADDRESS,
    data: encodedData,
    value: "0",
    chainId: 195,
    protocol: protocol,
    claimType: claimType,
    feeBps: 300,
    feePercentage: "3.00%",
    summary: `This will claim your ${protocol} airdrop through ClaimAssist and send the claimed funds to your wallet (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}), minus a 3% service fee. Review and sign in your own wallet to proceed.`
  };

  return txPayload;
}

module.exports = {
  CLAIM_ASSIST_ADDRESS,
  prepareClaimTransaction
};
