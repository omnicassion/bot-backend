const Report = require('../models/Report');
const User = require('../models/User');

// Function to create and store a medical report
const createReport = async (reportData) => {
  try {
    // Handle both old format (individual parameters) and new format (object)
    let reportParams;
    if (typeof reportData === 'object' && reportData !== null && !Array.isArray(reportData)) {
      reportParams = reportData;
    } else {
      // Legacy support for individual parameters
      const [userId, chatHistory, symptoms, diagnosis] = arguments;
      reportParams = { userId, chatHistory, symptoms, diagnosis };
    }

    // Try to find and link the user by username
    if (reportParams.userId) {
      const user = await User.findOne({ username: reportParams.userId });
      if (user) {
        reportParams.user = user._id;
      }
    }

    const report = new Report(reportParams);
    await report.save();
    
    // Populate user data before returning
    await report.populate('user', 'username email role');
    return report;
  } catch (error) {
    throw new Error('Error creating report: ' + error.message);
  }
};

// Function to get all reports
const getAllReports = async () => {
  try {
    const reports = await Report.find()
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });
    return reports;
  } catch (error) {
    throw new Error('Error fetching all reports: ' + error.message);
  }
};

// Function to get reports by user ID
const getReportsByUserId = async (userId) => {
  try {
    const reports = await Report.find({ userId })
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });
    return reports;
  } catch (error) {
    throw new Error('Error fetching reports by user ID: ' + error.message);
  }
};

// Function to get a report by ID
const getReportById = async (reportId) => {
  try {
    const report = await Report.findById(reportId)
      .populate('user', 'username email role');
    return report;
  } catch (error) {
    throw new Error('Error fetching report by ID: ' + error.message);
  }
};

// Function to update a report
const updateReport = async (reportId, updateData) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(
      reportId, 
      { ...updateData, updatedAt: Date.now() }, 
      { new: true, runValidators: true }
    );
    return updatedReport;
  } catch (error) {
    throw new Error('Error updating report: ' + error.message);
  }
};

// Function to delete a report
const deleteReport = async (reportId) => {
  try {
    const deletedReport = await Report.findByIdAndDelete(reportId);
    return deletedReport;
  } catch (error) {
    throw new Error('Error deleting report: ' + error.message);
  }
};

// Function to add chat entry to existing report
const addChatToReport = async (userId, chatEntry) => {
  try {
    const report = await Report.findOne({ userId });
    if (!report) {
      // Create new report if none exists
      const newReport = new Report({
        userId,
        chatHistory: [chatEntry]
      });
      await newReport.save();
      return newReport;
    }
    
    report.chatHistory.push(chatEntry);
    await report.save();
    return report;
  } catch (error) {
    throw new Error('Error adding chat to report: ' + error.message);
  }
};

// Function to get reports by status
const getReportsByStatus = async (status) => {
  try {
    const reports = await Report.find({ status })
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });
    return reports;
  } catch (error) {
    throw new Error('Error fetching reports by status: ' + error.message);
  }
};

// Function to get reports by priority
const getReportsByPriority = async (priority) => {
  try {
    const reports = await Report.find({ priority })
      .populate('user', 'username email role')
      .sort({ createdAt: -1 });
    return reports;
  } catch (error) {
    throw new Error('Error fetching reports by priority: ' + error.message);
  }
};

// Function to update report analysis results
const updateReportAnalysis = async (reportId, analysisResults) => {
  try {
    const updatedReport = await Report.findByIdAndUpdate(
      reportId,
      { analysisResults, updatedAt: Date.now() },
      { new: true }
    ).populate('user', 'username email role');
    return updatedReport;
  } catch (error) {
    throw new Error('Error updating report analysis: ' + error.message);
  }
};

module.exports = {
  createReport,
  getAllReports,
  getReportsByUserId,
  getReportById,
  updateReport,
  deleteReport,
  addChatToReport,
  getReportsByStatus,
  getReportsByPriority,
  updateReportAnalysis
};