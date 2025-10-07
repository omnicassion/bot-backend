const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  user: { type: String, required: true },
  bot: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
  contextUsed: { type: String }, // The key of the context that was used
  contextName: { type: String }  // The human-readable name of the context
});

const reportSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  chatHistory: [chatSchema],
  symptoms: [{ type: String }], // Array of symptoms
  diagnosis: { type: String }, // Medical diagnosis
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  status: { 
    type: String, 
    enum: ['draft', 'completed', 'reviewed', 'archived'], 
    default: 'draft' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  notes: { type: String }, // Additional notes from medical professional
  analysisResults: { type: mongoose.Schema.Types.Mixed } // Results from AI analysis (can be object or string)
});

// Update the updatedAt field before saving
reportSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Report', reportSchema);
