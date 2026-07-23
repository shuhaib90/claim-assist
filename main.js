/**
 * Main Entry Point for Claim Assist — Non-Custodial Airdrop Claim Agent
 * Strictly non-custodial: Prepares unsigned transactions for owner wallet execution.
 */

const { prepareClaimTransaction, CLAIM_ASSIST_ADDRESS } = require("./services/calldataPrep");

// Sample Active Airdrops Library on X Layer Testnet
const AVAILABLE_AIRDROPS = [
  {
    id: "xlayer_genesis_native",
    protocol: "X Layer Testnet Genesis Faucet/Airdrop",
    claimType: "native",
    targetContract: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    claimCalldata: "0x4e71d92d", // claimNativeAirdrop()
    estimatedReward: "1.0 OKB (Native)",
    fee: "3%"
  },
  {
    id: "xlayer_erc20_reward",
    protocol: "X Layer Liquidity Reward Vault",
    claimType: "erc20",
    targetContract: "0x8a9424745056Eb399FD19a0EC26A14316684e274",
    tokenAddress: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    claimCalldata: "0x379607f5", // claimERC20Airdrop()
    estimatedReward: "1,000 TAT",
    fee: "3%"
  }
];

/**
 * Generates an unsigned claim transaction for the owner's wallet to review and sign
 */
function generateClaimTx(walletAddress, airdropIdOrEntry) {
  let entry = airdropIdOrEntry;

  if (typeof airdropIdOrEntry === "string") {
    entry = AVAILABLE_AIRDROPS.find(a => a.id === airdropIdOrEntry) || AVAILABLE_AIRDROPS[0];
  }

  const txPayload = prepareClaimTransaction(walletAddress, entry);
  
  return {
    success: true,
    unsigned_transaction: txPayload,
    user_instructions: txPayload.summary
  };
}

/**
 * Returns list of eligible testnet airdrops
 */
function listEligibleAirdrops(walletAddress) {
  return {
    walletAddress: walletAddress || "0x...",
    eligibleAirdrops: AVAILABLE_AIRDROPS
  };
}

module.exports = {
  CLAIM_ASSIST_ADDRESS,
  AVAILABLE_AIRDROPS,
  generateClaimTx,
  listEligibleAirdrops
};

// CLI Execution if run directly
if (require.main === module) {
  const sampleWallet = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  console.log(JSON.stringify(generateClaimTx(sampleWallet, "xlayer_genesis_native"), null, 2));
}
