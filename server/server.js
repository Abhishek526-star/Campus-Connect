import http from 'node:http';
import { connectDB } from './config/db.js';
import { env } from './config/env.js';
import app from './app.js';
import { initSocket } from './sockets/index.js';

/**
 * Startup sequence: connect to MongoDB first, then start HTTP + Socket.IO.
 */
async function start() {
  try {
    await connectDB();
  } catch (error) {
    console.error(`\n[${env.appName}] failed to start: ${error.message}\n`);
    process.exit(1);
  }

  const server = http.createServer(app);
  initSocket(server);

  server.listen(env.port, '0.0.0.0', () => {
    console.log(`[${env.appName}] API server listening on http://0.0.0.0:${env.port} (${env.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`[${env.appName}] ${signal} received — shutting down gracefully`);
    server.close(() => {
      console.log(`[${env.appName}] server closed`);
      process.exit(0);
    });
    // Force-exit if connections refuse to drain within 10s.
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
