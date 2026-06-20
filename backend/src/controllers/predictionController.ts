import { Request, Response } from 'express';
import prisma from '../config/db';

export const createPrediction = async (req: Request, res: Response) => {
  try {
    const tipsterId = req.user?.userId;
    if (!tipsterId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const { sport, league, eventDate, odds, stake, price, description, imageUrl, argumentation, betLink, isFixed, availableUntil } = req.body;

    if (!sport || odds === undefined || price === undefined || !description) {
      return res.status(400).json({ error: 'All fields are required.' });
    }

    const prediction = await prisma.prediction.create({
      data: {
        tipsterId,
        sport,
        league: league || '',
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        odds: parseFloat(odds),
        stake: stake !== undefined ? parseFloat(stake) : 5,
        price: parseFloat(price),
        description,
        imageUrl: imageUrl || null,
        argumentation: argumentation || null,
        betLink: betLink || null,
        isFixed: isFixed === true || isFixed === 'true',
        availableUntil: availableUntil ? new Date(availableUntil) : null,
      },
    });

    return res.status(201).json({
      message: 'Prediction published successfully.',
      prediction,
    });
  } catch (error) {
    console.error('Error creating prediction:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getPredictions = async (req: Request, res: Response) => {
  try {
    const { sport, league, minOdds, maxOdds, tipsterId } = req.query;
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    // Filter conditions
    const where: any = {};
    if (sport) where.sport = String(sport);
    if (league) where.league = String(league);
    if (tipsterId) where.tipsterId = String(tipsterId);
    
    if (minOdds || maxOdds) {
      where.odds = {};
      if (minOdds) where.odds.gte = parseFloat(String(minOdds));
      if (maxOdds) where.odds.lte = parseFloat(String(maxOdds));
    }

    const predictions = await prisma.prediction.findMany({
      where,
      include: {
        tipster: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            stats: true,
          },
        },
        ...(currentUserId
          ? {
              purchases: {
                where: {
                  punterId: currentUserId,
                  status: {
                    in: ['COMPLETED', 'PENDING']
                  }
                },
              },
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    // Mask the description + extra fields if the user hasn't bought it
    const now = new Date();
    const processedPredictions = predictions.map((pred) => {
      const isAuthor = currentUserId === pred.tipsterId;
      const isAdmin = currentUserRole === 'ADMIN';
      const purchase = pred.purchases && pred.purchases[0];
      const hasPurchased = purchase && purchase.status === 'COMPLETED';
      const hasPending = purchase && purchase.status === 'PENDING';
      const showFullInfo = isAuthor || isAdmin || hasPurchased || pred.price === 0;
      const expirationTime = pred.availableUntil ? new Date(pred.availableUntil) : new Date(pred.eventDate);
      const isLive = expirationTime <= now && !pred.isCompleted;

      const { purchases, ...rest } = pred;

      return {
        ...rest,
        isLive,
        description: showFullInfo ? pred.description : '🔒 CONTENIDO PREMIUM OCULTO. Compra este pronóstico para desbloquear el pick y análisis completo.',
        imageUrl: showFullInfo ? pred.imageUrl : null,
        argumentation: showFullInfo ? pred.argumentation : null,
        betLink: showFullInfo ? pred.betLink : null,
        isUnlocked: showFullInfo,
        hasPendingPurchase: !!hasPending,
      };
    });

    return res.status(200).json({ predictions: processedPredictions });
  } catch (error) {
    console.error('Error getting predictions:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getPredictionById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    const prediction = await prisma.prediction.findUnique({
      where: { id },
      include: {
        tipster: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            stats: true,
          },
        },
        ...(currentUserId
          ? {
              purchases: {
                where: {
                  punterId: currentUserId,
                  status: {
                    in: ['COMPLETED', 'PENDING']
                  }
                },
              },
            }
          : {}),
      },
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    const isAuthor = currentUserId === prediction.tipsterId;
    const isAdmin = currentUserRole === 'ADMIN';
    const purchase = prediction.purchases && prediction.purchases[0];
    const hasPurchased = purchase && purchase.status === 'COMPLETED';
    const hasPending = purchase && purchase.status === 'PENDING';
    const showFullInfo = isAuthor || isAdmin || hasPurchased || prediction.price === 0;
    const expirationTime = prediction.availableUntil ? new Date(prediction.availableUntil) : new Date(prediction.eventDate);
    const isLive = expirationTime <= new Date() && !prediction.isCompleted;

    const { purchases, ...rest } = prediction;

    return res.status(200).json({
      prediction: {
        ...rest,
        isLive,
        description: showFullInfo ? prediction.description : '🔒 CONTENIDO PREMIUM OCULTO. Compra este pronóstico para desbloquear el pick y análisis completo.',
        imageUrl: showFullInfo ? prediction.imageUrl : null,
        argumentation: showFullInfo ? prediction.argumentation : null,
        betLink: showFullInfo ? prediction.betLink : null,
        isUnlocked: showFullInfo,
        hasPendingPurchase: !!hasPending,
      },
    });
  } catch (error) {
    console.error('Error getting prediction by id:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const resolvePrediction = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { result } = req.body; // "WON", "LOST", "VOID"
    const currentUserId = req.user?.userId;
    const currentUserRole = req.user?.role;

    if (!['WON', 'LOST', 'VOID'].includes(result)) {
      return res.status(400).json({ error: 'Invalid result. Choose WON, LOST, or VOID.' });
    }

    const prediction = await prisma.prediction.findUnique({
      where: { id },
    });

    if (!prediction) {
      return res.status(404).json({ error: 'Prediction not found.' });
    }

    // Only Admin or the Tipster who created it can resolve it
    if (prediction.tipsterId !== currentUserId && currentUserRole !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden. You do not own this prediction.' });
    }

    if (prediction.isCompleted) {
      return res.status(400).json({ error: 'Prediction is already resolved.' });
    }

    // Update prediction and TipsterStats in a transaction
    await prisma.$transaction(async (tx) => {
      await tx.prediction.update({
        where: { id },
        data: {
          isCompleted: true,
          result,
          resolvedAt: new Date(),   // 🕐 used by auto-delete scheduler
        },
      });

      // Si la predicción se marca como PERDIDA (LOST), otorgar una reposición de apuesta (free bet)
      // a todos los apostadores registrados que hayan adquirido este pick con éxito.
      if (result === 'LOST') {
        const completedPurchases = await tx.purchase.findMany({
          where: {
            predictionId: id,
            status: 'COMPLETED',
            punterId: { not: null },
          },
          select: {
            punterId: true,
          },
        });

        const punterIds = completedPurchases
          .map((p) => p.punterId)
          .filter(Boolean) as string[];

        if (punterIds.length > 0) {
          await tx.user.updateMany({
            where: {
              id: { in: punterIds },
            },
            data: {
              freeBetsCount: {
                increment: 1,
              },
            },
          });
        }
      }

      // Recalculate Stats
      const allCompleted = await tx.prediction.findMany({
        where: {
          tipsterId: prediction.tipsterId,
          isCompleted: true,
        },
      });

      const totalPredictions = allCompleted.length;
      const wonPredictions = allCompleted.filter((p) => p.result === 'WON').length;

      // Calculate Profit and Yield
      // Yield = (Net profit / Total amount staked) * 100
      let totalStake = 0;
      let totalProfit = 0;

      for (const p of allCompleted) {
        totalStake += p.stake;
        if (p.result === 'WON') {
          totalProfit += p.stake * (p.odds - 1);
        } else if (p.result === 'LOST') {
          totalProfit -= p.stake;
        }
        // VOID prediction profit is 0 and is not added/subtracted
      }

      const yieldPercentage = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;

      await tx.tipsterStats.update({
        where: { tipsterId: prediction.tipsterId },
        data: {
          totalPredictions,
          wonPredictions,
          profit: parseFloat(totalProfit.toFixed(2)),
          yield: parseFloat(yieldPercentage.toFixed(2)),
        },
      });
    });

    return res.status(200).json({ message: 'Prediction resolved successfully and stats updated.' });
  } catch (error) {
    console.error('Error resolving prediction:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
