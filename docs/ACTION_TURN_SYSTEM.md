# Action Point & Turn System Implementation

## Overview
Complete implementation of action point tracking and automatic turn progression for the Zealandia political simulation.

## Action Point System

### Core Mechanics
- **Starting AP**: 5 action points per turn
- **Reset Frequency**: Every 24 hours (1 turn)
- **Bonus AP**: Party leaders get +3 AP when fundraising

### Action Costs

**1 AP Actions:**
- Move to different province
- Invest in business
- Submit policy proposal
- Campaign for office
- Endorse candidate
- Take bar exam
- Party fundraising (leaders only, grants +3 AP bonus)
- Create business
- Create newspaper

**0 AP (Free) Actions:**
- Vote on policy
- Participate in court case
- Parliamentary debate
- View dashboards
- Read news

### Implementation Files

**Middleware**: `backend/src/middleware/actionPoints.ts`

**Key Functions:**
```typescript
// Check if player has enough AP before action
requireActionPoints(cost: number)

// Consume AP after successful action
consumeActionPoints(player, cost)

// Grant bonus AP (party leader fundraising)
grantActionPoints(playerId, bonus)

// Reset all players' AP (called on turn change)
resetActionPoints(sessionId)

// Get current AP for player
getActionPoints(playerId)
```

**Routes**: `backend/src/routes/actions.ts`

**API Endpoints:**
```
GET /api/actions/remaining/:playerId - Get remaining AP
GET /api/actions/history/:playerId - Get action history
GET /api/actions/session/:sessionId - Get all actions (GM view)
POST /api/actions/reset/:sessionId - Reset AP (GM only)
GET /api/actions/costs - Get reference list of AP costs
```

### Usage Example

**In Route Handler:**
```typescript
import { requireActionPoints, consumeActionPoints, ActionPointRequest } from '../middleware/actionPoints';

router.post('/submit', 
  authMiddleware, 
  requireActionPoints(1), 
  async (req: ActionPointRequest, res: Response) => {
    // ... perform action ...
    
    // Consume AP after success
    await consumeActionPoints(req.player, req.apCost || 1);
    
    res.json({ 
      success: true,
      actionsRemaining: req.player.actionsRemaining 
    });
  }
);
```

**Error Response (Insufficient AP):**
```json
{
  "error": "Insufficient action points",
  "required": 1,
  "available": 0,
  "message": "This action requires 1 AP, but you only have 0 AP remaining this turn."
}
```

---

## Turn System

### Turn Mechanics

**Turn Duration:**
- **Real-time**: 24 hours
- **In-game**: 1.2 months (36 days)
- **Starting date**: June 1, 1854

**Turn Progression:**
1. Calculate company profits (5% of valuation, 30% margin)
2. Distribute dividends (50% of company cash)
3. Process enacted policies (apply GDP/price/unemployment effects)
4. Reset player action points to 5
5. Advance turn number
6. Advance in-game date by 1.2 months
7. Check for annual events (elections, immigration)
8. Archive old turns (keep last 24)
9. Schedule next turn in 24 hours

**Annual Events:**
- **Elections**: Every 3 years in November (1855, 1858, 1861...)
- **Immigration**: Every January, 2% population growth per province

### Implementation Files

**Service**: `backend/src/services/TurnService.ts`

**Key Methods:**
```typescript
// Initialize turn system for new session
initializeTurnSystem(sessionId, startDate)

// Schedule auto-processing in 24 hours
scheduleTurnEnd(sessionId)

// Process turn end (auto or manual)
processTurnEnd(sessionId)

// Advance in-game date by 1.2 months
advanceInGameDate(currentDate)

// Calculate company profits
calculateCompanyProfits(sessionId)

// Distribute dividends to shareholders
distributeDividends(sessionId)

// Process enacted policies
processPolicies(sessionId)

// Check for annual events
checkAnnualEvents(sessionId, inGameDate)

// Archive old turns
archiveOldTurns(sessionId, currentTurn)

// Pause/resume turn timer
pauseTurn(sessionId)
resumeTurn(sessionId)

// Get current turn info
getTurnInfo(sessionId)
```

**Routes**: `backend/src/routes/turns.ts`

**API Endpoints:**
```
GET /api/turns/info/:sessionId - Get current turn info
POST /api/turns/initialize/:sessionId - Initialize turn system (GM only)
POST /api/turns/process/:sessionId - Manually trigger turn processing (GM only)
POST /api/turns/pause/:sessionId - Pause turn timer (GM only)
POST /api/turns/resume/:sessionId - Resume turn timer (GM only)
```

### Turn Processing Flow

```
Turn Start (T0)
↓
[24 hours of gameplay]
↓
Turn End Processing (T+24h)
├── Calculate company profits
├── Distribute dividends
├── Process policies
│   ├── Update province GDPs
│   ├── Update resource prices
│   └── Mark policies as enacted
├── Reset action points (all players → 5 AP)
├── Advance turn number (T+1)
├── Advance in-game date (+36 days)
├── Check annual events
│   ├── Elections (every 3 years, November)
│   └── Immigration (every January, +2% pop)
├── Archive old turns (delete turns < T-24)
└── Schedule next turn
    ↓
    Turn Start (T+1)
```

### Turn Information Response

```json
{
  "currentTurn": 5,
  "inGameDate": "1854-10-07T00:00:00.000Z",
  "turnStartTime": "2024-12-04T10:00:00.000Z",
  "turnEndTime": "2024-12-05T10:00:00.000Z",
  "timeRemaining": {
    "hours": 18,
    "minutes": 35,
    "milliseconds": 66900000
  },
  "status": "active"
}
```

### GM Controls

**Initialize Turn System:**
```bash
POST /api/turns/initialize/:sessionId
{
  "userId": "<gmId>",
  "startDate": "1854-06-01"
}
```

**Manually Advance Turn:**
```bash
POST /api/turns/process/:sessionId
{
  "userId": "<gmId>"
}
```

**Pause Turn Timer:**
```bash
POST /api/turns/pause/:sessionId
{
  "userId": "<gmId>"
}
```

**Resume Turn Timer:**
```bash
POST /api/turns/resume/:sessionId
{
  "userId": "<gmId>"
}
```

---

## Integration with Other Systems

### Policy System
- **Submission**: Costs 1 AP
- **Processing**: Enacted policies auto-apply effects on turn change
- **Effects**: GDP changes, price changes, unemployment updates

### Company System
- **Profits**: Calculated every turn (5% of valuation)
- **Dividends**: Distributed to shareholders (50% of cash)
- **Player Cash**: Auto-updated with dividend payments

### News System
- **Future**: Generate turn summary news articles
- **Future**: "This Week in Zealandia" AI-generated recap

### Immigration System
- **Annual**: 2% population growth every January
- **Event-driven**: GM events can trigger additional immigration
- **Policy-driven**: Policies can boost/reduce immigration

---

## Database Updates

### GameState Schema
```typescript
{
  sessionId: ObjectId,
  currentTurn: Number,
  inGameDate: Date,
  turnStartTime: Date,
  turnEndTime: Date,
  status: "active" | "processing" | "paused"
}
```

### Player Schema
```typescript
{
  actionsRemaining: Number (default: 5),
  // ... existing fields
}
```

### Action Schema
```typescript
{
  playerId: ObjectId,
  sessionId: ObjectId,
  actionType: String,
  details: Mixed,
  apCost: Number,
  turn: Number,
  timestamp: Date
}
```

---

## Setup Instructions

### 1. Initialize Turn System

After creating a session, initialize the turn system:

```bash
POST /api/turns/initialize/<sessionId>
{
  "userId": "<gmId>",
  "startDate": "1854-06-01"
}
```

**Response:**
```json
{
  "success": true,
  "turnState": {
    "sessionId": "...",
    "turnNumber": 1,
    "startTime": "2024-12-04T10:00:00.000Z",
    "endTime": "2024-12-05T10:00:00.000Z",
    "inGameDate": "1854-06-01T00:00:00.000Z",
    "status": "active"
  },
  "message": "Turn system initialized. Turns will auto-process every 24 hours."
}
```

### 2. Monitor Turn Progress

Check current turn info:

```bash
GET /api/turns/info/<sessionId>
```

### 3. Check Player AP

```bash
GET /api/actions/remaining/<playerId>
```

**Response:**
```json
{
  "actionsRemaining": 3,
  "maxActions": 5
}
```

### 4. View Action History

```bash
GET /api/actions/history/<playerId>
```

---

## Testing Checklist

**Action Points:**
- [ ] Submit policy with 5 AP → Success, AP decreases to 4
- [ ] Submit 5 policies → Last one succeeds, AP = 0
- [ ] Try 6th policy with 0 AP → Error: "Insufficient action points"
- [ ] Check AP via `/api/actions/remaining`
- [ ] View action history via `/api/actions/history`

**Turn Processing:**
- [ ] Initialize turn system
- [ ] Verify turn timer scheduled (check logs)
- [ ] Wait 24 hours or manually trigger `/api/turns/process`
- [ ] Verify:
  - [ ] Turn number incremented
  - [ ] In-game date advanced by 36 days
  - [ ] All player AP reset to 5
  - [ ] Company profits calculated
  - [ ] Dividends distributed
  - [ ] Policies processed

**GM Controls:**
- [ ] Pause turn timer → Verify no auto-processing
- [ ] Resume turn timer → Verify auto-processing resumes
- [ ] Manually process turn → Verify immediate turn change

**Annual Events:**
- [ ] Advance to January → Verify immigration (+2% pop)
- [ ] Advance to November 1855 → Verify election event triggered

---

## Future Enhancements

### 1. Turn Summary Dashboard
- Display turn history (last 10 turns)
- Show policies enacted this turn
- Display major events this turn
- Company profit/dividend summary

### 2. Turn Preview
- "What-if" analysis for pending policies
- Projected GDP/unemployment changes
- Estimated dividend payouts

### 3. Variable Turn Lengths
- GM can set turn duration (12hr, 24hr, 48hr)
- "Fast-forward" mode for non-critical periods
- "Slow-motion" mode for elections/crises

### 4. Turn Milestones
- Achievements for reaching Turn 10, 50, 100
- Historical event triggers at specific dates
- Era transitions (1854-1860, 1860-1870, etc.)

### 5. Action Point Bonuses
- Achievements grant bonus AP
- Province governor gets +1 AP
- Party leader gets +1 AP (in addition to fundraising bonus)
- "Early bird" bonus for logging in first each turn

---

## Status

✅ **COMPLETE:**
- Action point middleware (`requireActionPoints`, `consumeActionPoints`)
- Action tracking routes (`/api/actions`)
- Turn service with auto-processing (`TurnService.ts`)
- Turn management routes (`/api/turns`)
- Policy submission with AP cost (1 AP)
- Company profit calculation
- Dividend distribution
- Policy auto-enactment
- AP reset on turn change
- Annual event checking (elections, immigration)
- Turn archiving (keep last 24)
- GM pause/resume controls

🚧 **IN USE:**
- Policy submission route consumes 1 AP
- Turn system auto-processes every 24 hours
- Action history tracked in database

❌ **PENDING:**
- Apply AP costs to other routes:
  - Business routes (invest, create)
  - Election routes (campaign, endorse)
  - Legal routes (bar exam)
  - Player routes (move province)
  - Party routes (fundraising)
- Frontend AP display
- Turn countdown timer UI
- Action history dashboard

---

## API Reference Summary

### Action Points

```typescript
// Middleware
requireActionPoints(cost: number) // Check AP before action
consumeActionPoints(player, cost) // Consume AP after success

// Routes
GET /api/actions/remaining/:playerId
GET /api/actions/history/:playerId
GET /api/actions/session/:sessionId
POST /api/actions/reset/:sessionId
GET /api/actions/costs
```

### Turn Management

```typescript
// Service Methods
turnService.initializeTurnSystem(sessionId, startDate)
turnService.processTurnEnd(sessionId)
turnService.pauseTurn(sessionId)
turnService.resumeTurn(sessionId)
turnService.getTurnInfo(sessionId)

// Routes
GET /api/turns/info/:sessionId
POST /api/turns/initialize/:sessionId
POST /api/turns/process/:sessionId
POST /api/turns/pause/:sessionId
POST /api/turns/resume/:sessionId
```

---

## Key Takeaways

### Why This System Works

1. **Automatic**: Turns process every 24 hours without GM intervention
2. **Fair**: All players get same AP refresh (5 per turn)
3. **Strategic**: Players must prioritize actions (limited AP)
4. **Balanced**: High-impact actions cost AP, low-impact are free
5. **Flexible**: GM can pause/resume/manually advance

### Design Decisions

**24-Hour Turns:**
- Long enough for async multiplayer (players in different timezones)
- Short enough to maintain engagement (daily login incentive)
- Matches real-world commitment (check game once per day)

**5 Action Points:**
- Enough for meaningful gameplay (3-5 actions per day)
- Limited enough to force strategic choices
- Can be extended with bonuses (party leader +3)

**1.2 Month In-Game:**
- 10 turns = 1 year (reasonable pace)
- 200 turns = 20 years (1854-1874, full early colonial period)
- Elections every 3 years = every 30 turns

**Auto-Processing:**
- No GM babysitting required
- Consistent schedule for all players
- Prevents "waiting for GM" bottlenecks
