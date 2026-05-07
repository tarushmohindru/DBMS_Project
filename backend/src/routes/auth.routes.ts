import { Router } from 'express';
import { login, registerUser, signupUser, listUsers, getMe } from '../controllers/auth.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.post('/login',    login);
router.post('/signup',   signupUser);
router.post('/register', authenticate, authorize('marketplace_admin'), registerUser);
router.get('/users',     authenticate, authorize('marketplace_admin'), listUsers);
router.get('/me',        authenticate, getMe);

export default router;
