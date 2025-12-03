# Authentication System Implementation

## Overview

The authentication system has been fully implemented with:
- JWT token-based authentication
- Password hashing with bcryptjs
- Protected routes on frontend
- API client with automatic token management
- React hooks for auth state

## Backend Components

### 1. Auth Utilities (`backend/src/utils/auth.ts`)

Functions for password and token management:
- `hashPassword()` - Hash passwords using bcryptjs
- `comparePassword()` - Verify passwords
- `generateToken()` - Create JWT tokens (7-day expiry)
- `verifyToken()` - Validate and decode JWT tokens
- `extractTokenFromHeader()` - Parse Authorization header

### 2. Auth Middleware (`backend/src/middleware/auth.ts`)

Express middleware for protecting routes:
- `authMiddleware` - Requires valid token, fails with 401
- `optionalAuthMiddleware` - Allows requests without token

Usage:
```typescript
import { authMiddleware } from './middleware/auth';

router.get('/protected-route', authMiddleware, (req: AuthRequest, res) => {
  // req.playerId and req.username available
});
```

### 3. Auth Routes (`backend/src/routes/auth.ts`)

API endpoints:
- `POST /auth/register` - Create new player account
- `POST /auth/login` - Login with credentials
- `POST /auth/verify` - Check token validity (protected)
- `POST /auth/logout` - Logout (protected)

Response format:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "player123",
    "email": "player@example.com"
  }
}
```

### 4. Player Routes (`backend/src/routes/players.ts`)

Player profile endpoints:
- `GET /api/players/:playerId` - Get public player profile
- `GET /api/players/me/profile` - Get current player (protected)
- `PUT /api/players/me/profile` - Update profile (protected)
- `GET /api/players/leaderboard` - Get top players
- `GET /api/players/:playerId/reputation` - Get reputation breakdown

## Frontend Components

### 1. API Client (`frontend/src/services/api.ts`)

Singleton service for API communication:
```typescript
import api from './services/api';

// Register
const { token, player } = await api.register({
  username: 'player1',
  email: 'player@example.com',
  password: 'password123'
});

// Login
const { token, player } = await api.login({
  username: 'player1',
  password: 'password123'
});

// Get profile
const profile = await api.getMyProfile();

// Logout
await api.logout();
```

Features:
- Automatic token storage (localStorage)
- Request/response interceptors
- Auto-logout on 401 responses
- Bearer token injection in all requests

### 2. useAuth Hook (`frontend/src/hooks/useAuth.ts`)

React hook for auth state management:
```typescript
const { player, isAuthenticated, loading, login, register, logout } = useAuth();

if (loading) return <div>Loading...</div>;

if (!isAuthenticated) {
  return <LoginForm onLogin={login} />;
}

return <Dashboard player={player} />;
```

### 3. Auth Page (`frontend/src/pages/AuthPage.tsx`)

Complete login/register UI with:
- Toggle between login and register modes
- Form validation
- Error handling
- Loading states
- Auto-redirect on success

### 4. Protected Routes (`frontend/src/App.tsx`)

Route protection wrapper:
```typescript
<Route
  path="/markets"
  element={
    <ProtectedRoute>
      <MarketsPage />
    </ProtectedRoute>
  }
/>
```

Routes requiring authentication:
- `/` - Home/Dashboard
- `/markets` - Markets page
- `/news` - News page
- `/government` - Government page
- `/reputation` - Reputation page
- `/gm-dashboard` - Game Master dashboard

Public routes:
- `/auth` - Login/Register page

## Setup Instructions

### Backend

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment variables** (`.env`):
   ```
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   MONGODB_URI=mongodb://localhost/polsim
   JWT_SECRET=your-secret-key-here
   ```

3. **Start MongoDB:**
   ```bash
   mongod
   ```
   Or use MongoDB Atlas cloud service.

4. **Run development server:**
   ```bash
   npm run dev
   ```
   Server will be available at `http://localhost:5000`

### Frontend

1. **Install dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables** (`.env`):
   ```
   REACT_APP_API_URL=http://localhost:5000
   ```

3. **Start development server:**
   ```bash
   npm start
   ```
   Application will be available at `http://localhost:3000`

## Testing the System

### Register a New Player

```bash
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "test@example.com",
    "password": "password123"
  }'
```

Response:
```json
{
  "message": "Player registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "testplayer",
    "email": "test@example.com"
  }
}
```

### Login

```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "password": "password123"
  }'
```

### Access Protected Route

```bash
curl -X POST http://localhost:5000/auth/verify \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIs..."
```

## Security Considerations

1. **Password Storage**: Passwords are hashed with bcryptjs (10 salt rounds)
2. **Token Expiry**: JWT tokens expire after 7 days
3. **HTTPS**: Use HTTPS in production
4. **JWT Secret**: Use a strong, random secret in production
5. **CORS**: Frontend URL is configurable via FRONTEND_URL env var
6. **SQL/NoSQL Injection**: Mongoose handles query sanitization

## Next Steps

1. ✅ Authentication system complete
2. Next: Game initialization (world generation)
3. Then: API endpoints for game mechanics
4. Then: Frontend integration for other pages

## Troubleshooting

**"Cannot find module" errors:**
```bash
npm install
npm install --save-dev @types/bcryptjs @types/jsonwebtoken
```

**MongoDB connection errors:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Try `mongodb://localhost:27017/polsim` if needed

**"Invalid or expired token":**
- Token may have expired (7 days)
- User needs to login again
- Check that JWT_SECRET matches on backend

**CORS errors:**
- Ensure FRONTEND_URL env var matches frontend URL
- Frontend should be at http://localhost:3000
- Backend should be at http://localhost:5000
