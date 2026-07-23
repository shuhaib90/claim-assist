const express = require("express");
const path = require("path");
const { generateDynamicClaimTx, PRESET_AIRDROPS } = require("./main");

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "ClaimAssist Dynamic Non-Custodial Airdrop Agent", chainId: 195 });
});

// List Preset Airdrops
app.get("/api/airdrops", (req, res) => {
  res.json({ ok: true, data: PRESET_AIRDROPS });
});

// Prepare Unsigned Claim Transaction Payload for Preset or Custom Inputs
app.post("/api/prepare-claim", (req, res) => {
  try {
    const { wallet_address, airdrop_id, target_contract, claim_calldata, function_signature, claim_type, token_address, chain, protocol_name } = req.body;

    const customConfig = target_contract ? {
      target_contract,
      claim_calldata: claim_calldata || function_signature || "claim()",
      claim_type: claim_type || "native",
      token_address,
      chain: chain || "xlayer_testnet",
      protocol_name: protocol_name || "Custom Airdrop Contract"
    } : (airdrop_id || "xlayer_genesis_native");

    const result = generateDynamicClaimTx(wallet_address, customConfig);
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🎁 ClaimAssist Dynamic Agent: http://localhost:${PORT}`);
  console.log(`⛓️  Multi-Chain Airdrop Claim Builder | Fee: 3.00%`);
  console.log(`==================================================\n`);
});
