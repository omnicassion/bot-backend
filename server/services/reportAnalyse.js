const express = require('express');
const router = express.Router();
const reportService = require('../services/reportService');
const model = require('../config/gemini'); // Your Gemini setup

// Analyze the latest report of a user
router.get('/analyze/:userId', async (req, res) => {
  const { userId } = req.params;

  try {
    // Fetch all reports
    const reports = await reportService.getReportsByUserId(userId);
    if (!reports || reports.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'No reports found for this user.' 
      });
    }

    // Get the latest report
    const latestReport = reports[0]; // Since we sort by createdAt desc, first is latest
    if (!latestReport) {
      return res.status(404).json({ 
        success: false, 
        error: 'No report data found for this user.' 
      });
    }

    // Create comprehensive prompt
    const prompt = `
You are a highly experienced medical analysis assistant for radiotherapy cases.

Here is a patient report for analysis:
- **Report ID**: ${latestReport._id}
- **User ID**: ${latestReport.userId}
- **Report Status**: ${latestReport.status || 'Not specified'}
- **Priority Level**: ${latestReport.priority || 'Not specified'}
- **Symptoms**: ${(latestReport.symptoms || []).join(', ') || 'Not specified'}
- **Diagnosis**: ${latestReport.diagnosis || 'Not specified'}
- **Created Date**: ${latestReport.createdAt ? new Date(latestReport.createdAt).toLocaleDateString() : 'Not specified'}
- **Chat History Summary**: 
${(latestReport.chatHistory || []).map((entry, index) =>
  `  ${index + 1}. Patient: "${entry.user || 'N/A'}" | Assistant: "${entry.bot || 'N/A'}" | Severity: ${entry.severity || 'low'} | Time: ${entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}`
).join('\n') || 'No chat history available'}

- **Additional Notes**: ${latestReport.notes || 'None'}

Please provide a comprehensive medical analysis including:
1. **Medical Insights**: Deeper analysis based on symptoms and diagnosis
2. **Risk Assessment**: Areas of concern and risk factors
3. **Red Flags**: Warning signs to monitor
4. **Follow-up Recommendations**: Suggested care and monitoring
5. **Treatment Considerations**: Potential treatment adjustments
6. **Quality of Life**: Impact and improvement suggestions

**IMPORTANT DISCLAIMER**: This analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment recommendations. Always consult with qualified healthcare professionals for medical decisions.
`;

    // Send to Gemini
    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();

    // Save the analysis results back to the report
    await reportService.updateReportAnalysis(latestReport._id, analysis);

    res.status(200).json({ 
      success: true,
      data: {
        reportId: latestReport._id,
        userId: userId,
        analysis: analysis,
        analysisDate: new Date(),
        reportStatus: latestReport.status,
        reportPriority: latestReport.priority
      }
    });
  } catch (error) {
    console.error('Error analyzing report:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error analyzing report', 
      details: error.message 
    });
  }
});

// Analyze a specific report by ID
router.get('/analyze/report/:reportId', async (req, res) => {
  const { reportId } = req.params;

  try {
    // Fetch specific report
    const report = await reportService.getReportById(reportId);
    if (!report) {
      return res.status(404).json({ 
        success: false, 
        error: 'Report not found.' 
      });
    }

    // Create comprehensive prompt for specific report
    const prompt = `
You are a highly experienced medical analysis assistant for radiotherapy cases.

Here is a specific patient report for analysis:
- **Report ID**: ${report._id}
- **User ID**: ${report.userId}
- **Report Status**: ${report.status || 'Not specified'}
- **Priority Level**: ${report.priority || 'Not specified'}
- **Symptoms**: ${(report.symptoms || []).join(', ') || 'Not specified'}
- **Diagnosis**: ${report.diagnosis || 'Not specified'}
- **Created Date**: ${report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Not specified'}
- **Last Updated**: ${report.updatedAt ? new Date(report.updatedAt).toLocaleDateString() : 'Not specified'}
- **Chat History Summary**: 
${(report.chatHistory || []).map((entry, index) =>
  `  ${index + 1}. Patient: "${entry.user || 'N/A'}" | Assistant: "${entry.bot || 'N/A'}" | Severity: ${entry.severity || 'low'} | Context: ${entry.contextName || 'General'} | Time: ${entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'N/A'}`
).join('\n') || 'No chat history available'}

- **Additional Notes**: ${report.notes || 'None'}
- **Previous Analysis**: ${report.analysisResults || 'None'}

Please provide a comprehensive medical analysis including:
1. **Medical Insights**: Deeper analysis based on symptoms and diagnosis
2. **Risk Assessment**: Areas of concern and risk factors
3. **Red Flags**: Warning signs to monitor
4. **Follow-up Recommendations**: Suggested care and monitoring
5. **Treatment Considerations**: Potential treatment adjustments
6. **Quality of Life**: Impact and improvement suggestions
7. **Progress Evaluation**: If there's previous analysis, compare and evaluate progress

**IMPORTANT DISCLAIMER**: This analysis is for informational purposes only and does not constitute medical advice, diagnosis, or treatment recommendations. Always consult with qualified healthcare professionals for medical decisions.
`;

    // Send to Gemini
    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();

    // Save the analysis results back to the report
    const updatedReport = await reportService.updateReportAnalysis(report._id, analysis);

    res.status(200).json({ 
      success: true,
      data: {
        reportId: report._id,
        userId: report.userId,
        analysis: analysis,
        analysisDate: new Date(),
        reportStatus: updatedReport.status,
        reportPriority: updatedReport.priority,
        updatedReport: updatedReport
      }
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

module.exports = router;
