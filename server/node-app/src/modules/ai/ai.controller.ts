import { Request, Response } from 'express';
import { AIService } from './ai.service';

const aiService = new AIService();

/**
 * Get AI-powered recommendations for the authenticated learner
 */
export const getRecommendations = async (req: Request, res: Response): Promise<void> => {
    try {
        const learnerEmail = (req.user as any)?.email;

        if (!learnerEmail) {
            res.status(401).json({
                success: false,
                message: 'Learner email not found in token'
            });
            return;
        }

        const recommendations = await aiService.getRecommendations(learnerEmail);

        res.status(200).json({
            success: true,
            data: recommendations
        });
    } catch (error: any) {
        console.error('Get recommendations error:', error);
        res.status(error.status || 500).json({
            success: false,
            message: error.message || 'Failed to get recommendations'
        });
    }
};
