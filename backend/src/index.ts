import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import apiRoutes from './routes';
import { startScheduler } from './utils/scheduler';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" } // allows image loading cross-origin
}));

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'http://127.0.0.1:3000',
].filter((url): url is string => !!url);

app.use(cors({
  origin: (origin, callback) => {
    // Permitir en desarrollo local o si el origen está en la lista blanca
    if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));


app.use(express.json());

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Main routing hub
app.use('/api', apiRoutes);

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Marketplace API is running' });
});

// 404 Route handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: 'Endpoint not found.' });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  startScheduler();   // 🕐 Auto-elimina picks WON >1h después de resolverse
});
