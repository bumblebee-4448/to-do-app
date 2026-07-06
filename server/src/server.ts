import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import connectDB from './config/db';
import { resolveDbRuntimeFromEnv } from './config/runtimeDb';

const port = process.env.PORT || 5000;
let stopMemoryServer: (() => Promise<void>) | undefined;

const connectRuntimeDb = async () => {
  const runtime = resolveDbRuntimeFromEnv(process.env);

  if (runtime.kind === 'mongo') {
    await connectDB(runtime.uri);
    return;
  }

  const { MongoMemoryServer } = await import('mongodb-memory-server');
  const memoryServer = await MongoMemoryServer.create({
    binary: {
      version: '7.0.24',
    },
  });

  stopMemoryServer = async () => {
    await memoryServer.stop();
  };

  await connectDB(memoryServer.getUri());
};

const shutdown = async () => {
  await mongoose.disconnect();
  await stopMemoryServer?.();
};

const start = async () => {
  try {
    await connectRuntimeDb();
    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);

    const server = app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });

    process.on('SIGTERM', async () => {
      server.close(async () => {
        await shutdown();
        process.exit(0);
      });
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

start();
