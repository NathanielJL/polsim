# Troubleshooting Guide

## Authentication Issues

### "Invalid username or password" Error

**Problem**: Cannot login or register, getting invalid credentials error

**Possible Causes:**

1. **Backend not running**
   ```bash
   # Check if backend is running on port 5000
   curl http://localhost:5000/api/health
   
   # Should return: {"status":"ok","timestamp":"..."}
   ```
   
   **Fix**: Start backend
   ```bash
   cd backend
   npm run dev
   ```

2. **Frontend can't reach backend**
   - Check browser console (F12) for network errors
   - Verify `REACT_APP_API_URL` in `frontend/.env`
   - Should be `http://localhost:5000` for local dev

3. **Database connection issue**
   - Check backend terminal for MongoDB connection errors
   - Verify `MONGODB_URI` in `backend/.env`
   - Ensure MongoDB is running locally

4. **Password mismatch during registration**
   - Ensure password and confirm password fields match
   - Password should meet minimum requirements

**Testing the Fix**:
```bash
# Test registration endpoint directly
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@test.com","password":"password123"}'

# Should return a token and player object
```

---

## Server Startup Issues

### Backend Won't Start

**Error**: `Session validation failed: gamemaster: Path 'gamemaster' is required`

**Fix**: Make gamemaster field optional in Session schema
```typescript
// backend/src/models/mongoose.ts line ~897
gamemaster: { type: Schema.Types.ObjectId, ref: 'Player', required: false },
```

**Error**: `Route.post() requires a callback function but got a [object Undefined]`

**Fix**: Check middleware imports - should be `authMiddleware` not `authenticateToken`
```typescript
// Correct:
import { authMiddleware } from '../middleware/auth';
router.post('/endpoint', authMiddleware, async (req, res) => { ... });

// Wrong:
import { authenticateToken } from '../middleware/auth';  // doesn't exist
```

**Error**: `Cannot find module`

**Fix**: Install dependencies
```bash
cd backend
npm install
```

**Error**: `Port 5000 already in use`

**Fix**: Kill existing process
```bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:5000 | xargs kill -9
```

---

### Frontend Won't Start

**Error**: `Something is already running on port 3000`

**Fix**: Either:
1. Kill existing process (see above)
2. Or use different port:
   ```bash
   PORT=3001 npm start
   ```

**Error**: `Cannot find module 'react'`

**Fix**: Install dependencies
```bash
cd frontend
npm install
```

---

## Database Issues

### MongoDB Connection Failed

**Error**: `MongooseError: connect ECONNREFUSED`

**Cause**: MongoDB not running

**Fix**:
```bash
# Windows (if installed as service)
net start MongoDB

# Mac
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Alternative**: Use MongoDB Atlas (cloud)
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Update `MONGODB_URI` in `backend/.env`

---

### Database Query Errors

**Error**: `Player not found` or similar model errors

**Cause**: Database might be empty or missing collections

**Fix**: 
1. Check if database exists:
   ```javascript
   // In MongoDB shell or Compass
   show dbs
   use polsim
   show collections
   ```

2. If empty, register a new account to populate initial data

---

## API Request Errors

### CORS Errors in Browser Console

**Error**: `Access to fetch at ... has been blocked by CORS policy`

**Cause**: Backend not configured to accept frontend origin

**Fix**: Check `backend/.env`
```env
FRONTEND_URL=http://localhost:3000
```

And verify in `backend/src/index.ts`:
```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true
}));
```

---

### 401 Unauthorized Errors

**Problem**: Logged in but getting 401 errors on API calls

**Causes**:

1. **Token expired**: JWT tokens expire after some time
   - **Fix**: Log out and log back in

2. **Token not being sent**: Check localStorage
   ```javascript
   // In browser console
   console.log(localStorage.getItem('authToken'));
   ```
   - Should show a JWT token
   - If null, need to log in again

3. **authMiddleware not configured correctly**
   - Check `backend/src/middleware/auth.ts`
   - Ensure it reads `Authorization: Bearer <token>` header

---

## Turn System Issues

### Turns Not Advancing

**Problem**: Game stuck on same turn

**Check**:
1. Backend terminal for scheduler errors
2. Session `autoAdvanceEnabled` should be `true`
3. Session `turnEndTime` should be set

**Fix**: Check session in database
```javascript
db.sessions.findOne({ status: 'active' })
// Check: autoAdvanceEnabled, turnEndTime, currentTurn
```

**Manual Advance** (for testing):
```bash
POST http://localhost:5000/api/turns/advance
{
  "sessionId": "your-session-id"
}
```

---

### Actions Not Processing

**Problem**: Submit action but it doesn't register

**Check**:
1. Action points remaining (need at least 1)
2. Backend logs for processing errors
3. Database for action record

**Debug**:
```javascript
// Check player's actions
db.players.findOne({ username: "YourUsername" })
// Look at: actionsRemaining, currentTurn
```

---

## GM Dashboard Issues

### Can't Access GM Dashboard

**Problem**: Redirected to GM Portal or access denied

**Cause**: Account not flagged as Game Master

**Fix**: Update in database
```javascript
db.players.updateOne(
  { username: "YourUsername" },
  { $set: { isGameMaster: true } }
)
```

Then log out and log back in.

---

### GM Actions Not Working

**Problem**: Can't approve events, modify values, etc.

**Check**:
1. `isGameMaster` field in auth token response
2. Backend `gmOnly` middleware working
3. Browser console for API errors

---

## Performance Issues

### Slow Page Loads

**Possible Causes**:
1. Large database queries without pagination
2. Too many WebSocket connections
3. Not enough system resources

**Optimizations**:
1. Add pagination to list endpoints
2. Limit database query results
3. Add indexes to frequently queried fields

---

## Development Environment Issues

### TypeScript Errors

**Problem**: Tons of TypeScript errors but code runs

**Explanation**: Using `--transpile-only` flag skips type checking

**To see errors**:
```bash
cd backend
npx tsc --noEmit
```

**To fix**: Address each error or adjust `tsconfig.json` strict settings

---

### Git Push Failures

**Error**: `failed to push some refs`

**Cause**: Remote has commits you don't have locally

**Fix**:
```bash
git pull origin main --rebase
git push origin main
```

**Error**: `large files detected`

**Fix**: Use Git LFS or add to `.gitignore`
```bash
# Add large files to .gitignore
echo "backend/node_modules" >> .gitignore
echo "frontend/node_modules" >> .gitignore
echo "*.json" >> .gitignore  # If JSON files are huge
git add .gitignore
git commit -m "Update gitignore"
```

---

## Common Fixes

### Nuclear Option: Fresh Start

If everything is broken:

```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
npm run dev

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start

# Database (WARNING: Deletes all data)
# In MongoDB shell
use polsim
db.dropDatabase()
```

---

## Getting More Help

### Check Logs

**Backend**:
```bash
# Terminal where backend is running
# Watch for errors, stack traces
```

**Frontend**:
```
Browser DevTools → Console (F12)
Browser DevTools → Network tab
```

**Database**:
```bash
# MongoDB logs
# Windows: C:\Program Files\MongoDB\Server\6.0\log\mongod.log
# Mac: /usr/local/var/log/mongodb/mongo.log
# Linux: /var/log/mongodb/mongod.log
```

### Debug Mode

Enable verbose logging:

**Backend**:
```typescript
// backend/src/index.ts
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

**Frontend**:
```typescript
// frontend/src/services/api.ts
console.log('Making request:', config);
```

---

## Still Stuck?

1. **Check documentation**: README.md, DEPLOYMENT.md, API_REFERENCE.md
2. **Search issues**: https://github.com/NathanielJL/polsim/issues
3. **Create issue**: Provide:
   - Error message (full stack trace)
   - Steps to reproduce
   - System info (OS, Node version, etc.)
   - What you've tried

---

## Quick Reference

### Restart Everything
```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm start
```

### Check Everything is Running
```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend
# Open http://localhost:3000 in browser

# MongoDB
# Connect with MongoDB Compass to mongodb://localhost:27017
```

### First Time Setup Checklist
- [ ] Node.js installed (18+)
- [ ] MongoDB installed and running
- [ ] Backend .env configured
- [ ] Frontend .env configured
- [ ] Backend dependencies installed (`npm install`)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Backend running (port 5000)
- [ ] Frontend running (port 3000)
- [ ] Can register account
- [ ] Can login
- [ ] Made self GM (MongoDB update)
