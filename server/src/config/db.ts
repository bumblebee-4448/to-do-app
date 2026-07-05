import mongoose from 'mongoose';

const connectDB = async (mongoUri: string | undefined) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  return mongoose.connect(mongoUri);
};

export default connectDB;
