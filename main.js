/**
 * Main Entry Point for Claim Assist — Dynamic Non-Custodial Airdrop Claim Agent
 * Strictly non-custodial: Prepares unsigned transactions for owner wallet execution.
 */

const { prepareCustomClaimTransaction, CLAIM_ASSIST_ADDRESS, CHAIN_ID_MAP } = require("./services/calldataPrep");

// Preset Airdrops Library
const PRESET_AIRDROPS = [
  {
    id: "xlayer_genesis_native",
    protocol: "X Layer Testnet Genesis Faucet/Airdrop",
    claimType: "native",
    targetContract: "0x907955240bc7821150b79014c59329e4ad1f6a5f",
    claimCalldata: "0x4e71d92d",
    chain: "xlayer_testnet",
    estimatedReward: "1.0 OKB (Native)",
    fee: "3%"
  },
  {
    id: "xlayer_erc20_reward",
    protocol: "X Layer Liquidity Reward Vault",
    claimType: "erc20",
    targetContract: "0x907955240bc7821150b79014c59329e4ad1f6a5f",
    tokenAddress: "0x907955240bc7821150b79014c59329e4ad1f6a5f",
    claimCalldata: "0x379607f5",
    chain: "xlayer_testnet",
    estimatedReward: "1,000 TAT Tokens",
    fee: "3%"
  }
];

/**
 * Generates dynamic unsigned claim transaction payload from custom user inputs
 */
function generateDynamicClaimTx(walletAddress, customConfig) {
  let config = customConfig;

  if (typeof customConfig === "string") {
    const preset = PRESET_AIRDROPS.find(a => a.id === customConfig) || PRESET_AIRDROPS[0];
    config = {
      protocol: preset.protocol,
      target_contract: preset.targetContract,
      claim_calldata: preset.claimCalldata,
      claim_type: preset.claimType,
      token_address: preset.tokenAddress,
      chain: preset.chain
    };
  }

  const txPayload = prepareCustomClaimTransaction(walletAddress, config);

  return {
    success: true,
    unsigned_transaction: txPayload,
    user_instructions: txPayload.summary
  };
}

module.exports = {
  CLAIM_ASSIST_ADDRESS,
  CHAIN_ID_MAP,
  PRESET_AIRDROPS,
  generateDynamicClaimTx
};

if (require.main === module) {
  const sampleWallet = "0x907955240bc7821150b79014c59329e4ad1f6a5f";
  const customConfig = {
    protocol_name: "Custom Base Protocol Airdrop",
    target_contract: "0x4200000000000000000000000000000000000006",
    claim_calldata: "claim()",
    claim_type: "native",
    chain: "base"
  };
  console.log(JSON.stringify(generateDynamicClaimTx(sampleWallet, customConfig), null, 2));
}
