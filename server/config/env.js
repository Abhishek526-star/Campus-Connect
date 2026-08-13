import dotenv from 'dotenv';

// Load .env relative to this file (server/.env) regardless of the working directory.
dotenv.config({ path: new URL('../.env', import.meta.url) });

const toNumber = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toList = (value) =>
  String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const nodeEnv = process.env.NODE_ENV ?? 'development';

export const env = {
  appName: process.env.APP_NAME ?? 'Campus Connect',
  nodeEnv,
  isProduction: nodeEnv === 'production',
  isTest: nodeEnv === 'test',
  isDevelopment: nodeEnv === 'development',

  port: toNumber(process.env.PORT, 5000),
  clientUrl: process.env.CLIENT_URL ?? 'http://localhost:5173',
  allowedOrigins: toList(process.env.CLIENT_URL || 'http://localhost:5173'),

  mongoUri: process.env.MONGO_URI ?? '',

  jwtSecret: process.env.JWT_SECRET ?? '',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET ?? '',
  jwtAccessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',

  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME ?? '',
    apiKey: process.env.CLOUDINARY_API_KEY ?? '',
    apiSecret: process.env.CLOUDINARY_API_SECRET ?? '',
    isConfigured: Boolean(
      process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET,
    ),
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID ?? '',
    keySecret: process.env.RAZORPAY_KEY_SECRET ?? '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET ?? '',
    isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  },

  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    isConfigured: Boolean(process.env.GOOGLE_CLIENT_ID),
  },

  smtp: {
    // "Gmail only" convenience: when the SMTP user is a Gmail address and no
    // explicit host is given, Gmail's SMTP server is used automatically.
    // All you need then is SMTP_USER=<you>@gmail.com + SMTP_PASSWORD=<app password>.
    host: process.env.SMTP_HOST ?? (String(process.env.SMTP_USER ?? '').toLowerCase().endsWith('@gmail.com') ? 'smtp.gmail.com' : ''),
    port: toNumber(process.env.SMTP_PORT, 587),
    user: process.env.SMTP_USER ?? '',
    password: process.env.SMTP_PASSWORD ?? '',
    from: process.env.SMTP_FROM ?? 'Campus Connect <no-reply@campus-connect.app>',
    isConfigured: Boolean(
      (process.env.SMTP_HOST || String(process.env.SMTP_USER ?? '').toLowerCase().endsWith('@gmail.com')) &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD,
    ),
  },
};
