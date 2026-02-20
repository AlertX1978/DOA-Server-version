import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  getAuditLogHandler,
  listUsersHandler,
  updateUserRoleHandler,
  toggleUserActiveHandler,
  listThresholdsHandler,
  updateThresholdHandler,
  listRolesHandler,
  createRoleHandler,
  updateRoleHandler,
  listCountriesHandler,
  updateCountryRiskHandler,
  addCountryHandler,
  deleteCountryHandler,
} from '../controllers/admin.controller';

const router = Router();

// All admin routes require authentication + admin role
router.use(requireAuth);
router.use(requireAdmin);

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/audit-log
router.get('/audit-log', getAuditLogHandler);

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/users
router.get('/users', listUsersHandler);

// PUT    /api/v1/admin/users/:id/role
router.put('/users/:id/role', updateUserRoleHandler);

// PUT    /api/v1/admin/users/:id/active
router.put('/users/:id/active', toggleUserActiveHandler);

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/thresholds
router.get('/thresholds', listThresholdsHandler);

// PUT    /api/v1/admin/thresholds/:thresholdId
router.put('/thresholds/:thresholdId', updateThresholdHandler);

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/roles
router.get('/roles', listRolesHandler);

// POST   /api/v1/admin/roles
router.post('/roles', createRoleHandler);

// PUT    /api/v1/admin/roles/:id
router.put('/roles/:id', updateRoleHandler);

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/countries
router.get('/countries', listCountriesHandler);

// PUT    /api/v1/admin/countries/:id
router.put('/countries/:id', updateCountryRiskHandler);

// POST   /api/v1/admin/countries
router.post('/countries', addCountryHandler);

// DELETE /api/v1/admin/countries/:id
router.delete('/countries/:id', deleteCountryHandler);

export default router;
