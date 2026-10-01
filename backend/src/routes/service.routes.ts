import { Router } from 'express';
import { listServices } from '../controllers/service.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth);
router.get('/', listServices);

export default router;