// routes/report.js
const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const model = require('../config/gemini');

router.get('/generate/:userId', async (req, res) => {
  const { userId } = req.params;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const userReport = await Report.findOne({ userId });

    if (!userReport || !userReport.chatHistory || !userReport.chatHistory.length) {
      return res.status(404).json({ error: 'No chat history found' });
    }

    const history = userReport.chatHistory.map(chat => 
      `Patient: ${chat.user}\nAssistant: ${chat.bot}`
    ).join('\n');

    const prompt = `
You are an AI medical assistant that generates patient reports based on chat history during radiotherapy.

Summarize the patient's condition, symptoms, advice given, and any suggested follow-up. Use bullet points where helpful. Add a friendly closing note too.

Chat History:
${history}
`;

    const result = await model.generateContent(prompt);
    const reportText = await result.response.text();

    res.json({ report: reportText });
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

module.exports = router;
