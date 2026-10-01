import { Router } from 'express';
import { register, confirmEmail, login } from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', register);
router.get('/confirm/:token', confirmEmail);
router.post('/login', login);

export default router;