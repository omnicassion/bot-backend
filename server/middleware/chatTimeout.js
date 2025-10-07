/**
 * Chat Timeout Middleware
 * Handles long-running chat requests with proper timeout management
 */

const chatTimeoutMiddleware = (req, res, next) => {
  // Only apply to chat message endpoints
  if (req.path.includes('/chat/message') && req.method === 'POST') {
    
    // Set longer timeout for chat requests
    const CHAT_TIMEOUT = 60000; // 60 seconds
    
    // Track request start time
    req.startTime = Date.now();
    
    // Set request timeout
    req.setTimeout(CHAT_TIMEOUT, () => {
      if (!res.headersSent) {
        console.log(`Chat request timeout after ${CHAT_TIMEOUT}ms for user: ${req.body?.userId}`);
        
        res.status(408).json({
          error: 'Chat Request Timeout',
          message: 'Your message is taking longer than expected to process. Please try again with a shorter message.',
          suggestion: 'If this continues, try breaking your question into smaller parts.',
          timeout: CHAT_TIMEOUT,
          processingTime: Date.now() - req.startTime
        });
      }
    });

    // Set response timeout
    res.setTimeout(CHAT_TIMEOUT, () => {
      if (!res.headersSent) {
        console.log(`Chat response timeout after ${CHAT_TIMEOUT}ms for user: ${req.body?.userId}`);
        
        res.status(408).json({
          error: 'Chat Response Timeout',
          message: 'I apologize, but your request is taking longer than expected to process. This might be due to high server load.',
          suggestion: 'Please try again in a moment. If urgent, contact your healthcare provider directly.',
          fallbackResponse: 'I\'m here to help with your medical questions. Please try rephrasing your question in a simpler way.',
          timeout: CHAT_TIMEOUT,
          processingTime: Date.now() - req.startTime
        });
      }
    });

    // Add timeout warning for long requests
    const warningTimeout = setTimeout(() => {
      if (!res.headersSent) {
        console.warn(`Chat request taking longer than expected (${CHAT_TIMEOUT / 2}ms) for user: ${req.body?.userId}`);
      }
    }, CHAT_TIMEOUT / 2);

    // Clean up warning timeout when response is sent
    const originalSend = res.send;
    res.send = function(data) {
      clearTimeout(warningTimeout);
      const processingTime = Date.now() - req.startTime;
      
      if (processingTime > 10000) { // Log slow requests
        console.log(`Slow chat request completed in ${processingTime}ms for user: ${req.body?.userId}`);
      }
      
      return originalSend.call(this, data);
    };
  }
  
  next();
};

module.exports = chatTimeoutMiddleware;