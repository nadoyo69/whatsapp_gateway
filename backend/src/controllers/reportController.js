const { pool } = require('../config/postgres');
const Message = require('../models/mongo/Message');

/**
 * Helper to compute start date from range parameter
 */
function getStartDate(range) {
  const now = new Date();
  if (range === 'today') {
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return today;
  }
  if (range === '7d') {
    return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }
  if (range === '30d') {
    return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  return null; // 'all'
}

/**
 * 1. Global Summary Stats
 */
async function getSummary(req, res) {
  try {
    const { range = '30d' } = req.query;
    const startDate = getStartDate(range);

    // MongoDB Message metrics
    const mongoQuery = startDate ? { timestamp: { $gte: startDate } } : {};
    const totalMessages = await Message.countDocuments(mongoQuery);
    const totalSent = await Message.countDocuments({ ...mongoQuery, from_me: true });
    const totalReceived = await Message.countDocuments({ ...mongoQuery, from_me: false });

    // PostgreSQL API Logs metrics
    let pgTimeClause = '';
    const pgParams = [];
    if (startDate) {
      pgParams.push(startDate.toISOString());
      pgTimeClause = `WHERE created_at >= $1`;
    }

    const apiStatsRes = await pool.query(`
      SELECT 
        COUNT(*)::integer as total_api_calls,
        COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END)::integer as success_calls,
        COUNT(CASE WHEN status_code >= 400 THEN 1 END)::integer as error_calls,
        COALESCE(ROUND(AVG(response_time_ms)), 0)::integer as avg_latency_ms
      FROM api_usage_logs
      ${pgTimeClause}
    `, pgParams);

    // PostgreSQL Devices metrics
    const devicesRes = await pool.query(`
      SELECT 
        COUNT(*)::integer as total_devices,
        COUNT(CASE WHEN status = 'connected' THEN 1 END)::integer as active_devices
      FROM devices
    `);

    // PostgreSQL API Tokens count
    const tokensRes = await pool.query(`
      SELECT 
        COUNT(*)::integer as total_tokens,
        COUNT(CASE WHEN is_active = TRUE THEN 1 END)::integer as active_tokens
      FROM api_tokens
    `);

    const apiStats = apiStatsRes.rows[0] || { total_api_calls: 0, success_calls: 0, error_calls: 0, avg_latency_ms: 0 };
    const successRate = apiStats.total_api_calls > 0 
      ? Math.round((apiStats.success_calls / apiStats.total_api_calls) * 100) 
      : 100;

    return res.json({
      success: true,
      data: {
        range,
        messages: {
          total: totalMessages,
          sent: totalSent,
          received: totalReceived
        },
        api: {
          totalCalls: apiStats.total_api_calls,
          successCalls: apiStats.success_calls,
          errorCalls: apiStats.error_calls,
          avgLatencyMs: apiStats.avg_latency_ms,
          successRate: `${successRate}%`
        },
        devices: devicesRes.rows[0],
        tokens: tokensRes.rows[0]
      }
    });
  } catch (err) {
    console.error('[getSummary error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch summary stats', error: err.message });
  }
}

/**
 * 2. Per-Device Usage Report
 */
async function getDeviceReports(req, res) {
  try {
    const { range = '30d' } = req.query;
    const startDate = getStartDate(range);

    // Fetch all registered devices from PostgreSQL
    const devicesRes = await pool.query(`
      SELECT id, session_id, name, phone_number, status, created_at, updated_at
      FROM devices
      ORDER BY name ASC
    `);

    // Fetch MongoDB message stats grouped by session_id
    const matchStage = startDate ? { $match: { timestamp: { $gte: startDate } } } : { $match: {} };

    const mongoAgg = await Message.aggregate([
      matchStage,
      {
        $group: {
          _id: '$session_id',
          totalMessages: { $sum: 1 },
          sentMessages: { $sum: { $cond: [{ $eq: ['$from_me', true] }, 1, 0] } },
          receivedMessages: { $sum: { $cond: [{ $eq: ['$from_me', false] }, 1, 0] } },
          // Types
          textCount: { $sum: { $cond: [{ $eq: ['$message_type', 'text'] }, 1, 0] } },
          imageCount: { $sum: { $cond: [{ $eq: ['$message_type', 'image'] }, 1, 0] } },
          documentCount: { $sum: { $cond: [{ $eq: ['$message_type', 'document'] }, 1, 0] } },
          audioCount: { $sum: { $cond: [{ $eq: ['$message_type', 'audio'] }, 1, 0] } },
          videoCount: { $sum: { $cond: [{ $eq: ['$message_type', 'video'] }, 1, 0] } },
          locationCount: { $sum: { $cond: [{ $eq: ['$message_type', 'location'] }, 1, 0] } },
          otherCount: {
            $sum: {
              $cond: [
                { $in: ['$message_type', ['text', 'image', 'document', 'audio', 'video', 'location']] },
                0,
                1
              ]
            }
          },
          // Status for sent messages
          deliveredCount: { $sum: { $cond: [{ $in: ['$status', ['delivered', 'read']] }, 1, 0] } },
          readCount: { $sum: { $cond: [{ $eq: ['$status', 'read'] }, 1, 0] } },
          lastActivity: { $max: '$timestamp' }
        }
      }
    ]);

    const statsMap = new Map();
    mongoAgg.forEach(item => {
      statsMap.set(item._id, item);
    });

    // Also get API usage count per session_id from PostgreSQL
    let pgTimeClause = '';
    const pgParams = [];
    if (startDate) {
      pgParams.push(startDate.toISOString());
      pgTimeClause = `WHERE created_at >= $1`;
    }

    const apiPerSession = await pool.query(`
      SELECT session_id, COUNT(*)::integer as api_calls
      FROM api_usage_logs
      ${pgTimeClause ? `${pgTimeClause} AND session_id IS NOT NULL` : 'WHERE session_id IS NOT NULL'}
      GROUP BY session_id
    `, pgParams);

    const apiCallsMap = new Map();
    apiPerSession.rows.forEach(r => apiCallsMap.set(r.session_id, r.api_calls));

    // Combine results
    const devices = devicesRes.rows.map(d => {
      const stats = statsMap.get(d.session_id) || {
        totalMessages: 0,
        sentMessages: 0,
        receivedMessages: 0,
        textCount: 0,
        imageCount: 0,
        documentCount: 0,
        audioCount: 0,
        videoCount: 0,
        locationCount: 0,
        otherCount: 0,
        deliveredCount: 0,
        readCount: 0,
        lastActivity: null
      };

      return {
        id: d.id,
        sessionId: d.session_id,
        name: d.name,
        phoneNumber: d.phone_number,
        status: d.status,
        apiCalls: apiCallsMap.get(d.session_id) || 0,
        messages: {
          total: stats.totalMessages,
          sent: stats.sentMessages,
          received: stats.receivedMessages,
          types: {
            text: stats.textCount,
            image: stats.imageCount,
            document: stats.documentCount,
            audio: stats.audioCount,
            video: stats.videoCount,
            location: stats.locationCount,
            other: stats.otherCount
          },
          deliveryRate: stats.sentMessages > 0 
            ? `${Math.round((stats.deliveredCount / stats.sentMessages) * 100)}%` 
            : '100%',
          readRate: stats.sentMessages > 0 
            ? `${Math.round((stats.readCount / stats.sentMessages) * 100)}%` 
            : '0%'
        },
        lastActivity: stats.lastActivity
      };
    });

    return res.json({
      success: true,
      range,
      count: devices.length,
      data: devices
    });
  } catch (err) {
    console.error('[getDeviceReports error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch device usage report', error: err.message });
  }
}

/**
 * 3. Per-API-Key Usage Report
 */
async function getApiKeyReports(req, res) {
  try {
    const { range = '30d' } = req.query;
    const startDate = getStartDate(range);

    // 1. Get all API Tokens
    const tokensRes = await pool.query(`
      SELECT t.id, t.name, t.token, t.is_active, t.last_used_at, t.created_at, u.username as owner_username
      FROM api_tokens t
      LEFT JOIN users u ON t.user_id = u.id
      ORDER BY t.created_at DESC
    `);

    // 2. Query usage stats per api_token_id from api_usage_logs
    let timeFilter = '';
    const params = [];
    if (startDate) {
      params.push(startDate.toISOString());
      timeFilter = `WHERE l.created_at >= $1`;
    }

    const usageRes = await pool.query(`
      SELECT 
        l.api_token_id,
        COUNT(*)::integer as total_requests,
        COUNT(CASE WHEN l.status_code >= 200 AND l.status_code < 300 THEN 1 END)::integer as success_count,
        COUNT(CASE WHEN l.status_code >= 400 AND l.status_code < 500 THEN 1 END)::integer as client_errors,
        COUNT(CASE WHEN l.status_code >= 500 THEN 1 END)::integer as server_errors,
        COALESCE(ROUND(AVG(l.response_time_ms)), 0)::integer as avg_latency_ms,
        MAX(l.created_at) as last_request_at
      FROM api_usage_logs l
      ${timeFilter}
      GROUP BY l.api_token_id
    `, params);

    const usageMap = new Map();
    usageRes.rows.forEach(r => usageMap.set(r.api_token_id, r));

    // 3. Top endpoints per token
    const endpointsRes = await pool.query(`
      SELECT 
        l.api_token_id,
        l.endpoint,
        COUNT(*)::integer as hit_count
      FROM api_usage_logs l
      ${timeFilter}
      GROUP BY l.api_token_id, l.endpoint
      ORDER BY hit_count DESC
    `, params);

    const endpointsMap = new Map();
    endpointsRes.rows.forEach(r => {
      const existing = endpointsMap.get(r.api_token_id) || [];
      if (existing.length < 5) {
        existing.push({ endpoint: r.endpoint, count: r.hit_count });
      }
      endpointsMap.set(r.api_token_id, existing);
    });

    const tokens = tokensRes.rows.map(t => {
      const u = usageMap.get(t.id) || {
        total_requests: 0,
        success_count: 0,
        client_errors: 0,
        server_errors: 0,
        avg_latency_ms: 0,
        last_request_at: null
      };

      const successRate = u.total_requests > 0
        ? Math.round((u.success_count / u.total_requests) * 100)
        : 100;

      // Mask token preview
      const maskedToken = t.token.length > 8 
        ? `${t.token.slice(0, 4)}...${t.token.slice(-4)}` 
        : '****';

      return {
        id: t.id,
        name: t.name,
        tokenPreview: maskedToken,
        owner: t.owner_username || 'System',
        isActive: t.is_active,
        totalRequests: u.total_requests,
        successCount: u.success_count,
        clientErrors: u.client_errors,
        serverErrors: u.server_errors,
        successRate: `${successRate}%`,
        avgLatencyMs: u.avg_latency_ms,
        lastRequestAt: u.last_request_at || t.last_used_at,
        topEndpoints: endpointsMap.get(t.id) || []
      };
    });

    return res.json({
      success: true,
      range,
      count: tokens.length,
      data: tokens
    });
  } catch (err) {
    console.error('[getApiKeyReports error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch API key usage report', error: err.message });
  }
}

/**
 * 4. Recent Audit Logs (Live API calls)
 */
async function getRecentLogs(req, res) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    const offset = (page - 1) * limit;

    const { status, sessionId, tokenId } = req.query;

    const conditions = [];
    const params = [];

    if (status === 'success') {
      conditions.push(`l.status_code >= 200 AND l.status_code < 300`);
    } else if (status === 'error') {
      conditions.push(`l.status_code >= 400`);
    }

    if (sessionId) {
      params.push(sessionId);
      conditions.push(`l.session_id = $${params.length}`);
    }

    if (tokenId) {
      params.push(parseInt(tokenId));
      conditions.push(`l.api_token_id = $${params.length}`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRes = await pool.query(`
      SELECT COUNT(*)::integer as total
      FROM api_usage_logs l
      ${whereClause}
    `, params);

    const totalLogs = countRes.rows[0]?.total || 0;

    params.push(limit);
    const limitParam = `$${params.length}`;
    params.push(offset);
    const offsetParam = `$${params.length}`;

    const query = `
      SELECT 
        l.id,
        l.api_token_id,
        l.session_id,
        l.endpoint,
        l.method,
        l.status_code,
        l.response_time_ms,
        l.ip_address,
        l.created_at,
        t.name as token_name,
        d.name as device_name
      FROM api_usage_logs l
      LEFT JOIN api_tokens t ON l.api_token_id = t.id
      LEFT JOIN devices d ON l.session_id = d.session_id
      ${whereClause}
      ORDER BY l.created_at DESC
      LIMIT ${limitParam} OFFSET ${offsetParam}
    `;

    const logsRes = await pool.query(query, params);

    return res.json({
      success: true,
      pagination: {
        page,
        limit,
        total: totalLogs,
        totalPages: Math.ceil(totalLogs / limit)
      },
      data: logsRes.rows
    });
  } catch (err) {
    console.error('[getRecentLogs error]', err);
    return res.status(500).json({ success: false, message: 'Failed to fetch audit logs', error: err.message });
  }
}

module.exports = {
  getSummary,
  getDeviceReports,
  getApiKeyReports,
  getRecentLogs
};
