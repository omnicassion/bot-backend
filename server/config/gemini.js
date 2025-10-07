const { GoogleGenerativeAI } = require("@google/generative-ai");

// Use environment variable for API key with fallback
const apiKey = process.env.GEMINI_API_KEY || "AIzaSyB-gl96HjvIRNiuSIe-R1gL2HxnjQgpTvo";

const genAI = new GoogleGenerativeAI(apiKey);

// Enhanced model configuration for better performance and reliability
const model = genAI.getGenerativeModel({ 
  model: "gemini-2.0-flash",
  generationConfig: {
    temperature: 0.7,        // Balanced creativity vs consistency
    topK: 40,               // Limit token selection for more focused responses
    topP: 0.95,             // Nucleus sampling for coherent responses
    maxOutputTokens: 2048,  // Limit response length for faster processing
    stopSequences: [],      // Add stop sequences if needed
  },
  safetySettings: [
    {
      category: "HARM_CATEGORY_HARASSMENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_HATE_SPEECH", 
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
    {
      category: "HARM_CATEGORY_DANGEROUS_CONTENT",
      threshold: "BLOCK_MEDIUM_AND_ABOVE",
    },
  ],
});

// Enhanced model wrapper with timeout and error handling
const enhancedModel = {
  async generateContent(prompt, options = {}) {
    const {
      timeout = 20000, // 20 second default timeout
      retries = 2,
      temperature,
      maxOutputTokens
    } = options;

    // Create custom generation config if options provided
    let customConfig = {};
    if (temperature !== undefined || maxOutputTokens !== undefined) {
      customConfig = {
        ...model.generationConfig,
        ...(temperature !== undefined && { temperature }),
        ...(maxOutputTokens !== undefined && { maxOutputTokens })
      };
    }

    const generateWithTimeout = async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        let result;
        if (Object.keys(customConfig).length > 0) {
          // Use custom config if provided
          const customModel = genAI.getGenerativeModel({
            model: "gemini-2.0-flash",
            generationConfig: customConfig,
            safetySettings: model.safetySettings
          });
          result = await customModel.generateContent(prompt);
        } else {
          result = await model.generateContent(prompt);
        }
        
        clearTimeout(timeoutId);
        return result;
      } catch (error) {
        clearTimeout(timeoutId);
        if (error.name === 'AbortError') {
          throw new Error(`Gemini API timeout after ${timeout}ms`);
        }
        throw error;
      }
    };

    // Retry logic
    for (let attempt = 1; attempt <= retries + 1; attempt++) {
      try {
        return await generateWithTimeout();
      } catch (error) {
        if (attempt === retries + 1) {
          console.error(`Gemini API failed after ${retries + 1} attempts:`, error.message);
          throw error;
        }
        
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Max 5s delay
        console.warn(`Gemini API attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  },

  // Shortcut method for quick responses (shorter timeout, fewer tokens)
  async generateQuickResponse(prompt) {
    return this.generateContent(prompt, {
      timeout: 10000,
      maxOutputTokens: 1024,
      temperature: 0.5
    });
  },

  // Method for detailed responses (longer timeout, more tokens)
  async generateDetailedResponse(prompt) {
    return this.generateContent(prompt, {
      timeout: 30000,
      maxOutputTokens: 3072,
      temperature: 0.8
    });
  }
};

module.exports = enhancedModel;