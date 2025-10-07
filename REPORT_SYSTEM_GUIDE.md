# Report System Usage Examples

## Overview
The improved report system now provides comprehensive handling of medical reports with proper validation, analysis, and management capabilities.

## Report Structure

```javascript
{
  _id: "ObjectId",
  userId: "string", // Required
  chatHistory: [
    {
      user: "string", // Required
      bot: "string", // Required
      timestamp: "Date",
      severity: "low|medium|high",
      contextUsed: "string",
      contextName: "string"
    }
  ],
  symptoms: ["array of strings"],
  diagnosis: "string",
  status: "draft|completed|reviewed|archived",
  priority: "low|medium|high|urgent",
  notes: "string",
  analysisResults: "string",
  createdAt: "Date",
  updatedAt: "Date"
}
```

## API Endpoints

### 1. Create a New Report
```
POST /api/reports
Content-Type: application/json

{
  "userId": "user123",
  "symptoms": ["headache", "nausea", "fatigue"],
  "diagnosis": "Post-radiation syndrome",
  "status": "draft",
  "priority": "medium",
  "chatHistory": [
    {
      "user": "I've been experiencing severe headaches",
      "bot": "I understand you're experiencing headaches. Can you describe the intensity?",
      "severity": "medium",
      "contextName": "Symptom Assessment"
    }
  ]
}
```

### 2. Get All Reports (with filtering)
```
GET /api/reports
GET /api/reports?status=completed
GET /api/reports?priority=high
GET /api/reports?userId=user123
```

### 3. Get Specific Report
```
GET /api/reports/:reportId
```

### 4. Update Report
```
PUT /api/reports/:reportId
Content-Type: application/json

{
  "status": "completed",
  "notes": "Patient responding well to treatment"
}
```

### 5. Add Chat Entry to Report
```
POST /api/reports/:userId/chat
Content-Type: application/json

{
  "user": "The medication seems to be helping",
  "bot": "That's great to hear! Continue monitoring your symptoms",
  "severity": "low",
  "contextName": "Follow-up"
}
```

### 6. Analyze Report (Latest for User)
```
GET /api/reports/analyze/:userId
```

### 7. Analyze Specific Report
```
GET /api/reports/analyze/report/:reportId
```

### 8. Update Analysis Results
```
PUT /api/reports/:reportId/analysis
Content-Type: application/json

{
  "analysisResults": "Detailed AI analysis results..."
}
```

### 9. Get Report Summary
```
GET /api/reports/:reportId/summary
```

### 10. Bulk Report Summaries
```
GET /api/reports/summaries/bulk
GET /api/reports/summaries/bulk?status=completed&limit=20
```

## Usage in Chat Service

To integrate with the chat service, update your chat handlers to automatically create/update reports:

```javascript
// In your chat service
const reportService = require('./reportService');

const handleChatMessage = async (userId, userMessage, botResponse, severity = 'low', contextInfo = {}) => {
  try {
    const chatEntry = {
      user: userMessage,
      bot: botResponse,
      severity: severity,
      contextUsed: contextInfo.key,
      contextName: contextInfo.name,
      timestamp: new Date()
    };

    // Add chat to existing report or create new one
    await reportService.addChatToReport(userId, chatEntry);
    
    // If high severity, update report priority
    if (severity === 'high') {
      const reports = await reportService.getReportsByUserId(userId);
      if (reports.length > 0) {
        const latestReport = reports[0];
        await reportService.updateReport(latestReport._id, { 
          priority: 'high',
          status: 'completed' // Mark for review
        });
      }
    }
  } catch (error) {
    console.error('Error updating report with chat:', error);
  }
};
```

## Response Format

All API responses follow this consistent format:

```javascript
// Success Response
{
  "success": true,
  "message": "Operation completed successfully", // Optional
  "data": { /* result data */ },
  "count": 10 // For arrays
}

// Error Response
{
  "success": false,
  "error": "Brief error description",
  "details": "Detailed error information" // Optional
}
```

## Validation Rules

1. **userId**: Required string for all reports
2. **chatHistory**: Array of objects with required `user` and `bot` fields
3. **symptoms**: Array of strings
4. **status**: Must be one of: draft, completed, reviewed, archived
5. **priority**: Must be one of: low, medium, high, urgent
6. **severity** (in chat): Must be one of: low, medium, high
7. **ObjectId**: All ID parameters are validated for proper MongoDB ObjectId format

## Error Handling

The system provides comprehensive error handling with detailed error messages and proper HTTP status codes:

- **400**: Validation errors, malformed requests
- **404**: Resource not found
- **500**: Server errors with detailed logging

## Performance Considerations

1. Reports are sorted by `createdAt` in descending order (newest first)
2. Bulk operations include count limits to prevent performance issues
3. Analysis results are cached in the report document
4. Indexes should be created on frequently queried fields (userId, status, priority, createdAt)

## Security Notes

1. All input data is sanitized before processing
2. ObjectId validation prevents injection attacks
3. Proper error handling prevents information leakage
4. Consider adding authentication middleware for production use