import { Router } from 'express';
import { getAboutJson } from '../controllers/about.controller.js';

const router = Router();

router.get('/about.json', getAboutJson);

export default router;