# Ayushman Card Feature - Quick Start Guide

## What's New?

The chatbot now automatically collects Ayushman Bharat card information when users ask about insurance or financial assistance!

## How It Works

### 1. **User Asks About Ayushman/Insurance**
Keywords that trigger the system:
- "ayushman"
- "insurance"  
- "card"
- "coverage"
- "financial help"
- "payment"
- "cost"

### 2. **Bot Asks Follow-Up Questions**

**Question 1**: "Do you have an Ayushman Bharat card?"
- User answers: "Yes" or "No"

**If YES → Question 2**: "How much have you used?"
- User can answer:
  - "50000" (amount in rupees)
  - "₹50,000" (with currency symbol)
  - "20%" (percentage of ₹5 lakh)
  - "none" (haven't used yet)

**If NO**:
- Bot provides information on how to apply for the card
- Lists alternative financial assistance options

### 3. **Bot Provides Summary**
- Total coverage: ₹5,00,000
- Amount used: (based on user input)
- Remaining balance
- Usage percentage
- Next steps and guidance

## Example Conversations

### Scenario 1: User with Card (Has Used ₹50,000)

```
👤 User: "I want to know about my Ayushman card"

🤖 Bot: [Provides Ayushman information]
      
      📋 Quick Question: Do you have an Ayushman card?

👤 User: "Yes I have it"

🤖 Bot: Great! How much of your coverage have you used so far?

👤 User: "around 50000 rupees"

🤖 Bot: Your Ayushman Card Coverage Summary:
      
      💳 Total Coverage: ₹5,00,000
      ✅ Amount Used: ₹50,000
      💰 Remaining: ₹4,50,000
      📈 Usage: 10% used
      
      [Additional guidance...]
```

### Scenario 2: User without Card

```
👤 User: "Can I get financial help?"

🤖 Bot: [Provides information]
      
      📋 Do you have an Ayushman Bharat card?

👤 User: "No"

🤖 Bot: Here's how to apply:
      1. Visit CSC or Ayushman Mitra
      2. Bring: Aadhaar, Ration card
      3. Free application, 10-15 minutes
      4. Get ₹5 lakh coverage
      
      [Alternative options...]
```

## Files Changed

### Backend
1. **`server/models/User.js`** - Added ayushmanCard schema
2. **`server/models/Report.js`** - Added follow-up tracking fields
3. **`server/config/contextTemplates.json`** - Added Ayushman context
4. **`server/services/chatService.js`** - Added follow-up logic
5. **`server/routes/ayushman.js`** - New API endpoints
6. **`server.js`** - Registered Ayushman routes

### Documentation
1. **`AYUSHMAN_CARD_SYSTEM.md`** - Complete technical documentation
2. **`AYUSHMAN_QUICK_START.md`** - This file

## API Endpoints

### Get User's Card Info
```http
GET /api/ayushman/:userId
```

### Update Card Info  
```http
PUT /api/ayushman/:userId
Body: { hasCard, amountUsed, cardNumber }
```

### Add Usage Entry
```http
POST /api/ayushman/:userId/usage
Body: { description, amountUsed, hospital }
```

### Get Statistics (Admin)
```http
GET /api/ayushman/stats/all
```

## Testing the Feature

### Test 1: Basic Flow
1. Start chat: "Tell me about Ayushman card"
2. Answer: "Yes" 
3. Answer: "30000"
4. Check: Should show ₹4,70,000 remaining

### Test 2: No Card Flow
1. Start chat: "I need financial help"
2. Answer: "No"
3. Check: Should provide application info

### Test 3: API Check
```bash
# PowerShell
Invoke-RestMethod -Uri "http://localhost:5500/api/ayushman/username" -Method Get
```

## Data Stored

For each user with an Ayushman card:
```json
{
  "hasCard": true,
  "cardNumber": "XXXX-XXXX-XXXX",
  "totalCoverageAmount": 500000,
  "amountUsed": 50000,
  "amountRemaining": 450000,
  "lastUpdated": "2025-10-08T...",
  "usageHistory": [
    {
      "date": "2025-10-08",
      "description": "Radiotherapy session",
      "amountUsed": 15000,
      "hospital": "PGIMER Chandigarh"
    }
  ]
}
```

## Next Steps

1. **Test the Feature**
   - Try different user inputs
   - Check data is saved correctly

2. **Frontend Integration**
   - Add Ayushman card display component
   - Show coverage summary in user profile
   - Display usage history

3. **Admin Dashboard**
   - View all users with cards
   - Track total coverage usage
   - Generate reports

## Benefits

✅ **Automatic Data Collection** - No manual forms  
✅ **Natural Conversation** - Feels like talking to a counselor  
✅ **Smart Parsing** - Understands various input formats  
✅ **Complete Tracking** - Usage history maintained  
✅ **Financial Planning** - Helps users plan treatment costs  
✅ **Admin Insights** - Statistics for hospital management  

## Important Notes

⚠️ **Disclaimers Included** - All responses include medical disclaimers  
⚠️ **Verification Needed** - Users should verify with Ayushman desk  
⚠️ **Privacy Protected** - Secure data storage  
⚠️ **Annual Reset** - Coverage resets each year  

## Support

If you encounter issues:
1. Check server logs: `console.log` statements added
2. Verify MongoDB connection
3. Test with Postman first
4. Check follow-up state: `report.pendingFollowUp`

---

**Version**: 1.0  
**Date**: October 8, 2025  
**Status**: Ready for testing ✅
