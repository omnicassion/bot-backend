// filepath: medical-chatbot/server/routes/chat.js
const express = require('express');
const router = express.Router();
const chatService = require('../services/chatService');

// Route to handle user chat input
router.post('/message', async (req, res) => {
  try {
    const { userId, message } = req.body;
    const response = await chatService.handleUserMessage(userId, message);
    res.status(200).json(response);
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing chat message');
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

module.exports = router;