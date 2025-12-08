
import { Request, Response } from 'express';
import { mockIntegrationService } from './service';
import { sendSuccess, sendError } from '../../utils/response';

export class MockIntegrationController {
    
    async connectDigiLocker(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            const result = await mockIntegrationService.connectDigiLocker(req.user.id);
            sendSuccess(res, result);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async connectSIP(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            const result = await mockIntegrationService.connectSIP(req.user.id);
            sendSuccess(res, result);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async getStatus(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            const result = await mockIntegrationService.getSyncStatus(req.user.id);
            sendSuccess(res, result);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async syncCredentials(req: Request, res: Response) {
        try {
            if (!req.user) return sendError(res, 'Unauthorized');
            const result = await mockIntegrationService.syncCredentials(req.user.id);
            sendSuccess(res, result);
        } catch (error: any) {
            sendError(res, error.message);
        }
    }

    async forceSyncAll(req: Request, res: Response) {
        try {
            // Admin only check should be here
            const count = await mockIntegrationService.syncAllUsers();
            sendSuccess(res, { count }, 'Full sync completed');
        } catch (error: any) {
            sendError(res, error.message);
        }
    }
}

export const mockIntegrationController = new MockIntegrationController();
