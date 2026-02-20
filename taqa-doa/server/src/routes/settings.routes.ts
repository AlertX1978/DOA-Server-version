import { Router } from 'express';
import {
  getSettingsHandler,
  getSettingHandler,
  updateSettingHandler,
  getAggregatedSettingsHandler,
  getCountriesHandler,
  updateCountryHandler,
} from '../controllers/settings.controller';

const router = Router();

// GET    /api/v1/settings/aggregated
// Note: must come before /:key to avoid matching as :key
router.get('/aggregated', getAggregatedSettingsHandler);

// GET    /api/v1/settings/countries
// Note: must come before /:key to avoid "countries" matching as :key
router.get('/countries', getCountriesHandler);

// PUT    /api/v1/settings/countries/:id
router.put('/countries/:id', updateCountryHandler);

// GET    /api/v1/settings
router.get('/', getSettingsHandler);

// GET    /api/v1/settings/:key
router.get('/:key', getSettingHandler);

// PUT    /api/v1/settings/:key
router.put('/:key', updateSettingHandler);

export default router;
