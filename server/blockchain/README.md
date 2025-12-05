# Blockchain Microservice - Ethereum Sepolia Integration

A production-ready blockchain microservice for credential verification on Ethereum.

## 🚀 Features

- **Smart Contract**: Immutable credential storage on Ethereum
- **Dual Mode**: Toggle between mock and real blockchain
- **Sepolia Integration**: Full Ethereum Sepolia testnet support
- **Gas Optimization**: Automatic gas estimation and limits
- **Error Handling**: Comprehensive transaction error handling
- **RESTful API**: Simple HTTP endpoints for integration

## 📋 Quick Start

### Mock Mode (Development)

```bash
cd server/blockchain
npm install
npm run dev
```

Service starts on **port 3001** in mock mode (no blockchain required).

### Real Blockchain (Sepolia)

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full setup guide.

**TL;DR:**
1. Get Sepolia ETH from faucets
2. Get RPC URL (Infura or Alchemy)
3. Deploy contract: `npx hardhat run scripts/deploy.js --network sepolia`
4. Update `.env` with contract address
5. Set `BLOCKCHAIN_MOCK_ENABLED=false`
6. Start service: `npm run dev`

## 🏗️ Architecture

```
server/blockchain/
├── contracts/              # Solidity smart contracts
│   └── CredentialRegistry.sol
├── scripts/                # Deployment scripts
│   └── deploy.js
├── src/
│   ├── config/
│   │   └── contract.ts    # Contract ABI
│   ├── controllers/
│   │   └── blockchain.controller.ts
│   ├── routes/
│   │   └── blockchain.routes.ts
│   ├── utils/
│   │   ├── blockchain.ts  # Ethers.js integration
│   │   └── logger.ts
│   ├── app.ts
│   └── server.ts
├── hardhat.config.js      # Hardhat configuration
├── Dockerfile
├── package.json
└── DEPLOYMENT.md          # Deployment guide
```

## 📡 API Endpoints

### POST /blockchain/write

Issue a credential to the blockchain.

**Request:**
```json
{
  "credential_id": "550e8400-e29b-41d4-a716-446655440000",
  "data_hash": "abc123hash",
  "ipfs_cid": "QmXyz123"
}
```

**Response:**
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

### GET /blockchain/verify/:txHash

Verify a blockchain transaction.

**Response:**
```json
{
  "success": true,
  "data": {
    "tx_hash": "0x...",
    "verified": true
  }
}
```

### GET /health

Health check endpoint.

## 🔧 Configuration

### Environment Variables

Create `.env` from `.env.example`:

```env
# Service
PORT=3001
NODE_ENV=development
LOG_LEVEL=info

# Blockchain Mode
BLOCKCHAIN_MOCK_ENABLED=true  # false for real blockchain

# Sepolia (when BLOCKCHAIN_MOCK_ENABLED=false)
SEPOLIA_RPC_URL=https://sepolia.infura.io/v3/YOUR_PROJECT_ID
PRIVATE_KEY=your_private_key
CONTRACT_ADDRESS=0x...
GAS_LIMIT=500000
```

### Toggle Modes

**Mock Mode** (no blockchain):
```env
BLOCKCHAIN_MOCK_ENABLED=true
```

**Real Mode** (Sepolia):
```env
BLOCKCHAIN_MOCK_ENABLED=false
SEPOLIA_RPC_URL=...
PRIVATE_KEY=...
CONTRACT_ADDRESS=...
```

## 🧪 Testing

### Compile Smart Contract

```bash
npx hardhat compile
```

### Test Locally with Hardhat

```bash
npx hardhat node  # Start local blockchain
npx hardhat run scripts/deploy.js --network localhost
```

### Test Endpoints

```bash
# Write to blockchain
curl -X POST http://localhost:3001/blockchain/write \
  -H "Content-Type: application/json" \
  -d '{"credential_id":"550e8400-e29b-41d4-a716-446655440000","data_hash":"test","ipfs_cid":"QmTest"}'

# Verify transaction
curl http://localhost:3001/blockchain/verify/0x...
```

## 🐳 Docker

```bash
docker build -t blockchain-service .
docker run -p 3001:3001 --env-file .env blockchain-service
```

## 💰 Gas Costs

**Sepolia Testnet** (free):
- Contract deployment: ~0.005 ETH
- Issue credential: ~0.0002 ETH per transaction

**Ethereum Mainnet** (estimated):
- Contract deployment: ~$50-100
- Issue credential: ~$5-15 per transaction

💡 **Always test on Sepolia first!**

## 📚 Smart Contract

The `CredentialRegistry` contract stores credentials on-chain:

```solidity
function issueCredential(
    string memory credentialId,
    bytes32 dataHash,
    string memory ipfsCid
) external
```

**Events:**
```solidity
event CredentialIssued(
    string indexed credentialId,
    bytes32 dataHash,
    string ipfsCid,
    address indexed issuer,
    uint256 timestamp
)
```

View contract on Etherscan after deployment.

## 🔒 Security

- ⚠️ **Never commit `.env` to git**
- ⚠️ **Never use production wallets for testing**
- ⚠️ **Keep private keys secure**
- ✅ Use environment-specific wallets
- ✅ Test on Sepolia before mainnet

## 📖 Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Step-by-step deployment guide
- [Hardhat Docs](https://hardhat.org/docs) - Hardhat documentation
- [Ethers.js v6](https://docs.ethers.org/v6/) - Ethers.js documentation
- [Sepolia Faucets](https://sepoliafaucet.com/) - Get test ETH

## 🤝 Integration

This service is consumed by the main node-app via HTTP:

```typescript
// In node-app
const response = await axios.post('http://localhost:3001/blockchain/write', {
  credential_id,
  data_hash,
  ipfs_cid
});
```

Set in node-app `.env`:
```
BLOCKCHAIN_SERVICE_URL=http://localhost:3001
```

## 🐛 Troubleshooting

See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting) for common issues and solutions.

## 📄 License

ISC
