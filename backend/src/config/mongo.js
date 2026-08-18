const mongoose = require('mongoose');

async function initMongo() {
  const mongoUri = process.env.MONGO_URI || `mongodb://${process.env.MONGO_USER || 'wa_admin'}:${process.env.MONGO_PASSWORD || 'wa_secret_123'}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB || 'wa_gateway_logs'}?authSource=admin`;
  
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('[MongoDB] Connected successfully to MongoDB logs database.');
  } catch (err) {
    console.error('[MongoDB] Connection error:', err.message);
    throw err;
  }
}

module.exports = { initMongo, mongoose };
