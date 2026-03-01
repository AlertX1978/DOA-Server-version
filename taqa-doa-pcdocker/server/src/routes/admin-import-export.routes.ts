import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  exportHandler,
  validateImportHandler,
  importHandler,
} from '../controllers/admin-import-export.controller';

const router = Router();

const adminRateLimit = rateLimit({ windowMs: 60_000, max: 100 });

// All routes require authentication + admin role
router.use(adminRateLimit);
router.use(requireAuth);
router.use(requireAdmin);

// ---------------------------------------------------------------------------
// Import/Export  (mounted at /api/v1/admin/import-export)
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/import-export/export
router.get('/export', exportHandler);

// POST   /api/v1/admin/import-export/import/validate
router.post('/import/validate', validateImportHandler);

// POST   /api/v1/admin/import-export/import
router.post('/import', importHandler);

export default router;
