const Chat = require('../models/mongo/Chat');
const Message = require('../models/mongo/Message');
const WebhookLog = require('../models/mongo/WebhookLog');
const { pool } = require('../config/postgres');
const { sessions } = require('../services/baileys');

/**
 * Get chat threads for a session with pagination & search
 */
async function getChats(req, res) {
  const { sessionId } = req.params;
  const { search = '', limit = 50, page = 1 } = req.query;

  const query = { session_id: sessionId };
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { jid: { $regex: search, $options: 'i' } }
    ];
  }

  try {
    const total = await Chat.countDocuments(query);
    const chats = await Chat.find(query)
      .sort({ updated_at: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    return res.json({
      success: true,
      data: chats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch chats from MongoDB.', error: err.message });
  }
}

/**
 * Get messages inside a chat thread with pagination
 */
async function getMessages(req, res) {
  const { sessionId, jid } = req.params;
  const { limit = 50, before } = req.query;

  const query = { session_id: sessionId, remote_jid: jid };
  if (before) {
    query.timestamp = { $lt: new Date(before) };
  }

  try {
    const messages = await Message.find(query)
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    // Reset unread count for this chat
    await Chat.updateOne({ session_id: sessionId, jid }, { $set: { unread_count: 0 } });

    return res.json({
      success: true,
      data: messages.reverse()
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to fetch messages from MongoDB.', error: err.message });
  }
}

/**
 * Get overall dashboard analytics & stats
 */
async function getDashboardStats(req, res) {
  try {
    // 1. Devices from Postgres
    const devicesRes = await pool.query('SELECT status, COUNT(*) as count FROM devices GROUP BY status');
    const totalDevicesRes = await pool.query('SELECT COUNT(*) as count FROM devices');
    const totalApiKeysRes = await pool.query('SELECT COUNT(*) as count FROM api_tokens WHERE is_active = TRUE');

    const totalDevices = parseInt(totalDevicesRes.rows[0]?.count || 0);
    const totalApiKeys = parseInt(totalApiKeysRes.rows[0]?.count || 0);
    
    let activeSessionsCount = 0;
    for (const [id, sock] of sessions.entries()) {
      if (sock?.user) activeSessionsCount++;
    }

    // 2. Message counts from MongoDB
    const totalMessages = await Message.countDocuments();
    const totalSent = await Message.countDocuments({ from_me: true });
    const totalReceived = await Message.countDocuments({ from_me: false });
    
    // 3. Webhook delivery stats from MongoDB
    const totalWebhooks = await WebhookLog.countDocuments();
    const successfulWebhooks = await WebhookLog.countDocuments({ success: true });

    // 4. Message types distribution
    const messageTypesAgg = await Message.aggregate([
      { $group: { _id: '$message_type', count: { $sum: 1 } } }
    ]);

    // 5. Recent 24h messages
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent24hCount = await Message.countDocuments({ timestamp: { $gte: oneDayAgo } });

    return res.json({
      success: true,
      data: {
        devices: {
          total: totalDevices,
          active: activeSessionsCount,
          byStatus: devicesRes.rows
        },
        apiKeys: {
          totalActive: totalApiKeys
        },
        messages: {
          total: totalMessages,
          sent: totalSent,
          received: totalReceived,
          last24h: recent24hCount,
          byType: messageTypesAgg
        },
        webhooks: {
          total: totalWebhooks,
          successful: successfulWebhooks,
          successRate: totalWebhooks > 0 ? ((successfulWebhooks / totalWebhooks) * 100).toFixed(1) + '%' : '100%'
        }
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to aggregate dashboard stats.', error: err.message });
  }
}

module.exports = {
  getChats,
  getMessages,
  getDashboardStats
};
