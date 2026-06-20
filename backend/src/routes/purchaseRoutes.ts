import { Router } from 'express';
import {
  createCheckoutSession,
  simulatePaymentSuccess,
  submitManualPaymentProof,
  approveManualPayment,
  getPendingManualPayments,
  getPurchasesHistory,
  getSalesHistory,
} from '../controllers/purchaseController';
import { authenticate, optionalAuthenticate, requireRole } from '../middlewares/auth';

const router = Router();

router.post('/checkout', optionalAuthenticate as any, createCheckoutSession as any);
router.post('/simulate-success', optionalAuthenticate as any, simulatePaymentSuccess as any);
router.post('/submit-proof', optionalAuthenticate as any, submitProofWrapper as any);
router.post('/approve-manual', authenticate as any, requireRole(['ADMIN', 'TIPSTER']) as any, approveManualPayment as any);
router.get('/pending', authenticate as any, requireRole(['ADMIN', 'TIPSTER']) as any, getPendingManualPayments as any);
router.get('/history/purchases', authenticate as any, requireRole(['PUNTER']) as any, getPurchasesHistory as any);
router.get('/history/sales', authenticate as any, requireRole(['TIPSTER']) as any, getSalesHistory as any);

// Wrapper because of potential request handling signature mismatch
function submitProofWrapper(req: any, res: any) {
  return submitManualPaymentProof(req, res);
}

export default router;
