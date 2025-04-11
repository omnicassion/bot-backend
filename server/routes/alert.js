// routes/alertRoutes.js
const express = require('express');
const router = express.Router();
const Alert = require('../models/Alert');

router.get('/:userId', async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.params.userId }).sort({ date: -1 });
    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch alerts' });
  }
});

module.exports = router;
