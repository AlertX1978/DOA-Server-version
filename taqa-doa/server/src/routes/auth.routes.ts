import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMe, getRole } from '../controllers/auth.controller';

const router = Router();

// All auth routes require a valid token
router.use(requireAuth);

router.get('/me', getMe);
router.get('/role', getRole);

export default router;
