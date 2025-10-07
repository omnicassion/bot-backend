// Example usage of the new dynamic context system

// Example 1: User asks about side effects
const userMessage1 = "I'm experiencing fatigue and skin irritation after my radiation treatment. What can I do?";
// Expected context selection: "radiotherapy_side_effects"
// Response will be specialized for managing side effects

// Example 2: User asks about treatment procedure
const userMessage2 = "What should I expect during my first radiotherapy session tomorrow?";
// Expected context selection: "treatment_information"
// Response will focus on procedure explanation and preparation

// Example 3: User expresses emotional distress
const userMessage3 = "I'm really scared about my cancer treatment and feeling overwhelmed.";
// Expected context selection: "emotional_support"
// Response will provide emotional support and coping strategies

// Example 4: User asks about diet
const userMessage4 = "What foods should I eat during my radiation treatment?";
// Expected context selection: "nutrition_lifestyle"
// Response will focus on dietary recommendations

// Example 5: User asks about appointments
const userMessage5 = "How do I reschedule my appointment at PGIMER?";
// Expected context selection: "appointment_logistics"
// Response will help with scheduling and hospital navigation

// Testing the API:
/*
POST /api/chat/message
{
  "userId": "test123",
  "message": "I'm feeling very tired after my treatment"
}

Expected Response:
{
  "response": "Fatigue is one of the most common side effects...",
  "severity": "low",
  "contextUsed": "radiotherapy_side_effects",
  "contextName": "Radiotherapy Side Effects Management"
}
*/

// GET /api/chat/contexts
// Returns all available contexts with their descriptions

// GET /api/chat/context-stats/test123
// Returns usage statistics showing which contexts are used most frequently