import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../middleware/errorHandler';
import {
  getAllBrowseItems,
  getBrowseItemByCode,
  getAllFunctions,
} from '../services/browse.service';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/browse/items
 * Get all browse items with optional query params: search, function.
 */
export async function getItems(req: Request, res: Response, next: NextFunction): Promise<void> {
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

/**
 * GET /api/v1/browse/items/:code
 * Get a single browse item by code.
 */
export async function getItemByCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const code = req.params.code as string;
    const item = await getBrowseItemByCode(code);

    if (!item) {
      throw new NotFoundError(`Browse item with code "${code}" not found`);
    }

    res.json({
      status: 'ok',
      data: item,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/browse/functions
 * Get all distinct function names.
 */
export async function getFunctions(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const functions = await getAllFunctions();

    res.json({
      status: 'ok',
      data: functions,
    });
  } catch (error) {
    next(error);
  }
}
