#!/usr/bin/env node

/**
 * Context Template Manager
 * 
 * This script helps manage the context templates for the medical chatbot.
 * Usage:
 *   node contextManager.js validate    - Validate context templates
 *   node contextManager.js list        - List all contexts
 *   node contextManager.js add <key>   - Add a new context (interactive)
 *   node contextManager.js backup      - Create backup of current templates
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const CONTEXT_FILE = path.join(__dirname, '../config/contextTemplates.json');
const BACKUP_DIR = path.join(__dirname, '../backups');

class ContextManager {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  loadContexts() {
    try {
      const data = fs.readFileSync(CONTEXT_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading context templates:', error.message);
      process.exit(1);
    }
  }

  saveContexts(contexts) {
    try {
      fs.writeFileSync(CONTEXT_FILE, JSON.stringify(contexts, null, 2));
      console.log('✅ Context templates saved successfully');
    } catch (error) {
      console.error('❌ Error saving context templates:', error.message);
      process.exit(1);
    }
  }

  validate() {
    console.log('🔍 Validating context templates...\n');
    
    const contexts = this.loadContexts();
    const requiredFields = ['name', 'description', 'context'];
    let isValid = true;
    let contextCount = 0;

    Object.entries(contexts).forEach(([key, value]) => {
      if (key.startsWith('_')) return; // Skip metadata
      
      contextCount++;
      console.log(`Validating context: ${key}`);
      
      requiredFields.forEach(field => {
        if (!value[field]) {
          console.log(`  ❌ Missing required field: ${field}`);
          isValid = false;
        } else {
          console.log(`  ✅ ${field}: ${value[field].substring(0, 50)}...`);
        }
      });
      
      console.log('');
    });

    console.log(`📊 Summary:`);
    console.log(`  Total contexts: ${contextCount}`);
    console.log(`  Validation: ${isValid ? '✅ PASSED' : '❌ FAILED'}`);
    
    return isValid;
  }

  list() {
    console.log('📝 Available Context Templates:\n');
    
    const contexts = this.loadContexts();
    
    Object.entries(contexts).forEach(([key, value]) => {
      if (key.startsWith('_')) return; // Skip metadata
      
      console.log(`🔸 ${key}`);
      console.log(`   Name: ${value.name}`);
      console.log(`   Description: ${value.description}`);
      if (value.keywords) {
        console.log(`   Keywords: ${value.keywords.join(', ')}`);
      }
      console.log('');
    });
  }

  async add(contextKey) {
    if (!contextKey) {
      console.log('❌ Please provide a context key');
      this.rl.close();
      return;
    }

    const contexts = this.loadContexts();
    
    if (contexts[contextKey]) {
      console.log(`❌ Context '${contextKey}' already exists`);
      this.rl.close();
      return;
    }

    console.log(`\n➕ Adding new context: ${contextKey}\n`);

    const name = await this.question('Enter context name: ');
    const description = await this.question('Enter context description: ');
    const contextPrompt = await this.question('Enter context prompt: ');
    const keywords = await this.question('Enter keywords (comma-separated): ');

    const newContext = {
      name,
      description,
      keywords: keywords.split(',').map(k => k.trim()),
      context: contextPrompt
    };

    contexts[contextKey] = newContext;
    
    // Update metadata
    if (contexts._info) {
      contexts._info.totalContexts = Object.keys(contexts).filter(k => !k.startsWith('_')).length;
      contexts._info.lastUpdated = new Date().toISOString().split('T')[0];
    }

    this.saveContexts(contexts);
    console.log(`✅ Context '${contextKey}' added successfully`);
    this.rl.close();
  }

  backup() {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(BACKUP_DIR, `contextTemplates-${timestamp}.json`);

    try {
      fs.copyFileSync(CONTEXT_FILE, backupFile);
      console.log(`✅ Backup created: ${backupFile}`);
    } catch (error) {
      console.error('❌ Error creating backup:', error.message);
    }
  }

  question(prompt) {
    return new Promise((resolve) => {
      this.rl.question(prompt, resolve);
    });
  }

  async run() {
    const command = process.argv[2];
    const arg = process.argv[3];

    switch (command) {
      case 'validate':
        this.validate();
        break;
      
      case 'list':
        this.list();
        break;
      
      case 'add':
        await this.add(arg);
        break;
      
      case 'backup':
        this.backup();
        break;
      
      default:
        console.log(`
📋 Context Template Manager

Usage:
  node contextManager.js validate     - Validate context templates
  node contextManager.js list         - List all contexts
  node contextManager.js add <key>    - Add a new context
  node contextManager.js backup       - Create backup of templates

Examples:
  node contextManager.js validate
  node contextManager.js add emergency_care
  node contextManager.js backup
        `);
        break;
    }
    
    if (command !== 'add') {
      this.rl.close();
    }
  }
}

// Run the manager
const manager = new ContextManager();
manager.run().catch(console.error);