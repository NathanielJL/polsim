# Single Lobby Game Implementation

## Overview
Converted POLSIM from a multi-session game to a **single continuous global lobby** where all players join the same persistent game world, even if they register at different turns.

## Key Changes

### 1. Global Session Architecture

**Backend: `GameInitializationService.ts`**
- Added `getOrCreateGlobalSession()` method
- Creates "Zealandia - Global Session" on first player registration
- Session starts at in-game date: January 1, 1840
- No gamemaster (GM) - it's a persistent lobby
- All new players automatically join this session

**Features:**
- Session is created once and persists forever
- Provinces, markets, and game world initialized on first creation
- Turn system runs continuously (24-hour real-time turns)
- New players can join at any turn number

### 2. Automatic Player Registration Flow

**Backend: `routes/auth.ts`**
When a new player registers:
1. ✅ Password hashed and validated
2. ✅ Global session fetched (or created if first player)
3. ✅ Random starting province assigned from session
4. ✅ AI-generated portrait assigned (`/ai-portraits/1-100.png`)
5. ✅ Player added to global session's player list
6. ✅ Starting resources: £1,000 cash, 5 action points

**Player Schema Updates:**
```typescript
sessionId: ObjectId // Reference to global session
currentProvinceId: ObjectId // Random starting province
portraitUrl: String // AI portrait path
cash: Number (default: 1000)
actionsRemaining: Number (default: 5)
```

### 3. Frontend Simplification

**Frontend: `HomePage.tsx`**
- ❌ Removed session creation UI/form
- ❌ Removed "Create New Game" button
- ✅ Automatically loads global session on login
- ✅ Shows error message if session fails to load

**User Flow:**
1. Register → Auto-join global session
2. Login → Load global session automatically
3. Play → No session selection needed

### 4. Leaflet Map Integration

**Frontend: `public/index.html`**
- Added Leaflet CSS CDN link (integrity hash included)
- Ensures map tiles and controls render properly

**Packages (Already Installed):**
- `leaflet`: ^1.9.4
- `react-leaflet`: ^5.0.0
- `@types/leaflet`: ^1.9.21

## Game Session Details

**Session Name:** "Zealandia - Global Session"

**Game Start Date:** January 1, 1840 (lore-accurate)

**Turn System:**
- 1 turn = 1 in-game month
- 24 real-time hours per turn
- Auto-advance enabled

**Player Onboarding:**
- Random province assignment (ensures distribution)
- Unique AI portrait (1-100)
- Starting cash: £1,000
- Starting AP: 5
- Starting ideology: Neutral (0, 0, 0)

## Benefits of Single Lobby

✅ **No fragmentation** - All players in same world
✅ **Late joiners welcome** - Join at turn 50, 100, 200+
✅ **Persistent politics** - Parties, laws, and history continue
✅ **True multiplayer** - Elections, trading, campaigns between all players
✅ **Simplified UX** - No session management confusion
✅ **Scalable** - Can support hundreds of players in one world

## Technical Notes

### Database Impact
- **One Session document** for entire game
- Players collection grows with each registration
- Session.players array contains all player IDs
- Provinces tied to single session ID

### Performance Considerations
- Turn processing handles all players at once
- Consider indexing `Session.players` for large player counts
- Province queries filtered by `sessionId` (always same value)

### Migration Path
If you have existing test data:
1. Delete all Session documents
2. Delete all Player documents (or update to add sessionId)
3. Register first player → Creates global session
4. All subsequent registrations join that session

## Files Modified

**Backend:**
- `backend/src/routes/auth.ts` - Auto-join logic
- `backend/src/services/GameInitializationService.ts` - Global session creation
- `backend/src/models/mongoose.ts` - Player schema (sessionId, portraitUrl)

**Frontend:**
- `frontend/src/pages/HomePage.tsx` - Removed session creation UI
- `frontend/public/index.html` - Added Leaflet CSS

## Next Steps

**Recommended:**
1. Generate 100 AI portraits and place in `frontend/public/ai-portraits/`
2. Test registration flow (first player creates session)
3. Test late-joining (register at turn 10+)
4. Monitor Session.players array size
5. Add player count to session info display

**Optional Enhancements:**
- Show "X players online" counter
- Player directory/search
- Province population heatmap (show where players are)
- "New player joined!" notifications
- Welcome message with tutorial for new players

## Lore Integration

**Game Start: January 1, 1840**
- British colonial administration beginning
- European male landowners can vote (1.86% of population)
- Provincial governance being established
- Players arrive as new colonists/settlers
- Build wealth, influence politics, shape Zealandia's future

This aligns with the historical setting where new settlers arrived continuously over decades, making late-joining lore-accurate.
