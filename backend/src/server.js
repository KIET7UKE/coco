import dotenv from 'dotenv';
dotenv.config({ quiet: true });

import mongoose from 'mongoose';
import { validateEnv } from './config/env.js';
import { app } from './app.js';
import { connectDB } from './config/db.js';
import { recoverStaleDeployments } from './services/deployService.js';
import { startSimulatedMeter } from './services/meteringService.js';
import { startBillingJobs } from './services/billingJobs.js';

const PORT = process.env.PORT || 5001;

async function bootstrap() {
  try {
    validateEnv();
    await connectDB();
  } catch (err) {
    console.error(`[Coco Server] Startup failed: ${err.message}`);
    process.exit(1);
  }

  const server = app.listen(PORT, (err) => {
    if (err) {
      console.error(`[Coco Server] Could not listen on port ${PORT}: ${err.message}`);
      process.exit(1);
    }
    console.log(`[Coco Server] Running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });

  recoverStaleDeployments().catch((err) => console.error('[Deploy] Stale recovery failed:', err?.message));
  startSimulatedMeter();
  startBillingJobs();

  process.on('unhandledRejection', (err) => {
    console.error('[Coco Server] Unhandled Rejection:', err);
  });

  const shutdown = (signal) => {
    console.log(`[Coco Server] ${signal} received, shutting down gracefully`);
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap();
