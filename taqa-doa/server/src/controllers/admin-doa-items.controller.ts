import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import { getUserByOid } from '../services/user.service';
import {
  getAllDOAItems,
  getDOAItemById,
  createDOAItem,
  updateDOAItem,
  deleteDOAItem,
  replaceDOAItemApprovers,
} from '../services/admin-doa-items.service';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createDOAItemSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  description: z.string().nullable().optional(),
  applies_to: z.string().nullable().optional(),
  category_id: z.number().int().nullable().optional(),
  business_owner: z.string().nullable().optional(),
  delegable: z.string().nullable().optional(),
  interpretation: z.string().nullable().optional(),
});

const updateDOAItemSchema = z.object({
  code: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  applies_to: z.string().nullable().optional(),
  category_id: z.number().int().nullable().optional(),
  business_owner: z.string().nullable().optional(),
  delegable: z.string().nullable().optional(),
  interpretation: z.string().nullable().optional(),
});

const approverSchema = z.object({
  approvers: z.array(
    z.object({
      role_id: z.number().int(),
      action: z.string().regex(/^[IREXN]\d*\*?$/, 'Action must match pattern [IREXN][0-9]*[*]?'),
      sort_order: z.number().int().default(0),
    })
  ),
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
// DOA Items handlers
// ---------------------------------------------------------------------------

export async function listDOAItemsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categoryId = req.query.category_id ? parseInt(req.query.category_id as string, 10) : undefined;
    const search = req.query.search as string | undefined;

    const items = await getAllDOAItems(categoryId, search);

    res.json({
      status: 'ok',
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getDOAItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid DOA item ID');
    }

    const item = await getDOAItemById(id);
    if (!item) {
      throw new NotFoundError(`DOA item with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function createDOAItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createDOAItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid DOA item data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const item = await createDOAItem(parsed.data, userId ?? undefined);

    res.status(201).json({
      status: 'ok',
      data: item,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return next(new ConflictError(`DOA item with code "${req.body.code}" already exists`));
    }
    next(error);
  }
}

export async function updateDOAItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid DOA item ID');
    }

    const parsed = updateDOAItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid DOA item data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const updated = await updateDOAItem(id, parsed.data, userId ?? undefined);
    if (!updated) {
      throw new NotFoundError(`DOA item with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return next(new ConflictError(`DOA item with code "${req.body.code}" already exists`));
    }
    next(error);
  }
}

export async function deleteDOAItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid DOA item ID');
    }

    const userId = await resolveUserId(req);
    await deleteDOAItem(id, userId ?? undefined);

    res.json({
      status: 'ok',
      data: { message: `DOA item with id ${id} deleted` },
    });
  } catch (error) {
    next(error);
  }
}

export async function replaceDOAItemApproversHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid DOA item ID');
    }

    const parsed = approverSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid approver data', parsed.error.flatten());
    }

    const item = await getDOAItemById(id);
    if (!item) {
      throw new NotFoundError(`DOA item with id ${id} not found`);
    }

    const userId = await resolveUserId(req);
    const approvers = await replaceDOAItemApprovers(id, parsed.data.approvers, userId ?? undefined);

    res.json({
      status: 'ok',
      data: approvers,
    });
  } catch (error) {
    next(error);
  }
}
