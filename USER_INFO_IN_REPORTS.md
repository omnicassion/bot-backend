# User Information in Reports - Implementation Guide

## Overview
This update enhances the report system to display user names instead of just user IDs. Reports now include full user information (username, email, role) when displaying report data.

## Changes Made

### Backend Changes

#### 1. Report Model (`server/models/Report.js`)
- Added `user` field as a reference to the User model
- Maintains backward compatibility with the existing `userId` field

```javascript
{
  userId: String,  // Username (for backward compatibility)
  user: ObjectId,  // Reference to User model
}
```

#### 2. Report Service (`server/services/reportService.js`)
- Updated all report retrieval methods to populate user data
- Modified `createReport` to automatically link user references
- Methods updated:
  - `getAllReports()`
  - `getReportsByUserId()`
  - `getReportById()`
  - `getReportsByStatus()`
  - `getReportsByPriority()`
  - `updateReportAnalysis()`

### Frontend Changes

#### 1. AnalysisPage Component (`src/components/AnalysisPage.js`)
- Added `getUserName()` helper function to safely extract username
- Updated all display areas to show username instead of userId
- Added user role badge display
- Enhanced modal to show full user information (username, email, role)
- Updated export functionality to include user details

#### 2. ReportsPage Component (`src/components/ReportsPage.js`)
- Added `getUserName()` helper function
- Updated report table to display username and email
- Enhanced report details modal with full user information
- Updated search functionality to work with populated user data

### Migration Script

A migration script has been created to update existing reports: `server/scripts/migrateReportUsers.js`

## Running the Migration

To populate the user field in existing reports:

```powershell
cd d:\bot-backend
node server/scripts/migrateReportUsers.js
```

This script will:
- Find all reports without a user reference
- Look up the corresponding user by username (userId field)
- Link the report to the user
- Provide a summary of successful and failed migrations

## Features

### 1. User Information Display
Reports now show:
- Username (primary identifier)
- Email address (when available)
- User role badge (user/doctor/admin/therapist)

### 2. Backward Compatibility
- Existing code using `userId` continues to work
- Frontend gracefully falls back to `userId` if user object is not populated
- No breaking changes to existing API

### 3. Enhanced Search
- Search now works with populated user data
- Can search by username, email, diagnosis, or symptoms

### 4. Better Exports
Downloaded analysis reports now include:
- Patient Name
- Patient Email
- Patient Role

## Testing

1. **Create New Report**
   - Create a new report through the chat interface
   - Verify it automatically links to the user

2. **View Existing Reports**
   - Check AnalysisPage to see usernames displayed
   - Check ReportsPage to see user details in the table

3. **Search Functionality**
   - Search by username
   - Search by email
   - Verify results are correct

4. **Export Reports**
   - Download an analysis report
   - Verify user information is included

## API Response Format

Reports now return user data in this format:

```json
{
  "_id": "report_id",
  "userId": "john_doe",
  "user": {
    "_id": "user_id",
    "username": "john_doe",
    "email": "john@example.com",
    "role": "user"
  },
  "diagnosis": "...",
  "symptoms": [...],
  ...
}
```

## Troubleshooting

### Issue: Reports show userId instead of username
**Solution**: Run the migration script to populate user references

### Issue: Some reports show "undefined" for username
**Cause**: The user account may have been deleted
**Solution**: The system will fall back to displaying the userId

### Issue: Migration script fails
**Check**:
- MongoDB connection string in .env
- User accounts exist for all reports
- Database permissions

## Future Enhancements

Potential improvements:
1. Add user profile pictures
2. Include user contact information
3. Add user department/specialty info
4. Track report views by user
5. Add user-specific analytics

## Notes

- User data is populated at query time (not stored redundantly)
- System maintains data integrity through MongoDB references
- Performance impact is minimal due to indexed queries
- Email and role are optional fields
