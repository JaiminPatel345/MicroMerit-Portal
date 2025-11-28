import { Router } from 'express';
import * as controller from './ai.controller';
import { authenticateLearner } from '../../middleware/auth';

const router = Router();

/**
 * @route   GET /api/ai/recommendations
 * @desc    Get AI-powered skill recommendations and career pathways for learner
 * @access  Private (Learner)
 */
router.get('/recommendations', authenticateLearner, controller.getRecommendations);

export default router;
