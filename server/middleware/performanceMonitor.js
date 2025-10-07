/**
 * Performance Monitoring Middleware
 * Tracks API response times and system metrics
 */

const performanceMonitor = () => {
  const stats = {
    requests: 0,
    totalResponseTime: 0,
    slowRequests: 0,
    errors: 0,
    endpoints: new Map()
  };

  return {
    // Middleware function
    middleware: (req, res, next) => {
      const startTime = Date.now();
      const endpoint = `${req.method} ${req.route?.path || req.path}`;

      // Track request start
      stats.requests++;

      // Override res.end to capture response time
      const originalEnd = res.end;
      res.end = function(...args) {
        const responseTime = Date.now() - startTime;
        
        // Update global stats
        stats.totalResponseTime += responseTime;
        
        // Track slow requests (>2 seconds)
        if (responseTime > 2000) {
          stats.slowRequests++;
          console.warn(`⚠️ Slow request detected: ${endpoint} took ${responseTime}ms`);
        }

        // Track errors
        if (res.statusCode >= 400) {
          stats.errors++;
        }

        // Track per-endpoint stats
        if (!stats.endpoints.has(endpoint)) {
          stats.endpoints.set(endpoint, {
            requests: 0,
            totalTime: 0,
            errors: 0,
            slowRequests: 0
          });
        }

        const endpointStats = stats.endpoints.get(endpoint);
        endpointStats.requests++;
        endpointStats.totalTime += responseTime;
        
        if (responseTime > 2000) {
          endpointStats.slowRequests++;
        }
        
        if (res.statusCode >= 400) {
          endpointStats.errors++;
        }

        // Log performance in development
        if (process.env.NODE_ENV === 'development') {
          const statusColor = res.statusCode >= 400 ? '\x1b[31m' : '\x1b[32m';
          const timeColor = responseTime > 1000 ? '\x1b[33m' : '\x1b[90m';
          console.log(
            `${statusColor}${res.statusCode}\x1b[0m ${req.method} ${req.originalUrl} ${timeColor}${responseTime}ms\x1b[0m`
          );
        }

        originalEnd.apply(this, args);
      };

      next();
    },

    // Get performance statistics
    getStats: () => {
      const avgResponseTime = stats.requests > 0 ? 
        Math.round(stats.totalResponseTime / stats.requests) : 0;

      const endpointStats = {};
      stats.endpoints.forEach((value, key) => {
        endpointStats[key] = {
          requests: value.requests,
          averageTime: Math.round(value.totalTime / value.requests),
          errorRate: ((value.errors / value.requests) * 100).toFixed(2) + '%',
          slowRequestRate: ((value.slowRequests / value.requests) * 100).toFixed(2) + '%'
        };
      });

      return {
        totalRequests: stats.requests,
        averageResponseTime: avgResponseTime + 'ms',
        slowRequests: stats.slowRequests,
        slowRequestRate: ((stats.slowRequests / stats.requests) * 100).toFixed(2) + '%',
        totalErrors: stats.errors,
        errorRate: ((stats.errors / stats.requests) * 100).toFixed(2) + '%',
        endpoints: endpointStats,
        timestamp: new Date().toISOString()
      };
    },

    // Reset statistics
    resetStats: () => {
      stats.requests = 0;
      stats.totalResponseTime = 0;
      stats.slowRequests = 0;
      stats.errors = 0;
      stats.endpoints.clear();
    },

    // Get system metrics
    getSystemMetrics: () => {
      const memoryUsage = process.memoryUsage();
      const cpuUsage = process.cpuUsage();
      
      return {
        memory: {
          heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB',
          heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
          external: Math.round(memoryUsage.external / 1024 / 1024) + ' MB',
          rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB'
        },
        cpu: {
          user: Math.round(cpuUsage.user / 1000) + ' ms',
          system: Math.round(cpuUsage.system / 1000) + ' ms'
        },
        uptime: Math.floor(process.uptime()) + ' seconds',
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch
      };
    }
  };
};

module.exports = performanceMonitor;