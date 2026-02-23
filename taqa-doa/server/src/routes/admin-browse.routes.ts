import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  listBrowseItemsHandler,
  getBrowseItemHandler,
  createBrowseItemHandler,
  updateBrowseItemHandler,
  deleteBrowseItemHandler,
  reorderBrowseItemsHandler,
  replaceBrowseItemApproversHandler,
} from '../controllers/admin-browse.controller';

const router = Router();

// All routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);

// ---------------------------------------------------------------------------
// Browse Items  (mounted at /api/v1/admin/browse-items)
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/browse-items
router.get('/', listBrowseItemsHandler);

// POST   /api/v1/admin/browse-items/reorder  (must be before /:id)
router.post('/reorder', reorderBrowseItemsHandler);

// GET    /api/v1/admin/browse-items/:id
router.get('/:id', getBrowseItemHandler);

// POST   /api/v1/admin/browse-items
router.post('/', createBrowseItemHandler);

// PUT    /api/v1/admin/browse-items/:id
router.put('/:id', updateBrowseItemHandler);

// DELETE /api/v1/admin/browse-items/:id
router.delete('/:id', deleteBrowseItemHandler);

// PUT    /api/v1/admin/browse-items/:id/approvers
router.put('/:id/approvers', replaceBrowseItemApproversHandler);

export default router;
