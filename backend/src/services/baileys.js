const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  downloadMediaMessage,
  proto
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/postgres');
const Message = require('../models/mongo/Message');
const Chat = require('../models/mongo/Chat');
const { emitToSession, emitGlobal } = require('./socket');
const { dispatchWebhook } = require('./webhook');
const { formatToWhatsAppJid, extractPhoneFromJid, extractMessageContent } = require('../utils/format');
const { shouldStoreMessages, shouldDownloadMedia } = require('../utils/devicePolicy');

const sessions = new Map();
const qrCodes = new Map();
const pairingCodes = new Map();
const reconnectTimeouts = new Map();

const SESSIONS_DIR = path.resolve(process.env.SESSIONS_PATH || path.join(__dirname, '../../sessions'));

// Ensure sessions directory exists
if (!fs.existsSync(SESSIONS_DIR)) {
  fs.mkdirSync(SESSIONS_DIR, { recursive: true });
}

/**
 * Initialize a Baileys WhatsApp Session
 * @param {string} sessionId 
 * @param {object} options 
 */
async function initSession(sessionId, options = {}) {
  if (sessions.has(sessionId)) {
    const existing = sessions.get(sessionId);
    if (existing?.user) {
      return { status: 'already_connected', sessionId };
    }
  }

  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  if (!fs.existsSync(sessionPath)) {
    fs.mkdirSync(sessionPath, { recursive: true });
  }

  const logger = pino({ level: process.env.LOG_LEVEL || 'silent' });
  const { state, saveCreds } = await useMultiFileAuthState(sessionPath);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger)
    },
    generateHighQualityLinkPreview: true,
    browser: ['WA-Gateway', 'Chrome', '124.0.0.0'],
    syncFullHistory: false,
    markOnlineOnConnect: true,
    connectTimeoutMs: 60000,
    defaultQueryTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
    getMessage: async (key) => {
      try {
        const found = await Message.findOne({ session_id: sessionId, message_id: key.id });
        if (found?.raw_message) {
          return found.raw_message.message || proto.Message.fromObject({});
        }
      } catch (err) {
        // silent fallback
      }
      return proto.Message.fromObject({});
    }
  });

  sessions.set(sessionId, sock);

  // Save updated credentials
  sock.ev.on('creds.update', saveCreds);

  // Handle connection events
  sock.ev.on('connection.update', async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      try {
        const qrDataUrl = await QRCode.toDataURL(qr, { margin: 2, scale: 8 });
        qrCodes.set(sessionId, { raw: qr, dataUrl: qrDataUrl, updatedAt: new Date() });
        
        emitToSession(sessionId, 'qr', { qr: qrDataUrl, raw: qr });
        
        // Update status in Postgres
        await updateDeviceStatus(sessionId, 'qr_ready');
      } catch (err) {
        console.error(`[Baileys] Error generating QR for ${sessionId}:`, err.message);
      }
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[Baileys] Session "${sessionId}" connection closed. Status code: ${statusCode}. Reconnecting: ${shouldReconnect}`);

      qrCodes.delete(sessionId);
      pairingCodes.delete(sessionId);

      if (statusCode === DisconnectReason.loggedOut) {
        // Session was logged out
        await updateDeviceStatus(sessionId, 'logged_out', null);
        sessions.delete(sessionId);
        
        // Clean session files
        try {
          fs.rmSync(sessionPath, { recursive: true, force: true });
        } catch (e) {
          console.error(`[Baileys] Error clearing session dir for ${sessionId}:`, e.message);
        }

        emitToSession(sessionId, 'connection.update', { status: 'logged_out' });
        await dispatchDeviceWebhook(sessionId, 'session.status', { status: 'logged_out' });
      } else {
        await updateDeviceStatus(sessionId, 'disconnected');
        emitToSession(sessionId, 'connection.update', { status: 'disconnected' });
        await dispatchDeviceWebhook(sessionId, 'session.status', { status: 'disconnected', reason: statusCode });

        // Auto reconnect with a slight backoff delay
        if (shouldReconnect) {
          if (reconnectTimeouts.has(sessionId)) {
            clearTimeout(reconnectTimeouts.get(sessionId));
          }
          const timeout = setTimeout(() => {
            console.log(`[Baileys] Attempting auto-reconnect for session "${sessionId}"...`);
            initSession(sessionId);
          }, 5000);
          reconnectTimeouts.set(sessionId, timeout);
        }
      }
    } else if (connection === 'open') {
      console.log(`[Baileys] Session "${sessionId}" connected successfully!`);
      qrCodes.delete(sessionId);
      pairingCodes.delete(sessionId);

      const phoneNumber = extractPhoneFromJid(sock.user?.id);
      const pushName = sock.user?.name || sock.user?.notify || 'WhatsApp User';

      await updateDeviceStatus(sessionId, 'connected', phoneNumber);

      emitToSession(sessionId, 'connection.update', { 
        status: 'connected', 
        phone: phoneNumber, 
        name: pushName 
      });

      await dispatchDeviceWebhook(sessionId, 'session.status', { 
        status: 'connected', 
        phone: phoneNumber, 
        name: pushName 
      });
    } else if (connection === 'connecting') {
      emitToSession(sessionId, 'connection.update', { status: 'connecting' });
    }
  });

  // Handle incoming messages
  sock.ev.on('messages.upsert', async (chatUpdate) => {
    try {
      if (chatUpdate.type === 'notify' || chatUpdate.type === 'append') {
        for (const msg of chatUpdate.messages) {
          if (!msg.message) continue;

          const remoteJid = msg.key.remoteJid;
          const fromMe = msg.key.fromMe || false;
          const messageId = msg.key.id;
          const senderName = msg.pushName || '';
          const parsed = extractMessageContent(msg);

          // Device untuk sesi ini (dipakai untuk keputusan simpan/unduh); di-cache per-pesan
          // agar konsisten dengan pemakaian auto_read di bawah, tanpa query tambahan.
          const policyDevice = await getDeviceBySessionId(sessionId);
          const messageTimestamp = new Date(msg.messageTimestamp ? Number(msg.messageTimestamp) * 1000 : Date.now());
          const isGroup = remoteJid.endsWith('@g.us');

          // 1. Simpan pesan ke MongoDB — dilewati bila store_messages = false (opt-out per sesi).
          //    Isi keuangan tenant UangRapi tidak boleh menetap di gateway pihak ketiga ini.
          let messageDoc = null;
          if (shouldStoreMessages(policyDevice)) {
            messageDoc = await Message.create({
              session_id: sessionId,
              message_id: messageId,
              remote_jid: remoteJid,
              from_me: fromMe,
              sender_name: senderName,
              message_type: parsed.type,
              text: parsed.text || '',
              media_mimetype: parsed.mimetype,
              media_filename: parsed.filename,
              status: fromMe ? 'sent' : 'delivered',
              raw_message: msg,
              timestamp: messageTimestamp
            });

            // 2. Upsert Chat record — hanya bila pesan memang disimpan (last_message memuat teks).
            await Chat.findOneAndUpdate(
              { session_id: sessionId, jid: remoteJid },
              {
                $set: {
                  name: senderName || extractPhoneFromJid(remoteJid),
                  phone: extractPhoneFromJid(remoteJid),
                  is_group: isGroup,
                  last_message: {
                    text: parsed.text || `[${parsed.type}]`,
                    from_me: fromMe,
                    type: parsed.type,
                    timestamp: messageTimestamp
                  },
                  updated_at: new Date()
                },
                $inc: { unread_count: fromMe ? 0 : 1 }
              },
              { upsert: true, new: true }
            );
          }

          // 3. Emit real-time message to frontend via Socket.IO
          emitToSession(sessionId, 'message.new', {
            id: messageDoc?._id || null,
            messageId,
            remoteJid,
            fromMe,
            senderName,
            type: parsed.type,
            text: parsed.text,
            timestamp: messageTimestamp
          });

          // 4. Dispatch to Webhook endpoint
          if (!fromMe) {
            let imageBase64 = null;
            if (parsed.type === 'image' && shouldDownloadMedia(policyDevice)) {
              try {
                const buffer = await downloadMediaMessage(
                  msg,
                  'buffer',
                  {},
                  {
                    logger: pino({ level: 'silent' }),
                    reuploadRequest: sock.updateMediaMessage
                  }
                );
                if (buffer && Buffer.isBuffer(buffer)) {
                  imageBase64 = buffer.toString('base64');
                }
              } catch (dlErr) {
                console.warn(`[Baileys] Failed to download image for webhook ${sessionId}:`, dlErr.message);
              }
            }

            const participant = msg.key.participant || msg.participant || null;
            const senderJid = isGroup ? (participant || remoteJid) : remoteJid;
            const senderPhone = extractPhoneFromJid(senderJid).split(':')[0];

            await dispatchDeviceWebhook(sessionId, 'message.received', {
              messageId,
              remoteJid,
              senderJid,
              phone: senderPhone,
              participant: participant ? extractPhoneFromJid(participant).split(':')[0] : null,
              senderName,
              isGroup,
              type: parsed.type,
              text: parsed.text,
              mimetype: parsed.mimetype,
              filename: parsed.filename,
              image_base64: imageBase64,
              location: parsed.latitude ? { lat: parsed.latitude, lng: parsed.longitude, name: parsed.name, address: parsed.address } : null,
              contact: parsed.displayName ? { name: parsed.displayName, vcard: parsed.vcard } : null,
              timestamp: messageTimestamp
            });

            // Auto-read if configured
            if (policyDevice?.auto_read) {
              await sock.readMessages([msg.key]);
            }
          }
        }
      }
    } catch (err) {
      console.error(`[Baileys] Error processing messages.upsert for ${sessionId}:`, err);
    }
  });

  // Handle message status updates (read receipt / delivery status)
  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates) {
      if (update.update.status) {
        let statusString = 'pending';
        const s = update.update.status;
        if (s === 2 || s === 'DELIVERY_ACK') statusString = 'server_ack';
        if (s === 3 || s === 'DELIVERY_RECEIPT') statusString = 'delivered';
        if (s === 4 || s === 'READ') statusString = 'read';
        if (s === 5 || s === 'PLAYED') statusString = 'read';

        try {
          await Message.findOneAndUpdate(
            { session_id: sessionId, message_id: update.key.id },
            { status: statusString }
          );

          emitToSession(sessionId, 'message.status', {
            messageId: update.key.id,
            remoteJid: update.key.remoteJid,
            status: statusString
          });

          await dispatchDeviceWebhook(sessionId, 'message.status', {
            messageId: update.key.id,
            remoteJid: update.key.remoteJid,
            status: statusString
          });
        } catch (err) {
          console.error(`[Baileys] Error updating message status for ${update.key.id}:`, err.message);
        }
      }
    }
  });

  return { status: 'initializing', sessionId };
}

/**
 * Request an 8-digit Pairing Code via Phone Number
 */
async function requestPairingCode(sessionId, phoneNumber) {
  let sock = sessions.get(sessionId);
  if (!sock) {
    await initSession(sessionId);
    sock = sessions.get(sessionId);
  }

  // Sanitize phone number (remove +, spaces, leading 0)
  let cleanPhone = String(phoneNumber).replace(/[^0-9]/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  }

  // Wait a short tick for socket connection to initialize if freshly spawned
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    const code = await sock.requestPairingCode(cleanPhone);
    pairingCodes.set(sessionId, { code, phone: cleanPhone, createdAt: new Date() });
    
    emitToSession(sessionId, 'pairing_code', { code, phone: cleanPhone });
    return { success: true, code, phone: cleanPhone };
  } catch (err) {
    console.error(`[Baileys] Failed to request pairing code for ${sessionId}:`, err.message);
    throw err;
  }
}

/**
 * Get socket instance for a session
 */
function getSessionSocket(sessionId) {
  return sessions.get(sessionId) || null;
}

/**
 * Get current QR code info
 */
function getSessionQR(sessionId) {
  return qrCodes.get(sessionId) || null;
}

/**
 * Get current Pairing code info
 */
function getSessionPairingCode(sessionId) {
  return pairingCodes.get(sessionId) || null;
}

/**
 * Logout and remove a session
 */
async function logoutSession(sessionId) {
  const sock = sessions.get(sessionId);
  if (sock) {
    try {
      await sock.logout();
    } catch (e) {
      // ignore
    }
    sessions.delete(sessionId);
  }

  qrCodes.delete(sessionId);
  pairingCodes.delete(sessionId);

  const sessionPath = path.join(SESSIONS_DIR, sessionId);
  if (fs.existsSync(sessionPath)) {
    try {
      fs.rmSync(sessionPath, { recursive: true, force: true });
    } catch (e) {
      console.error(`[Baileys] Error removing session directory:`, e.message);
    }
  }

  await updateDeviceStatus(sessionId, 'disconnected', null);
  return { success: true, message: `Session ${sessionId} logged out.` };
}

/**
 * Restart a session
 */
async function restartSession(sessionId) {
  const sock = sessions.get(sessionId);
  if (sock) {
    try {
      sock.end(undefined);
    } catch (e) {}
    sessions.delete(sessionId);
  }
  return await initSession(sessionId);
}

/**
 * Auto-restore all active sessions registered in PostgreSQL on startup
 */
async function restoreAllSessions() {
  try {
    const result = await pool.query('SELECT session_id, status FROM devices');
    console.log(`[Baileys] Found ${result.rows.length} registered devices to check.`);
    for (const row of result.rows) {
      const sessionPath = path.join(SESSIONS_DIR, row.session_id);
      if (fs.existsSync(sessionPath) || row.status === 'connected') {
        console.log(`[Baileys] Restoring session: "${row.session_id}"...`);
        initSession(row.session_id).catch(err => {
          console.error(`[Baileys] Failed to restore session "${row.session_id}":`, err.message);
        });
      }
    }
  } catch (err) {
    console.error('[Baileys] Error restoring sessions from database:', err.message);
  }
}

// Database helper functions
async function updateDeviceStatus(sessionId, status, phoneNumber = undefined) {
  try {
    if (phoneNumber !== undefined) {
      await pool.query(
        'UPDATE devices SET status = $1, phone_number = $2, updated_at = NOW() WHERE session_id = $3',
        [status, phoneNumber, sessionId]
      );
    } else {
      await pool.query(
        'UPDATE devices SET status = $1, updated_at = NOW() WHERE session_id = $2',
        [status, sessionId]
      );
    }
  } catch (err) {
    console.error(`[Baileys] Failed to update device status in PG:`, err.message);
  }
}

async function getDeviceBySessionId(sessionId) {
  try {
    const res = await pool.query('SELECT * FROM devices WHERE session_id = $1', [sessionId]);
    return res.rows[0] || null;
  } catch (err) {
    return null;
  }
}

async function dispatchDeviceWebhook(sessionId, event, data) {
  const device = await getDeviceBySessionId(sessionId);
  if (device?.webhook_url) {
    // Sengaja tanpa `await`: pemanggil (messages.upsert dkk.) tidak boleh menunggu
    // retry multi-menit. Kegagalan tercatat di WebhookLog, tidak pernah melempar ke pemanggil.
    dispatchWebhook(sessionId, device.webhook_url, device.webhook_secret, event, data, {
      retry: !!device.webhook_retry,
    });
  }
}

module.exports = {
  initSession,
  requestPairingCode,
  getSessionSocket,
  getSessionQR,
  getSessionPairingCode,
  logoutSession,
  restartSession,
  restoreAllSessions,
  getDeviceBySessionId,
  sessions
};
