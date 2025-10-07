# Context Template System - Updated Implementation

## 🎯 Overview

The chatbot now uses a **separated JSON-based context system** that makes it easier to manage and modify conversation contexts without touching the code.

## 📁 File Structure

```
server/
├── config/
│   └── contextTemplates.json    ← NEW: All contexts defined here
├── scripts/
│   └── contextManager.js        ← NEW: Management utility
├── services/
│   └── chatService.js           ← UPDATED: Reads from JSON file
└── routes/
    └── chat.js                  ← UPDATED: Added management endpoints
```

## ⚡ Quick Start

### 1. Validate Context Templates
```bash
node server/scripts/contextManager.js validate
```

### 2. List All Available Contexts
```bash
node server/scripts/contextManager.js list
```

### 3. Create Backup Before Changes
```bash
node server/scripts/contextManager.js backup
```

### 4. Add New Context (Interactive)
```bash
node server/scripts/contextManager.js add new_context_key
```

## 🔧 API Endpoints

### Get Available Contexts
```http
GET /api/chat/contexts

Response:
[
  {
    "key": "radiotherapy_side_effects",
    "name": "Radiotherapy Side Effects Management",
    "description": "Handles questions about side effects...",
    "keywords": ["side effects", "fatigue", "nausea"]
  }
]
```

### Validate Context Templates
```http
GET /api/chat/validate-contexts

Response:
{
  "isValid": true,
  "errors": [],
  "contextCount": 6
}
```

### Reload Context Templates (Hot Reload)
```http
POST /api/chat/reload-contexts

Response:
{
  "message": "Context templates reloaded successfully"
}
```

## 📝 Context Template Structure

Each context in `contextTemplates.json` has the following structure:

```json
{
  "context_key": {
    "name": "Human-readable name",
    "description": "What this context handles",
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "context": "The actual prompt that will be sent to Gemini"
  }
}
```

## 🛠️ Managing Contexts

### Adding a New Context

1. **Method 1: Using the Script (Recommended)**
   ```bash
   node server/scripts/contextManager.js add emergency_care
   ```

2. **Method 2: Edit JSON Directly**
   - Open `server/config/contextTemplates.json`
   - Add your new context following the structure above
   - Validate: `node server/scripts/contextManager.js validate`

### Modifying Existing Contexts

1. Edit `server/config/contextTemplates.json`
2. Validate your changes: `node server/scripts/contextManager.js validate`
3. Reload in running server (optional): `POST /api/chat/reload-contexts`

### Best Practices

1. **Always backup before major changes**
   ```bash
   node server/scripts/contextManager.js backup
   ```

2. **Use descriptive context keys** (snake_case recommended)
   - ✅ `emergency_care`
   - ✅ `medication_management`
   - ❌ `ctx1`, `temp`, `test`

3. **Include relevant keywords** for better context selection

4. **Test your contexts** after making changes

## 🔍 Available Context Types

| Context Key | Purpose | When Selected |
|-------------|---------|---------------|
| `radiotherapy_side_effects` | Side effect management | User mentions symptoms, discomfort, side effects |
| `treatment_information` | Treatment procedures | User asks about processes, preparation, what to expect |
| `emotional_support` | Psychological support | User expresses fear, anxiety, emotional distress |
| `nutrition_lifestyle` | Diet and lifestyle | User asks about food, nutrition, exercise |
| `appointment_logistics` | Hospital navigation | User needs help with appointments, locations |
| `general_medical` | General health questions | Fallback for other medical concerns |

## 🔄 How Context Selection Works

1. **User sends message** → Chat service receives it
2. **Previous chat analysis** → Last 5 messages are reviewed
3. **Context analysis** → Gemini analyzes message + history
4. **Context selection** → Best matching context is chosen
5. **Response generation** → Specialized prompt generates response
6. **History tracking** → Context used is saved for analytics

## 🚨 Troubleshooting

### Context Templates Not Loading
```bash
# Check JSON syntax
node -e "console.log(require('./server/config/contextTemplates.json'))"

# Validate structure
node server/scripts/contextManager.js validate
```

### Context Selection Not Working
- Check if context keys match exactly
- Ensure no metadata fields (starting with `_`) are selected
- Verify Gemini API is working

### Hot Reload Not Working
- Call validation endpoint first: `GET /api/chat/validate-contexts`
- Then reload: `POST /api/chat/reload-contexts`

## 💡 Benefits of This Approach

✅ **Easy to Modify**: Edit JSON file without touching code  
✅ **Version Control**: Track context changes separately  
✅ **Hot Reload**: Update contexts without server restart  
✅ **Validation**: Built-in validation and error checking  
✅ **Backup**: Easy backup and restore functionality  
✅ **Analytics**: Track which contexts are used most  
✅ **Maintainable**: Clear separation of concerns  

## 🔮 Future Enhancements

- Context versioning and rollback
- A/B testing for different context versions
- Web-based context editor
- Context usage analytics dashboard
- Machine learning for better context selection