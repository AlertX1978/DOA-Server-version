import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  listDOAItemsHandler,
  getDOAItemHandler,
  createDOAItemHandler,
  updateDOAItemHandler,
  deleteDOAItemHandler,
  replaceDOAItemApproversHandler,
} from '../controllers/admin-doa-items.controller';

const router = Router();

const adminRateLimit = rateLimit({ windowMs: 60_000, max: 100 });

// All routes require authentication + admin role
router.use(adminRateLimit);
router.use(requireAuth);
router.use(requireAdmin);

// ---------------------------------------------------------------------------
// DOA Items  (mounted at /api/v1/admin/doa-items)
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/doa-items
router.get('/', listDOAItemsHandler);

// GET    /api/v1/admin/doa-items/:id
router.get('/:id', getDOAItemHandler);

// POST   /api/v1/admin/doa-items
router.post('/', createDOAItemHandler);

// PUT    /api/v1/admin/doa-items/:id
router.put('/:id', updateDOAItemHandler);

// DELETE /api/v1/admin/doa-items/:id
router.delete('/:id', deleteDOAItemHandler);

// PUT    /api/v1/admin/doa-items/:id/approvers
router.put('/:id/approvers', replaceDOAItemApproversHandler);

export default router;
