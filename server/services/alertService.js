// filepath: e:\omni-app\BOT\server\services\alertService.js
const Alert = require('../models/Alert');

// Function to create an alert based on symptom severity
const createAlert = async (userId, severity, message) => {
  const alert = new Alert({
    userId,
    severity,
    message,
    date: new Date()
  });

  await alert.save();
  return alert;
};

// Function to notify doctors based on alerts
const notifyDoctors = async (alert) => {
  // Logic to notify doctors (e.g., send an email or push notification)
  console.log(`Notifying doctors about alert: ${alert.message}`);
};

// Function to handle alert generation based on symptoms
const handleSymptomAlert = async (userId, symptoms) => {
  // Example logic to determine severity based on symptoms
  let severity;
  if (symptoms.includes('severe')) {
    severity = 'high';
  } else if (symptoms.includes('moderate')) {
    severity = 'medium';
  } else {
    severity = 'low';
  }

  const message = `Alert for user ${userId}: ${severity} severity symptoms detected.`;
  const alert = await createAlert(userId, severity, message);
  await notifyDoctors(alert);
};

module.exports = {
  createAlert,
  notifyDoctors,
  handleSymptomAlert
};