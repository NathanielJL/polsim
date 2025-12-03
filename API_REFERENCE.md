# API Quick Reference

## Base URLs
- **Backend**: `http://localhost:5000`
- **Frontend**: `http://localhost:3000`

## Authentication Endpoints

### Register
```
POST /auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player@example.com",
  "password": "password123"
}

Response 201:
{
  "message": "Player registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "player1",
    "email": "player@example.com"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "password123"
}

Response 200:
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "player1",
    "email": "player@example.com"
  }
}
```

### Verify Token
```
POST /auth/verify
Authorization: Bearer {token}

Response 200:
{
  "valid": true,
  "player": {
    "id": "507f1f77bcf86cd799439011",
    "username": "player1",
    "email": "player@example.com"
  }
}
```

### Logout
```
POST /auth/logout
Authorization: Bearer {token}

Response 200:
{
  "message": "Logged out successfully"
}
```

## Player Endpoints

### Get Player by ID
```
GET /api/players/:playerId

Response 200:
{
  "_id": "507f1f77bcf86cd799439011",
  "username": "player1",
  "ideologyPoint": {
    "economic": 25,
    "social": -10,
    "personalFreedom": 50
  },
  "overallApproval": 45,
  "approval": {
    "Aristocrats": 50,
    "Entrepreneurs": 40,
    ...
  }
}
```

### Get My Profile
```
GET /api/players/me/profile
Authorization: Bearer {token}

Response 200:
(same as above, without password field)
```

### Update My Profile
```
PUT /api/players/me/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "bio": "I love politics",
  "displayName": "Supreme Leader"
}

Response 200:
(updated player object)
```

### Get Leaderboard
```
GET /api/players/leaderboard?limit=50&skip=0

Response 200:
{
  "players": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "username": "player1",
      "overallApproval": 85,
      ...
    },
    ...
  ],
  "total": 1234,
  "limit": 50,
  "skip": 0
}
```

### Get Player Reputation
```
GET /api/players/:playerId/reputation

Response 200:
{
  "overall": 45,
  "byGroup": {
    "Aristocrats": 50,
    "Entrepreneurs": 40,
    "WorkersUnion": 35,
    ...
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "error": "Username, email, and password are required"
}
```

### 401 Unauthorized
```json
{
  "error": "Invalid or expired token"
}
```

### 409 Conflict
```json
{
  "error": "Username or email already taken"
}
```

### 404 Not Found
```json
{
  "error": "Player not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

## Common Patterns

### Making Authenticated Requests

JavaScript/Axios:
```javascript
import api from './services/api';

// Automatically adds Authorization header
const profile = await api.getMyProfile();
```

curl:
```bash
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/players/me/profile
```

### Handling Responses

```typescript
try {
  const { token, player } = await api.login(credentials);
  // Token automatically saved to localStorage
  // Can now make authenticated requests
} catch (error) {
  if (error.response?.status === 401) {
    // Invalid credentials
  } else {
    // Other error
  }
}
```

## Token Management

- **Storage**: localStorage (key: `authToken`)
- **Format**: Bearer token in Authorization header
- **Expiry**: 7 days from issue
- **Auto-logout**: On 401 response

## HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Login successful |
| 201 | Created | Player registered |
| 400 | Bad Request | Missing fields |
| 401 | Unauthorized | Invalid token |
| 404 | Not Found | Player not found |
| 409 | Conflict | Username taken |
| 500 | Server Error | Database error |

## Rate Limiting (Not Yet Implemented)

Currently no rate limiting. Recommend adding before production:
- 10 register attempts per IP per hour
- 20 login attempts per IP per hour
- 100 API calls per token per hour

## CORS Configuration

Frontend URL must match `FRONTEND_URL` env var:
```
FRONTEND_URL=http://localhost:3000
```

## Socket.io Events (Not Yet Integrated)

Currently Socket.io is set up but no events are being used for game logic.

## Pagination

Leaderboard supports pagination:
```
GET /api/players/leaderboard?limit=50&skip=0
```
- `limit`: Max 100 results per page
- `skip`: Offset from beginning

## Testing Tools

### Thunder Client / Postman
1. Open in VS Code
2. Create collection for POLSIM
3. Add requests with variables for token
4. Test endpoints

### curl
```bash
# Register
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"pass123"}'

# Login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"pass123"}'

# Get profile
curl -H "Authorization: Bearer {token}" \
  http://localhost:5000/api/players/me/profile
```

## Future Endpoints (Planned)

- `POST /api/sessions` - Create game session
- `GET /api/sessions/:sessionId` - Get session info
- `POST /api/actions` - Submit action
- `GET /api/markets` - List markets
- `POST /api/trades` - Execute trade
- `GET /api/news` - Get news articles
- `POST /api/news` - Submit article
- `GET /api/government/laws` - List laws
- `POST /api/government/propose` - Propose policy
- `POST /api/events/:eventId/review` - GM review event
- And 10+ more...

---

**Last Updated**: December 2, 2025
**Total Endpoints**: 8 (auth + players)
**Ready for Testing**: Yes ✅
