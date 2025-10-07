// filepath: medical-chatbot/server/routes/chat.js
const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// Route to handle user chat input
router.post('/message', async (req, res) => {
  const startTime = Date.now();
  
  try {
    const { userId, message } = req.body;
    
    // Input validation
    if (!userId || !message) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Both userId and message are required',
        required: ['userId', 'message']
      });
    }

    if (typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        error: 'Invalid message',
        message: 'Message must be a non-empty string'
      });
    }

    if (message.length > 2000) {
      return res.status(400).json({
        error: 'Message too long',
        message: 'Message must be less than 2000 characters',
        currentLength: message.length,
        maxLength: 2000
      });
    }

    console.log(`Processing chat message for user ${userId}: "${message.substring(0, 100)}..."`);
    
    const response = await chatService.handleUserMessage(userId, message.trim());
    
    // Add processing time to response
    response.serverProcessingTime = Date.now() - startTime;
    
    res.status(200).json(response);
    
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`Chat message error after ${processingTime}ms:`, error);
    
    // Handle specific error types
    if (error.message && error.message.includes('timeout')) {
      return res.status(408).json({
        error: 'Request Timeout',
        message: 'Your message took too long to process. Please try again with a shorter message.',
        processingTime,
        suggestion: 'Try breaking your question into smaller parts or rephrasing it.'
      });
    }

    if (error.message && error.message.includes('rate limit')) {
      return res.status(429).json({
        error: 'Rate Limited',
        message: 'Too many requests. Please wait a moment before sending another message.',
        processingTime
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Chat Processing Error',
      message: 'I apologize, but I\'m having trouble processing your message right now. Please try again in a moment.',
      processingTime,
      suggestion: 'If this persists, try rephrasing your question or contact support.'
    });
  }
});

// Route to get chat history for a user
router.get('/history/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const chatHistory = await chatService.getChatHistory(userId);
    res.status(200).json(chatHistory);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving chat history');
  }
});

// Route to get available contexts
router.get('/contexts', async (req, res) => {
  try {
    const contexts = chatService.getAvailableContexts();
    res.status(200).json(contexts);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving available contexts');
  }
});

// Route to get context usage statistics for a user
router.get('/context-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await chatService.getContextUsageStats(userId);
    res.status(200).json(stats);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error retrieving context usage statistics');
  }
});

// Route to reload context templates from file
router.post('/reload-contexts', async (req, res) => {
  try {
    const success = chatService.reloadContextTemplates();
    if (success) {
      res.status(200).json({ message: 'Context templates reloaded successfully' });
    } else {
      res.status(500).json({ error: 'Failed to reload context templates' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error reloading context templates');
  }
});

// Route to validate context templates
router.get('/validate-contexts', async (req, res) => {
  try {
    const validation = chatService.validateContextTemplates();
    res.status(200).json(validation);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error validating context templates');
  }
});

module.exports = router;