import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { writeToBlockchain, verifyBlockchainTransaction } from '../utils/blockchain';
import { logger } from '../utils/logger';

// Validation schemas
const writeSchema = z.object({
    credential_id: z.string().uuid(),
    data_hash: z.string().min(1),
    ipfs_cid: z.string().min(1),
});

const verifySchema = z.object({
    txHash: z.string().regex(/^0x[a-f0-9]+$/i, 'Invalid transaction hash format'),
});

/**
 * Write to blockchain
 */
export async function write(req: Request, res: Response, next: NextFunction) {
    try {
        // Validate request body
        const { credential_id, data_hash, ipfs_cid } = writeSchema.parse(req.body);

        logger.info('Blockchain write request received', { credential_id });

        // Write to blockchain
        const result = await writeToBlockchain(credential_id, data_hash, ipfs_cid);

        logger.info('Blockchain write successful', {
            credential_id,
            tx_hash: result.tx_hash
        });

        res.status(200).json({
            success: true,
            data: result,
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }

        logger.error('Blockchain write failed', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}

/**
 * Verify blockchain transaction
 */
export async function verify(req: Request, res: Response, next: NextFunction) {
    try {
        // Validate transaction hash
        const { txHash } = verifySchema.parse({ txHash: req.params.txHash });

        logger.info('Blockchain verify request received', { txHash });

        // Verify transaction
        const verified = await verifyBlockchainTransaction(txHash);

        logger.info('Blockchain verification complete', { txHash, verified });

        res.status(200).json({
            success: true,
            data: {
                tx_hash: txHash,
                verified,
            },
        });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                success: false,
                error: 'Validation error',
                details: error.errors,
            });
        }

        logger.error('Blockchain verification failed', {
            error: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: 'Internal server error',
            message: error.message,
        });
    }
}
