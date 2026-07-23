/**
 * Dynamic Calldata Preparation Service for ClaimAssist Agent
 * Supports Custom Airdrop Contracts, Function Signatures, ERC-20 Tokens, and Multi-Chain Targets
 * Strictly Non-Custodial — Produces Unsigned Transaction Payloads for Owner Wallet Signing
 */

const { ethers } = require("ethers");

// Deployed ClaimAssist contract address on X Layer Testnet / Mainnet
const CLAIM_ASSIST_ADDRESS = process.env.CLAIM_ASSIST_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Chain ID Map
const CHAIN_ID_MAP = {
  xlayer_testnet: 195,
  xlayer: 196,
  ethereum: 1,
  base: 8453,
  arbitrum: 42161,
  bsc: 56,
  polygon: 137
};

// ClaimAssist ABI
const CLAIM_ASSIST_ABI = [
  "function claimNative(address targetContract, bytes calldata claimCalldata) external returns (uint256 netAmount)",
  "function claimERC20(address targetContract, bytes calldata claimCalldata, address token) external returns (uint256 netAmount)"
];

const claimAssistIface = new ethers.Interface(CLAIM_ASSIST_ABI);

/**
 * Encodes custom claim function signature or uses raw bytes
 */
function encodeCustomCalldata(fnSigOrBytes, args = []) {
  if (!fnSigOrBytes) return "0x4e71d92d"; // Default claim() selector

  const trimmed = fnSigOrBytes.trim();

  // If already hex calldata (starts with 0x)
  if (trimmed.startsWith("0x")) {
    return trimmed;
  }

  // Parse function signature e.g. "claim()" or "claimTokens(address)"
  try {
    let normalizedSig = trimmed;
    if (!normalizedSig.startsWith("function ")) {
      normalizedSig = "function " + normalizedSig;
    }
    const customIface = new ethers.Interface([normalizedSig]);
    const fnName = Object.keys(customIface.functions)[0];
    return customIface.encodeFunctionData(fnName, args);
  } catch (e) {
    // Return standard claim() selector fallback
    return "0x4e71d92d";
  }
}

/**
 * Prepares custom unsigned claim transaction payload
 */
function prepareCustomClaimTransaction(walletAddress, customConfig) {
  if (!walletAddress || !ethers.isAddress(walletAddress)) {
    throw new Error("Valid owner wallet address is required.");
  }

  const targetContract = customConfig.target_contract || customConfig.targetContract;
  if (!targetContract || !ethers.isAddress(targetContract)) {
    throw new Error("Valid target airdrop contract address is required.");
  }

  const claimType = (customConfig.claim_type || customConfig.claimType || "native").toLowerCase();
  const tokenAddress = customConfig.token_address || customConfig.tokenAddress || null;
  const rawFnSigOrBytes = customConfig.claim_calldata || customConfig.claimCalldata || customConfig.function_signature || "claim()";
  const chainName = (customConfig.chain || "xlayer_testnet").toLowerCase();
  const chainId = CHAIN_ID_MAP[chainName] || 195;
  const protocol = customConfig.protocol_name || customConfig.protocol || "Custom Airdrop Contract";

  // 1. Encode the target claim calldata
  const targetCalldata = encodeCustomCalldata(rawFnSigOrBytes, customConfig.args || []);

  // 2. Encode ClaimAssist wrapper call
  let encodedWrapperData;
  if (claimType === "erc20") {
    if (!tokenAddress || !ethers.isAddress(tokenAddress)) {
      throw new Error("Valid ERC-20 token address is required for ERC-20 claims.");
    }
    encodedWrapperData = claimAssistIface.encodeFunctionData("claimERC20", [targetContract, targetCalldata, tokenAddress]);
  } else {
    encodedWrapperData = claimAssistIface.encodeFunctionData("claimNative", [targetContract, targetCalldata]);
  }

  const claimAssistContract = customConfig.claim_assist_address || CLAIM_ASSIST_ADDRESS;

  return {
    to: claimAssistContract,
    data: encodedWrapperData,
    value: "0",
    chainId: chainId,
    protocol: protocol,
    claimType: claimType,
    targetContract: targetContract,
    tokenAddress: tokenAddress,
    targetCalldata: targetCalldata,
    feeBps: 300,
    feePercentage: "3.00%",
    summary: `This will claim your ${protocol} airdrop (${targetContract.slice(0, 6)}...${targetContract.slice(-4)}) through ClaimAssist on chain ${chainName.toUpperCase()} and send 97% to your wallet (${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}), forwarding a 3.00% fee to the protocol recipient. Review and sign in your own wallet to proceed.`
  };
}

module.exports = {
  CLAIM_ASSIST_ADDRESS,
  CHAIN_ID_MAP,
  encodeCustomCalldata,
  prepareCustomClaimTransaction
};
