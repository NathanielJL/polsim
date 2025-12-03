# POLSIM API Documentation

## Base URL
Development: `http://localhost:5000/api`

## Authentication
All authenticated endpoints require JWT token in header:
```
Authorization: Bearer <token>
```

## Endpoints

### Sessions
#### POST /sessions
Create or join a game session
```json
{
  "playerId": "string",
  "sessionName": "string",
  "sessionId": "string?" // optional, creates new if not provided
}
```
Response:
```json
{
  "sessionId": "string",
  "currentTurn": "number",
  "maintenanceActive": "boolean",
  "nextMaintenanceTime": "ISO 8601"
}
```

#### GET /sessions/:sessionId
Get session state
Response:
```json
{
  "id": "string",
  "currentTurn": "number",
  "playerCount": "number",
  "maintenanceActive": "boolean",
  "nextMaintenanceTime": "ISO 8601"
}
```

### Players
#### GET /players/:playerId/home
Get player home data (location, stats, profile)

#### GET /players/:playerId/reputation
Get reputation breakdown by population group

#### POST /players/:playerId/actions
Submit an action
```json
{
  "type": "political|economic|media|administrative",
  "subType": "string",
  "data": "object",
  "cost": "number?" // optional for paid actions
}
```

### Markets
#### GET /markets/:sessionId
Get all markets and current prices

### News
#### GET /news/:sessionId
Get recent news articles and outlets

#### POST /articles/:sessionId
Submit an article (press only)
```json
{
  "playerId": "string",
  "title": "string",
  "content": "string",
  "outletId": "string"
}
```

### Government
#### GET /government/:sessionId/laws
Get federal and provincial laws

#### POST /government/:sessionId/policies
Propose a policy (authenticated players only)

### Game Master Only
#### GET /gm/pending-events/:gmId
Get events pending GM review

#### POST /gm/events/:eventId/review
Review and approve/reject an event
```json
{
  "gmId": "string",
  "approved": "boolean",
  "durationOverride": "number?"
}
```

#### POST /gm/overrides
Create a value override
```json
{
  "gmId": "string",
  "target": "gdp|unemployment|population_mood|event_probability",
  "value": "number",
  "reason": "string"
}
```

#### POST /gm/ai-instructions
Send instruction to AI system
```json
{
  "gmId": "string",
  "instruction": "string",
  "context": "string?",
  "priority": "low|medium|high"
}
```

## WebSocket Events

### Client → Server
- `joinGame` - Join a session
- `submitAction` - Submit a player action
- `subscribeToUpdates` - Subscribe to real-time updates

### Server → Client
- `gameJoined` - Confirmation of session join
- `actionAck` - Action received and queued
- `subscriptionConfirmed` - Update subscription confirmed
- `marketUpdate` - Real-time market price change
- `eventTriggered` - New event occurred
- `newsPublished` - New article published
- `populationMoodShift` - Population opinion changed

## Rate Limiting
- 100 API calls per minute per player
- 5 actions per turn limit (enforced)

## Error Responses
All errors follow this format:
```json
{
  "error": "string",
  "code": "string",
  "details": "object?"
}
```

Common errors:
- `UNAUTHORIZED` - Missing or invalid JWT token
- `ACTION_LIMIT_EXCEEDED` - Player has used all 5 actions this turn
- `INSUFFICIENT_FUNDS` - Action cost exceeds player cash
- `INVALID_OUTLET` - Can't submit to misaligned news outlet
- `NOT_FOUND` - Resource doesn't exist
- `CONFLICT` - Action violates game rules
