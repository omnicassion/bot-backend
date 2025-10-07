/**
 * Test Examples for the Separated Context Template System
 * 
 * This file demonstrates how the new JSON-based context system works
 */

// Test the API endpoints

// 1. Test normal chat message
const testChatMessage = {
  method: 'POST',
  url: '/api/chat/message',
  body: {
    userId: 'testUser123',
    message: 'I am feeling very tired after my radiation treatment yesterday'
  }
};

// Expected response:
/*
{
  "response": "Fatigue is one of the most common side effects of radiation therapy...",
  "severity": "low",
  "contextUsed": "radiotherapy_side_effects",
  "contextName": "Radiotherapy Side Effects Management"
}
*/

// 2. Test getting available contexts
const testGetContexts = {
  method: 'GET',
  url: '/api/chat/contexts'
};

// Expected response:
/*
[
  {
    "key": "radiotherapy_side_effects",
    "name": "Radiotherapy Side Effects Management",
    "description": "Handles questions about side effects...",
    "keywords": ["side effects", "fatigue", "skin reactions", "nausea", "symptoms"]
  },
  ...
]
*/

// 3. Test context validation
const testValidateContexts = {
  method: 'GET',
  url: '/api/chat/validate-contexts'
};

// Expected response:
/*
{
  "isValid": true,
  "errors": [],
  "contextCount": 6
}
*/

// 4. Test reloading contexts (useful after editing JSON file)
const testReloadContexts = {
  method: 'POST',
  url: '/api/chat/reload-contexts'
};

// Expected response:
/*
{
  "message": "Context templates reloaded successfully"
}
*/

// 5. Test different types of messages and expected context selection

const testMessages = [
  {
    message: "I'm scared about my treatment tomorrow",
    expectedContext: "emotional_support"
  },
  {
    message: "What should I eat during my radiation treatment?",
    expectedContext: "nutrition_lifestyle"
  },
  {
    message: "How do I reschedule my appointment?",
    expectedContext: "appointment_logistics"
  },
  {
    message: "What happens during a radiation session?",
    expectedContext: "treatment_information"
  },
  {
    message: "My skin is red and itchy",
    expectedContext: "radiotherapy_side_effects"
  },
  {
    message: "I have general questions about my health",
    expectedContext: "general_medical"
  }
];

// Testing the context manager script
console.log(`
🧪 Testing Context Template System

1. Validate contexts:
   node server/scripts/contextManager.js validate

2. List all contexts:
   node server/scripts/contextManager.js list

3. Add a new context:
   node server/scripts/contextManager.js add emergency_care

4. Create backup:
   node server/scripts/contextManager.js backup

5. Test the API endpoints using the examples above
`);

// File structure after implementation:
/*
server/
├── config/
│   ├── contextTemplates.json    ← NEW: Context templates separated
│   ├── db.js
│   └── gemini.js
├── scripts/
│   └── contextManager.js        ← NEW: Context management script
├── services/
│   └── chatService.js           ← UPDATED: Now reads from JSON file
└── routes/
    └── chat.js                  ← UPDATED: Added new endpoints
*/

module.exports = {
  testChatMessage,
  testGetContexts,
  testValidateContexts,
  testReloadContexts,
  testMessages
};