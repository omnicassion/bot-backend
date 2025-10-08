/**
 * Migration script to populate the user field in existing reports
 * This script links reports to users based on the userId (username) field
 */

const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');
require('dotenv').config();

async function migrateReportUsers() {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');

    // Find all reports that don't have a user reference
    const reports = await Report.find({ user: { $exists: false } });
    console.log(`Found ${reports.length} reports to migrate`);

    let successCount = 0;
    let notFoundCount = 0;

    for (const report of reports) {
      // Find the user by username
      const user = await User.findOne({ username: report.userId });
      
      if (user) {
        report.user = user._id;
        await report.save();
        successCount++;
        console.log(`✓ Linked report ${report._id} to user ${user.username}`);
      } else {
        notFoundCount++;
        console.log(`✗ User not found for report ${report._id} with userId: ${report.userId}`);
      }
    }

    console.log('\n=== Migration Summary ===');
    console.log(`Total reports processed: ${reports.length}`);
    console.log(`Successfully linked: ${successCount}`);
    console.log(`Users not found: ${notFoundCount}`);
    console.log('======================\n');

    await mongoose.connection.close();
    console.log('Database connection closed');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the migration
migrateReportUsers();
