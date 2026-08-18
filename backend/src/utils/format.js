/**
 * Format a phone number or ID into a valid WhatsApp JID
 * e.g., '08123456789' -> '628123456789@s.whatsapp.net'
 * e.g., '628123456789' -> '628123456789@s.whatsapp.net'
 * e.g., '12036302482394@g.us' -> unchanged
 */
function formatToWhatsAppJid(to) {
  if (!to) return null;
  let cleanNumber = String(to).trim();

  // If already a full JID
  if (cleanNumber.endsWith('@s.whatsapp.net') || cleanNumber.endsWith('@g.us') || cleanNumber.endsWith('@newsletter')) {
    return cleanNumber;
  }

  // Remove non-numeric characters except +
  cleanNumber = cleanNumber.replace(/[^0-9]/g, '');

  // Handle Indonesian local prefix '08' -> '628'
  if (cleanNumber.startsWith('0')) {
    cleanNumber = '62' + cleanNumber.slice(1);
  }

  return `${cleanNumber}@s.whatsapp.net`;
}

/**
 * Extract phone number from WhatsApp JID
 */
function extractPhoneFromJid(jid) {
  if (!jid) return '';
  return jid.split('@')[0];
}

/**
 * Extract text & media metadata from Baileys message object
 */
function extractMessageContent(msg) {
  const message = msg.message;
  if (!message) return { type: 'other', text: '' };

  if (message.conversation) {
    return { type: 'text', text: message.conversation };
  }
  if (message.extendedTextMessage) {
    return { type: 'text', text: message.extendedTextMessage.text || '' };
  }
  if (message.imageMessage) {
    return {
      type: 'image',
      text: message.imageMessage.caption || '',
      mimetype: message.imageMessage.mimetype,
      fileLength: message.imageMessage.fileLength
    };
  }
  if (message.documentMessage || message.documentWithCaptionMessage) {
    const doc = message.documentMessage || message.documentWithCaptionMessage?.message?.documentMessage;
    return {
      type: 'document',
      text: doc?.caption || '',
      filename: doc?.fileName || 'document',
      mimetype: doc?.mimetype
    };
  }
  if (message.audioMessage) {
    return {
      type: 'audio',
      text: '',
      mimetype: message.audioMessage.mimetype,
      seconds: message.audioMessage.seconds,
      isPtt: message.audioMessage.ptt || false
    };
  }
  if (message.videoMessage) {
    return {
      type: 'video',
      text: message.videoMessage.caption || '',
      mimetype: message.videoMessage.mimetype,
      seconds: message.videoMessage.seconds
    };
  }
  if (message.locationMessage) {
    return {
      type: 'location',
      latitude: message.locationMessage.degreesLatitude,
      longitude: message.locationMessage.degreesLongitude,
      name: message.locationMessage.name,
      address: message.locationMessage.address
    };
  }
  if (message.contactMessage || message.contactsArrayMessage) {
    return {
      type: 'contact',
      displayName: message.contactMessage?.displayName || 'Contact',
      vcard: message.contactMessage?.vcard
    };
  }
  if (message.stickerMessage) {
    return {
      type: 'sticker',
      mimetype: message.stickerMessage.mimetype
    };
  }

  return { type: 'other', text: '' };
}

module.exports = {
  formatToWhatsAppJid,
  extractPhoneFromJid,
  extractMessageContent
};
