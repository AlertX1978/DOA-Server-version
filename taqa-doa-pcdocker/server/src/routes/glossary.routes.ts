import { Router } from 'express';
import { getGlossaryHandler } from '../controllers/glossary.controller';

const router = Router();

// GET    /api/v1/glossary
router.get('/', getGlossaryHandler);

export default router;
