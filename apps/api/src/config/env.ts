import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables from .env file if available
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'staging', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1000).max(65535).default(5000),
  API_PREFIX: z.string().default('/api/v1'),
  MONGODB_URI: z.string().min(1).default('mongodb://localhost:27017/autodock_dev'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173'),
  JWT_ACCESS_SECRET: z.string().min(16).default('autodock_dev_access_secret_min_32_characters_long_12345'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16).default('autodock_dev_refresh_secret_min_32_characters_long_67890'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  // eslint-disable-next-line no-console
  console.error('❌ Invalid environment variables configuration:', parsed.error.format());
  throw new Error('Environment configuration validation failed');
}

export const env = parsed.data;
export type EnvConfig = typeof env;
