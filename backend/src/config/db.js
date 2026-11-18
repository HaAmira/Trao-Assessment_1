const mongoose = require('mongoose');
const config = require('./env');

let isConnected = false;

async function connectDB() {
  if (isConnected) return;
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000
    });
    isConnected = true;
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.warn(`[Database] Warning: Could not connect to MongoDB at ${config.MONGODB_URI}. Error: ${err.message}`);
    console.warn(`[Database] If you do not have MongoDB running, you can set MONGODB_URI in .env to a MongoDB Atlas cluster.`);
  }
}

module.exports = {
  connectDB,
  isConnected: () => isConnected
};

