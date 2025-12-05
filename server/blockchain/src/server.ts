import dotenv from "dotenv";
dotenv.config();

import app from './app';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
    logger.info('Blockchain service started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        mock_enabled: process.env.BLOCKCHAIN_MOCK_ENABLED === 'true',
    });
    console.log(`🚀 Blockchain service running on port ${PORT}`);
});
