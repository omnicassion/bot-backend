const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const reportService = require('../services/reportService');
const { 
  validateReportData, 
  validateObjectId, 
  sanitizeReportData, 
  generateReportSummary 
} = require('../utils/reportValidation');
const { requireMedicalStaff } = require('../middleware/roleAuth');

// Validation middleware for report creation
const validateReportCreation = (req, res, next) => {
  const validation = validateReportData(req.body);
  
  if (!validation.isValid) {
    return res.status(400).json({ 
      success: false,
      error: 'Validation failed',
      details: validation.errors
    });
  }
  
  // Sanitize the data
  req.body = sanitizeReportData(req.body);
  next();
};

// Validation middleware for ObjectId parameters
const validateObjectIdParam = (paramName) => {
  return (req, res, next) => {
    const id = req.params[paramName];
    if (!validateObjectId(id)) {
      return res.status(400).json({
        success: false,
        error: `Invalid ${paramName} format`
      });
    }
    next();
  };
};

// Create a new report
router.post('/', validateReportCreation, async (req, res) => {
  try {
    const reportData = req.body;
    const report = await reportService.createReport(reportData);
    res.status(201).json({
      success: true,
      message: 'Report created successfully',
      data: report
    });
  } catch (error) {
    console.error('Error creating report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error creating report', 
      details: error.message 
    });
  }
});

// Get all reports with optional filtering
router.get('/', async (req, res) => {
  try {
    const { status, priority, userId } = req.query;
    let reports;

    if (status) {
      reports = await reportService.getReportsByStatus(status);
    } else if (priority) {
      reports = await reportService.getReportsByPriority(priority);
    } else if (userId) {
      reports = await reportService.getReportsByUserId(userId);
    } else {
      reports = await reportService.getAllReports();
    }

    res.status(200).json({
      success: true,
      count: reports.length,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching reports', 
      details: error.message 
    });
  }
});

// Get a report by ID
router.get('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    res.status(200).json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error fetching report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error fetching report', 
      details: error.message 
    });
  }
});

// Update a report by ID
router.put('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const updatedReport = await reportService.updateReport(req.params.id, req.body);
    if (!updatedReport) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    res.status(200).json({
      success: true,
      message: 'Report updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error updating report', 
      details: error.message 
    });
  }
});

// Delete a report by ID
router.delete('/:id', validateObjectIdParam('id'), async (req, res) => {
  try {
    const deletedReport = await reportService.deleteReport(req.params.id);
    if (!deletedReport) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    res.status(200).json({
      success: true,
      message: 'Report deleted successfully',
      data: deletedReport
    });
  } catch (error) {
    console.error('Error deleting report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error deleting report', 
      details: error.message 
    });
  }
});

// Add chat entry to existing report
router.post('/:userId/chat', async (req, res) => {
  try {
    const { userId } = req.params;
    const chatEntry = req.body;
    
    if (!chatEntry.user || !chatEntry.bot) {
      return res.status(400).json({ 
        success: false, 
        error: 'Chat entry must contain both user and bot messages' 
      });
    }

    const report = await reportService.addChatToReport(userId, chatEntry);
    res.status(200).json({
      success: true,
      message: 'Chat entry added to report successfully',
      data: report
    });
  } catch (error) {
    console.error('Error adding chat to report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error adding chat to report', 
      details: error.message 
    });
  }
});

// Update report analysis results
router.put('/:id/analysis', validateObjectIdParam('id'), async (req, res) => {
  try {
    const { analysisResults } = req.body;
    
    if (!analysisResults) {
      return res.status(400).json({ 
        success: false, 
        error: 'Analysis results are required' 
      });
    }

    const updatedReport = await reportService.updateReportAnalysis(req.params.id, analysisResults);
    if (!updatedReport) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'Report analysis updated successfully',
      data: updatedReport
    });
  } catch (error) {
    console.error('Error updating report analysis:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error updating report analysis', 
      details: error.message 
    });
  }
});

// Get report summary by ID
router.get('/:id/summary', validateObjectIdParam('id'), async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    const summary = generateReportSummary(report);
    res.status(200).json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error generating report summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generating report summary', 
      details: error.message 
    });
  }
});

// Bulk get report summaries
router.get('/summaries/bulk', async (req, res) => {
  try {
    const { status, priority, userId, limit = 50 } = req.query;
    let reports;

    // Apply filters
    if (status) {
      reports = await reportService.getReportsByStatus(status);
    } else if (priority) {
      reports = await reportService.getReportsByPriority(priority);
    } else if (userId) {
      reports = await reportService.getReportsByUserId(userId);
    } else {
      reports = await reportService.getAllReports();
    }

    // Limit results
    const limitedReports = reports.slice(0, parseInt(limit));
    
    // Generate summaries
    const summaries = limitedReports.map(report => generateReportSummary(report));

    res.status(200).json({
      success: true,
      count: summaries.length,
      totalAvailable: reports.length,
      data: summaries
    });
  } catch (error) {
    console.error('Error generating bulk report summaries:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error generating report summaries', 
      details: error.message 
    });
  }
});

// Analyze a specific report by ID
router.get('/analyze/report/:reportId', validateObjectIdParam('reportId'), async (req, res) => {
  try {
    const reportId = req.params.reportId;
    const report = await reportService.getReportById(reportId);
    
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found' 
      });
    }

    // Check if analysis already exists
    if (report.analysisResults) {
      let analysisData = report.analysisResults;
      
      // Handle backward compatibility - if it's a string, try to parse it
      if (typeof analysisData === 'string') {
        try {
          analysisData = JSON.parse(analysisData);
        } catch (e) {
          // If parsing fails, keep as string in a wrapper object
          analysisData = { analysisText: analysisData, analysisType: 'text' };
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Analysis already exists',
        data: analysisData
      });
    }

    // Perform analysis if chat history exists
    if (!report.chatHistory || !report.chatHistory.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'No chat history found for analysis' 
      });
    }

    // Generate analysis using Gemini AI
    const model = require('../config/gemini');
    const history = report.chatHistory.map(chat => 
      `Patient: ${chat.user}\nAssistant: ${chat.bot}`
    ).join('\n');

    const prompt = `
You are an AI medical assistant that analyzes patient reports based on chat history during radiotherapy.

Analyze the following patient interaction and provide:
1. Key symptoms identified
2. Severity assessment (mild/moderate/severe)
3. Recommendations given
4. Follow-up suggestions
5. Risk factors identified
6. Overall assessment

Chat History:
${history}

Please provide the analysis in JSON format with the following structure:
{
  "symptoms": ["symptom1", "symptom2"],
  "severity": "mild|moderate|severe",
  "recommendations": ["rec1", "rec2"],
  "followUp": "follow-up suggestions",
  "riskFactors": ["risk1", "risk2"],
  "overallAssessment": "summary of patient condition"
}
`;

    const result = await model.generateContent(prompt);
    const analysisText = await result.response.text();
    
    let analysisResults;
    try {
      analysisResults = JSON.parse(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, store as plain text
      analysisResults = {
        analysisText: analysisText,
        generatedAt: new Date(),
        analysisType: 'text'
      };
    }

    // Update report with analysis results
    const updatedReport = await reportService.updateReportAnalysis(reportId, analysisResults);
    
    res.status(200).json({
      success: true,
      message: 'Report analysis completed',
      data: analysisResults
    });

  } catch (error) {
    console.error('Error analyzing specific report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error analyzing report', 
      details: error.message 
    });
  }
});

// Analyze latest report for a specific user
router.get('/analyze/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Find the most recent report for the user
    const reports = await reportService.getReportsByUserId(userId);
    
    if (!reports || reports.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No reports found for this user' 
      });
    }

    // Get the most recent report
    const latestReport = reports.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    
    // Check if analysis already exists
    if (latestReport.analysisResults) {
      let analysisData = latestReport.analysisResults;
      
      // Handle backward compatibility - if it's a string, try to parse it
      if (typeof analysisData === 'string') {
        try {
          analysisData = JSON.parse(analysisData);
        } catch (e) {
          // If parsing fails, keep as string in a wrapper object
          analysisData = { analysisText: analysisData, analysisType: 'text' };
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'Analysis already exists for latest report',
        data: analysisData
      });
    }

    // Perform analysis if chat history exists
    if (!latestReport.chatHistory || !latestReport.chatHistory.length) {
      return res.status(400).json({ 
        success: false, 
        error: 'No chat history found for analysis' 
      });
    }

    // Generate analysis using Gemini AI
    const model = require('../config/gemini');
    const history = latestReport.chatHistory.map(chat => 
      `Patient: ${chat.user}\nAssistant: ${chat.bot}`
    ).join('\n');

    const prompt = `
You are an AI medical assistant that analyzes patient reports based on chat history during radiotherapy.

Analyze the following patient interaction and provide:
1. Key symptoms identified
2. Severity assessment (mild/moderate/severe)
3. Recommendations given
4. Follow-up suggestions
5. Risk factors identified
6. Overall assessment

Chat History:
${history}

Please provide the analysis in JSON format with the following structure:
{
  "symptoms": ["symptom1", "symptom2"],
  "severity": "mild|moderate|severe",
  "recommendations": ["rec1", "rec2"],
  "followUp": "follow-up suggestions",
  "riskFactors": ["risk1", "risk2"],
  "overallAssessment": "summary of patient condition"
}
`;

    const result = await model.generateContent(prompt);
    const analysisText = await result.response.text();
    
    let analysisResults;
    try {
      analysisResults = JSON.parse(analysisText);
    } catch (parseError) {
      // If JSON parsing fails, store as plain text
      analysisResults = {
        analysisText: analysisText,
        generatedAt: new Date(),
        analysisType: 'text'
      };
    }

    // Update report with analysis results
    const updatedReport = await reportService.updateReportAnalysis(latestReport._id, analysisResults);
    
    res.status(200).json({
      success: true,
      message: 'Latest report analysis completed',
      data: analysisResults
    });

  } catch (error) {
    console.error('Error analyzing latest report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error analyzing latest report', 
      details: error.message 
    });
  }
});

module.exports = router;