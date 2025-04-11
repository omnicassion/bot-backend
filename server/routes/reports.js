const express = require('express');
const router = express.Router();
const Report = require('../models/Report');
const reportService = require('../services/reportService');

// Create a new report
router.post('/', async (req, res) => {
  try {
    const reportData = req.body;
    const report = await reportService.createReport(reportData);
    res.status(201).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error creating report');
  }
});

// Get all reports
router.get('/', async (req, res) => {
  try {
    const reports = await reportService.getAllReports();
    res.status(200).json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching reports');
  }
});

// Get a report by ID
router.get('/:id', async (req, res) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    if (!report) {
      return res.status(404).send('Report not found');
    }
    res.status(200).json(report);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error fetching report');
  }
});

// Update a report by ID
router.put('/:id', async (req, res) => {
  try {
    const updatedReport = await reportService.updateReport(req.params.id, req.body);
    if (!updatedReport) {
      return res.status(404).send('Report not found');
    }
    res.status(200).json(updatedReport);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error updating report');
  }
});

// Delete a report by ID
router.delete('/:id', async (req, res) => {
  try {
    const deletedReport = await reportService.deleteReport(req.params.id);
    if (!deletedReport) {
      return res.status(404).send('Report not found');
    }
    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error deleting report');
  }
});

module.exports = router;