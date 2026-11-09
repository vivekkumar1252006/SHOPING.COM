import './config/env.js';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

import { connectDB, disconnectDB, isDatabaseConnected, requireDatabase } from './config/db.js';
import { notFound, errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable trust proxy for Render / Cloudflare / Vercel reverse proxies (essential for express-rate-limit)
app.set('trust proxy', 1);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../client/dist');
const uploadsPath = path.join(__dirname, 'uploads');

// 1. Security Headers (Helmet) with Cross-Origin Resource Policy
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Handled by frontend bundler / SPA
  })
);

// 2. HTTP Response Gzip Compression
app.use(compression());

// 3. CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  'https://client-tan-rho-97.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
].filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);

    // Check configured origins
    if (allowedOrigins.some((allowed) => origin === allowed || allowed === '*')) {
      return callback(null, true);
    }

    // Automatically allow Vercel production and preview deployments
    if (/\.vercel\.app$/.test(origin)) {
      return callback(null, true);
    }

    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-razorpay-signature'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// 4. Request Body Parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. NoSQL Injection Prevention Sanitizer Middleware
const sanitizeObject = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      if (/^\$/.test(key) || key.includes('.')) {
        delete obj[key];
      } else {
        sanitizeObject(obj[key]);
      }
    }
  }
};

app.use((req, res, next) => {
  if (req.body) sanitizeObject(req.body);
  if (req.params) sanitizeObject(req.params);
  if (req.query) sanitizeObject(req.query);
  next();
});

// 6. Request Logger
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// 7. General API Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 500, // 500 requests per 15 minutes
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// 8. Serve Uploaded Static Files
app.use('/uploads', express.static(uploadsPath));

// 9. Root & Health Check Endpoints
app.get(['/api', '/api/'], (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Shoping.com API is running',
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
  });
});

app.get(['/health', '/api/health'], (req, res) => {
  const database = isDatabaseConnected() ? 'connected' : 'disconnected';
  res.status(database === 'connected' ? 200 : 503).json({
    status: database === 'connected' ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    service: 'Shoping.com API',
    uptime: Math.round(process.uptime()),
    database,
    dbUri: process.env.NODE_ENV !== 'production' ? process.env.ACTIVE_MONGO_URI : undefined,
  });
});

app.use('/api', requireDatabase);

// 10. Express API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);

// 11. Client Static Build Serving & SPA Fallback
app.use(express.static(clientDistPath));

app.get('*', (req, res, next) => {
  if (req.originalUrl.startsWith('/api') || req.originalUrl.startsWith('/uploads')) {
    return next();
  }
  res.sendFile(path.join(clientDistPath, 'index.html'));
});

// 12. Centralized Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

let serverInstance = null;

const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET?.trim()) {
      throw new Error('JWT_SECRET is missing from server/.env.');
    }

    await connectDB();

    serverInstance = app.listen(PORT, () => {
      console.log(`🚀 Shopping.com Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
      console.log(`🌐 API Endpoint: http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error(`Backend startup aborted: ${error.message}`);
    await disconnectDB();
    process.exitCode = 1;
  }
};

// 13. Graceful Server Shutdown
const handleShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Gracefully shutting down Shopping.com server...`);
  if (serverInstance) {
    serverInstance.close(async () => {
      console.log('HTTP server closed.');
      try {
        await mongoose.disconnect();
        console.log('MongoDB connection closed.');
      } catch (err) {
        console.error('Error during MongoDB disconnect:', err);
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleShutdown('SIGTERM'));
process.on('SIGINT', () => handleShutdown('SIGINT'));

startServer();
