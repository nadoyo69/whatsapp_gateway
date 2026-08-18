const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { getSessionSocket } = require('../services/baileys');
const { formatToWhatsAppJid, extractPhoneFromJid } = require('../utils/format');
const Message = require('../models/mongo/Message');
const Chat = require('../models/mongo/Chat');
const { emitToSession } = require('../services/socket');

/**
 * Helper to ensure session socket is alive and connected
 */
function getActiveSocket(sessionId, res) {
  const sock = getSessionSocket(sessionId);
  if (!sock) {
    res.status(400).json({ success: false, message: `Session "${sessionId}" is not active or not initialized.` });
    return null;
  }
  if (!sock.user) {
    res.status(400).json({ success: false, message: `Session "${sessionId}" is not yet connected to WhatsApp. Please scan QR first.` });
    return null;
  }
  return sock;
}

/**
 * Helper to get buffer from local file upload or remote URL
 */
async function getMediaBuffer(req, mediaUrlField = 'mediaUrl') {
  if (req.file) {
    return {
      buffer: fs.readFileSync(req.file.path),
      mimetype: req.file.mimetype,
      filename: req.file.originalname,
      tempPath: req.file.path
    };
  }

  const url = req.body[mediaUrlField];
  if (url) {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const contentType = response.headers['content-type'] || 'application/octet-stream';
    const filename = path.basename(new URL(url).pathname) || 'file';
    return {
      buffer: Buffer.from(response.data),
      mimetype: contentType,
      filename: filename,
      tempPath: null
    };
  }

  return null;
}

/**
 * Helper to clean up uploaded temporary file
 */
function cleanupTempFile(filePath) {
  if (filePath && fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (e) {}
  }
}

/**
 * Send Plain Text Message
 */
async function sendText(req, res) {
  const { sessionId, to, message, mentions } = req.body;

  if (!sessionId || !to || !message) {
    return res.status(400).json({ success: false, message: 'sessionId, to, and message are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) return;

  const targetJid = formatToWhatsAppJid(to);

  try {
    const options = { text: message };
    if (mentions && Array.isArray(mentions)) {
      options.mentions = mentions.map(m => formatToWhatsAppJid(m));
    }

    const sent = await sock.sendMessage(targetJid, options);
    
    return res.json({
      success: true,
      message: 'Text message sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        timestamp: new Date()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send text message.', error: err.message });
  }
}

/**
 * Send Image (via Multipart upload or URL)
 */
async function sendImage(req, res) {
  const { sessionId, to, caption } = req.body;

  if (!sessionId || !to) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(400).json({ success: false, message: 'sessionId and to are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) {
    if (req.file) cleanupTempFile(req.file.path);
    return;
  }

  const targetJid = formatToWhatsAppJid(to);

  try {
    const media = await getMediaBuffer(req, 'imageUrl');
    if (!media) {
      return res.status(400).json({ success: false, message: 'Image file or imageUrl is required.' });
    }

    const sent = await sock.sendMessage(targetJid, {
      image: media.buffer,
      caption: caption || '',
      mimetype: media.mimetype
    });

    if (media.tempPath) cleanupTempFile(media.tempPath);

    return res.json({
      success: true,
      message: 'Image sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        timestamp: new Date()
      }
    });
  } catch (err) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to send image.', error: err.message });
  }
}

/**
 * Send Document / PDF / File (via Multipart upload or URL)
 */
async function sendDocument(req, res) {
  const { sessionId, to, caption, filename, mimetype } = req.body;

  if (!sessionId || !to) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(400).json({ success: false, message: 'sessionId and to are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) {
    if (req.file) cleanupTempFile(req.file.path);
    return;
  }

  const targetJid = formatToWhatsAppJid(to);

  try {
    const media = await getMediaBuffer(req, 'documentUrl');
    if (!media) {
      return res.status(400).json({ success: false, message: 'Document file or documentUrl is required.' });
    }

    const sent = await sock.sendMessage(targetJid, {
      document: media.buffer,
      mimetype: mimetype || media.mimetype || 'application/octet-stream',
      fileName: filename || media.filename || 'document.pdf',
      caption: caption || ''
    });

    if (media.tempPath) cleanupTempFile(media.tempPath);

    return res.json({
      success: true,
      message: 'Document sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        filename: filename || media.filename,
        timestamp: new Date()
      }
    });
  } catch (err) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to send document.', error: err.message });
  }
}

/**
 * Send Audio / Voice Note (PTT)
 */
async function sendAudio(req, res) {
  const { sessionId, to, isPtt } = req.body;

  if (!sessionId || !to) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(400).json({ success: false, message: 'sessionId and to are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) {
    if (req.file) cleanupTempFile(req.file.path);
    return;
  }

  const targetJid = formatToWhatsAppJid(to);

  try {
    const media = await getMediaBuffer(req, 'audioUrl');
    if (!media) {
      return res.status(400).json({ success: false, message: 'Audio file or audioUrl is required.' });
    }

    const sent = await sock.sendMessage(targetJid, {
      audio: media.buffer,
      mimetype: media.mimetype || 'audio/mp4',
      ptt: isPtt === 'true' || isPtt === true
    });

    if (media.tempPath) cleanupTempFile(media.tempPath);

    return res.json({
      success: true,
      message: 'Audio sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        timestamp: new Date()
      }
    });
  } catch (err) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to send audio.', error: err.message });
  }
}

/**
 * Send Video
 */
async function sendVideo(req, res) {
  const { sessionId, to, caption } = req.body;

  if (!sessionId || !to) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(400).json({ success: false, message: 'sessionId and to are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) {
    if (req.file) cleanupTempFile(req.file.path);
    return;
  }

  const targetJid = formatToWhatsAppJid(to);

  try {
    const media = await getMediaBuffer(req, 'videoUrl');
    if (!media) {
      return res.status(400).json({ success: false, message: 'Video file or videoUrl is required.' });
    }

    const sent = await sock.sendMessage(targetJid, {
      video: media.buffer,
      caption: caption || '',
      mimetype: media.mimetype || 'video/mp4'
    });

    if (media.tempPath) cleanupTempFile(media.tempPath);

    return res.json({
      success: true,
      message: 'Video sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        timestamp: new Date()
      }
    });
  } catch (err) {
    if (req.file) cleanupTempFile(req.file.path);
    return res.status(500).json({ success: false, message: 'Failed to send video.', error: err.message });
  }
}

/**
 * Send Location Coordinate
 */
async function sendLocation(req, res) {
  const { sessionId, to, latitude, longitude, name, address } = req.body;

  if (!sessionId || !to || latitude === undefined || longitude === undefined) {
    return res.status(400).json({ success: false, message: 'sessionId, to, latitude, and longitude are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) return;

  const targetJid = formatToWhatsAppJid(to);

  try {
    const sent = await sock.sendMessage(targetJid, {
      location: {
        degreesLatitude: parseFloat(latitude),
        degreesLongitude: parseFloat(longitude),
        name: name || undefined,
        address: address || undefined
      }
    });

    return res.json({
      success: true,
      message: 'Location sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        timestamp: new Date()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send location.', error: err.message });
  }
}

/**
 * Send Contact Card (VCard)
 */
async function sendContact(req, res) {
  const { sessionId, to, contactName, contactPhone } = req.body;

  if (!sessionId || !to || !contactName || !contactPhone) {
    return res.status(400).json({ success: false, message: 'sessionId, to, contactName, and contactPhone are required.' });
  }

  const sock = getActiveSocket(sessionId, res);
  if (!sock) return;

  const targetJid = formatToWhatsAppJid(to);
  const cleanPhone = String(contactPhone).replace(/[^0-9]/g, '');

  const vcard = 'BEGIN:VCARD\n'
    + 'VERSION:3.0\n' 
    + `FN:${contactName}\n`
    + `ORG:WhatsApp Contact;\n`
    + `TEL;type=CELL;type=VOICE;waid=${cleanPhone}:+${cleanPhone}\n`
    + 'END:VCARD';

  try {
    const sent = await sock.sendMessage(targetJid, {
      contacts: {
        displayName: contactName,
        contacts: [{ vcard }]
      }
    });

    return res.json({
      success: true,
      message: 'Contact sent successfully.',
      data: {
        messageId: sent.key.id,
        remoteJid: targetJid,
        timestamp: new Date()
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Failed to send contact.', error: err.message });
  }
}

/**
 * Check if a Phone Number is registered on WhatsApp
 */
async function checkNumber(req, res) {
  const { sessionId, phone } = req.params;

  const sock = getActiveSocket(sessionId, res);
  if (!sock) return;

  try {
    let cleanPhone = String(phone).replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const [result] = await sock.onWhatsApp(cleanPhone);

    if (result && result.exists) {
      return res.json({
        success: true,
        exists: true,
        data: {
          jid: result.jid,
          phone: cleanPhone
        }
      });
    }

    return res.json({
      success: true,
      exists: false,
      message: `Phone number ${cleanPhone} is not registered on WhatsApp.`
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error checking number on WhatsApp.', error: err.message });
  }
}

module.exports = {
  sendText,
  sendImage,
  sendDocument,
  sendAudio,
  sendVideo,
  sendLocation,
  sendContact,
  checkNumber
};
