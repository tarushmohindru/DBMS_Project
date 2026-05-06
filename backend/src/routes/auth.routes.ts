import { Router } from 'express';
import { login, registerUser, getMe } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login',    login);
router.post('/register', authenticate, authorize('marketplace_admin'), registerUser);
router.get('/me',        authenticate, getMe);

export default router;
