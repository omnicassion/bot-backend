# Ayushman Card Follow-Up System - Complete Guide

## Overview
This feature adds intelligent follow-up questions to collect Ayushman Bharat (PM-JAY) card information from users. When users ask about insurance, coverage, or financial assistance, the bot automatically initiates a conversation flow to gather their Ayushman card details.

## Features

### 1. **Automatic Detection**
- Detects when users ask about Ayushman card, insurance, or financial assistance
- Keywords trigger: `ayushman`, `pm-jay`, `pmjay`, `insurance`, `scheme`, `card`, `coverage`, `financial help`

### 2. **Follow-Up Question Flow**
```
User asks about Ayushman → Bot responds with information
                         ↓
              "Do you have an Ayushman card?"
                         ↓
              ┌─────────┴─────────┐
              ↓                   ↓
             YES                 NO
              ↓                   ↓
   "How much have you used?"   Provides application info
              ↓
   Shows coverage summary
   & available balance
```

### 3. **Data Collected**
- **Has Card**: Whether user possesses Ayushman Bharat card
- **Amount Used**: Total coverage utilized (₹)
- **Amount Remaining**: Balance available (₹)
- **Coverage Summary**: Detailed breakdown of usage

## Database Schema

### User Model Addition
```javascript
ayushmanCard: {
  hasCard: Boolean,              // Whether user has the card
  cardNumber: String,            // Card number (optional)
  totalCoverageAmount: Number,   // Default: ₹5,00,000
  amountUsed: Number,            // Amount utilized
  amountRemaining: Number,       // Balance remaining
  lastUpdated: Date,             // Last update timestamp
  usageHistory: [{               // Historical usage tracking
    date: Date,
    description: String,
    amountUsed: Number,
    hospital: String
  }]
}
```

### Report Model Addition
```javascript
pendingFollowUp: String,         // Current follow-up state
                                // Values: 'ayushman_has_card', 
                                //         'ayushman_amount_used', null
followUpData: Object            // Temporary storage for responses
```

## Context Template

### New Context: `ayushman_card_insurance`
```json
{
  "name": "Ayushman Bharat Insurance Support",
  "description": "Provides information about Ayushman card coverage and claims",
  "keywords": ["ayushman", "insurance", "card", "coverage", "money", "cost"],
  "context": "Expert counselor for Ayushman Bharat scheme..."
}
```

**Coverage Details:**
- Total Coverage: ₹5,00,000 per family per year
- Covers: Hospitalization, medicines, diagnostics, treatment
- Type: Cashless and paperless at empanelled hospitals
- Includes: Pre and post-hospitalization expenses

## API Endpoints

### 1. Get Ayushman Card Info
```
GET /api/ayushman/:userId
```
**Response:**
```json
{
  "success": true,
  "data": {
    "hasCard": true,
    "cardNumber": "XXXX-XXXX-XXXX",
    "totalCoverageAmount": 500000,
    "amountUsed": 50000,
    "amountRemaining": 450000,
    "lastUpdated": "2025-10-08T..."
  }
}
```

### 2. Update Ayushman Card Info
```
PUT /api/ayushman/:userId
```
**Request Body:**
```json
{
  "hasCard": true,
  "cardNumber": "1234-5678-9012",
  "amountUsed": 50000,
  "totalCoverageAmount": 500000
}
```

### 3. Add Usage History
```
POST /api/ayushman/:userId/usage
```
**Request Body:**
```json
{
  "description": "Radiotherapy session 5",
  "amountUsed": 15000,
  "hospital": "PGIMER Chandigarh"
}
```

### 4. Get Usage History
```
GET /api/ayushman/:userId/usage
```

### 5. Get Statistics (Admin)
```
GET /api/ayushman/stats/all
```
**Response:**
```json
{
  "success": true,
  "data": {
    "totalUsersWithCard": 45,
    "totalAmountUsed": 2250000,
    "totalAmountRemaining": 20250000,
    "averageUsage": 50000,
    "usageDistribution": {
      "none": 5,
      "low": 20,
      "medium": 15,
      "high": 4,
      "veryHigh": 1
    }
  }
}
```

## Chat Service Functions

### `isAyushmanQuery(message)`
Checks if user's message is about Ayushman card.

### `handleFollowUpQuestion(userId, message, report)`
Processes follow-up responses:
- Handles "Do you have card?" responses
- Parses amount used from user input
- Updates user database
- Returns appropriate next question or summary

### Input Parsing Examples
```javascript
// Amount parsing
"50000" → ₹50,000
"₹50,000" → ₹50,000
"50000 rupees" → ₹50,000
"20%" → ₹1,00,000 (20% of ₹5 lakh)
"none" → ₹0
"not used" → ₹0
```

## User Experience Flow

### Example Conversation 1: User with Card
```
User: "I want to know about my Ayushman card coverage"

Bot: [Provides general Ayushman information]
     
     📋 Quick Question to Help You Better:
     Do you have an Ayushman Bharat card (PM-JAY)?
     Please reply with "Yes" or "No"

User: "Yes"

Bot: Great! That's helpful to know. 💳
     
     How much of your Ayushman card coverage have 
     you used so far?
     
     You can provide:
     - The amount in rupees (e.g., ₹50,000)
     - A percentage (e.g., 10%)
     - Or simply say 'none' if you haven't used it yet

User: "I have used about 50000 rupees"

Bot: Thank you for sharing that information! 📊
     
     Your Ayushman Card Coverage Summary:
     
     💳 Total Coverage: ₹5,00,000 per year
     ✅ Amount Used: ₹50,000
     💰 Remaining Balance: ₹4,50,000
     📈 Usage: 10.0% of total coverage
     
     Great news! You still have ₹4,50,000 available...
     [Additional guidance and next steps]
```

### Example Conversation 2: User without Card
```
User: "Can I get financial help for treatment?"

Bot: [Provides information]
     
     📋 Quick Question: Do you have an Ayushman card?

User: "No, I don't have it"

Bot: I understand. Don't worry, there are still ways 
     to get financial assistance for your treatment. 🏥
     
     Here's how you can apply for an Ayushman Bharat card:
     
     1. Check Eligibility: Visit nearest CSC or Ayushman Mitra
     2. Required Documents: Aadhaar, Ration card, Mobile number
     3. Application Process: Free and takes 10-15 minutes
     4. Coverage: You'll get ₹5 lakh per year
     
     [Additional assistance options...]
```

## Frontend Integration

### API Service Update
Add to `apiService.js`:

```javascript
ayushman: {
  getCardInfo: (userId) => api.get(`/ayushman/${userId}`),
  
  updateCardInfo: (userId, data) => api.put(`/ayushman/${userId}`, data),
  
  addUsage: (userId, data) => api.post(`/ayushman/${userId}/usage`, data),
  
  getUsageHistory: (userId) => api.get(`/ayushman/${userId}/usage`),
  
  getStats: () => api.get('/ayushman/stats/all')
}
```

### Component Example

```javascript
import React, { useState, useEffect } from 'react';
import apiService from '../services/apiService';

const AyushmanCard = ({ userId }) => {
  const [cardInfo, setCardInfo] = useState(null);
  
  useEffect(() => {
    fetchCardInfo();
  }, [userId]);
  
  const fetchCardInfo = async () => {
    try {
      const response = await apiService.ayushman.getCardInfo(userId);
      setCardInfo(response.data.data);
    } catch (error) {
      console.error('Error fetching Ayushman card info:', error);
    }
  };
  
  if (!cardInfo || !cardInfo.hasCard) {
    return <div>No Ayushman card information available</div>;
  }
  
  return (
    <div className="ayushman-card">
      <h3>Ayushman Card Coverage</h3>
      <div className="coverage-info">
        <p>Total Coverage: ₹{cardInfo.totalCoverageAmount.toLocaleString()}</p>
        <p>Amount Used: ₹{cardInfo.amountUsed.toLocaleString()}</p>
        <p>Remaining: ₹{cardInfo.amountRemaining.toLocaleString()}</p>
        <div className="progress-bar">
          <div 
            style={{ 
              width: `${(cardInfo.amountUsed / cardInfo.totalCoverageAmount) * 100}%` 
            }}
          />
        </div>
      </div>
    </div>
  );
};
```

## Testing

### Test Case 1: User Has Card with Usage
```bash
# User query
POST /api/chat/message
{
  "userId": "testuser",
  "message": "I want to know about my Ayushman card"
}

# Follow-up: User has card
POST /api/chat/message
{
  "userId": "testuser",
  "message": "Yes, I have the card"
}

# Follow-up: Amount used
POST /api/chat/message
{
  "userId": "testuser",
  "message": "50000"
}

# Verify data saved
GET /api/ayushman/testuser
```

### Test Case 2: User Doesn't Have Card
```bash
POST /api/chat/message
{
  "userId": "testuser2",
  "message": "What is Ayushman scheme?"
}

# Follow-up response
POST /api/chat/message
{
  "userId": "testuser2",
  "message": "No"
}

# Should receive application information
```

### Test Case 3: Direct API Update
```bash
PUT /api/ayushman/testuser3
{
  "hasCard": true,
  "amountUsed": 75000,
  "cardNumber": "1234-5678-9012"
}
```

## Admin Features

### Dashboard Statistics
Admins can view:
- Total users with Ayushman cards
- Total amount used across all users
- Average usage per user
- Usage distribution (none, low, medium, high, very high)

### Usage Tracking
Track individual usage history:
- Date of usage
- Treatment description
- Amount used
- Hospital name

## Important Notes

### Data Privacy
- Card numbers are stored securely
- Only authorized personnel can view statistics
- Users can only access their own data

### Coverage Reset
- Ayushman coverage resets annually
- Manual reset required at year-end
- Admin can update coverage amounts

### Accuracy
- Users should verify coverage with Ayushman desk
- Bot provides estimates, not official balances
- Disclaimers included in all responses

## Troubleshooting

### Issue: Follow-up questions not triggering
**Solution**: Check if Ayushman keywords are in the message

### Issue: Amount parsing fails
**Solution**: User should provide numeric values. Bot will ask to clarify.

### Issue: Data not saving
**Solution**: Check MongoDB connection and User model schema

### Issue: Old users don't have ayushmanCard field
**Solution**: Field is auto-created with defaults when accessed

## Future Enhancements

1. **OTP Verification**: Verify card number with PMJAY API
2. **Real-time Balance**: Fetch actual balance from PMJAY system
3. **Treatment Cost Estimator**: Predict costs for upcoming treatments
4. **Document Upload**: Allow users to upload card photos
5. **Claim Tracking**: Track claim submission and approval
6. **Multi-language Support**: Support regional languages
7. **SMS Notifications**: Alert users about coverage usage
8. **Family Members**: Track coverage for multiple family members

## Support

For issues or questions:
- Check server logs for error messages
- Verify MongoDB connection
- Ensure all required fields are in User model
- Test with Postman before frontend integration

---

**Version**: 1.0  
**Last Updated**: October 8, 2025  
**Author**: Medical Chatbot Development Team
