import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  exportHandler,
  validateImportHandler,
  importHandler,
} from '../controllers/admin-import-export.controller';

const router = Router();

// All routes require authentication + admin role
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
