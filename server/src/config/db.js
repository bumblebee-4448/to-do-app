const mongoose = require('mongoose');

const connectDB = async (mongoUri) => {
  if (!mongoUri) {
    throw new Error('MONGO_URI is required');
  }

  return mongoose.connect(mongoUri);
};

module.exports = connectDB;
