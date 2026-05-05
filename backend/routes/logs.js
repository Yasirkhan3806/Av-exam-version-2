import express from 'express';
import { frontendLogger } from '../utils/logger.js';

const router = express.Router();

router.post('/frontend', (req, res) => {
    const { userId, userName, errorType, message, stack } = req.body;
    const userAgent = req.headers['user-agent'] || 'Unknown Device';

    frontendLogger.error(message || 'Frontend Error', {
        userId: userId || 'Unauthenticated',
        userName: userName || 'Unknown',
        errorType: errorType || 'Unknown Error Type',
        stack: stack || 'No stack trace provided',
        device: userAgent
    });

    res.status(200).json({ success: true });
});

export default router;
