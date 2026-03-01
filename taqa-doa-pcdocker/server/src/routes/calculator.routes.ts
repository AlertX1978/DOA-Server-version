import { Router } from 'express';
import {
  evaluate,
  getThresholds,
  getThresholdsByTypeHandler,
  getCountries,
} from '../controllers/calculator.controller';

const router = Router();

// POST   /api/v1/calculator/evaluate
router.post('/evaluate', evaluate);

// GET    /api/v1/calculator/thresholds
router.get('/thresholds', getThresholds);

// GET    /api/v1/calculator/thresholds/:type
router.get('/thresholds/:type', getThresholdsByTypeHandler);

// GET    /api/v1/calculator/countries
router.get('/countries', getCountries);

export default router;
