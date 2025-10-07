const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// Health check endpoint
router.get('/', async (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    status: 'OK',
    services: {}
  };

  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    healthCheck.services.database = {
      status: dbState === 1 ? 'healthy' : 'unhealthy',
      state: dbStates[dbState] || 'unknown',
      host: mongoose.connection.host,
      name: mongoose.connection.name
    };

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthCheck.services.memory = {
      status: memUsage.heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning', // 500MB threshold
      heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
      heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
    };

    // Check API response time
    const startTime = Date.now();
    await new Promise(resolve => setTimeout(resolve, 1)); // Minimal async operation
    const responseTime = Date.now() - startTime;
    
    healthCheck.services.api = {
      status: responseTime < 100 ? 'healthy' : 'warning',
      responseTime: `${responseTime}ms`
    };

    // Overall health status
    const services = Object.values(healthCheck.services);
    const hasUnhealthy = services.some(service => service.status === 'unhealthy');
    const hasWarning = services.some(service => service.status === 'warning');
    
    if (hasUnhealthy) {
      healthCheck.status = 'UNHEALTHY';
      res.status(503);
    } else if (hasWarning) {
      healthCheck.status = 'WARNING';
      res.status(200);
    } else {
      healthCheck.status = 'HEALTHY';
      res.status(200);
    }

    res.json(healthCheck);

  } catch (error) {
    console.error('Health check error:', error);
    
    healthCheck.status = 'ERROR';
    healthCheck.error = error.message;
    
    res.status(503).json(healthCheck);
  }
});

// Detailed system information (admin only)
router.get('/detailed', async (req, res) => {
  try {
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      database: {
        state: mongoose.connection.readyState,
        host: mongoose.connection.host,
        name: mongoose.connection.name,
        collections: mongoose.connection.collections ? Object.keys(mongoose.connection.collections) : []
      }
    };

    res.json(systemInfo);
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      error: 'Failed to retrieve system information',
      message: error.message
    });
  }
});

module.exports = router;