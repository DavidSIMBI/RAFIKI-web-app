import { Router } from 'express';
import { getDatabaseHealthStatus } from '../controllers/databaseHealthController.js';

const router = Router();
router.get('/health/db', getDatabaseHealthStatus);

export default router;
