const mongoose = require('mongoose');

// Use environment variable for database URI with fallback
const dbURI = process.env.MONGODB_URI || 'mongodb+srv://adityabandale2:MDADITYA01@rt-bot-db.w1zkd7b.mongodb.net/?retryWrites=true&w=majority&appName=RT-BOT-DB';

// Enhanced connection options for better performance
const mongooseOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  
  // Connection pool settings
  maxPoolSize: 10, // Maintain up to 10 socket connections
  serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  
  // Buffering settings
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
  
  // Automatic reconnection
  maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
  
  // Write concern
  writeConcern: {
    w: 'majority',
    j: true,
    wtimeout: 1000
  }
};

const connectDB = async () => {
  try {
    // Set mongoose options for better performance
    mongoose.set('strictQuery', false);
    
    // Enable debug mode in development
    if (process.env.NODE_ENV === 'development') {
      mongoose.set('debug', true);
    }

    const conn = await mongoose.connect(dbURI, mongooseOptions);
    
    console.log(`
📊 MongoDB Connected Successfully!
   Host: ${conn.connection.host}
   Database: ${conn.connection.name}
   Port: ${conn.connection.port}
   Ready State: ${conn.connection.readyState}
    `);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ Mongoose disconnected from MongoDB');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔄 Mongoose connection closed due to application termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    
    // Retry connection after 5 seconds
    console.log('🔄 Retrying database connection in 5 seconds...');
    setTimeout(connectDB, 5000);
  }
};

// Function to check database health
const checkDBHealth = async () => {
  try {
    await mongoose.connection.db.admin().ping();
    return {
      status: 'healthy',
      connected: mongoose.connection.readyState === 1,
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message
    };
  }
};

// Function to get database stats
const getDBStats = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database not connected');
    }

    const stats = await mongoose.connection.db.stats();
    return {
      collections: stats.collections,
      dataSize: stats.dataSize,
      storageSize: stats.storageSize,
      indexes: stats.indexes,
      indexSize: stats.indexSize,
      objects: stats.objects
    };
  } catch (error) {
    throw new Error(`Failed to get database stats: ${error.message}`);
  }
};

module.exports = {
  connectDB,
  checkDBHealth,
  getDBStats
};