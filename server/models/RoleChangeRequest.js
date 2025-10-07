const mongoose = require('mongoose');

const roleChangeRequestSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  username: { 
    type: String, 
    required: true 
  },
  currentRole: { 
    type: String, 
    enum: ['admin', 'doctor', 'user', 'therapist'], 
    required: true 
  },
  requestedRole: { 
    type: String, 
    enum: ['admin', 'doctor', 'user', 'therapist'], 
    required: true 
  },
  reason: { 
    type: String, 
    required: true,
    maxlength: 500
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  reviewedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  reviewedAt: { 
    type: Date 
  },
  reviewNotes: { 
    type: String,
    maxlength: 500
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

// Index for efficient queries
roleChangeRequestSchema.index({ userId: 1, status: 1 });
roleChangeRequestSchema.index({ status: 1, createdAt: -1 });

const RoleChangeRequest = mongoose.model('RoleChangeRequest', roleChangeRequestSchema);

module.exports = RoleChangeRequest;