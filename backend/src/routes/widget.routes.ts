import { Router } from 'express';
import { listUserWidgets, addUserWidget, editUserWidget, removeUserWidget } from '../controllers/widget.controller.js';
import { requireAuth } from '../middlewares/requireAuth.js';

const router = Router();

router.use(requireAuth);

router.get('/', listUserWidgets);
router.post('/', addUserWidget);
router.patch('/:id', editUserWidget);
router.delete('/:id', removeUserWidget);

export default router;