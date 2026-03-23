// Mama Fua API Server
// KhimTech | Lead Dev: Brian Wanjiku | QA: Maryann Wanjiru | 2026

import http from 'http';
import app from './app';
import { initSocket } from './socket';
import { logger } from './lib/logger';
import { redis } from './lib/redis';

const PORT = process.env.PORT ?? 3001;

const server = http.createServer(app);
initSocket(server);

server.listen(PORT, () => {
  logger.info(`🚀 Mama Fua API running on port ${PORT} [${process.env.NODE_ENV}]`);
  logger.info(`   KhimTech | Lead Dev: Brian Wanjiku | QA: Maryann Wanjiru`);
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    await redis.quit();
    logger.info('Server closed.');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
