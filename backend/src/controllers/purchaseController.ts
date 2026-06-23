import { Request, Response } from 'express';
import prisma from '../config/db';

const PLATFORM_FEE_PERCENT = 0.10; // 10% platform fee

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const punterId = req.user?.userId || null;
    const { predictionId, paymentMethod, guestEmail } = req.body;

    if (!predictionId || !paymentMethod) {
      return res.status(400).json({ error: 'Prediction ID and payment method are required.' });
    }

    if (!['BINANCE', 'YAPE', 'PLIN', 'FREE_BET'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method.' });
    }

    const prediction = await prisma.prediction.findUnique({
      where: { id: predictionId },
      include: { tipster: true },
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    if (punterId && prediction.tipsterId === punterId) {
      return res.status(400).json({ error: 'You cannot buy your own predictions.' });
    }

    // Block purchase if the event has already started or the sale time has expired
    const expirationTime = prediction.availableUntil ? new Date(prediction.availableUntil) : new Date(prediction.eventDate);
    if (expirationTime <= new Date() && !prediction.isCompleted) {
      return res.status(400).json({ error: 'Este pick ya está en juego o su período de compra ha finalizado.' });
    }

    // Check if already purchased (only if authenticated)
    if (punterId) {
      const existingPurchase = await prisma.purchase.findFirst({
        where: {
          punterId,
          predictionId,
          status: 'COMPLETED',
        },
      });

      if (existingPurchase) {
        return res.status(400).json({ error: 'You have already purchased this prediction.' });
      }
    }

    // 🎁 PROCESAR REPOSICIÓN DE APUESTA (FREE_BET)
    if (paymentMethod === 'FREE_BET') {
      if (!punterId) {
        return res.status(401).json({ error: 'Debes iniciar sesión para usar una reposición.' });
      }

      const user = await prisma.user.findUnique({
        where: { id: punterId },
      });

      if (!user || user.freeBetsCount <= 0) {
        return res.status(400).json({ error: 'No tienes reposiciones de apuesta disponibles.' });
      }

      // Completar la compra en una transacción (descontar crédito y crear la compra + transacción)
      const purchase = await prisma.$transaction(async (tx) => {
        // Descontar la reposición
        await tx.user.update({
          where: { id: punterId },
          data: {
            freeBetsCount: {
              decrement: 1,
            },
          },
        });

        // Crear la compra completada
        const newPurchase = await tx.purchase.create({
          data: {
            punterId,
            predictionId,
            amountPaid: 0,
            status: 'COMPLETED',
          },
        });

        // Crear la transacción con valores en cero
        await tx.transaction.create({
          data: {
            purchaseId: newPurchase.id,
            paymentMethod: 'FREE_BET',
            paymentGatewayId: `free_${Math.random().toString(36).substr(2, 9)}`,
            amount: 0,
            platformFee: 0,
            tipsterEarnings: 0,
          },
        });

        return newPurchase;
      });

      return res.status(201).json({
        message: 'Pick desbloqueado con reposición de apuesta con éxito.',
        purchaseId: purchase.id,
        paymentMethod: 'FREE_BET',
        isUnlocked: true,
      });
    }

    // Create a PENDING purchase record
    const purchase = await prisma.purchase.create({
      data: {
        punterId,
        guestEmail: guestEmail || null,
        predictionId,
        amountPaid: prediction.price,
        paymentMethod,
        status: 'PENDING',
      },
    });

    // Handle payment integration responses
    let paymentUrl = '';
    let instructions = '';

    if (paymentMethod === 'YAPE') {
      instructions = `Por favor realiza un pago de S/. ${prediction.price.toFixed(2)} escaneando el código QR de Yape o ingresando al número de teléfono 912966742 (Brajhan Jhoel Sandoval Duran). Sube el comprobante de pago para su verificación.`;
    } else if (paymentMethod === 'PLIN') {
      instructions = `Por favor realiza un pago de S/. ${prediction.price.toFixed(2)} escaneando el código QR de Plin o ingresando al número de teléfono 912966742 (Brajhan Jhoel Sandoval Duran). Sube el comprobante de pago para su verificación.`;
    } else if (paymentMethod === 'BINANCE') {
      instructions = `Por favor realiza el envío de USDT/BUSD equivalente a S/. ${prediction.price.toFixed(2)} a nuestra Binance Pay ID: 258963147. Sube la captura de pantalla e ingresa el código de referencia/Hash de la transacción para su verificación.`;
    }

    return res.status(201).json({
      message: 'Checkout initiated.',
      purchaseId: purchase.id,
      paymentMethod,
      paymentUrl,
      instructions,
    });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// Simulation endpoint to confirm payments instantly for testing (non-production)
export const simulatePaymentSuccess = async (req: Request, res: Response) => {
  try {
    const { purchaseId, transactionId } = req.body;

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { prediction: true },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }

    if (purchase.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Purchase already completed.' });
    }

    const platformFee = purchase.amountPaid * PLATFORM_FEE_PERCENT;
    const tipsterEarnings = purchase.amountPaid - platformFee;

    // Complete purchase in transaction
    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: 'COMPLETED' },
      });

      await tx.transaction.create({
        data: {
          purchaseId,
          paymentMethod: purchase.paymentMethod || 'MANUAL',
          paymentGatewayId: transactionId || `sim_${Math.random().toString(36).substr(2, 9)}`,
          amount: purchase.amountPaid,
          platformFee,
          tipsterEarnings,
        },
      });
    });

    return res.status(200).json({ 
      message: 'Payment simulated successfully. Prediction unlocked!',
      predictionId: purchase.predictionId,
      description: purchase.prediction.description 
    });
  } catch (error) {
    console.error('Payment simulation error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// For Yape/Plin/Binance, Apostador submits receipt/reference code and screenshot
export const submitManualPaymentProof = async (req: Request, res: Response) => {
  try {
    const { purchaseId, referenceCode, screenshotUrl } = req.body;

    if (!purchaseId || !screenshotUrl) {
      return res.status(400).json({ error: 'Purchase ID and screenshot of payment are required.' });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { prediction: true },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }

    if (purchase.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Purchase already completed.' });
    }

    // Save proof and leave status as PENDING (waiting for Tipster or Admin approval)
    const currentUserId = req.user?.userId || null;
    await prisma.purchase.update({
      where: { id: purchaseId },
      data: {
        screenshotUrl,
        referenceCode: referenceCode || null,
        status: 'PENDING',
        ...(currentUserId && !purchase.punterId ? { punterId: currentUserId } : {}),
      },
    });

    return res.status(200).json({
      message: 'Comprobante de pago enviado con éxito. Esperando aprobación.',
      purchaseId,
      description: purchase.prediction.description,
    });
  } catch (error) {
    console.error('Proof submission error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// ADMIN or TIPSTER approves Yape/Plin payment
export const approveManualPayment = async (req: Request, res: Response) => {
  try {
    const { purchaseId, paymentMethod, referenceCode } = req.body;
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    if (!purchaseId || !paymentMethod) {
      return res.status(400).json({ error: 'Purchase ID and payment method are required.' });
    }

    const purchase = await prisma.purchase.findUnique({
      where: { id: purchaseId },
      include: { prediction: true },
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found.' });
    }

    if (purchase.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Purchase already completed.' });
    }

    // Verify permission: ADMIN can approve anything. TIPSTER can only approve payments for their own predictions.
    if (currentUserRole !== 'ADMIN') {
      if (currentUserRole === 'TIPSTER') {
        if (purchase.prediction.tipsterId !== currentUserId) {
          return res.status(403).json({ error: 'No tienes permiso para aprobar pagos de este pronóstico.' });
        }
      } else {
        return res.status(403).json({ error: 'No autorizado para esta acción.' });
      }
    }

    const platformFee = purchase.amountPaid * PLATFORM_FEE_PERCENT;
    const tipsterEarnings = purchase.amountPaid - platformFee;

    await prisma.$transaction(async (tx) => {
      await tx.purchase.update({
        where: { id: purchaseId },
        data: { status: 'COMPLETED' },
      });

      await tx.transaction.create({
        data: {
          purchaseId,
          paymentMethod,
          paymentGatewayId: referenceCode || `manual_${Math.random().toString(36).substr(2, 9)}`,
          amount: purchase.amountPaid,
          platformFee,
          tipsterEarnings,
        },
      });
    });

    return res.status(200).json({ message: 'Manual payment approved successfully. Prediction unlocked!' });
  } catch (error) {
    console.error('Payment approval error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

// GET pending manual payments for verification (for ADMIN and TIPSTER)
export const getPendingManualPayments = async (req: Request, res: Response) => {
  try {
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    if (!currentUserId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    let purchases = [];

    if (currentUserRole === 'ADMIN') {
      purchases = await prisma.purchase.findMany({
        where: {
          status: 'PENDING',
          screenshotUrl: { not: null },
        },
        include: {
          punter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          prediction: {
            include: {
              tipster: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else if (currentUserRole === 'TIPSTER') {
      purchases = await prisma.purchase.findMany({
        where: {
          status: 'PENDING',
          screenshotUrl: { not: null },
          prediction: {
            tipsterId: currentUserId,
          },
        },
        include: {
          punter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          prediction: true,
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    return res.status(200).json({ purchases });
  } catch (error) {
    console.error('Error fetching pending payments:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getPurchasesHistory = async (req: Request, res: Response) => {
  try {
    const punterId = req.user?.userId;

    if (!punterId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const purchases = await prisma.purchase.findMany({
      where: {
        punterId,
        OR: [
          { status: 'COMPLETED' },
          { status: 'PENDING', screenshotUrl: { not: null } }
        ]
      },
      include: {
        prediction: {
          include: {
            tipster: {
              select: {
                id: true,
                name: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return res.status(200).json({ purchases });
  } catch (error) {
    console.error('Error fetching purchases history:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getSalesHistory = async (req: Request, res: Response) => {
  try {
    const tipsterId = req.user?.userId;

    if (!tipsterId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    // Get transactions associated with purchases of this tipster's predictions
    const sales = await prisma.transaction.findMany({
      where: {
        purchase: {
          prediction: {
            tipsterId,
          },
        },
      },
      include: {
        purchase: {
          include: {
            punter: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            prediction: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate total earnings
    const totalEarnings = sales.reduce((acc, curr) => acc + curr.tipsterEarnings, 0);

    return res.status(200).json({
      sales,
      totalEarnings,
    });
  } catch (error) {
    console.error('Error fetching sales history:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};


