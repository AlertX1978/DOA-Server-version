import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError, NotFoundError, ConflictError } from '../middleware/errorHandler';
import { getUserByOid } from '../services/user.service';
import {
  getAllBrowseItems,
  getBrowseItemById,
  createBrowseItem,
  updateBrowseItem,
  deleteBrowseItem,
  reorderBrowseItems,
  replaceBrowseItemApprovers,
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../services/admin-browse.service';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const createBrowseItemSchema = z.object({
  code: z.string().min(1, 'Code is required'),
  parent_code: z.string().nullable().optional(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  function_name: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const updateBrowseItemSchema = z.object({
  code: z.string().min(1).optional(),
  parent_code: z.string().nullable().optional(),
  title: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  comments: z.string().nullable().optional(),
  function_name: z.string().nullable().optional(),
  sort_order: z.number().int().optional(),
});

const reorderSchema = z.object({
  items: z.array(
    z.object({
      id: z.number().int(),
      sort_order: z.number().int(),
    })
  ).min(1, 'At least one item is required'),
});

const approverSchema = z.object({
  approvers: z.array(
    z.object({
      role_id: z.number().int(),
      action: z.string().regex(/^[IREXN]\d*\*?$/, 'Action must match pattern [IREXN][0-9]*[*]?'),
      kind: z.string().max(1).default('A'),
      sort_order: z.number().int().default(0),
    })
  ),
});

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  sort_order: z.number().int().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  sort_order: z.number().int().optional(),
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
// Browse Items handlers
// ---------------------------------------------------------------------------

export async function listBrowseItemsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const search = req.query.search as string | undefined;
    const functionName = req.query.function as string | undefined;

    const items = await getAllBrowseItems(search, functionName);

    res.json({
      status: 'ok',
      data: items,
    });
  } catch (error) {
    next(error);
  }
}

export async function getBrowseItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid browse item ID');
    }

    const item = await getBrowseItemById(id);
    if (!item) {
      throw new NotFoundError(`Browse item with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function createBrowseItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createBrowseItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid browse item data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const item = await createBrowseItem(parsed.data, userId ?? undefined);

    res.status(201).json({
      status: 'ok',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

export async function updateBrowseItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid browse item ID');
    }

    const parsed = updateBrowseItemSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid browse item data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const updated = await updateBrowseItem(id, parsed.data, userId ?? undefined);
    if (!updated) {
      throw new NotFoundError(`Browse item with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteBrowseItemHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid browse item ID');
    }

    const cascade = req.query.cascade === 'true';
    const userId = await resolveUserId(req);

    const result = await deleteBrowseItem(id, cascade, userId ?? undefined);
    if (result.deleted === 0) {
      throw new NotFoundError(`Browse item with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: { deleted: result.deleted },
    });
  } catch (error: any) {
    if (error?.message?.startsWith('CHILDREN_EXIST:')) {
      const count = error.message.split(':')[1];
      return next(new ConflictError(
        `Cannot delete: item has ${count} children. Use ?cascade=true to delete all.`
      ));
    }
    next(error);
  }
}

export async function reorderBrowseItemsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = reorderSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid reorder data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const result = await reorderBrowseItems(parsed.data.items, userId ?? undefined);

    res.json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

export async function replaceBrowseItemApproversHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid browse item ID');
    }

    const parsed = approverSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid approver data', parsed.error.flatten());
    }

    // Verify item exists
    const item = await getBrowseItemById(id);
    if (!item) {
      throw new NotFoundError(`Browse item with id ${id} not found`);
    }

    const userId = await resolveUserId(req);
    const approvers = await replaceBrowseItemApprovers(id, parsed.data.approvers, userId ?? undefined);

    res.json({
      status: 'ok',
      data: approvers,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Categories handlers
// ---------------------------------------------------------------------------

export async function listCategoriesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const categories = await getCategories();

    res.json({
      status: 'ok',
      data: categories,
    });
  } catch (error) {
    next(error);
  }
}

export async function createCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = createCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid category data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const category = await createCategory(parsed.data, userId ?? undefined);

    res.status(201).json({
      status: 'ok',
      data: category,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return next(new ConflictError(`Category "${req.body.name}" already exists`));
    }
    next(error);
  }
}

export async function updateCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid category ID');
    }

    const parsed = updateCategorySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid category data', parsed.error.flatten());
    }

    const userId = await resolveUserId(req);
    const updated = await updateCategory(id, parsed.data, userId ?? undefined);
    if (!updated) {
      throw new NotFoundError(`Category with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error: any) {
    if (error?.code === '23505') {
      return next(new ConflictError(`Category "${req.body.name}" already exists`));
    }
    next(error);
  }
}

export async function deleteCategoryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid category ID');
    }

    const userId = await resolveUserId(req);
    await deleteCategory(id, userId ?? undefined);

    res.json({
      status: 'ok',
      data: { message: `Category with id ${id} deleted` },
    });
  } catch (error: any) {
    if (error?.message === 'CATEGORY_IN_USE') {
      return next(new ConflictError('Cannot delete category: it is referenced by DOA items'));
    }
    next(error);
  }
}
