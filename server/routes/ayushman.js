const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get Ayushman card information for a user
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ username: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const ayushmanCard = user.ayushmanCard || {
      hasCard: false,
      totalCoverageAmount: 500000,
      amountUsed: 0,
      amountRemaining: 500000
    };

    res.status(200).json({
      success: true,
      data: ayushmanCard
    });
  } catch (error) {
    console.error('Error fetching Ayushman card info:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching Ayushman card information'
    });
  }
});

// Update Ayushman card information
router.put('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { hasCard, cardNumber, amountUsed, totalCoverageAmount } = req.body;
    
    const updateData = {
      'ayushmanCard.lastUpdated': new Date()
    };

    if (hasCard !== undefined) {
      updateData['ayushmanCard.hasCard'] = hasCard;
    }

    if (cardNumber !== undefined) {
      updateData['ayushmanCard.cardNumber'] = cardNumber;
    }

    if (totalCoverageAmount !== undefined) {
      updateData['ayushmanCard.totalCoverageAmount'] = totalCoverageAmount;
    }

    if (amountUsed !== undefined) {
      updateData['ayushmanCard.amountUsed'] = amountUsed;
      const coverage = totalCoverageAmount || 500000;
      updateData['ayushmanCard.amountRemaining'] = coverage - amountUsed;
    }

    const user = await User.findOneAndUpdate(
      { username: userId },
      updateData,
      { new: true, upsert: false }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Ayushman card information updated',
      data: user.ayushmanCard
    });
  } catch (error) {
    console.error('Error updating Ayushman card info:', error);
    res.status(500).json({
      success: false,
      error: 'Error updating Ayushman card information'
    });
  }
});

// Add usage history entry
router.post('/:userId/usage', async (req, res) => {
  try {
    const { userId } = req.params;
    const { description, amountUsed, hospital } = req.body;

    if (!amountUsed || amountUsed <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid amount is required'
      });
    }

    const user = await User.findOne({ username: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Add to usage history
    if (!user.ayushmanCard) {
      user.ayushmanCard = {
        hasCard: true,
        totalCoverageAmount: 500000,
        amountUsed: 0,
        amountRemaining: 500000,
        usageHistory: []
      };
    }

    const newUsage = {
      date: new Date(),
      description: description || 'Medical treatment',
      amountUsed: amountUsed,
      hospital: hospital || 'PGIMER Chandigarh'
    };

    user.ayushmanCard.usageHistory.push(newUsage);
    user.ayushmanCard.amountUsed += amountUsed;
    user.ayushmanCard.amountRemaining = user.ayushmanCard.totalCoverageAmount - user.ayushmanCard.amountUsed;
    user.ayushmanCard.lastUpdated = new Date();

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Usage history updated',
      data: {
        newUsage,
        totalUsed: user.ayushmanCard.amountUsed,
        remaining: user.ayushmanCard.amountRemaining
      }
    });
  } catch (error) {
    console.error('Error adding usage history:', error);
    res.status(500).json({
      success: false,
      error: 'Error adding usage history'
    });
  }
});

// Get usage history
router.get('/:userId/usage', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ username: userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const usageHistory = user.ayushmanCard?.usageHistory || [];

    res.status(200).json({
      success: true,
      data: usageHistory
    });
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching usage history'
    });
  }
});

// Get Ayushman card statistics (for admin/doctors)
router.get('/stats/all', async (req, res) => {
  try {
    const users = await User.find({ 'ayushmanCard.hasCard': true });
    
    const stats = {
      totalUsersWithCard: users.length,
      totalAmountUsed: 0,
      totalAmountRemaining: 0,
      averageUsage: 0,
      usageDistribution: {
        none: 0,
        low: 0,      // 0-25%
        medium: 0,   // 25-50%
        high: 0,     // 50-75%
        veryHigh: 0  // 75-100%
      }
    };

    users.forEach(user => {
      const card = user.ayushmanCard;
      stats.totalAmountUsed += card.amountUsed || 0;
      stats.totalAmountRemaining += card.amountRemaining || 500000;
      
      const usagePercent = ((card.amountUsed || 0) / (card.totalCoverageAmount || 500000)) * 100;
      
      if (usagePercent === 0) stats.usageDistribution.none++;
      else if (usagePercent <= 25) stats.usageDistribution.low++;
      else if (usagePercent <= 50) stats.usageDistribution.medium++;
      else if (usagePercent <= 75) stats.usageDistribution.high++;
      else stats.usageDistribution.veryHigh++;
    });

    if (users.length > 0) {
      stats.averageUsage = stats.totalAmountUsed / users.length;
    }

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching Ayushman stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error fetching statistics'
    });
  }
});

module.exports = router;
