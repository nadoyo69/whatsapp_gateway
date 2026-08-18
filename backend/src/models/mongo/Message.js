const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    message_id: { type: String, required: true, index: true },
    remote_jid: { type: String, required: true, index: true },
    from_me: { type: Boolean, default: false },
    sender_name: { type: String },
    message_type: { 
      type: String, 
      enum: ['text', 'image', 'document', 'audio', 'video', 'location', 'contact', 'sticker', 'other'],
      default: 'text' 
    },
    text: { type: String },
    media_url: { type: String },
    media_mimetype: { type: String },
    media_filename: { type: String },
    status: { 
      type: String, 
      enum: ['pending', 'sent', 'delivered', 'read', 'failed'],
      default: 'pending' 
    },
    raw_message: { type: mongoose.Schema.Types.Mixed },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

messageSchema.index({ session_id: 1, remote_jid: 1, timestamp: -1 });

module.exports = mongoose.model('Message', messageSchema);
