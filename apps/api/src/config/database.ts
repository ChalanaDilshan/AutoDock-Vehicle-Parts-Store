import mongoose from 'mongoose';
import { env } from './env.js';
import { logger } from '../shared/utils/logger.js';

interface ConnectionStatus {
  isConnected: boolean;
  readyState: number;
  host?: string;
  name?: string;
}

/**
 * Connect to MongoDB database instance.
 */
export async function connectDatabase(): Promise<typeof mongoose> {
  if (mongoose.connection.readyState === 1) {
    logger.info('Database already connected.');
    return mongoose;
  }

  try {
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 10000,
    });

    logger.info(`MongoDB connected to host: ${conn.connection.host}, database: ${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

/**
 * Disconnect from MongoDB database gracefully.
 */
export async function disconnectDatabase(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info('MongoDB disconnected cleanly.');
  }
}

/**
 * Safe connection status check (Does NOT leak credentials or connection string).
 */
export function getDatabaseStatus(): ConnectionStatus {
  const state = mongoose.connection.readyState;
  return {
    isConnected: state === 1,
    readyState: state,
    host: state === 1 ? mongoose.connection.host : undefined,
    name: state === 1 ? mongoose.connection.name : undefined,
  };
}
