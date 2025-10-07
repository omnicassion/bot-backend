# Dynamic Context System for Medical Chatbot

## Overview

The chatbot now uses a dynamic context selection system that analyzes user input and selects the most appropriate specialized context for generating responses. This provides more targeted and relevant assistance to patients.

## Available Contexts

### 1. Radiotherapy Side Effects Management (`radiotherapy_side_effects`)
- **Purpose**: Handles questions about side effects of radiation therapy
- **Expertise**: Managing fatigue, skin reactions, nausea, home remedies, self-care tips
- **When selected**: User asks about side effects, reactions, symptoms, management

### 2. Radiotherapy Treatment Information (`treatment_information`)
- **Purpose**: Provides information about radiotherapy procedures and preparation
- **Expertise**: Treatment processes, preparation, what to expect, equipment explanations
- **When selected**: User asks about procedures, preparation, treatment process

### 3. Emotional and Psychological Support (`emotional_support`)
- **Purpose**: Addresses anxiety, fear, and psychological concerns
- **Expertise**: Coping strategies, emotional challenges, family support, stress management
- **When selected**: User expresses anxiety, fear, emotional distress, mental health concerns

### 4. Nutrition and Lifestyle Guidance (`nutrition_lifestyle`)
- **Purpose**: Dietary recommendations and lifestyle modifications
- **Expertise**: Nutrition during treatment, eating difficulties, exercise guidelines
- **When selected**: User asks about diet, nutrition, lifestyle, exercise, eating

### 5. Appointments and Hospital Navigation (`appointment_logistics`)
- **Purpose**: Helps with scheduling and hospital navigation
- **Expertise**: Appointments, hospital locations, required documents, PGIMER protocols
- **When selected**: User asks about appointments, scheduling, hospital navigation, logistics

### 6. General Medical Concerns (`general_medical`)
- **Purpose**: Handles general health questions (fallback context)
- **Expertise**: General health concerns, when to seek help, medical terminology
- **When selected**: Questions don't fit other categories or context selection fails

## How It Works

1. **Input Analysis**: When a user sends a message, Gemini first analyzes the content
2. **Context Selection**: Based on the analysis, the most appropriate context is selected
3. **Response Generation**: The selected context's specialized prompt is used to generate a response
4. **Chat History**: Previous conversations are maintained and considered for context
5. **Tracking**: Each response includes which context was used for analytics

## API Endpoints

### Chat Message
```
POST /api/chat/message
{
  "userId": "user123",
  "message": "I'm feeling tired after my radiation session"
}

Response:
{
  "response": "...",
  "severity": "low",
  "contextUsed": "radiotherapy_side_effects",
  "contextName": "Radiotherapy Side Effects Management"
}
```

### Get Available Contexts
```
GET /api/chat/contexts

Response:
[
  {
    "key": "radiotherapy_side_effects",
    "name": "Radiotherapy Side Effects Management",
    "description": "Handles questions about side effects..."
  },
  ...
]
```

### Get Context Usage Statistics
```
GET /api/chat/context-stats/:userId

Response:
{
  "radiotherapy_side_effects": 5,
  "emotional_support": 3,
  "treatment_information": 2
}
```

### Get Chat History
```
GET /api/chat/history/:userId

Response:
[
  {
    "user": "I'm feeling tired",
    "bot": "Fatigue is common...",
    "timestamp": "2025-10-07T...",
    "severity": "low",
    "contextUsed": "radiotherapy_side_effects",
    "contextName": "Radiotherapy Side Effects Management"
  }
]
```

## Database Schema Updates

The `chatHistory` schema now includes:
- `contextUsed`: The key of the context that was used
- `contextName`: The human-readable name of the context

## Benefits

1. **Specialized Responses**: Each context provides expert-level responses in specific areas
2. **Improved Relevance**: Automatic context selection ensures responses match user needs
3. **Analytics**: Track which contexts are most commonly used
4. **Maintainability**: Easy to add new contexts or modify existing ones
5. **Consistency**: Each context maintains a consistent tone and expertise level

## Future Enhancements

- Add machine learning to improve context selection accuracy
- Implement context switching within conversations
- Add custom contexts for specific patient conditions
- Include confidence scores for context selection