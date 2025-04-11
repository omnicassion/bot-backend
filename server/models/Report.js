const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: { type: String, required: true },
  bot: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' }
});

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  chatHistory: [chatSchema]
});

module.exports = mongoose.model('Report', reportSchema);
