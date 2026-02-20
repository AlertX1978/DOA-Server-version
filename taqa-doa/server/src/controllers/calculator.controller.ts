import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '../middleware/errorHandler';
import {
  evaluateApproval,
  getAllThresholds,
  getThresholdsByType,
  getAllCountries,
} from '../services/calculator.service';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const evaluateSchema = z.object({
  contractValue: z.number().min(0, 'contractValue must be >= 0'),
  capexValue: z.number().min(0, 'capexValue must be >= 0').default(0),
  contractType: z.enum(['standard', 'nonBinding', 'directSales', 'directSalesMarkup', 'epf']).default('standard'),
  selectedCountry: z.string().min(1, 'selectedCountry is required'),
  manualHighRisk: z.boolean().default(false),
  grossMargin: z.number().min(0).max(100).default(100),
  operatingProfitPercent: z.number().default(45),
  markupPercent: z.number().min(0).default(0),
});

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

/**
 * POST /api/v1/calculator/evaluate
 * Evaluate approval requirements for a given contract.
 */
export async function evaluate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parsed = evaluateSchema.safeParse(req.body);

    if (!parsed.success) {
      throw new ValidationError('Invalid calculator input', parsed.error.flatten());
    }

    const result = await evaluateApproval(parsed.data);

    res.json({
      status: 'ok',
      data: result,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/calculator/thresholds
 * Get all thresholds grouped by type.
 */
export async function getThresholds(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const grouped = await getAllThresholds();

    res.json({
      status: 'ok',
      data: grouped,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/calculator/thresholds/:type
 * Get thresholds of a specific type.
 */
export async function getThresholdsByTypeHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const type = req.params.type as string;
    const validTypes = ['high_risk', 'non_binding', 'commercial', 'direct_sales', 'direct_sales_markup', 'epf'];

    if (!validTypes.includes(type)) {
      throw new ValidationError(`Invalid threshold type. Must be one of: ${validTypes.join(', ')}`);
    }

    const thresholds = await getThresholdsByType(type);

    res.json({
      status: 'ok',
      data: thresholds,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/calculator/countries
 * Get all countries with their risk levels.
 */
export async function getCountries(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const countries = await getAllCountries();

    res.json({
      status: 'ok',
      data: countries,
    });
  } catch (error) {
    next(error);
  }
}
