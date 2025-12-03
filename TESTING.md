# Testing POLSIM Authentication System

## Quick Start

### 1. Install Dependencies

**Option A: Automatic (Recommended)**
- Double-click `install_backend.bat` to install backend dependencies
- Double-click `install_frontend.bat` to install frontend dependencies

**Option B: Manual**
```bash
cd backend
npm install

cd ../frontend
npm install
```

### 2. Configure Environment Variables

**Backend (.env)**
Create `backend/.env` from `backend/.env.example`:
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost/polsim
JWT_SECRET=dev-secret-key-change-in-production
LOG_LEVEL=debug
```

**Frontend (.env)**
Create `frontend/.env` from `frontend/.env.example`:
```
REACT_APP_API_URL=http://localhost:5000
```

### 3. Start MongoDB

You need MongoDB running. Choose one:

**Option A: Local MongoDB**
```bash
mongod
```
(Ensure MongoDB is installed on your system)

**Option B: MongoDB Atlas (Cloud)**
1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Get your connection string
4. Add to `.env`: `MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/polsim?retryWrites=true&w=majority`

### 4. Start Development Servers

**Option A: Automatic**
- Double-click `start_dev.bat`
- This will open two command windows:
  - Backend server on http://localhost:5000
  - Frontend server on http://localhost:3000

**Option B: Manual (in separate terminals)**
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm start
```

### 5. Test in Browser

1. Open http://localhost:3000 in your browser
2. You should see the POLSIM login page
3. Click "Register" to create a new account
4. Fill in:
   - Username: `testplayer1`
   - Email: `test@example.com`
   - Password: `password123`
5. Click "Register"
6. You should be logged in and see the home page
7. Try logging out and logging back in

## Testing Checklist

### Registration Flow
- [ ] Navigate to login page
- [ ] Click "Register" button
- [ ] Fill in username, email, password
- [ ] Click "Register" button
- [ ] Should see success message
- [ ] Should be redirected to home page
- [ ] Token should be saved in localStorage

### Login Flow
- [ ] Logout from previous account
- [ ] Fill in username and password
- [ ] Click "Login" button
- [ ] Should see success message
- [ ] Should be redirected to home page

### Session Persistence
- [ ] Login to account
- [ ] Refresh the page (F5)
- [ ] Should still be logged in
- [ ] Token should be restored from localStorage

### Protected Routes
- [ ] Logout completely
- [ ] Try accessing http://localhost:3000/markets
- [ ] Should redirect to login page
- [ ] Try accessing http://localhost:3000/government
- [ ] Should redirect to login page

### Error Handling
- [ ] Try registering with existing username
- [ ] Should see error message "Username or email already taken"
- [ ] Try login with wrong password
- [ ] Should see error message "Invalid username or password"
- [ ] Try registering with short password (< 6 chars)
- [ ] Should see error message in form

### Profile Page
- [ ] Login to account
- [ ] Navigate to different pages (Markets, News, etc.)
- [ ] All pages should load (they're placeholders for now)
- [ ] Logout button should work

## API Testing (curl or Postman)

### Register New Player
```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testplayer2\",
    \"email\": \"player2@example.com\",
    \"password\": \"password123\"
  }"
```

Expected response:
```json
{
  "message": "Player registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testplayer2",
    "email": "player2@example.com"
  }
}
```

### Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"testplayer2\",
    \"password\": \"password123\"
  }"
```

### Verify Token
```bash
curl -X POST http://localhost:5000/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get My Profile
```bash
curl -X GET http://localhost:5000/api/players/me/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Get Leaderboard
```bash
curl http://localhost:5000/api/players/leaderboard
```

## Troubleshooting

### MongoDB Connection Error
**Problem**: "MongoServerError: connect ECONNREFUSED"

**Solution**:
1. Ensure MongoDB is running (`mongod` in another terminal)
2. Or use MongoDB Atlas cloud service
3. Check MONGODB_URI in `.env`

### npm install fails
**Problem**: "npm ERR! code ERESOLVE"

**Solution**:
```bash
npm install --legacy-peer-deps
```

### Port Already in Use
**Problem**: "Error: listen EADDRINUSE :::5000"

**Solution**:
1. Change PORT in `.env` (e.g., 5001)
2. Or kill existing process on port 5000

**Windows**:
```bash
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Frontend Can't Connect to Backend
**Problem**: "Network Error" when trying to login

**Solution**:
1. Ensure backend is running on http://localhost:5000
2. Check REACT_APP_API_URL in frontend `.env`
3. Check FRONTEND_URL in backend `.env`
4. Restart frontend: `npm start`

### Token Invalid After Register
**Problem**: "Invalid or expired token" immediately after registering

**Solution**:
1. Check JWT_SECRET in backend `.env`
2. Ensure it's the same when token is generated and verified
3. Restart backend: `npm run dev`

## Expected Behavior

### First Time User
1. Sees login page
2. Clicks Register
3. Fills in credentials
4. Gets JWT token
5. Redirected to home page
6. Can access all game pages
7. Profile/leaderboard show user data

### Returning User
1. Sees login page
2. Fills in credentials
3. Gets new JWT token
4. Redirected to home page
5. Can access all game pages
6. localStorage persists token across sessions

### Invalid Credentials
1. User sees error message
2. Stays on login page
3. Can try again

### Session Expired
1. Page refresh loads user from token
2. If token invalid, redirected to login
3. User can login again

## Performance Notes

- First load takes ~3-5 seconds (React compilation)
- Login/register takes ~1-2 seconds (password hashing is intentionally slow)
- Pages load instantly after auth
- Database queries should be < 100ms

## Next Steps After Testing

1. ✅ Verify auth system works end-to-end
2. Build game initialization (world generation)
3. Implement turn system
4. Connect game pages to backend
5. Add real game mechanics

## Support

If you encounter issues:
1. Check the console (browser DevTools, terminal output)
2. Verify all environment variables are set correctly
3. Ensure MongoDB is running and accessible
4. Check that ports 5000 and 3000 are not in use
5. Review error messages carefully

---

**Status**: Ready to test ✅
**Test Date**: December 2, 2025
