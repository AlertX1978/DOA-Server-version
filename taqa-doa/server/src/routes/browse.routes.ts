import { Router } from 'express';
import {
  getItems,
  getItemByCode,
  getFunctions,
} from '../controllers/browse.controller';

const router = Router();

// GET    /api/v1/browse/functions
// Note: must come before /items/:code to avoid "functions" matching as :code
router.get('/functions', getFunctions);

// GET    /api/v1/browse/items
router.get('/items', getItems);

// GET    /api/v1/browse/items/:code
router.get('/items/:code', getItemByCode);

export default router;
