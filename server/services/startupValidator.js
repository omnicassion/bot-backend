const mongoose = require('mongoose');
const fs = require('fs').promises;
const path = require('path');

class StartupValidator {
  constructor() {
    this.requiredEnvVars = [
      'MONGODB_URI',
      'GEMINI_API_KEY'
    ];
    
    this.requiredFiles = [
      './server/config/contextTemplates.json',
      './server/config/db.js',
      './server/config/gemini.js'
    ];
    
    this.requiredDirectories = [
      './server/models',
      './server/routes',
      './server/services',
      './server/middleware'
    ];
  }

  async validateEnvironment() {
    console.log('🔍 Validating environment variables...');
    const missing = [];
    
    for (const envVar of this.requiredEnvVars) {
      if (!process.env[envVar]) {
        missing.push(envVar);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
    }
    
    console.log('✅ Environment variables validated');
    return true;
  }

  async validateFiles() {
    console.log('📁 Validating required files...');
    const missing = [];
    
    for (const filePath of this.requiredFiles) {
      try {
        await fs.access(filePath);
      } catch (error) {
        missing.push(filePath);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required files: ${missing.join(', ')}`);
    }
    
    console.log('✅ Required files validated');
    return true;
  }

  async validateDirectories() {
    console.log('📂 Validating directory structure...');
    const missing = [];
    
    for (const dirPath of this.requiredDirectories) {
      try {
        const stats = await fs.stat(dirPath);
        if (!stats.isDirectory()) {
          missing.push(dirPath);
        }
      } catch (error) {
        missing.push(dirPath);
      }
    }
    
    if (missing.length > 0) {
      throw new Error(`Missing required directories: ${missing.join(', ')}`);
    }
    
    console.log('✅ Directory structure validated');
    return true;
  }

  async validateDatabase() {
    console.log('💾 Validating database connection...');
    
    if (mongoose.connection.readyState !== 1) {
      throw new Error('Database connection is not established');
    }
    
    // Test basic database operations
    try {
      await mongoose.connection.db.admin().ping();
      console.log('✅ Database connection validated');
      return true;
    } catch (error) {
      throw new Error(`Database ping failed: ${error.message}`);
    }
  }

  async validateContextTemplates() {
    console.log('📝 Validating context templates...');
    
    try {
      const contextPath = './server/config/contextTemplates.json';
      const contextData = await fs.readFile(contextPath, 'utf8');
      const contexts = JSON.parse(contextData);
      
      if (!contexts.contexts || !Array.isArray(contexts.contexts)) {
        throw new Error('Context templates must have a "contexts" array');
      }
      
      if (contexts.contexts.length === 0) {
        throw new Error('At least one context template is required');
      }
      
      // Validate each context has required fields
      for (const context of contexts.contexts) {
        if (!context.name || !context.prompt || !context.keywords) {
          throw new Error(`Invalid context template: missing required fields (name, prompt, keywords)`);
        }
      }
      
      console.log(`✅ Context templates validated (${contexts.contexts.length} contexts loaded)`);
      return true;
    } catch (error) {
      throw new Error(`Context templates validation failed: ${error.message}`);
    }
  }

  async validateMemoryUsage() {
    console.log('🧠 Checking memory usage...');
    
    const memUsage = process.memoryUsage();
    const heapMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    const totalMB = Math.round(memUsage.heapTotal / 1024 / 1024);
    
    console.log(`📊 Memory usage: ${heapMB}MB used / ${totalMB}MB allocated`);
    
    // Warn if memory usage is high
    if (heapMB > 500) {
      console.warn(`⚠️  High memory usage detected: ${heapMB}MB`);
    }
    
    console.log('✅ Memory check completed');
    return true;
  }

  async runAllValidations() {
    const startTime = Date.now();
    console.log('🚀 Starting server validation checks...\n');
    
    try {
      await this.validateEnvironment();
      await this.validateDirectories();
      await this.validateFiles();
      await this.validateContextTemplates();
      await this.validateDatabase();
      await this.validateMemoryUsage();
      
      const duration = Date.now() - startTime;
      console.log(`\n🎉 All validation checks passed! (${duration}ms)`);
      console.log('📊 System ready for operation\n');
      
      return {
        success: true,
        duration,
        timestamp: new Date().toISOString(),
        checks: [
          'environment',
          'directories', 
          'files',
          'contextTemplates',
          'database',
          'memory'
        ]
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`\n❌ Startup validation failed after ${duration}ms:`);
      console.error(`🚫 ${error.message}\n`);
      
      return {
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Quick health check for runtime monitoring
  async quickHealthCheck() {
    const checks = {
      database: mongoose.connection.readyState === 1,
      memory: process.memoryUsage().heapUsed < 500 * 1024 * 1024, // 500MB threshold
      uptime: process.uptime() > 0
    };
    
    const healthy = Object.values(checks).every(check => check === true);
    
    return {
      healthy,
      checks,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = new StartupValidator();