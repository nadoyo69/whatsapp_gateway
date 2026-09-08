require('dotenv').config();
const http = require('http');
const express = require('express');
const cors = require('cors');
const path = require('path');

const { initPostgres, pool } = require('./config/postgres');
const { initMongo, mongoose } = require('./config/mongo');
const { initSocket } = require('./services/socket');
const { restoreAllSessions, sessions } = require('./services/baileys');
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
const reportRoutes = require('./routes/reports');

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

// Health check handler (supports Uptime Kuma, UptimeRobot, BetterUptime, etc.)
const healthCheckHandler = async (req, res) => {
  const startTime = Date.now();
  let pgStatus = 'connected';
  let mongoStatus = 'connected';
  let isHealthy = true;

  try {
    await pool.query('SELECT 1');
  } catch (err) {
    pgStatus = 'error: ' + err.message;
    isHealthy = false;
  }

  try {
    if (mongoose.connection.readyState !== 1) {
      mongoStatus = 'disconnected';
      isHealthy = false;
    }
  } catch (err) {
    mongoStatus = 'error: ' + err.message;
    isHealthy = false;
  }

  const uptimeSeconds = process.uptime();
  const formatUptime = (sec) => {
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    return d + 'd ' + h + 'h ' + m + 'm ' + s + 's';
  };

  const mem = process.memoryUsage();
  const responseData = {
    status: isHealthy ? 'ok' : 'degraded',
    uptime: {
      seconds: Math.floor(uptimeSeconds),
      human: formatUptime(uptimeSeconds)
    },
    timestamp: new Date().toISOString(),
    service: 'WA-Gateway-Backend',
    database: {
      postgres: pgStatus,
      mongodb: mongoStatus
    },
    activeSessions: sessions ? sessions.size : 0,
    memory: {
      rss: (mem.rss / 1024 / 1024).toFixed(2) + ' MB',
      heapUsed: (mem.heapUsed / 1024 / 1024).toFixed(2) + ' MB'
    },
    responseTime: (Date.now() - startTime) + 'ms'
  };

  res.status(isHealthy ? 200 : 503).json(responseData);
};

app.get('/health', healthCheckHandler);
app.get('/api/v1/health', healthCheckHandler);

// Register API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/sessions', sessionRoutes);
app.use('/api/v1/messages', messageRoutes);
app.use('/api/v1/chats', chatRoutes);
app.use('/api/v1/webhooks', webhookRoutes);
app.use('/api/v1/api-keys', apiKeyRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/tools', toolRoutes);
app.use('/api/v1/reports', reportRoutes);

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
