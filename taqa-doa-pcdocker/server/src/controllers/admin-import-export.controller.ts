import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';
import { getUserByOid } from '../services/user.service';
import { exportEntities, validateImport, importEntities } from '../services/import-export.service';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const validEntities = [
  'browse_items', 'doa_items', 'categories', 'roles',
  'thresholds', 'countries', 'glossary', 'settings',
] as const;

const importSchema = z.object({
  entities: z.record(z.array(z.any())),
  mode: z.enum(['merge', 'replace']).default('merge'),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

async function resolveUserId(req: Request): Promise<string | null> {
  if (!req.user) return null;
  const dbUser = await getUserByOid(req.user.oid);
  return dbUser?.id ?? null;
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/admin/export
 * Query: ?entities=browse_items,roles,...
 */
export async function exportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entitiesParam = req.query.entities as string | undefined;
    let entities: string[];

    if (entitiesParam) {
      entities = entitiesParam.split(',').map((e) => e.trim());
      const invalid = entities.filter((e) => !(validEntities as readonly string[]).includes(e));
      if (invalid.length > 0) {
        throw new ValidationError(`Invalid entities: ${invalid.join(', ')}`);
      }
    } else {
      entities = [...validEntities];
    }

    const result = await exportEntities(entities);

    res.json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/import/validate
 * Body: { entities: { ... } }
 */
export async function validateImportHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await validateImport(req.body);

    res.json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/admin/import
 * Body: { entities: { ... }, mode: 'merge' | 'replace' }
 */
export async function importHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = importSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid import data', parsed.error.flatten());
    }

    // Validate first
    const validation = await validateImport(req.body);
    if (!validation.valid) {
      throw new ValidationError('Import validation failed', { errors: validation.errors });
    }

    const userId = await resolveUserId(req);
    const result = await importEntities(req.body, parsed.data.mode, userId ?? undefined);

    res.json({
      status: 'ok',
      data: { imported: result },
    });
  } catch (error) {
    next(error);
  }
}
