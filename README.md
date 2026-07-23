# 🎁 ClaimAssist — Non-Custodial Airdrop Claim + Fee Contract

> **X Layer Testnet (`chainId: 195`)**  
> *Lets a wallet owner claim from an external airdrop contract in the same transaction they initiate themselves, with a fixed 3.00% service fee taken from the claimed amount before forwarding 97% to the owner's wallet.*

---

## 🔒 Non-Custodial Architecture Guarantees

1. **Owner Direct Invocation (`msg.sender`)**:  
   The `ClaimAssist` contract is called directly by the wallet owner's wallet software (OKX Wallet, MetaMask). `msg.sender` in the contract IS the owner, proven by standard EIP-155 transaction signing.
2. **Zero Custody**:  
   Funds pass through the contract transiently within a single atomic transaction. No funds are stored or locked in the contract across blocks.
3. **No Private Keys / Secret Tokens**:  
   Neither the contract nor the agent wrapper ever accepts, requests, or stores user private keys. The agent's only output is an unsigned transaction payload for the user's wallet to review and sign.
4. **On-Chain Fixed Fee (3.00% / 300 BPS)**:  
   The 3% service fee is enforced directly inside `ClaimAssist.sol` via `FEE_BPS = 300`.

---

## 📜 Smart Contract API (`ClaimAssist.sol`)

```solidity
function claimNative(address targetContract, bytes calldata claimCalldata)
    external
    returns (uint256 netAmount);

function claimERC20(address targetContract, bytes calldata claimCalldata, address token)
    external
    returns (uint256 netAmount);
```

---

## 🧪 Hardhat Testing Suite

```bash
# Compile contracts
npx hardhat compile

# Run Hardhat test suite (Native & ERC-20 97%/3% fee split verification)
npx hardhat test
```

---

## 🚀 Deployment to X Layer Testnet

```bash
# Set deployer key
export DEPLOYER_PRIVATE_KEY="your_agent_deployer_private_key"

# Deploy ClaimAssist, MockERC20, and MockAirdrop
npx hardhat run scripts/deploy.js --network xLayerTestnet
```

---

## 🌐 Web Server & UI Dashboard

```bash
npm start
```
Open [http://localhost:3006](http://localhost:3006) to interact with the ClaimAssist web UI.
