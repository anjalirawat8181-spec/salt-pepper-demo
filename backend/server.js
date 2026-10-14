import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import mongoose from 'mongoose';
import morgan from 'morgan';

import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import healthRoutes from './routes/health.js';
import labRoutes from './routes/lab.js';
import userRoutes from './routes/users.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/salt-pepper-demo';

app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: false,
  })
);
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);
app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests. Please wait a few minutes and try again.' },
});

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/lab', labRoutes);
app.use('/api/health', healthRoutes);

app.get('/', (req, res) => {
  res.json({
    service: 'Salt & Pepper Demo API',
    status: 'online',
    documentation: 'Use /api/auth, /api/users, /api/admin, /api/lab, /api/health',
  });
});

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      console.warn('JWT_SECRET is not configured; using development fallback.');
    }

    if (!process.env.PASSWORD_PEPPER) {
      console.warn('PASSWORD_PEPPER is not configured; hashing will fail for authentication flows.');
    }

    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected: ${mongoUri}`);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

startServer();
