import { Request, Response, NextFunction } from 'express';
import { getGlossary } from '../services/glossary.service';

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/glossary
 * Get all glossary entries ordered by sort_order.
 */
export async function getGlossaryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const entries = await getGlossary();

    res.json({
      status: 'ok',
      data: entries,
    });
  } catch (error) {
    next(error);
  }
}
