const mongoose = require('mongoose');

const webhookLogSchema = new mongoose.Schema(
  {
    session_id: { type: String, required: true, index: true },
    event: { type: String, required: true, index: true },
    target_url: { type: String, required: true },
    request_payload: { type: mongoose.Schema.Types.Mixed },
    response_status: { type: Number },
    response_body: { type: mongoose.Schema.Types.Mixed },
    error_message: { type: String },
    execution_time_ms: { type: Number },
    success: { type: Boolean, default: false, index: true },
    attempt: { type: Number, default: 1 },
    created_at: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

webhookLogSchema.index({ session_id: 1, created_at: -1 });

module.exports = mongoose.model('WebhookLog', webhookLogSchema);
