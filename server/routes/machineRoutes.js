const express = require('express');
const router = express.Router();
const Machine = require('../models/machine');

// Create a new machine
router.post('/create', async (req, res) => {
  try {
    const { name } = req.body;
    const machine = new Machine({ name });
    await machine.save();
    res.status(201).json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create machine' });
  }
});

// Get all machines
router.get('/get', async (req, res) => {
  try {
    const machines = await Machine.find();
    res.json(machines);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machines' });
  }
});

// Get single machine
router.get('/:id', async (req, res) => {
  try {
    const machine = await Machine.findById(req.params.id);
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch machine' });
  }
});

// Update machine status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const machine = await Machine.findByIdAndUpdate(
      req.params.id,
      { status, lastUpdated: Date.now() },
      { new: true }
    );
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    res.json(machine);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update machine status' });
  }
});

// Delete a machine
router.delete('/:id', async (req, res) => {
  try {
    const machine = await Machine.findByIdAndDelete(req.params.id);
    if (!machine) return res.status(404).json({ error: 'Machine not found' });
    res.json({ message: 'Machine deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete machine' });
  }
});

module.exports = router;
