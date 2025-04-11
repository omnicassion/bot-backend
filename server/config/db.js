const mongoose = require('mongoose');

const dbURI = 'mongodb+srv://adityabandale2:MDADITYA01@rt-bot-db.w1zkd7b.mongodb.net/?retryWrites=true&w=majority&appName=RT-BOT-DB'

const connectDB = async () => {
  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

module.exports = connectDB;