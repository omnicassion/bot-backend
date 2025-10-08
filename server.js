const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./server/routes/auth');
const chatRoutes = require('./server/routes/chat');
const reportRoutes = require('./server/routes/reports');
const generateReport = require('./server/services/analyse');
const reportAnalysis = require('./server/services/reportAnalyse');
const alertRoutes = require('./server/routes/alert');
const machineRoutes = require('./server/routes/machineRoutes');
const { connectDB, checkDBHealth, getDBStats } = require('./server/config/db');
const adminRouter = require('./server/routes/adminRoutes');
const healthRoutes = require('./server/routes/health');
const performanceMonitor = require('./server/middleware/performanceMonitor');
const chatTimeoutMiddleware = require('./server/middleware/chatTimeout');
const startupValidator = require('./server/services/startupValidator');
require('dotenv').config();





const app = express();
const port = process.env.PORT || 5500;
const isDevelopment = process.env.NODE_ENV !== 'production';

// Initialize performance monitor
const perfMonitor = performanceMonitor();

// Trust proxy for accurate IP addresses behind reverse proxy
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Compression middleware for better performance
app.use(compression());

// CORS configuration
app.use(cors({
  origin: "https://bot-frontend-sage.vercel.app",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isDevelopment ? 1000 : 100, // Limit each IP to 100 requests per windowMs in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check endpoints
    return req.path === '/' || req.path === '/health';
  }
});

// Apply rate limiting to API routes only
app.use('/api', limiter);

// Morgan logging configuration
if (isDevelopment) {
  // Detailed logging for development
  app.use(morgan('dev'));
} else {
  // Combined log format for production
  app.use(morgan('combined'));
}

// Request timeout middleware
app.use((req, res, next) => {
  // Set longer timeout for chat endpoints
  const timeout = req.path.includes('/chat/message') ? 60000 : 30000; // 60s for chat, 30s for others
  
  req.setTimeout(timeout, () => {
    const error = new Error(`Request timeout: ${req.method} ${req.path} took longer than ${timeout}ms`);
    error.status = 408;
    next(error);
  });
  
  res.setTimeout(timeout, () => {
    if (!res.headersSent) {
      res.status(408).json({
        error: 'Request Timeout',
        message: 'The server took too long to respond. Please try again.',
        timeout: timeout
      });
    }
  });
  
  next();
});

// Body parsing middleware with size limits
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf);
    } catch (e) {
      res.status(400).json({ error: 'Invalid JSON' });
      throw new Error('Invalid JSON');
    }
  }
}));

app.use(express.urlencoded({ 
  extended: true, 
  limit: '10mb' 
}));

// Connect to the database
connectDB();

// Performance monitoring middleware
app.use(perfMonitor.middleware);

// Chat-specific timeout middleware
app.use(chatTimeoutMiddleware);

// Health check routes (before rate limiting)
app.use('/health', healthRoutes);

// Performance stats endpoint
app.get('/api/performance', (req, res) => {
  try {
    const performanceStats = perfMonitor.getStats();
    const systemMetrics = perfMonitor.getSystemMetrics();
    
    res.json({
      message: 'Performance Statistics',
      performance: performanceStats,
      system: systemMetrics
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve performance statistics',
      message: error.message
    });
  }
});

// Database stats endpoint (admin only - add authentication as needed)
app.get('/api/db-stats', async (req, res) => {
  try {
    const stats = await getDBStats();
    res.json({
      message: 'Database Statistics',
      timestamp: new Date().toISOString(),
      stats
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to retrieve database statistics',
      message: error.message
    });
  }
});

// API documentation endpoint
app.get('/api', (req, res) => {
  res.json({
    message: 'Medical Chatbot API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      chat: '/api/chat',
      reports: '/api/reports',
      alerts: '/api/alerts',
      machines: '/api/machines',
      admin: '/api/adminRoute'
    },
    monitoring: {
      health: '/health',
      performance: '/api/performance',
      database: '/api/db-stats'
    },
    documentation: {
      roles: '/ROLE_MANAGEMENT.md',
      contexts: '/CONTEXT_SYSTEM_README.md'
    }
  });
});

// Set up routes with proper ordering
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/machines', machineRoutes);
app.use('/api/adminRoute', adminRouter);

// New admin management routes
const userManagementRoutes = require('./server/routes/userManagement');
app.use('/api/admin', userManagementRoutes);

// These routes should be mounted on specific paths instead of '/api'
app.use('/api/analyse', generateReport);
app.use('/api/report-analysis', reportAnalysis);
app.use('/api/alerts', alertRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Medical Chatbot Server is running',
    status: 'active',
    timestamp: new Date().toISOString(),
    api: '/api',
    health: '/health'
  });
});

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'GET /api',
      'POST /api/auth/register',
      'POST /api/auth/login',
      'POST /api/chat/message',
      'GET /api/reports',
      'GET /api/machines',
      'GET /api/adminRoute'
    ]
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  // Handle different types of errors
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      message: error.message,
      details: error.errors
    });
  }
  
  if (error.name === 'CastError') {
    return res.status(400).json({
      error: 'Invalid ID format',
      message: 'The provided ID is not valid'
    });
  }
  
  if (error.code === 11000) {
    return res.status(409).json({
      error: 'Duplicate entry',
      message: 'A record with this information already exists'
    });
  }
  
  // Default error response
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal Server Error',
    ...(isDevelopment && { stack: error.stack }),
    timestamp: new Date().toISOString()
  });
});

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  
  // Close server
  server.close(() => {
    console.log('HTTP server closed.');
    
    // Close database connection
    mongoose.connection.close(false, () => {
      console.log('MongoDB connection closed.');
      process.exit(0);
    });
  });
  
  // Force close after 10 seconds
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Start server
const server = app.listen(port, () => {
  console.log(`
🚀 Medical Chatbot Server Started Successfully!

📊 Server Information:
   Port: ${port}
   Environment: ${process.env.NODE_ENV || 'development'}
   Node Version: ${process.version}
   
🔗 Available Endpoints:
   Health Check: http://localhost:${port}/health
   API Documentation: http://localhost:${port}/api
   Main API: http://localhost:${port}/api/
   
📝 Features Enabled:
   ✅ Morgan Logging
   ✅ Security Headers (Helmet)
   ✅ Compression
   ✅ Rate Limiting
   ✅ CORS Protection
   ✅ Error Handling
   ✅ Graceful Shutdown
   
🔧 Ready to accept connections!
  `);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Handle graceful shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

