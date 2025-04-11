const model = require('../config/gemini');
const Report = require('../models/Report');

const chatService = {
  async handleUserMessage(userId, message) {
    try {
      const previousReport = await Report.findOne({ userId });

let previousChats = '';
if (previousReport && previousReport.chatHistory) {
  const recentChats = previousReport.chatHistory.slice(-5); // last 5 messages
  previousChats = recentChats.map(chat => `User: ${chat.user}\nBot: ${chat.bot}`).join('\n');
}


      // Context for medical chat
     const medicalContext = `
You are an experienced and compassionate radiotherapy counseling assistant.

Your job is to:
- Understand and respond to patients undergoing radiotherapy treatment.
- Offer advice in a warm, conversational tone like a supportive medical counselor.
- When symptoms indicate something concerning, kindly suggest seeking medical help.
- Offer relevant guidance, home remedies, and radiotherapy-related tips.
- Avoid diagnosis. Always include a soft disclaimer.

---

Here are some previous exchanges:
${previousChats}

---

Here is the patient's latest message:
"${message}"
    `;

      // Generate response using Gemini
      const result = await model.generateContent(medicalContext + message);
      const response = await result.response.text();

      // Determine severity based on keywords in the response
      const severityLevel = this.determineSeverity(response);
      if (['medium', 'high'].includes(severityLevel)) {
  const Alert = require('../models/Alert');
  await Alert.create({
    userId,
    severity: severityLevel,
    message: response
  });
}


      // Save the conversation to database
      await Report.findOneAndUpdate(
        { userId },
        {
          $push: {
            chatHistory: {
              user: message,
              bot: response,
              timestamp: new Date(),
              severity: severityLevel
            }
          }
        },
        { upsert: true }
      );

      return {
        response,
        severity: severityLevel
      };
    } catch (error) {
      console.error('Chat service error:', error);
      throw error;
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
  }
};

module.exports = chatService;