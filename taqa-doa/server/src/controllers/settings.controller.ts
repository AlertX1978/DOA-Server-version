import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { NotFoundError, ValidationError } from '../middleware/errorHandler';
import {
  getAllSettings,
  getSetting,
  updateSetting,
  getAggregatedSettings,
  getCountries,
  updateCountryRiskLevel,
} from '../services/settings.service';

// ---------------------------------------------------------------------------
// Validation schemas
// ---------------------------------------------------------------------------

const updateSettingSchema = z.object({
  value: z.unknown(),
});

const updateCountrySchema = z.object({
  risk_level: z.enum(['safe', 'special', 'high_risk'], {
    errorMap: () => ({ message: "risk_level must be 'safe', 'special', or 'high_risk'" }),
  }),
});

// ---------------------------------------------------------------------------
// Settings handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings
 * Get all application settings.
 */
export async function getSettingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const settings = await getAllSettings();

    res.json({
      status: 'ok',
      data: settings,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/settings/:key
 * Get a single setting by key.
 */
export async function getSettingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = req.params.key as string;
    const setting = await getSetting(key);

    if (!setting) {
      throw new NotFoundError(`Setting with key "${key}" not found`);
    }

    res.json({
      status: 'ok',
      data: setting,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT /api/v1/settings/:key
 * Update a setting value.
 */
export async function updateSettingHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const key = req.params.key as string;

    const parsed = updateSettingSchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid setting value', parsed.error.flatten());
    }

    // userId would come from auth middleware in the future
    const userId = (req as unknown as { userId?: string }).userId;

    const updated = await updateSetting(key, parsed.data.value, userId);

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/settings/aggregated
 * Get settings in the aggregated format expected by the client frontend.
 */
export async function getAggregatedSettingsHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const aggregated = await getAggregatedSettings();

    res.json({
      status: 'ok',
      data: aggregated,
    });
  } catch (error) {
    next(error);
  }
}

// ---------------------------------------------------------------------------
// Country handlers
// ---------------------------------------------------------------------------

/**
 * GET /api/v1/settings/countries
 * Get all countries with risk levels.
 */
export async function getCountriesHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
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
 * PUT /api/v1/settings/countries/:id
 * Update a country's risk level.
 */
export async function updateCountryHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      throw new ValidationError('Invalid country ID');
    }

    const parsed = updateCountrySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError('Invalid country update', parsed.error.flatten());
    }

    // userId would come from auth middleware in the future
    const userId = (req as unknown as { userId?: string }).userId;

    const updated = await updateCountryRiskLevel(id, parsed.data.risk_level, userId);

    if (!updated) {
      throw new NotFoundError(`Country with id ${id} not found`);
    }

    res.json({
      status: 'ok',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
}
