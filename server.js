const express = require("express");
const path = require("path");
const { generateClaimTx, listEligibleAirdrops, AVAILABLE_AIRDROPS } = require("./main");

const app = express();
const PORT = process.env.PORT || 3006;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Healthcheck
app.get("/api/health", (req, res) => {
  res.json({ ok: true, service: "ClaimAssist Non-Custodial Airdrop Agent", chainId: 195 });
});

// List Available Airdrops
app.get("/api/airdrops", (req, res) => {
  const wallet = req.query.wallet || "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045";
  res.json({ ok: true, data: listEligibleAirdrops(wallet) });
});

// Prepare Unsigned Claim Transaction Payload
app.post("/api/prepare-claim", (req, res) => {
  try {
    const { wallet_address, airdrop_id } = req.body;
    const result = generateClaimTx(wallet_address, airdrop_id);
    res.json({ ok: true, data: result });
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`🎁 ClaimAssist Non-Custodial Agent: http://localhost:${PORT}`);
  console.log(`⛓️  X Layer Testnet (Chain ID: 195) | Fee: 3.00%`);
  console.log(`==================================================\n`);
});
