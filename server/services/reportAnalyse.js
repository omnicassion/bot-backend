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
      return res.status(404).json({ error: 'No reports found for this user.' });
    }

    // Get the latest report
    const latestReport = reports[reports.length - 1];

    // Create prompt
    // Create prompt
const prompt = `
You are a highly experienced medical analysis assistant for radiotherapy cases.

Here is a patient report for analysis:
- **Symptoms**: ${(latestReport.symptoms || []).join(', ')}
- **Diagnosis**: ${latestReport.diagnosis || 'Not specified'}
- **Chat Summary**: ${(latestReport.chatHistory || []).map(entry =>
  `Patient: ${entry.user || 'N/A'} | Assistant: ${entry.bot || 'N/A'}`
).join('\n')}

Please:
- Provide a deeper medical insight.
- Suggest areas of concern if any.
- Give tips or red flags to watch for.
- Suggest follow-up care advice.
(Include a disclaimer that this is not a medical diagnosis.)
`;


    // Send to Gemini
    const result = await model.generateContent(prompt);
    const analysis = await result.response.text();

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Error analyzing report:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
