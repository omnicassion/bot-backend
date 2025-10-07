const model = require('../config/gemini');
const Report = require('../models/Report');
const fs = require('fs');
const path = require('path');

const chatService = {
  // Load context templates from JSON file
  getContextTemplates() {
    try {
      const contextPath = path.join(__dirname, '../config/contextTemplates.json');
      const contextData = fs.readFileSync(contextPath, 'utf8');
      return JSON.parse(contextData);
    } catch (error) {
      console.error('Error loading context templates:', error);
      // Fallback to basic context if file loading fails
      return {
        "general_medical": {
          name: "General Medical Concerns",
          description: "Handles general health questions and concerns",
          context: "You are a general medical counselor with radiotherapy expertise. Always include a soft medical disclaimer in italics."
        }
      };
    }
  },

  // Helper function to create timeout promise
  createTimeoutPromise(timeoutMs = 15000) {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout: Operation took longer than ${timeoutMs}ms`));
      }, timeoutMs);
    });
  },

  // Helper function to retry API calls with exponential backoff
  async retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  async selectAppropriateContext(message, previousChats) {
    const contexts = this.getContextTemplates();
    const contextOptions = Object.entries(contexts)
      .filter(([key]) => !key.startsWith('_')) // Filter out metadata
      .map(([key, value]) => `${key}: ${value.description}`)
      .join('\n');

    const selectionPrompt = `
You are a context analyzer. Based on the user's message and previous chat history, select the most appropriate context from the available options.

Available contexts:
${contextOptions}

Previous chat history (last 3 exchanges):
${previousChats}

Current user message: "${message}"

Respond with ONLY the context key (e.g., "radiotherapy_side_effects") that best matches the user's query. Choose the most specific and relevant context.
    `;

    try {
      // Use quick response method for context selection
      const result = await model.generateQuickResponse(selectionPrompt);

      const selectedContext = (await result.response.text()).trim();
      
      // Validate the selected context exists and is not metadata
      if (contexts[selectedContext] && !selectedContext.startsWith('_')) {
        return selectedContext;
      } else {
        // Fallback to general medical if selection is invalid
        return 'general_medical';
      }
    } catch (error) {
      console.error('Error selecting context:', error);
      // If context selection fails, use simple keyword matching as fallback
      return this.fallbackContextSelection(message);
    }
  },

  // Fallback context selection using simple keyword matching
  fallbackContextSelection(message) {
    const messageLower = message.toLowerCase();
    
    // Define keyword patterns for each context
    const contextKeywords = {
      'radiotherapy_side_effects': ['side effect', 'tired', 'fatigue', 'skin', 'nausea', 'sick', 'pain', 'sore', 'burn', 'rash'],
      'treatment_information': ['treatment', 'procedure', 'session', 'radiation', 'what happens', 'expect', 'prepare'],
      'emotional_support': ['scared', 'afraid', 'anxious', 'worried', 'depressed', 'fear', 'stress', 'overwhelmed', 'sad'],
      'nutrition_lifestyle': ['eat', 'food', 'diet', 'nutrition', 'weight', 'appetite', 'exercise', 'lifestyle'],
      'appointment_logistics': ['appointment', 'schedule', 'when', 'time', 'location', 'where', 'directions', 'cancel']
    };

    // Find best matching context based on keywords
    let bestMatch = 'general_medical';
    let maxMatches = 0;

    for (const [contextKey, keywords] of Object.entries(contextKeywords)) {
      const matches = keywords.filter(keyword => messageLower.includes(keyword)).length;
      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = contextKey;
      }
    }

    console.log(`Fallback context selection: ${bestMatch} (${maxMatches} keyword matches)`);
    return bestMatch;
  },

  async handleUserMessage(userId, message) {
    const startTime = Date.now();
    
    try {
      console.log(`Starting chat processing for user ${userId} at ${new Date().toISOString()}`);
      
      // Get previous chat history
      const previousReport = await Report.findOne({ userId });

      let previousChats = '';
      if (previousReport && previousReport.chatHistory) {
        const recentChats = previousReport.chatHistory.slice(-5); // last 5 messages
        previousChats = recentChats.map(chat => `User: ${chat.user}\nBot: ${chat.bot}`).join('\n');
      }

      // Select appropriate context with timeout
      console.log('Selecting appropriate context...');
      const selectedContextKey = await this.selectAppropriateContext(message, previousChats);
      const contexts = this.getContextTemplates();
      const selectedContext = contexts[selectedContextKey];

      console.log(`Selected context: ${selectedContextKey}`);

      // Build the complete prompt with selected context
      const fullPrompt = `
${selectedContext.context}

---

Previous conversation context:
${previousChats}

---

Current patient message: "${message}"

Please provide a helpful, compassionate response based on your specialized expertise. Use appropriate headings to organize your response when needed. Keep your response concise but comprehensive.
      `;

      // Generate response using Gemini with enhanced model
      console.log('Generating response with Gemini...');
      const result = await model.generateDetailedResponse(fullPrompt);

      const response = await result.response.text();
      console.log(`Response generated in ${Date.now() - startTime}ms`);

      // Determine severity based on keywords in the response
      const severityLevel = this.determineSeverity(response);
      
      // Create alert if needed (don't wait for it)
      if (['medium', 'high'].includes(severityLevel)) {
        setImmediate(async () => {
          try {
            const Alert = require('../models/Alert');
            await Alert.create({
              userId,
              severity: severityLevel,
              message: response
            });
            console.log(`Alert created for user ${userId} with severity: ${severityLevel}`);
          } catch (alertError) {
            console.error('Error creating alert:', alertError);
          }
        });
      }

      // Save the conversation to database (don't wait for it)
      setImmediate(async () => {
        try {
          await Report.findOneAndUpdate(
            { userId },
            {
              $push: {
                chatHistory: {
                  user: message,
                  bot: response,
                  timestamp: new Date(),
                  severity: severityLevel,
                  contextUsed: selectedContextKey,
                  contextName: selectedContext.name,
                  processingTime: Date.now() - startTime
                }
              }
            },
            { upsert: true }
          );
          console.log(`Chat history saved for user ${userId}`);
        } catch (saveError) {
          console.error('Error saving chat history:', saveError);
        }
      });

      const totalTime = Date.now() - startTime;
      console.log(`Chat processing completed in ${totalTime}ms`);

      return {
        response,
        severity: severityLevel,
        contextUsed: selectedContextKey,
        contextName: selectedContext.name,
        processingTime: totalTime
      };
    } catch (error) {
      const totalTime = Date.now() - startTime;
      console.error(`Chat service error after ${totalTime}ms:`, error);
      
      // Return a fallback response instead of throwing
      if (error.message.includes('timeout')) {
        return {
          response: "I apologize, but I'm experiencing some delays right now. Please try rephrasing your question, and I'll do my best to help you quickly. If this is urgent, please contact your healthcare provider directly.\n\n*This is an automated response due to system delays.*",
          severity: 'low',
          contextUsed: 'general_medical',
          contextName: 'General Medical Concerns',
          processingTime: totalTime,
          error: 'timeout'
        };
      }
      
      // For other errors, provide a generic helpful response
      return {
        response: "I'm sorry, I'm having trouble processing your request right now. Please try again in a moment. If you have urgent medical concerns, please contact your healthcare provider immediately.\n\n*This is an automated response due to a technical issue.*",
        severity: 'low',
        contextUsed: 'general_medical',
        contextName: 'General Medical Concerns',
        processingTime: totalTime,
        error: 'service_error'
      };
    }
  },
  

  determineSeverity(response) {
    const highSeverityKeywords = [
      'emergency',
      'immediate medical attention',
      'urgent',
      'severe',
      'call 911',
      'life-threatening'
    ];

    const mediumSeverityKeywords = [
      'consult',
      'should see a doctor',
      'medical attention',
      'concerning'
    ];

    if (highSeverityKeywords.some(keyword => 
      response.toLowerCase().includes(keyword))) {
      return 'high';
    }
    
    if (mediumSeverityKeywords.some(keyword => 
      response.toLowerCase().includes(keyword))) {
      return 'medium';
    }

    return 'low';
  },

  async getChatHistory(userId) {
    try {
      const report = await Report.findOne({ userId });
      return report ? report.chatHistory : [];
    } catch (error) {
      console.error('Error fetching chat history:', error);
      throw error;
    }
  },

  // Method to get available contexts (useful for API documentation or frontend)
  getAvailableContexts() {
    const contexts = this.getContextTemplates();
    return Object.entries(contexts)
      .filter(([key]) => !key.startsWith('_')) // Filter out metadata
      .map(([key, value]) => ({
        key,
        name: value.name,
        description: value.description,
        keywords: value.keywords || []
      }));
  },

  // Method to get context usage statistics for a user
  async getContextUsageStats(userId) {
    try {
      const report = await Report.findOne({ userId });
      if (!report || !report.chatHistory) {
        return {};
      }

      const contextStats = {};
      report.chatHistory.forEach(chat => {
        if (chat.contextUsed) {
          contextStats[chat.contextUsed] = (contextStats[chat.contextUsed] || 0) + 1;
        }
      });

      return contextStats;
    } catch (error) {
      console.error('Error fetching context usage stats:', error);
      throw error;
    }
  },

  // Method to reload context templates from file (useful for hot updates)
  reloadContextTemplates() {
    try {
      // Clear require cache to force reload
      const contextPath = path.join(__dirname, '../config/contextTemplates.json');
      delete require.cache[require.resolve(contextPath)];
      console.log('Context templates reloaded successfully');
      return true;
    } catch (error) {
      console.error('Error reloading context templates:', error);
      return false;
    }
  },

  // Method to validate context templates JSON structure
  validateContextTemplates() {
    try {
      const contexts = this.getContextTemplates();
      const requiredFields = ['name', 'description', 'context'];
      const validationErrors = [];

      Object.entries(contexts).forEach(([key, value]) => {
        // Skip metadata fields
        if (key.startsWith('_')) return;
        
        requiredFields.forEach(field => {
          if (!value[field]) {
            validationErrors.push(`Context '${key}' is missing required field '${field}'`);
          }
        });
      });

      // Count only actual contexts (not metadata)
      const contextCount = Object.keys(contexts).filter(key => !key.startsWith('_')).length;

      return {
        isValid: validationErrors.length === 0,
        errors: validationErrors,
        contextCount: contextCount
      };
    } catch (error) {
      return {
        isValid: false,
        errors: [error.message],
        contextCount: 0
      };
    }
  }
};

module.exports = chatService;