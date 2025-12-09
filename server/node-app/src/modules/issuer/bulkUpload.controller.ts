import { Request, Response } from 'express';
import { bulkUploadService } from './bulkUpload.service';




// Rewriting Controller to match the plan
export const bulkUploadController = {
    upload: async (req: Request, res: Response) => {
        try {
            if (!req.file) {
                return res.status(400).json({ success: false, message: 'No file uploaded' });
            }
            const issuerId = (req as any).user.id;
            const filePath = req.file?.path || '';
            const fileName = req.file?.originalname || '';

            // Call service
            const result = await bulkUploadService.initiateBulkUpload(issuerId, filePath, fileName);
            
            res.json({ success: true, data: result });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    },

    getStatus: async (req: Request, res: Response) => {
        try {
            const batchId = parseInt(req.params.batchId || '0');
            const issuerId = (req as any).user.id;
            const batch = await bulkUploadService.getBatchStatus(batchId, issuerId);
            if (!batch) {
                return res.status(404).json({ success: false, message: 'Batch not found' });
            }
            res.json({ success: true, data: batch });
        } catch (error: any) {
            res.status(500).json({ success: false, message: error.message });
        }
    }
};
