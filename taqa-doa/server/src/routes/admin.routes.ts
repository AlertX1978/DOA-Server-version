import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth';
import {
  getAuditLogHandler,
  listUsersHandler,
  updateUserRoleHandler,
  toggleUserActiveHandler,
  listThresholdsHandler,
  updateThresholdHandler,
  createThresholdHandler,
  deleteThresholdHandler,
  replaceThresholdApproversHandler,
  listRolesHandler,
  createRoleHandler,
  updateRoleHandler,
  listCountriesHandler,
  updateCountryRiskHandler,
  addCountryHandler,
  deleteCountryHandler,
  listGlossaryHandler,
  createGlossaryHandler,
  updateGlossaryHandler,
  deleteGlossaryHandler,
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

// POST   /api/v1/admin/thresholds
router.post('/thresholds', createThresholdHandler);

// PUT    /api/v1/admin/thresholds/:thresholdId
router.put('/thresholds/:thresholdId', updateThresholdHandler);

// DELETE /api/v1/admin/thresholds/:id
router.delete('/thresholds/:id', deleteThresholdHandler);

// PUT    /api/v1/admin/thresholds/:id/approvers
router.put('/thresholds/:id/approvers', replaceThresholdApproversHandler);

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

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

import {
  listCategoriesHandler,
  createCategoryHandler,
  updateCategoryHandler,
  deleteCategoryHandler,
} from '../controllers/admin-browse.controller';

// GET    /api/v1/admin/categories
router.get('/categories', listCategoriesHandler);

// POST   /api/v1/admin/categories
router.post('/categories', createCategoryHandler);

// PUT    /api/v1/admin/categories/:id
router.put('/categories/:id', updateCategoryHandler);

// DELETE /api/v1/admin/categories/:id
router.delete('/categories/:id', deleteCategoryHandler);

// ---------------------------------------------------------------------------
// Glossary
// ---------------------------------------------------------------------------

// GET    /api/v1/admin/glossary
router.get('/glossary', listGlossaryHandler);

// POST   /api/v1/admin/glossary
router.post('/glossary', createGlossaryHandler);

// PUT    /api/v1/admin/glossary/:id
router.put('/glossary/:id', updateGlossaryHandler);

// DELETE /api/v1/admin/glossary/:id
router.delete('/glossary/:id', deleteGlossaryHandler);

export default router;
