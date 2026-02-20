import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import { getUserByOid } from '../services/user.service';
import { listUsers, updateUserRole, toggleUserActive } from '../services/user.service';
import {
  getAuditLog,
  getThresholdsWithApprovers,
  updateThreshold,
  getRoles,
  updateRole,
  createRole,
  getCountries,
  updateCountryRisk,
  addCountry,
  deleteCountry,
} from '../services/admin.service';
import { clearCalculatorCache } from '../services/calculator.service';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const updateUserRoleSchema = z.object({
  role: z.enum(['admin', 'viewer'], {
    errorMap: () => ({ message: "role must be 'admin' or 'viewer'" }),
  }),
});

const toggleUserActiveSchema = z.object({
  is_active: z.boolean({
    errorMap: () => ({ message: 'is_active must be a boolean' }),
  }),
});

const addCountrySchema = z.object({
  name: z.string().min(1, 'Country name is required'),
  risk_level: z.enum(['safe', 'special', 'high_risk'], {
    errorMap: () => ({ message: "risk_level must be 'safe', 'special', or 'high_risk'" }),
  }),
});

const createRoleSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  sort_order: z.number().int().optional(),
});

const updateRoleSchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().optional(),
});

const updateThresholdSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().optional(),
  notes: z.string().nullable().optional(),
  min_value: z.number().nullable().optional(),
  max_value: z.number().nullable().optional(),
  min_capex: z.number().nullable().optional(),
  max_capex: z.number().nullable().optional(),
  min_markup: z.number().nullable().optional(),
  max_markup: z.number().nullable().optional(),
  max_gross_margin: z.number().nullable().optional(),
  condition_text: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

// ---------------------------------------------------------------------------
// Helper: resolve internal user ID from req.user.oid
// ---------------------------------------------------------------------------

async function resolveUserId(req: Request): Promise<string | null> {
  if (!req.user) return null;
  const dbUser = await getUserByOid(req.user.oid);
  return dbUser?.id ?? null;
}

// ---------------------------------------------------------------------------
// Audit log
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/audit-log
 * Query params: limit, offset, entity_type, action
 */
export async function getAuditLogHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset as string, 10) : undefined;
    const entityType = req.query.entity_type as string | undefined;
    const action = req.query.action as string | undefined;

    const result = await getAuditLog({ limit, offset, entityType, action });

    res.json({
      status: 'ok',
      data: {
        rows: result.rows,
        total: result.total,
      },
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/users
 */
export async function listUsersHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const users = await listUsers();

    res.json({
      status: 'ok',
      data: users,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/admin/users/:id/role
 * Body: { role: 'admin' | 'viewer' }
 */
export async function updateUserRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const parsed = updateUserRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid role value', parsed.error.flatten());
    }

    const updated = await updateUserRole(id as string, parsed.data.role);
    if (!updated) {
      throw new NotFoundError(`User with id "${id}" not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/admin/users/:id/active
 * Body: { is_active: boolean }
 */
export async function toggleUserActiveHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { id } = req.params;

    const parsed = toggleUserActiveSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid is_active value', parsed.error.flatten());
    }

    const updated = await toggleUserActive(id as string, parsed.data.is_active);
    if (!updated) {
      throw new NotFoundError(`User with id "${id}" not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Thresholds
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/thresholds
 */
export async function listThresholdsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const thresholds = await getThresholdsWithApprovers();

    res.json({
      status: 'ok',
      data: thresholds,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/admin/thresholds/:thresholdId
 * Body: partial threshold fields
 */
export async function updateThresholdHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const thresholdId = parseInt(req.params.thresholdId as string, 10);
    if (isNaN(thresholdId)) {
      throw new ValidationError('Invalid threshold ID');
    }

    const parsed = updateThresholdSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid threshold data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);

    const updated = await updateThreshold(thresholdId, parsed.data, userId ?? undefined);
    if (!updated) {
      throw new NotFoundError(`Threshold with id ${thresholdId} not found`);
    }

    clearCalculatorCache();

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Roles
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/roles
 */
export async function listRolesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const roles = await getRoles();

    res.json({
      status: 'ok',
      data: roles,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/roles
 * Body: { name: string, sort_order?: number }
 */
export async function createRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid role data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);

    const role = await createRole(parsed.data, userId ?? undefined);

    res.status(201).json({
      status: 'ok',
      data: role,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/admin/roles/:id
 * Body: { name?, sort_order?, is_active? }
 */
export async function updateRoleHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid role ID');
    }

    const parsed = updateRoleSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid role data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);

    const updated = await updateRole(id, parsed.data, userId ?? undefined);
    if (!updated) {
      throw new NotFoundError(`Role with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Countries
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/countries
 */
export async function listCountriesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const countries = await getCountries();

    res.json({
      status: 'ok',
      data: countries,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/admin/countries/:id
 * Body: { risk_level: 'safe' | 'special' | 'high_risk' }
 */
export async function updateCountryRiskHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid country ID');
    }

    const parsed = addCountrySchema.pick({ risk_level: true }).safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid risk_level value', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);

    const updated = await updateCountryRisk(id, parsed.data.risk_level, userId ?? undefined);
    if (!updated) {
      throw new NotFoundError(`Country with id ${id} not found`);
    }

    clearCalculatorCache();

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/countries
 * Body: { name: string, risk_level: 'safe' | 'special' | 'high_risk' }
 */
export async function addCountryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = addCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid country data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);

    const country = await addCountry(parsed.data.name, parsed.data.risk_level, userId ?? undefined);

    clearCalculatorCache();

    res.status(201).json({
      status: 'ok',
      data: country,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return next(new ConflictError(`Country "${req.body.name}" already exists`));
    }
    next(error);
  }
}

/**
 * DELETE /api/v1/admin/countries/:id
 */
export async function deleteCountryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid country ID');
    }

    const userId = await resolveUserId(req);

    await deleteCountry(id, userId ?? undefined);

    clearCalculatorCache();

    res.json({
      status: 'ok',
      message: `Country with id ${id} deleted`,
    });
  } catch (error) {
    next(error);
  }
}
