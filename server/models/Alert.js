const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  severity: { type: String, enum: ['low', 'medium', 'high'], required: true },
  message: { type: String, required: true },
  date: { type: Date, default: Date.now }
});

const Alert = mongoose.model('Alert', alertSchema);

module.exports = Alert;