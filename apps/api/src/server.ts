import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { logger } from './shared/utils/logger.js';

async function bootstrap(): Promise<void> {
  const app = createApp();

  // Attempt database connection in non-test environments
  if (env.NODE_ENV !== 'test') {
    try {
      await connectDatabase();
    } catch {
      logger.warn('Initial MongoDB connection failed. Server will continue in degraded mode.');
    }
  }

  const server = app.listen(env.PORT, () => {
    logger.info(`🚀 AutoDock API Server listening on port ${env.PORT} (${env.NODE_ENV})`);
    logger.info(`📡 Health probe available at: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown handling
  const handleShutdown = async (signal: string) => {
    logger.info(`${signal} received. Initiating graceful shutdown...`);
    server.close(async () => {
      logger.info('HTTP server closed.');
      await disconnectDatabase();
      process.exit(0);
    });

    // Force exit after 10 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
}

bootstrap().catch((err) => {
  logger.error('Fatal bootstrap failure:', err);
  process.exit(1);
});
