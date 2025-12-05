import { Router } from 'express';
import * as blockchainController from '../controllers/blockchain.controller';

const router = Router();

/**
 * POST /blockchain/write
 * Write credential data to blockchain
 */
router.post('/write', blockchainController.write);

/**
 * GET /blockchain/verify/:txHash
 * Verify a blockchain transaction
 */
router.get('/verify/:txHash', blockchainController.verify);

export default router;
