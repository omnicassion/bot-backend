// Report validation utilities
const mongoose = require('mongoose');

// Validate report data structure
const validateReportData = (reportData) => {
  const errors = [];

  // Required fields validation
  if (!reportData.userId) {
    errors.push('userId is required');
  }

  // Validate userId format if provided
  if (reportData.userId && typeof reportData.userId !== 'string') {
    errors.push('userId must be a string');
  }

  // Validate symptoms array if provided
  if (reportData.symptoms && !Array.isArray(reportData.symptoms)) {
    errors.push('symptoms must be an array');
  }

  // Validate status enum if provided
  const validStatuses = ['draft', 'completed', 'reviewed', 'archived'];
  if (reportData.status && !validStatuses.includes(reportData.status)) {
    errors.push(`status must be one of: ${validStatuses.join(', ')}`);
  }

  // Validate priority enum if provided
  const validPriorities = ['low', 'medium', 'high', 'urgent'];
  if (reportData.priority && !validPriorities.includes(reportData.priority)) {
    errors.push(`priority must be one of: ${validPriorities.join(', ')}`);
  }

  // Validate chat history structure if provided
  if (reportData.chatHistory) {
    if (!Array.isArray(reportData.chatHistory)) {
      errors.push('chatHistory must be an array');
    } else {
      reportData.chatHistory.forEach((chat, index) => {
        if (!chat.user || !chat.bot) {
          errors.push(`chatHistory[${index}] must contain both user and bot messages`);
        }
        
        const validSeverities = ['low', 'medium', 'high'];
        if (chat.severity && !validSeverities.includes(chat.severity)) {
          errors.push(`chatHistory[${index}].severity must be one of: ${validSeverities.join(', ')}`);
        }
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate MongoDB ObjectId
const validateObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

// Sanitize report data
const sanitizeReportData = (reportData) => {
  const sanitized = { ...reportData };

  // Remove any undefined or null values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined || sanitized[key] === null) {
      delete sanitized[key];
    }
  });

  // Trim string values
  if (sanitized.diagnosis) {
    sanitized.diagnosis = sanitized.diagnosis.trim();
  }
  
  if (sanitized.notes) {
    sanitized.notes = sanitized.notes.trim();
  }

  // Sanitize symptoms array
  if (sanitized.symptoms && Array.isArray(sanitized.symptoms)) {
    sanitized.symptoms = sanitized.symptoms
      .filter(symptom => symptom && typeof symptom === 'string')
      .map(symptom => symptom.trim())
      .filter(symptom => symptom.length > 0);
  }

  // Sanitize chat history
  if (sanitized.chatHistory && Array.isArray(sanitized.chatHistory)) {
    sanitized.chatHistory = sanitized.chatHistory.map(chat => ({
      ...chat,
      user: chat.user ? chat.user.trim() : '',
      bot: chat.bot ? chat.bot.trim() : '',
      contextName: chat.contextName ? chat.contextName.trim() : undefined,
      contextUsed: chat.contextUsed ? chat.contextUsed.trim() : undefined
    }));
  }

  return sanitized;
};

// Generate report summary
const generateReportSummary = (report) => {
  const summary = {
    id: report._id,
    userId: report.userId,
    status: report.status,
    priority: report.priority,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    symptomsCount: report.symptoms ? report.symptoms.length : 0,
    chatHistoryCount: report.chatHistory ? report.chatHistory.length : 0,
    hasDiagnosis: !!report.diagnosis,
    hasAnalysis: !!report.analysisResults,
    hasNotes: !!report.notes
  };

  // Calculate average severity from chat history
  if (report.chatHistory && report.chatHistory.length > 0) {
    const severityMap = { low: 1, medium: 2, high: 3 };
    const totalSeverity = report.chatHistory.reduce((sum, chat) => {
      return sum + (severityMap[chat.severity] || 1);
    }, 0);
    const avgSeverity = totalSeverity / report.chatHistory.length;
    
    if (avgSeverity <= 1.3) summary.averageSeverity = 'low';
    else if (avgSeverity <= 2.3) summary.averageSeverity = 'medium';
    else summary.averageSeverity = 'high';
  }

  return summary;
};

module.exports = {
  validateReportData,
  validateObjectId,
  sanitizeReportData,
  generateReportSummary
};