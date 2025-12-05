# Deploying to Sepolia Testnet

This guide walks you through deploying the CredentialRegistry smart contract to Ethereum Sepolia testnet.

## Prerequisites

### 1. Get Sepolia ETH

You need testnet ETH to deploy the contract and pay for gas fees.

**Faucets:**
- Alchemy Sepolia Faucet: https://sepoliafaucet.com/
- Infura Sepolia Faucet: https://www.infura.io/faucet/sepolia
- QuickNode Faucet: https://faucet.quicknode.com/ethereum/sepolia

Send ~0.1 SepoliaETH to your wallet address.

### 2. Get RPC Provider

Choose one of these providers and create a free account:

**Option A: Infura**
1. Sign up at https://infura.io/
2. Create a new project
3. Copy the Sepolia RPC URL: `https://sepolia.infura.io/v3/YOUR_PROJECT_ID`

**Option B: Alchemy**
1. Sign up at https://alchemy.com/
2. Create a new app (select Sepolia network)
3. Copy the RPC URL: `https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY`

### 3. Generate Wallet

If you don't have a wallet, generate one:

```bash
# Using Node.js
node -e "const ethers = require('ethers'); const wallet = ethers.Wallet.createRandom(); console.log('Address:', wallet.address); console.log('Private Key:', wallet.privateKey);"
```

**⚠️ IMPORTANT:** Save your private key securely! Never commit it to git!

## Setup

### 1. Install Dependencies

```bash
cd server/blockchain
npm install
```

### 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and update:

```env
# Server Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Blockchain Mode
BLOCKCHAIN_MOCK_ENABLED=false  # Set to false for real blockchain

# Sepolia Configuration
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key_without_0x_prefix
GAS_LIMIT=500000
```

## Deployment

### 1. Compile Contract

```bash
npx hardhat compile
```

Expected output:
```
Compiled 1 Solidity file successfully
```

### 2. Deploy to Sepolia

```bash
npx hardhat run scripts/deploy.js --network sepolia
```

Expected output:
```
Deploying CredentialRegistry contract...
✅ CredentialRegistry deployed to: 0x1234567890abcdef...

📝 Update your .env file with:
CONTRACT_ADDRESS=0x1234567890abcdef...

🔍 Verify on Etherscan:
https://sepolia.etherscan.io/address/0x1234567890abcdef...
```

### 3. Update Environment

Copy the contract address from the deployment output and add it to your `.env`:

```env
CONTRACT_ADDRESS=0x1234567890abcdef...
```

### 4. Verify on Etherscan (Optional)

```bash
npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

This makes your contract code publicly viewable and verifiable.

## Testing

### 1. Start the Blockchain Service

```bash
npm run dev
```

You should see:
```
🚀 Blockchain service running on port 3001
Blockchain initialized in REAL mode
```

### 2. Test with curl

**Issue a credential:**
```bash
curl -X POST http://localhost:3001/blockchain/write \
  -H "Content-Type: application/json" \
  -d '{
    "credential_id": "550e8400-e29b-41d4-a716-446655440000",
    "data_hash": "abc123hash",
    "ipfs_cid": "QmXyz123"
  }'
```

Expected response:
```json
{
  "success": true,
  "data": {
    "tx_hash": "0x...",
    "network": "sepolia",
    "contract_address": "0x...",
    "timestamp": "2025-12-05T..."
  }
}
```

**Verify transaction:**
```bash
curl http://localhost:3001/blockchain/verify/<TX_HASH>
```

### 3. Check on Etherscan

Visit: `https://sepolia.etherscan.io/tx/<TX_HASH>`

You should see:
- Transaction status: Success ✓
- Method: issueCredential
- Event logs: CredentialIssued

## Troubleshooting

### "Insufficient funds for gas"
- Check your Sepolia ETH balance: https://sepolia.etherscan.io/address/YOUR_ADDRESS
- Get more from faucets (links above)

### "Invalid API key" or "Connection timeout"
- Verify your RPC URL is correct in `.env`
- Check if your RPC provider API key is active
- Try switching providers (Infura ↔ Alchemy)

### "Nonce too low"
- You may have pending transactions
- Wait a few minutes or check provider dashboard

### "Contract deployment failed"
- Ensure `hardhat.config.js` has correct network settings
- Verify `PRIVATE_KEY` in `.env` (no `0x` prefix needed)
- Check you have enough Sepolia ETH

## Gas Costs

Approximate costs on Sepolia:
- **Contract deployment**: ~0.005 - 0.01 ETH (one-time)
- **Issue credential**: ~0.0001 - 0.0003 ETH per transaction
- **Verify credential**: Free (read-only)

💡 These are testnet costs. On mainnet, costs would be 100-1000x higher.

## Switching Between Mock and Real

Toggle blockchain mode in `.env`:

**Mock mode** (for development):
```env
BLOCKCHAIN_MOCK_ENABLED=true
```

**Real mode** (Sepolia):
```env
BLOCKCHAIN_MOCK_ENABLED=false
SEPOLIA_RPC_URL=...
PRIVATE_KEY=...
CONTRACT_ADDRESS=...
```

Restart the service after changing modes.

## Security Notes

🔐 **Never commit your `.env` file to git!**  
🔐 **Never use production wallets for testing!**  
🔐 **Keep your private key secure!**  
🔐 **Use environment-specific wallets!**
