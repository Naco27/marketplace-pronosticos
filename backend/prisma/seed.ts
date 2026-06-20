import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Clean existing tables
  await prisma.review.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.purchase.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.tipsterStats.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const admin = await prisma.user.create({
    data: {
      email: 'admin@marketplace.com',
      passwordHash,
      name: 'Don Admin',
      role: 'ADMIN',
      isVerified: true,
    },
  });

  // 2. Create Tipsters
  const tipster1 = await prisma.user.create({
    data: {
      email: 'tipster1@marketplace.com',
      passwordHash,
      name: 'John Betster (Pro)',
      role: 'TIPSTER',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    },
  });

  const tipster2 = await prisma.user.create({
    data: {
      email: 'tipster2@marketplace.com',
      passwordHash,
      name: 'Betting Master',
      role: 'TIPSTER',
      isVerified: true,
      avatarUrl: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150',
    },
  });

  // Create Tipster Stats
  await prisma.tipsterStats.create({
    data: {
      tipsterId: tipster1.id,
      totalPredictions: 4,
      wonPredictions: 3,
      yield: 24.5,
      profit: 980.0,
    },
  });

  await prisma.tipsterStats.create({
    data: {
      tipsterId: tipster2.id,
      totalPredictions: 10,
      wonPredictions: 6,
      yield: 12.3,
      profit: 450.0,
    },
  });

  // 3. Create Punters (Apostadores)
  const punter1 = await prisma.user.create({
    data: {
      email: 'punter1@marketplace.com',
      passwordHash,
      name: 'Carlos Apostador',
      role: 'PUNTER',
      isVerified: true,
    },
  });

  const punter2 = await prisma.user.create({
    data: {
      email: 'punter2@marketplace.com',
      passwordHash,
      name: 'Maria BettingFan',
      role: 'PUNTER',
      isVerified: true,
    },
  });

  // 4. Create Predictions
  // ONE Active Prediction (John Betster) — only this one is shown in the marketplace
  const pred1 = await prisma.prediction.create({
    data: {
      tipsterId: tipster1.id,
      sport: 'Fútbol',
      league: 'Champions League',
      eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      odds: 1.95,
      stake: 5.0,
      price: 20.0,
      description: 'Real Madrid vs Bayern Munich — Ambos anotan + Más de 2.5 goles. Real Madrid llega sólido de local. Bayern necesita remontar y saldrá a buscar el partido desde el arranque. El juego abierto favorece este mercado combinado.',
      isCompleted: false,
      result: 'PENDING',
    },
  });

  // 5. Create Purchases
  // Maria initiated checkout for pred1 (Active) — pending payment
  await prisma.purchase.create({
    data: {
      punterId: punter2.id,
      predictionId: pred1.id,
      amountPaid: 20.0,
      status: 'PENDING',
    },
  });

  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
