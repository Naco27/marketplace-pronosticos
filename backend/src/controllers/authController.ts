import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import prisma from '../config/db';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

const BCRYPT_SALT_ROUNDS = 10;

// Guest login: creates or retrieves an anonymous Punter account
export const guestLogin = async (req: Request, res: Response) => {
  try {
    const guestUsername = `guest_${randomUUID().replace(/-/g, '').slice(0, 16)}`;

    const user = await prisma.user.create({
      data: {
        username: guestUsername,
        name: 'Apostador',
        role: 'PUNTER',
      },
    });

    const accessToken = generateAccessToken({ userId: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    return res.status(201).json({
      message: 'Guest account created.',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        freeBetsCount: user.freeBetsCount,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role, username } = req.body;

    if (!name || !role) {
      return res.status(400).json({ error: 'Name and role are required.' });
    }

    if (!['ADMIN', 'TIPSTER', 'PUNTER'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role. Choose ADMIN, TIPSTER or PUNTER.' });
    }

    if (role === 'PUNTER') {
      if (!username) {
        return res.status(400).json({ error: 'Username is required for Punters.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { username } });
      if (existingUser) {
        return res.status(409).json({ error: 'Username already taken.' });
      }

      const user = await prisma.user.create({
        data: {
          username,
          name,
          role,
        },
      });

      const accessToken = generateAccessToken({ userId: user.id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

      return res.status(201).json({
        message: 'Punter registered successfully.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          freeBetsCount: user.freeBetsCount,
        },
      });
    } else {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required for this role.' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ error: 'User with this email already exists.' });
      }

      const passwordHash = await bcrypt.hash(password, BCRYPT_SALT_ROUNDS);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            passwordHash,
            name,
            role,
          },
        });

        if (role === 'TIPSTER') {
          await tx.tipsterStats.create({
            data: {
              tipsterId: newUser.id,
            },
          });
        }

        return newUser;
      });

      const accessToken = generateAccessToken({ userId: user.id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

      return res.status(201).json({
        message: 'User registered successfully.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          freeBetsCount: user.freeBetsCount,
        },
      });
    }
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password, username, role, code } = req.body;

    // Login for Tipster using a simple access code
    if (code) {
      if (code !== 'BETMARKET-PRO') {
        return res.status(401).json({ error: 'Código de acceso incorrecto.' });
      }

      const user = await prisma.user.findFirst({
        where: { role: 'TIPSTER', email: 'tipster1@marketplace.com' },
        include: { stats: true },
      });

      if (!user) {
        return res.status(404).json({ error: 'Tipster por defecto no encontrado. Corre el seed de la base de datos.' });
      }

      const accessToken = generateAccessToken({ userId: user.id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

      return res.status(200).json({
        message: 'Login successful via access code.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          stats: user.stats,
          freeBetsCount: user.freeBetsCount,
        },
      });
    }

    if (role === 'PUNTER' || username) {
      if (!username) {
        return res.status(400).json({ error: 'Username is required for Punters.' });
      }

      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) {
        return res.status(401).json({ error: 'Invalid username.' });
      }

      const accessToken = generateAccessToken({ userId: user.id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

      return res.status(200).json({
        message: 'Login successful.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          freeBetsCount: user.freeBetsCount,
        },
      });
    } else {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const user = await prisma.user.findUnique({
        where: { email },
        include: { stats: true },
      });

      if (!user || !user.passwordHash) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const accessToken = generateAccessToken({ userId: user.id, role: user.role });
      const refreshToken = generateRefreshToken({ userId: user.id, role: user.role });

      return res.status(200).json({
        message: 'Login successful.',
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          stats: user.stats,
          freeBetsCount: user.freeBetsCount,
        },
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid or expired refresh token.' });
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const newAccessToken = generateAccessToken({ userId: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ userId: user.id, role: user.role });

    return res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};

export const getProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        stats: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    return res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        name: user.name,
        role: user.role,
        isVerified: user.isVerified,
        avatarUrl: user.avatarUrl,
        stats: user.stats,
        freeBetsCount: user.freeBetsCount,
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return res.status(500).json({ error: 'Internal server error.' });
  }
};
