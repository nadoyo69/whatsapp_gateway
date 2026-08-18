require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initPostgres } = require('./config/postgres');
const { initMongo } = require('./config/mongo');
const { initSocket } = require('./services/socket');
const { restoreAllSessions } = require('./services/baileys');
const { UPLOADS_DIR } = require('./middlewares/upload');

// Import routes
const authRoutes = require('./routes/auth');
const sessionRoutes = require('./routes/sessions');
const messageRoutes = require('./routes/messages');
const chatRoutes = require('./routes/chats');
const webhookRoutes = require('./routes/webhooks');
const apiKeyRoutes = require('./routes/apiKeys');
const userRoutes = require('./routes/users');
const toolRoutes = require('./routes/tools');

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Webhook-Secret']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads directory
app.use('/uploads', express.static(UPLOADS_DIR));

// Initialize Socket.IO
initSocket(server);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'WA-Gateway-Backend'
  });
});

// Register API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tools', toolRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : undefined
  });
});

const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    console.log('🚀 Starting WhatsApp Gateway Backend Services...');

    // 1. Init PostgreSQL
    await initPostgres();

    // 2. Init MongoDB
    await initMongo();

    // 3. Start HTTP + WebSocket Server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🌐 Server running and listening on http://0.0.0.0:${PORT}`);
    });

    // 4. Restore active sessions
    setTimeout(() => {
      restoreAllSessions();
    }, 2000);

  } catch (err) {
    console.error('❌ Failed to bootstrap backend:', err.message);
    process.exit(1);
  }
}

bootstrap();
