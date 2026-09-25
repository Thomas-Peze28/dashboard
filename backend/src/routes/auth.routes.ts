import { Router } from 'express';
import { register, confirmEmail } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.get('/confirm/:token', confirmEmail);

export default router;