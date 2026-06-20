import { Router } from 'express';
import { createPrediction, getPredictions, getPredictionById, resolvePrediction } from '../controllers/predictionController';
import { authenticate, optionalAuthenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.post('/', authenticate as any, requireRole(['TIPSTER']) as any, createPrediction as any);
router.get('/', optionalAuthenticate as any, getPredictions as any);
router.get('/:id', optionalAuthenticate as any, getPredictionById as any);
router.post('/:id/resolve', authenticate as any, requireRole(['TIPSTER', 'ADMIN']) as any, resolvePrediction as any);

export default router;
