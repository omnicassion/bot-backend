// filepath: e:\omni-app\BOT\medical-chatbot\server\services\reportService.js
const Report = require('../models/Report');

// Function to create and store a medical report
const createReport = async (userId, chatHistory, symptoms, diagnosis) => {
  try {
    const report = new Report({
      userId,
      chatHistory,
      symptoms,
      diagnosis,
    });

    await report.save();
    return report;
  } catch (error) {
    throw new Error('Error creating report: ' + error.message);
  }
};

// Function to get reports by user ID
const getReportsByUserId = async (userId) => {
  try {
    const reports = await Report.find({ userId });
    return reports;
  } catch (error) {
    throw new Error('Error fetching reports: ' + error.message);
  }
};

module.exports = {
  createReport,
  getReportsByUserId,
};