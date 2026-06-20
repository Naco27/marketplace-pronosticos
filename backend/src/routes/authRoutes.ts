import { Router } from 'express';
import { register, login, refresh, getProfile, guestLogin } from '../controllers/authController';
import { authenticate } from '../middlewares/auth';

const router = Router();

router.post('/register', register as any);
router.post('/login', login as any);
router.post('/refresh', refresh as any);
router.post('/guest', guestLogin as any);
router.get('/profile', authenticate as any, getProfile as any);

export default router;
