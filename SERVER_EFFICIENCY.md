# Efficient Medical Chatbot Server

## 🚀 Performance Optimizations Implemented

### 1. **Security Enhancements**
- **Helmet.js**: Adds security headers (XSS protection, content security policy, etc.)
- **CORS Configuration**: Properly configured with specific origins and methods
- **Rate Limiting**: Prevents abuse with configurable limits per IP
- **Input Validation**: JSON parsing with size limits and validation

### 2. **Performance Middleware**
- **Compression**: Gzip compression for responses
- **Morgan Logging**: Efficient HTTP request logging
- **Performance Monitoring**: Custom middleware tracking response times
- **Connection Pooling**: Optimized MongoDB connection settings

### 3. **Database Optimizations**
- **Connection Pooling**: Up to 10 concurrent connections
- **Write Concerns**: Optimized for performance and durability
- **Automatic Reconnection**: Handles connection drops gracefully
- **Health Monitoring**: Real-time database health checks

### 4. **Error Handling & Monitoring**
- **Global Error Handler**: Centralized error processing
- **Graceful Shutdown**: Proper cleanup on server termination
- **Health Checks**: Comprehensive system health monitoring
- **Performance Stats**: Real-time performance metrics

## 📊 Monitoring Endpoints

### Health Check
```http
GET /health

Response:
{
  "status": "healthy",
  "timestamp": "2025-10-07T...",
  "uptime": 3600,
  "memory": {
    "used": "25 MB",
    "total": "50 MB",
    "external": "2 MB"
  },
  "database": {
    "status": "healthy",
    "connected": true,
    "host": "cluster0.mongodb.net",
    "name": "medical-chatbot"
  }
}
```

### Performance Statistics
```http
GET /api/performance

Response:
{
  "performance": {
    "totalRequests": 1250,
    "averageResponseTime": "145ms",
    "slowRequests": 5,
    "slowRequestRate": "0.40%",
    "totalErrors": 12,
    "errorRate": "0.96%",
    "endpoints": {
      "POST /api/chat/message": {
        "requests": 800,
        "averageTime": 250,
        "errorRate": "0.25%",
        "slowRequestRate": "0.50%"
      }
    }
  },
  "system": {
    "memory": {...},
    "cpu": {...},
    "uptime": "3600 seconds"
  }
}
```

### Database Statistics
```http
GET /api/db-stats

Response:
{
  "stats": {
    "collections": 5,
    "dataSize": 1048576,
    "storageSize": 2097152,
    "indexes": 8,
    "indexSize": 262144,
    "objects": 1500
  }
}
```

## ⚙️ Configuration Options

### Environment Variables
```bash
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/medical-chatbot

# Security
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100  # Per window

# Performance
REQUEST_TIMEOUT=30000        # 30 seconds
MAX_REQUEST_SIZE=10mb        # Request body limit
```

### Rate Limiting Configuration
- **Development**: 1000 requests per 15 minutes
- **Production**: 100 requests per 15 minutes
- **Skip**: Health check endpoints
- **Headers**: Standard rate limit headers included

### Security Headers (Helmet.js)
- Content Security Policy
- X-XSS-Protection
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy
- HSTS (in production)

## 🔧 Performance Features

### 1. **Connection Management**
```javascript
// MongoDB Connection Pool Settings
maxPoolSize: 10,              // Max connections
serverSelectionTimeoutMS: 5000,
socketTimeoutMS: 45000,
maxIdleTimeMS: 30000
```

### 2. **Response Compression**
- Automatic gzip compression
- Reduces response size by 70-90%
- Configurable compression threshold

### 3. **Request Processing**
- Body parsing with size limits
- JSON validation before processing
- Automatic error handling for malformed requests

### 4. **Logging Optimization**
- Development: Detailed `dev` format
- Production: Combined log format
- Performance tracking per endpoint
- Slow request detection (>2s)

## 📈 Performance Metrics

### Tracked Metrics
- **Response Times**: Average, min, max per endpoint
- **Error Rates**: 4xx and 5xx errors percentage
- **Slow Requests**: Requests taking >2 seconds
- **Memory Usage**: Heap, external, RSS usage
- **Database**: Connection status, query performance

### Alerts & Warnings
- Slow requests automatically logged
- Memory usage warnings
- Database connection issues
- High error rates detection

## 🛠️ Server Features

### 1. **Graceful Shutdown**
```javascript
// Handles SIGTERM and SIGINT
// Closes HTTP server
// Closes database connections
// Force exit after 10 seconds
```

### 2. **Error Recovery**
```javascript
// Database reconnection with retry logic
// Uncaught exception handling
// Unhandled promise rejection handling
// Process exit on critical errors
```

### 3. **API Documentation**
- Self-documenting endpoints
- Available routes listing
- Monitoring endpoints
- Health status information

## 🚦 Status Codes & Responses

### Success Responses
- `200` - OK
- `201` - Created
- `204` - No Content

### Error Responses
- `400` - Bad Request (validation errors)
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict (duplicate data)
- `429` - Too Many Requests (rate limited)
- `500` - Internal Server Error
- `503` - Service Unavailable (health check fail)

## 📝 Logging Formats

### Development
```
GET /api/chat/message 200 145ms
POST /api/auth/login 401 25ms
```

### Production
```
127.0.0.1 - - [07/Oct/2025:10:30:15 +0000] "GET /api/health HTTP/1.1" 200 156 "-" "curl/7.68.0"
```

## 🔍 Debugging & Troubleshooting

### Performance Issues
1. Check `/api/performance` for slow endpoints
2. Monitor memory usage in `/health`
3. Review database connections in `/api/db-stats`
4. Check server logs for slow request warnings

### Error Debugging
1. Enable debug mode: `NODE_ENV=development`
2. Check error logs for stack traces
3. Monitor error rates in performance stats
4. Use health check for system status

### Database Issues
1. Check database health in `/health`
2. Monitor connection pool usage
3. Review query performance logs
4. Check database statistics

## 🚀 Deployment Recommendations

### Production Checklist
- [ ] Set `NODE_ENV=production`
- [ ] Configure proper CORS origins
- [ ] Set up SSL/HTTPS
- [ ] Configure rate limits appropriately
- [ ] Set up log aggregation
- [ ] Monitor performance metrics
- [ ] Set up database backups
- [ ] Configure health check monitoring

### Scaling Considerations
- Use PM2 or similar for process management
- Implement horizontal scaling with load balancer
- Set up Redis for session storage
- Configure CDN for static assets
- Monitor and optimize database indexes
- Implement caching strategies