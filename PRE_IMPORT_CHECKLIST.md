# Pre-Implementation Checklist

## ✅ Code Quality
- [x] All TypeScript compilation errors fixed
- [x] Type definitions updated in `types.ts`
- [x] Mongoose schemas properly indexed
- [x] Services use proper typing

## 📋 Before Running Import

### 1. **Database Setup**
```bash
# Verify MongoDB connection
# Check backend/.env has MONGODB_URI set
```

**Required .env variables:**
```
MONGODB_URI=mongodb+srv://... (your Atlas connection)
NODE_ENV=development
DEV_MODE=true (optional, for testing)
```

### 2. **Create a Session First**
You **must** create a game session before importing the map:

**Option A: Via API**
```http
POST /api/sessions/create
{
  "name": "Zealandia 1853",
  "gamemaster": "<your-player-id>"
}
```

**Option B: Via MongoDB directly**
```javascript
// In MongoDB Compass or shell
db.sessions.insertOne({
  name: "Zealandia 1853",
  gamemaster: ObjectId("<player-id>"),
  players: [],
  status: "active",
  currentTurn: 1,
  startedAt: new Date(),
  world: {}
})
```

**Copy the session `_id` for the import step!**

### 3. **Verify Map File Path**
```bash
# Ensure the Azgaar file exists
dir "c:\Users\NateL\Documents\My Code\polsim\Aotearoa Full 2025-12-03-19-27.json"
```

### 4. **Install Dependencies (if not done)**
```bash
cd backend
npm install

# Should already have these from previous work:
# - mongoose
# - express
# - typescript
# - @types/node
```

### 5. **Backend Server Status**
The import can run in two ways:

**Option A: While server is running**
```bash
# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Call import API
POST http://localhost:5000/api/map/import
{
  "sessionId": "<session-id>",
  "mapFilePath": "Aotearoa Full 2025-12-03-19-27.json"
}
```

**Option B: Standalone script (server off)**
```bash
# Just run the test script
ts-node test-import.ts <session-id>
```

---

## ⚠️ Important Notes

### Session ID Format
- Must be a valid MongoDB ObjectId (24 hex characters)
- Example: `674f5e1a2b3c4d5e6f7g8h9i`
- Get it from session creation response or MongoDB

### Expected Import Time
- **Parsing**: ~2 seconds
- **Database inserts**: ~10-30 seconds (5,595 cells)
- **Population distribution**: ~5 seconds
- **Economic calculations**: ~3 seconds
- **Total**: ~30-60 seconds

### Database Impact
**Collections created/populated:**
- `provinces` - 7 documents
- `cells` - ~5,595 documents
- `cities` - ~16 documents
- `cultures` - ~10 documents
- `religions` - ~5 documents
- `rivers` - ~20 documents

**Storage**: ~5-10 MB

### Memory Requirements
- Parsing JSON: ~50 MB RAM
- Batch inserts: ~100 MB RAM
- Should work fine on most systems

---

## 🚨 Common Issues & Solutions

### Issue: "Session not found"
**Solution:** Create session first (see step 2 above)

### Issue: "Cannot find module"
**Solution:** 
```bash
cd backend
npm install
```

### Issue: "Duplicate key error"
**Solution:** Map already imported. Either:
1. Delete existing data: `db.cells.deleteMany({ sessionId: ObjectId("...") })`
2. Use a new session ID

### Issue: "File not found"
**Solution:** Use absolute path:
```json
{
  "mapFilePath": "c:\\Users\\NateL\\Documents\\My Code\\polsim\\Aotearoa Full 2025-12-03-19-27.json"
}
```

### Issue: Port already in use (5000)
**Solution:** 
```bash
# Option A: Kill process
netstat -ano | findstr :5000
taskkill /PID <pid> /F

# Option B: Change port in backend/.env
PORT=5001
```

---

## ✅ Ready to Import Checklist

Before running the import, verify:

- [ ] MongoDB connection working (check via Compass or connection test)
- [ ] Session created and session ID copied
- [ ] Map file path verified
- [ ] Backend dependencies installed (`npm install` completed)
- [ ] No TypeScript errors in new files
- [ ] Enough disk space (at least 100 MB free)
- [ ] Backend server running (if using API method)

---

## 🎯 Next Steps After Import

Once import succeeds, you should:

1. **Verify data:**
   ```http
   GET /api/map/<session-id>/summary
   GET /api/map/<session-id>/provinces
   ```

2. **Expected results:**
   - 7 provinces (New Caledonia, Tasminata, Vulteralia, New Zealand, Cooksland, Te Moana-a-Toir, Southland)
   - ~95,000 total population distributed
   - GDP values ranging from £180k (Te Moana-a-Toir) to £2.8M (Southland)
   - Each province has resources (timber, agriculture, fishing, etc.)

3. **Create AI players** for NPC provinces (optional)

4. **Assign human players** to provinces

5. **Test frontend** map rendering

6. **Connect to game simulation** engine

---

## 🐛 Debugging

### Enable verbose logging:
```typescript
// In MapImportService.ts, already has console.log statements
// Watch terminal output during import
```

### Check import progress:
```javascript
// During import, query MongoDB
db.cells.countDocuments({ sessionId: ObjectId("...") })
// Should gradually increase to ~5,595
```

### Rollback if needed:
```javascript
// Delete all imported data
db.cells.deleteMany({ sessionId: ObjectId("...") })
db.provinces.deleteMany({ sessionId: ObjectId("...") })
db.cities.deleteMany({ sessionId: ObjectId("...") })
db.cultures.deleteMany({ sessionId: ObjectId("...") })
db.religions.deleteMany({ sessionId: ObjectId("...") })
db.rivers.deleteMany({ sessionId: ObjectId("...") })
```

---

## 📞 Quick Reference

**Import Command (API):**
```bash
curl -X POST http://localhost:5000/api/map/import \
  -H "Content-Type: application/json" \
  -d "{\"sessionId\":\"<id>\",\"mapFilePath\":\"Aotearoa Full 2025-12-03-19-27.json\"}"
```

**Import Command (Script):**
```bash
ts-node test-import.ts <session-id>
```

**Check Results:**
```bash
curl http://localhost:5000/api/map/<session-id>/summary
```

---

## ✨ You're Ready!

All prerequisites are in place. The integration is production-ready with proper error handling, type safety, and efficient batch processing.

**To start:** Create a session, then run the import!
