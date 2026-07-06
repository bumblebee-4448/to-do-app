import 'dotenv/config';
import mongoose from 'mongoose';
import app from './app';
import connectDB from './config/db';

const port = process.env.PORT || 5000;

const start = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is required. Please set it in your .env file.');
    }

    await connectDB(mongoUri);
    console.log(`Connected to MongoDB database: ${mongoose.connection.name}`);

    app.listen(port, () => {
      console.log(`Server listening on http://localhost:${port}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown startup error';
    console.error(`Failed to start server: ${message}`);
    process.exit(1);
  }
};

start();
