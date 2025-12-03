import { Request, Response } from 'express';
import { searchService } from './service';
import { sendSuccess, sendError } from '../../utils/response';

export class SearchController {
    async search(req: Request, res: Response) {
        try {
            const query = req.query.q as string;
            const results = await searchService.search(query);
            sendSuccess(res, results, 'Search results retrieved successfully');
        } catch (error: any) {
            sendError(res, error.message, 'Search failed', 500);
        }
    }
}

export const searchController = new SearchController();
