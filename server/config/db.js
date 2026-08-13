import mongoose from 'mongoose';
import { env } from './env.js';

/**
 * Reconcile collection indexes on startup.
 *
 * The user schema uses a UNIQUE PARTIAL index on googleId
 * ({ $type: 'string' }) so accounts without a Google link never collide on
 * `googleId: null`. A legacy sparse index with the same name used to exist;
 * MongoDB does not replace indexes automatically, so drop any legacy variant
 * and let Mongoose recreate the current definition.
 */
export async function reconcileIndexes() {
  try {
    const collection = mongoose.connection.collection('users');
    const indexes = await collection.indexes();
    const legacy = indexes.find((idx) => idx.name === 'googleId_1' && !idx.partialFilterExpression);
    if (legacy) {
      await collection.dropIndex('googleId_1');
      console.log('[db] dropped legacy googleId_1 index — recreating as partial unique index');
    }
  } catch (error) {
    console.warn(`[db] index reconciliation skipped: ${error.message}`);
  }

  try {
    const { default: UserModel } = await import('../models/user.js');
    await UserModel.init(); // ensures the partial unique index exists
  } catch (error) {
    console.warn(`[db] model index sync skipped: ${error.message}`);
  }
}

/**
 * Establish the MongoDB connection. Called once at server startup.
 */
export async function connectDB() {
  if (!env.mongoUri) {
    throw new Error(
      'MONGO_URI is not set. Copy .env.example to server/.env and set MONGO_URI ' +
        '(e.g. mongodb://127.0.0.1:27017/campus_connect or your MongoDB Atlas URI).',
    );
  }

  mongoose.set('strictQuery', true);

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 8000 });
    console.log(`[db] connected to ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error(`[db] connection failed: ${error.message}`);
    throw error;
  }

  await reconcileIndexes();

  mongoose.connection.on('error', (err) => {
    console.error(`[db] runtime error: ${err.message}`);
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('[db] disconnected');
  });

  return mongoose.connection;
}

/**
 * Disconnect cleanly (used by tests and graceful shutdown).
 */
export async function disconnectDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}
