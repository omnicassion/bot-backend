const mongoose = require('mongoose');

const piqFormSchema = new mongoose.Schema({
  // Patient Reference
  patientId: { type: String, required: true },
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Therapist Reference
  therapistId: { type: String, required: true },
  therapist: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Basic Information
  patientName: { type: String, required: true },
  age: { type: Number },
  gender: { type: String, enum: ['Male', 'Female', 'Other', ''], default: '' },
  contactNumber: { type: String },
  
  // Medical Information
  diagnosis: { type: String, required: true },
  grading: { 
    type: String, 
    enum: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Not Applicable', ''],
    default: ''
  },
  staging: { 
    type: String, 
    enum: ['Stage 0', 'Stage I', 'Stage II', 'Stage III', 'Stage IV', 'Not Applicable', ''],
    default: ''
  },
  
  // Socio-Economic Information
  incomeStatus: { 
    type: String, 
    enum: ['Below Poverty Line', 'Lower Income', 'Middle Income', 'Upper Income', 'Prefer not to say', ''],
    default: ''
  },
  
  // Performance Status
  performanceStatus: {
    type: String,
    enum: [
      'ECOG 0 - Fully active',
      'ECOG 1 - Restricted in physically strenuous activity',
      'ECOG 2 - Ambulatory and capable of self-care',
      'ECOG 3 - Capable of limited self-care',
      'ECOG 4 - Completely disabled',
      'ECOG 5 - Dead',
      'Not Assessed',
      ''
    ],
    default: ''
  },
  
  // Clinical Notes
  description: { type: String },
  clinicalNotes: { type: String },
  
  // Treatment Information
  medication: [{ 
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    endDate: Date,
    notes: String
  }],
  
  treatment: { type: String },
  dosage: { type: String },
  
  treatmentType: {
    type: String,
    enum: [
      'Chemotherapy',
      'Radiotherapy',
      'Surgery',
      'Immunotherapy',
      'Hormone Therapy',
      'Targeted Therapy',
      'Palliative Care',
      'Combination Therapy',
      'Other',
      ''
    ],
    default: ''
  },
  
  // Additional Treatment Details
  treatmentStartDate: { type: Date },
  treatmentEndDate: { type: Date },
  numberOfSessions: { type: Number },
  sessionsCompleted: { type: Number, default: 0 },
  
  // Vital Signs (Optional)
  vitals: {
    bloodPressure: { type: String },
    heartRate: { type: Number },
    temperature: { type: Number },
    weight: { type: Number },
    height: { type: Number },
    bmi: { type: Number }
  },
  
  // Laboratory Results
  labResults: [{
    testName: String,
    value: String,
    unit: String,
    date: Date,
    normalRange: String
  }],
  
  // Attachments
  attachments: [{
    fileName: String,
    fileUrl: String,
    fileType: String,
    uploadDate: { type: Date, default: Date.now }
  }],
  
  // Status and Metadata
  status: { 
    type: String, 
    enum: ['draft', 'submitted', 'reviewed', 'archived'], 
    default: 'draft' 
  },
  
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  
  // Follow-up Information
  followUpRequired: { type: Boolean, default: false },
  followUpDate: { type: Date },
  followUpNotes: { type: String },
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

// Update the updatedAt field before saving
piqFormSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  
  // Auto-calculate BMI if height and weight are provided
  if (this.vitals && this.vitals.height && this.vitals.weight) {
    const heightInMeters = this.vitals.height / 100;
    this.vitals.bmi = (this.vitals.weight / (heightInMeters * heightInMeters)).toFixed(2);
  }
  
  next();
});

// Index for faster queries
piqFormSchema.index({ patientId: 1, createdAt: -1 });
piqFormSchema.index({ therapistId: 1, createdAt: -1 });
piqFormSchema.index({ status: 1 });

module.exports = mongoose.model('PIQForm', piqFormSchema);
