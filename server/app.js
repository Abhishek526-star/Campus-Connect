import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from './config/env.js';
import { sanitize } from './middleware/sanitize.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import routes from './routes/index.js';

const app = express();

app.disable('x-powered-by');

// Security headers (spec §25).
app.use(helmet());

// Gzip/deflate response compression (performance).
app.use(compression());

// Cross-origin policy — only the configured client origin(s) may call the API with credentials.
app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  }),
);

// Parse JSON for all routes EXCEPT the Razorpay webhook, which needs the raw
// body (as sent over the wire) for signature verification.
app.use((req, res, next) => {
  if (req.originalUrl.startsWith('/api/donations/webhook')) {
    express.raw({ type: 'application/json', limit: '1mb' })(req, res, next);
  } else {
    express.json({ limit: '2mb' })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: '2mb' }));
app.use(cookieParser());

// Query injection + XSS sanitization before any route sees the payload.
app.use(sanitize);

// Serve locally-stored uploads in development (Cloudinary fallback).
app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')));

if (!env.isTest) {
  app.use(morgan('dev'));
}

app.use('/api', routes);

// 404 — consistent error envelope (spec §33).
app.use(notFound);

// Centralized error handling (spec §33).
app.use(errorHandler);

export default app;
