const mongoose = require('mongoose');
const { requireEnv } = require('./secrets');

async function initMongo() {
  // Existing deployments keep their MongoDB volume (and its password), so the
  // password is required but not checked against the published defaults.
  const mongoUri = process.env.MONGO_URI || `mongodb://${encodeURIComponent(process.env.MONGO_USER || 'wa_admin')}:${encodeURIComponent(requireEnv('MONGO_PASSWORD', { rejectPublished: false }))}@${process.env.MONGO_HOST || 'localhost'}:${process.env.MONGO_PORT || 27017}/${process.env.MONGO_DB || 'wa_gateway_logs'}?authSource=admin`;

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
