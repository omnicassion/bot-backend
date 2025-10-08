const mongoose = require('mongoose');

const ayushmanCardSchema = new mongoose.Schema({
  hasCard: { type: Boolean, default: false },
  cardNumber: { type: String, default: '' },
  totalCoverageAmount: { type: Number, default: 500000 }, // Default ₹5 lakh coverage
  amountUsed: { type: Number, default: 0 },
  amountRemaining: { type: Number, default: 500000 },
  lastUpdated: { type: Date, default: Date.now },
  usageHistory: [{
    date: { type: Date, default: Date.now },
    description: { type: String },
    amountUsed: { type: Number },
    hospital: { type: String }
  }]
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, default:"" },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'doctor', 'user',"therapist"], default: 'user' },
  ayushmanCard: { type: ayushmanCardSchema, default: () => ({}) }
});

const User = mongoose.model('User', userSchema);

module.exports = User;