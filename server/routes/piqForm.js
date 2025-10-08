const express = require('express');
const router = express.Router();
const PIQForm = require('../models/PIQForm');
const User = require('../models/User');
const { requireRole } = require('../middleware/roleAuth');

// Middleware to check if user is therapist, doctor, or admin
const requireMedicalStaff = requireRole(['therapist', 'doctor', 'admin']);

// Create a new PIQ form
router.post('/', requireMedicalStaff, async (req, res) => {
  try {
    const formData = req.body;
    
    // Validate required fields
    if (!formData.patientId || !formData.patientName || !formData.diagnosis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: patientId, patientName, and diagnosis are required'
      });
    }
    
    // Find patient user
    const patient = await User.findOne({ username: formData.patientId });
    if (patient) {
      formData.patient = patient._id;
    }
    
    // Find therapist user
    const therapist = await User.findOne({ username: formData.therapistId });
    if (therapist) {
      formData.therapist = therapist._id;
    }
    
    const piqForm = new PIQForm(formData);
    await piqForm.save();
    
    // Populate references
    await piqForm.populate([
      { path: 'patient', select: 'username email role' },
      { path: 'therapist', select: 'username email role' }
    ]);
    
    res.status(201).json({
      success: true,
      message: 'PIQ form created successfully',
      data: piqForm
    });
  } catch (error) {
    console.error('Error creating PIQ form:', error);
    res.status(500).json({
      success: false,
      error: 'Error creating PIQ form',
      details: error.message
    });
  }
});

// Get all PIQ forms (with optional filters)
router.get('/', requireMedicalStaff, async (req, res) => {
  try {
    const { patientId, therapistId, status, priority, startDate, endDate } = req.query;
    
    let query = {};
    
    if (patientId) query.patientId = patientId;
    if (therapistId) query.therapistId = therapistId;
    if (status) query.status = status;
    if (priority) query.priority = priority;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const forms = await PIQForm.find(query)
      .populate('patient', 'username email role')
      .populate('therapist', 'username email role')
      .populate('reviewedBy', 'username email role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Error fetching PIQ forms:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PIQ forms',
      details: error.message
    });
  }
});

// Get a specific PIQ form by ID
router.get('/:id', requireMedicalStaff, async (req, res) => {
  try {
    const form = await PIQForm.findById(req.params.id)
      .populate('patient', 'username email role')
      .populate('therapist', 'username email role')
      .populate('reviewedBy', 'username email role');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: form
    });
  } catch (error) {
    console.error('Error fetching PIQ form:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching PIQ form',
      details: error.message
    });
  }
});

// Get all forms for a specific patient
router.get('/patient/:patientId', requireMedicalStaff, async (req, res) => {
  try {
    const forms = await PIQForm.find({ patientId: req.params.patientId })
      .populate('therapist', 'username email role')
      .populate('reviewedBy', 'username email role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Error fetching patient forms:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching patient forms',
      details: error.message
    });
  }
});

// Get all forms created by a specific therapist
router.get('/therapist/:therapistId', requireMedicalStaff, async (req, res) => {
  try {
    const forms = await PIQForm.find({ therapistId: req.params.therapistId })
      .populate('patient', 'username email role')
      .populate('reviewedBy', 'username email role')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: forms.length,
      data: forms
    });
  } catch (error) {
    console.error('Error fetching therapist forms:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching therapist forms',
      details: error.message
    });
  }
});

// Update a PIQ form
router.put('/:id', requireMedicalStaff, async (req, res) => {
  try {
    const updateData = req.body;
    updateData.updatedAt = Date.now();
    
    // If status is being changed to submitted, set submittedAt
    if (updateData.status === 'submitted' && req.body.status !== 'submitted') {
      updateData.submittedAt = Date.now();
    }
    
    const form = await PIQForm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    )
    .populate('patient', 'username email role')
    .populate('therapist', 'username email role')
    .populate('reviewedBy', 'username email role');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'PIQ form updated successfully',
      data: form
    });
  } catch (error) {
    console.error('Error updating PIQ form:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating PIQ form',
      details: error.message
    });
  }
});

// Delete a PIQ form
router.delete('/:id', requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const form = await PIQForm.findByIdAndDelete(req.params.id);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'PIQ form deleted successfully',
      data: form
    });
  } catch (error) {
    console.error('Error deleting PIQ form:', error);
    res.status(500).json({
      success: false,
      error: 'Error deleting PIQ form',
      details: error.message
    });
  }
});

// Submit a form (change status from draft to submitted)
router.patch('/:id/submit', requireMedicalStaff, async (req, res) => {
  try {
    const form = await PIQForm.findByIdAndUpdate(
      req.params.id,
      { 
        status: 'submitted',
        submittedAt: Date.now(),
        updatedAt: Date.now()
      },
      { new: true }
    )
    .populate('patient', 'username email role')
    .populate('therapist', 'username email role');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'PIQ form submitted successfully',
      data: form
    });
  } catch (error) {
    console.error('Error submitting PIQ form:', error);
    res.status(500).json({
      success: false,
      error: 'Error submitting PIQ form',
      details: error.message
    });
  }
});

// Review a form (change status to reviewed)
router.patch('/:id/review', requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { reviewerId, notes } = req.body;
    
    const reviewer = await User.findOne({ username: reviewerId });
    
    const updateData = {
      status: 'reviewed',
      reviewedAt: Date.now(),
      updatedAt: Date.now()
    };
    
    if (reviewer) {
      updateData.reviewedBy = reviewer._id;
    }
    
    if (notes) {
      updateData.clinicalNotes = notes;
    }
    
    const form = await PIQForm.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('patient', 'username email role')
    .populate('therapist', 'username email role')
    .populate('reviewedBy', 'username email role');
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'PIQ form reviewed successfully',
      data: form
    });
  } catch (error) {
    console.error('Error reviewing PIQ form:', error);
    res.status(500).json({
      success: false,
      error: 'Error reviewing PIQ form',
      details: error.message
    });
  }
});

// Add medication to a form
router.post('/:id/medication', requireMedicalStaff, async (req, res) => {
  try {
    const { name, dosage, frequency, startDate, endDate, notes } = req.body;
    
    if (!name || !dosage) {
      return res.status(400).json({
        success: false,
        error: 'Medication name and dosage are required'
      });
    }
    
    const form = await PIQForm.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    form.medication.push({
      name,
      dosage,
      frequency,
      startDate: startDate ? new Date(startDate) : Date.now(),
      endDate: endDate ? new Date(endDate) : null,
      notes
    });
    
    form.updatedAt = Date.now();
    await form.save();
    
    await form.populate([
      { path: 'patient', select: 'username email role' },
      { path: 'therapist', select: 'username email role' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Medication added successfully',
      data: form
    });
  } catch (error) {
    console.error('Error adding medication:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding medication',
      details: error.message
    });
  }
});

// Add lab results to a form
router.post('/:id/lab-results', requireMedicalStaff, async (req, res) => {
  try {
    const { testName, value, unit, date, normalRange } = req.body;
    
    if (!testName || !value) {
      return res.status(400).json({
        success: false,
        error: 'Test name and value are required'
      });
    }
    
    const form = await PIQForm.findById(req.params.id);
    
    if (!form) {
      return res.status(404).json({
        success: false,
        error: 'PIQ form not found'
      });
    }
    
    form.labResults.push({
      testName,
      value,
      unit,
      date: date ? new Date(date) : Date.now(),
      normalRange
    });
    
    form.updatedAt = Date.now();
    await form.save();
    
    await form.populate([
      { path: 'patient', select: 'username email role' },
      { path: 'therapist', select: 'username email role' }
    ]);
    
    res.status(200).json({
      success: true,
      message: 'Lab results added successfully',
      data: form
    });
  } catch (error) {
    console.error('Error adding lab results:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding lab results',
      details: error.message
    });
  }
});

// Get statistics
router.get('/stats/overview', requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const totalForms = await PIQForm.countDocuments();
    const draftForms = await PIQForm.countDocuments({ status: 'draft' });
    const submittedForms = await PIQForm.countDocuments({ status: 'submitted' });
    const reviewedForms = await PIQForm.countDocuments({ status: 'reviewed' });
    
    const treatmentTypes = await PIQForm.aggregate([
      { $group: { _id: '$treatmentType', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);
    
    const priorityDistribution = await PIQForm.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalForms,
        statusDistribution: {
          draft: draftForms,
          submitted: submittedForms,
          reviewed: reviewedForms
        },
        treatmentTypes,
        priorityDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching statistics',
      details: error.message
    });
  }
});

module.exports = router;
