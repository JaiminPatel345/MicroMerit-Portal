import { Router } from 'express';
import { searchController } from './controller';
import { asyncHandler } from '../../middleware/error';

const router = Router();

router.get('/', asyncHandler(searchController.search.bind(searchController)));

export default router;
