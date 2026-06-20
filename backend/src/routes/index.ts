import { Router } from 'express';
import authRoutes from './authRoutes';
import predictionRoutes from './predictionRoutes';
import purchaseRoutes from './purchaseRoutes';
import uploadRoutes from './uploadRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/predictions', predictionRoutes);
router.use('/purchases', purchaseRoutes);
router.use('/upload', uploadRoutes);

export default router;
