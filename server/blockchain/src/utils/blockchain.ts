import { ethers } from 'ethers';
import { logger } from './logger';
import { CONTRACT_ABI, getContractConfig } from '../config/contract';
import 'dotenv/config';

/**
 * Blockchain service for credential verification
 * Supports both mock mode and real Ethereum (Sepolia) integration
 */

export interface BlockchainWriteResult {
    tx_hash: string;
    network: string;
    contract_address: string;
    timestamp: Date;
}

export interface BlockchainReadResult {
    tx_hash: string;
    data_hash: string;
    ipfs_cid: string;
    verified: boolean;
}

// Initialize provider and signer (only when not in mock mode)
let provider: ethers.Provider | null = null;
let signer: ethers.Wallet | null = null;
let contract: ethers.Contract | null = null;

/**
 * Initialize blockchain connection
 */
function initializeBlockchain() {

    if (process.env.BLOCKCHAIN_MOCK_ENABLED === 'true') {
        logger.info('Blockchain initialized in MOCK mode');
        return;
    }

    try {
        const rpcUrl = process.env.SEPOLIA_RPC_URL;
        const privateKey = process.env.PRIVATE_KEY;
        const contractAddress = process.env.CONTRACT_ADDRESS;

        if (!rpcUrl || !privateKey || !contractAddress) {
            throw new Error('Missing required environment variables for blockchain connection');
        }

        provider = new ethers.JsonRpcProvider(rpcUrl);
        signer = new ethers.Wallet(privateKey, provider);
        contract = new ethers.Contract(contractAddress, CONTRACT_ABI, signer);

        logger.info('Blockchain initialized in REAL mode', {
            network: 'sepolia',
            contractAddress,
        });
    } catch (error: any) {
        logger.error('Failed to initialize blockchain', { error: error.message });
        throw error;
    }
}

// Initialize on module load
initializeBlockchain();

/**
 * Mock blockchain write operation
 */
async function mockWriteToBlockchain(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string
): Promise<BlockchainWriteResult> {
    logger.info('BLOCKCHAIN_WRITE (MOCK)', {
        credential_id,
        data_hash,
        ipfs_cid,
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
        contract: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || 'mock_contract',
    });

    // Generate mock transaction hash
    const tx_hash = `0x${credential_id.replace(/-/g, '')}`;

    return {
        tx_hash,
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
        contract_address: process.env.BLOCKCHAIN_CONTRACT_ADDRESS || 'mock_contract',
        timestamp: new Date(),
    };
}

/**
 * Real blockchain write operation using ethers.js
 */
async function realWriteToBlockchain(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string
): Promise<BlockchainWriteResult> {
    if (!contract || !signer) {
        throw new Error('Blockchain not initialized');
    }

    try {
        logger.info('BLOCKCHAIN_WRITE (REAL)', {
            credential_id,
            data_hash,
            ipfs_cid,
            network: 'sepolia',
        });

        // Convert data hash to bytes32 format
        const dataHashBytes32 = ethers.keccak256(ethers.toUtf8Bytes(data_hash));

        // Estimate gas
        const gasEstimate = await contract.issueCredential.estimateGas(
            credential_id,
            dataHashBytes32,
            ipfs_cid
        );

        const gasLimit = process.env.GAS_LIMIT
            ? BigInt(process.env.GAS_LIMIT)
            : gasEstimate * BigInt(120) / BigInt(100); // 120% of estimate

        logger.info('Gas estimation', {
            estimated: gasEstimate.toString(),
            limit: gasLimit.toString(),
        });

        // Send transaction
        const tx = await contract.issueCredential(
            credential_id,
            dataHashBytes32,
            ipfs_cid,
            { gasLimit }
        );

        logger.info('Transaction sent', {
            tx_hash: tx.hash,
            credential_id,
        });

        // Wait for confirmation
        const receipt = await tx.wait();

        logger.info('Transaction confirmed', {
            tx_hash: receipt.hash,
            block_number: receipt.blockNumber,
            gas_used: receipt.gasUsed.toString(),
        });

        return {
            tx_hash: receipt.hash,
            network: 'sepolia',
            contract_address: await contract.getAddress(),
            timestamp: new Date(),
        };
    } catch (error: any) {
        logger.error('Real blockchain write failed', {
            error: error.message,
            code: error.code,
            credential_id,
        });
        throw new Error(`Blockchain transaction failed: ${error.message}`);
    }
}

/**
 * Write to blockchain (auto-selects mock or real based on env)
 */
export async function writeToBlockchain(
    credential_id: string,
    data_hash: string,
    ipfs_cid: string
): Promise<BlockchainWriteResult> {
    const isMockEnabled = process.env.BLOCKCHAIN_MOCK_ENABLED === 'true';

    if (isMockEnabled) {
        return mockWriteToBlockchain(credential_id, data_hash, ipfs_cid);
    } else {
        return realWriteToBlockchain(credential_id, data_hash, ipfs_cid);
    }
}

/**
 * Mock blockchain read operation
 */
async function mockReadFromBlockchain(tx_hash: string): Promise<BlockchainReadResult> {
    logger.info('BLOCKCHAIN_READ (MOCK)', {
        tx_hash,
        network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
    });

    const isValidTxHash = /^0x[a-f0-9]+$/i.test(tx_hash);

    return {
        tx_hash,
        data_hash: '',
        ipfs_cid: '',
        verified: isValidTxHash,
    };
}

/**
 * Real blockchain read operation
 */
async function realReadFromBlockchain(tx_hash: string): Promise<BlockchainReadResult> {
    if (!provider) {
        throw new Error('Blockchain not initialized');
    }

    try {
        logger.info('BLOCKCHAIN_READ (REAL)', {
            tx_hash,
            network: 'sepolia',
        });

        // Get transaction receipt
        const receipt = await provider.getTransactionReceipt(tx_hash);

        if (!receipt) {
            return {
                tx_hash,
                data_hash: '',
                ipfs_cid: '',
                verified: false,
            };
        }

        // Transaction exists and was successful
        const verified = receipt.status === 1;

        logger.info('Transaction verified', {
            tx_hash,
            verified,
            block_number: receipt.blockNumber,
        });

        return {
            tx_hash,
            data_hash: '',
            ipfs_cid: '',
            verified,
        };
    } catch (error: any) {
        logger.error('Real blockchain read failed', {
            error: error.message,
            tx_hash,
        });
        return {
            tx_hash,
            data_hash: '',
            ipfs_cid: '',
            verified: false,
        };
    }
}

/**
 * Read from blockchain (auto-selects mock or real based on env)
 */
export async function readFromBlockchain(tx_hash: string): Promise<BlockchainReadResult> {
    const isMockEnabled = process.env.BLOCKCHAIN_MOCK_ENABLED === 'true';

    if (isMockEnabled) {
        return mockReadFromBlockchain(tx_hash);
    } else {
        return realReadFromBlockchain(tx_hash);
    }
}

/**
 * Verify blockchain transaction exists
 */
export async function verifyBlockchainTransaction(tx_hash: string): Promise<boolean> {
    try {
        const result = await readFromBlockchain(tx_hash);
        return result.verified;
    } catch (error) {
        logger.error('Blockchain verification failed', { error, tx_hash });
        return false;
    }
}
