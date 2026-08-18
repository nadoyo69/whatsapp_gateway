const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    jid: { type: String, required: true, index: true },
    name: { type: String },
    phone: { type: String },
    is_group: { type: Boolean, default: false },
    unread_count: { type: Number, default: 0 },
    last_message: {
      text: String,
      from_me: Boolean,
      type: String,
      timestamp: Date
    },
    updated_at: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

chatSchema.index({ session_id: 1, jid: 1 }, { unique: true });

module.exports = mongoose.model('Chat', chatSchema);
