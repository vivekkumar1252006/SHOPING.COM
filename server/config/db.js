import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadEnv } from './env.js';
import { seedDatabase } from '../utils/seeder.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let connectionPromise = null;
let listenersRegistered = false;
let mongoMemoryServer = null;

const registerConnectionListeners = () => {
  if (listenersRegistered) return;

  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established.');
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('MongoDB connection disconnected.');
  });
  mongoose.connection.on('error', (error) => {
    console.error(`MongoDB connection error: ${error.name}${error.code ? ` (${error.code})` : ''} - ${error.message}`);
  });
  listenersRegistered = true;
};

export const connectDB = async () => {
  loadEnv();

  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (connectionPromise) return connectionPromise;

  const uri = process.env.MONGO_URI?.trim() || 'mongodb://127.0.0.1:27017/smartcart';
  const isPlaceholder =
    !uri ||
    uri.includes('username:password') ||
    uri.includes('<password>') ||
    uri.includes('<db_password>') ||
    uri.includes('YOUR_MONGODB_URI');

  mongoose.set('strictQuery', false);
  registerConnectionListeners();

  connectionPromise = (async () => {
    // 1. Try remote MongoDB Atlas / standard MongoDB instance first
    if (!isPlaceholder) {
      try {
        console.log(`Connecting to MongoDB (Atlas / Remote Database)...`);
        await mongoose.connect(uri, {
          dbName: process.env.DB_NAME || 'shoping',
          serverSelectionTimeoutMS: 10000,
          connectTimeoutMS: 10000,
        });
        console.log(`✅ MongoDB connected successfully to: ${mongoose.connection.host} (Database: ${mongoose.connection.name})`);

        // Seed initial catalogue & admin account if empty
        try {
          await seedDatabase();
        } catch (seedErr) {
          console.warn('Initial database check warning (non-fatal):', seedErr.message);
        }

        return mongoose.connection;
      } catch (primaryError) {
        console.error(`❌ Primary MongoDB connection failed (${primaryError.message}).`);
        if (process.env.NODE_ENV === 'production') {
          console.error('🚨 Production environment detected: Please verify your MongoDB Atlas connection string, credentials, and Network Access (0.0.0.0/0).');
          throw primaryError;
        }
        console.warn('⚠️ Falling back to local embedded MongoDB for development...');
      }
    } else {
      console.log(`ℹ️ Placeholder MONGO_URI detected. Starting Embedded In-Memory MongoDB for development...`);
    }

    // 2. Fall back to MongoMemoryServer with Persistent Local Disk Storage
    try {
      const dbDataDir = path.resolve(__dirname, '..', '.data', 'db');
      if (!fs.existsSync(dbDataDir)) {
        fs.mkdirSync(dbDataDir, { recursive: true });
      }

      mongoMemoryServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dbDataDir,
          storageEngine: 'wiredTiger',
          launchTimeout: 60000,
        },
      });
      const memUri = mongoMemoryServer.getUri();
      process.env.ACTIVE_MONGO_URI = memUri;
      await mongoose.connect(memUri);
      console.log(`✅ Persistent MongoDB connected successfully with disk storage at: ${dbDataDir}`);

      // Seed default accounts and catalogue if unseeded
      try {
        await seedDatabase();
      } catch (seedErr) {
        console.warn('Initial seeding warning (non-fatal):', seedErr.message);
      }

      return mongoose.connection;
    } catch (memError) {
      console.error(`❌ Failed to start In-Memory MongoDB: ${memError.message}`);
      connectionPromise = null;
      throw memError;
    }
  })();

  try {
    return await connectionPromise;
  } catch (error) {
    connectionPromise = null;
    await mongoose.disconnect().catch(() => {});
    throw error;
  }
};

export const isDatabaseConnected = () => mongoose.connection.readyState === 1;

export const requireDatabase = (req, res, next) => {
  if (!isDatabaseConnected()) {
    return res.status(503).json({
      success: false,
      message: 'The database is temporarily unavailable. Please try again shortly.',
    });
  }
  return next();
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
      mongoMemoryServer = null;
    }
    connectionPromise = null;
    console.log('MongoDB connection disconnected cleanly.');
  } catch (error) {
    console.error(`MongoDB disconnect failed (${error.name}):`, error.message);
  }
};
