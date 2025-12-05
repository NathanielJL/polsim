# POLSIM - Multiplayer Political Economy Simulator

A comprehensive browser-based multiplayer political and economic simulation game where players navigate markets, influence populations, enact policies, and compete for reputation and influence.

## Project Overview

POLSIM is designed as a complex, immersive sandbox where:
- **Players** start with equal footing ($100,000) and advance through reputation-based influence
- **Automated Economy** with multiple markets (healthcare, housing, food, technology, etc.) influenced by policies and company operations
- **Dynamic Population** divided into political archetypes and class levels that respond to events, media, and policies
- **AI-Driven Events** probabilistically generated and shaped by game conditions
- **Media & News** with 3 national AI outlets and player-run local outlets
- **Government Systems** supporting democracies with expandable support for other forms
- **Game Master Tools** for narrative control and world management

## Architecture

### Backend (Node.js/Express)
- **Real-time WebSocket** communication via Socket.io
- **Game Simulation Engine** handling markets, population opinion, event generation, and policy effects
- **Action Queue Manager** tracking player actions (5 per turn limit)
- **Game Master Tools** for event review and world management
- **REST API** for standard queries and mutations

### Frontend (React)
- **Home/Map Page** - Central dashboard with location, stats, and navigation
- **Markets Page** - View and trade goods, stocks, ETFs
- **News Page** - Read articles, submit content to aligned outlets
- **Government Page** - View laws, propose policies, vote, watch provincial debates
- **Reputation Page** - See approval breakdown by population group
- **GM Dashboard** - Event review, value overrides, AI communication

## Core Mechanics

### Reputation System (NEW - December 2025)
- **1,701 Demographic Slices**: Multi-dimensional population tracking
  - Economic: Class × Occupation × Gender × Property Ownership
  - Cultural: Ethnicity × Religion × Indigenous/Mixed status
  - Locational: Province × Settlement (Urban/Rural)
- **Political Positioning**: 3D Cube + 34 Issue Scales
  - Economic (-10 socialist to +10 capitalist)
  - Authority (-10 anarchist to +10 authoritarian)
  - Social (-10 progressive to +10 conservative)
  - 34 policy issues with demographic-specific salience weights
- **Campaigns**: 12-turn campaigns targeting demographics (1 AP + £100, 1-5% boost)
- **Endorsements**: Player-to-player approval transfers based on reputation tiers
- **Dynamic Approval**: 0-100% per demographic, updated based on policies, campaigns, news, endorsements

### Action System
- **5 Actions per Turn** (24-hour cycle) across all activities
- **Action Costs**:
  - Campaign start: 1 AP + £100
  - Endorsement: 1 AP
  - Article submission: varies by outlet
  - Policy proposal: varies
- **Optional Paid Actions**: 
  - Twitter campaign boost ($1000) - increases campaign visibility
  - Article sponsorship ($2500) - amplifies media impact

### Population & Politics (Era: 1840s-1850s New Zealand)
- **97,284 Total Population**:
  - 75,820 Indigenous (Māori)
  - 20,600 European Settlers
  - 863 European-Indigenous (Mixed)
- **1,808 Eligible Voters**: White Male Landowners only (7% of European males)
- **7 Provinces**: Southland, Vulteralia, Cooksland, Tasminata, New Zealand, New Caledonia, Te Moana-a-Toir
- **Top Political Issues** (era-appropriate):
  1. Property-Based Suffrage
  2. Taxes
  3. Land Sales (Tuku Whenua)
  4. Responsible Government
  5. Property Rights
  6. Centralization vs Provincialism
  7. Protectionism
  8. Sovereignty
  9. Kīngitanga (Māori King Movement)
- **Approval Tracking**: Per-demographic approval affects elections, policy success, business profitability, loan rates

### Market Simulation
- **6+ Markets**: Healthcare, Transportation, Housing, Food, Technology, Goods
- **Supply & Demand**: Influenced by population, policies, companies, economy
- **Company Operations**: Auto-calculated monthly profit (turn-based)
- **Stock Market**: Player + AI-influenced stocks and ETFs

### Policy System
- **Proposal & Voting**: Players propose, parliament votes (or direct democracy referendum)
- **Dual Effects**: Numeric modifiers (GDP, unemployment, budget) + event triggers
- **Duration & Decay**: Policies last for specified turns, can be repealed
- **AI-Guided Consequences**: Market crashes, recessions, economic booms

### Event System
- **Probabilistic Generation**: Base 15% per turn, scaled by economic health and population mood
- **GM Review & Approval**: Before turn resolution, GMs can adjust duration and severity
- **Narrative Integration**: Events can trigger policies, influence markets, shift population opinion
- **Long-term Effects**: AI memory system tracks events for historical context

### News & Media
- **National Outlets** (3): AI-operated, politically neutral to slightly biased
- **Local Outlets**: Player-owned and operated (limited to local scope)
- **Article Generation**: AI creates articles about events; players can submit pieces
- **Ideology Matching**: Players can only submit to politically aligned outlets
- **Reputation Impact**: Articles shift group approval based on content

## Turn Resolution Order

1. **Players Submit Actions** (5 action limit)
2. **Maintenance Check** (3-6 hours daily)
   - GMs review pending events
   - AI processes instructions
3. **Action Processing** (simultaneous)
4. **Market Updates** (all markets recalculate)
5. **Event Generation** (new events created)
6. **Population Opinion** (shifts applied)
7. **News Generation** (AI creates articles)
8. **Company Payouts** (monthly distribution)
9. **Turn Advancement**

## Game Master Features

### Event Management
- Review events before they occur
- Adjust duration (severity auto-calculated by AI)
- Override values if needed for balance

### Direct Control
- Modify game state variables (GDP, unemployment, population mood)
- Generate narrative events
- Communicate with AI system via natural language

### Audit & Monitoring
- View all override history
- Monitor world state across all sessions
- Track player activity

## Technical Stack

- **Frontend**: React 18, TypeScript, React Router, Zustand (state), Axios
- **Backend**: Node.js, Express, Socket.io, MongoDB (prepared), TypeScript
- **Deployment**: TBD (Vercel/Netlify for frontend, Heroku/Railway for backend suggested)

## Development Roadmap

### Phase 1 (MVP)
- [x] Project structure and architecture
- [ ] Backend API implementation
- [ ] WebSocket real-time updates
- [ ] Home/Map page component
- [ ] Basic market simulation
- [ ] Action queue system
- [ ] Player authentication

### Phase 2
- [ ] Complete all page components
- [ ] Event generation engine
- [ ] News/media system
- [ ] Policy proposal and voting
- [ ] GM tools implementation
- [ ] Database integration (MongoDB)

### Phase 3
- [ ] AI integration for event/news generation (Claude API)
- [ ] Advanced market dynamics
- [ ] Company management system
- [ ] Stock market & ETFs
- [ ] Advanced reputation calculations

### Phase 4
- [ ] Multi-province support
- [ ] Provincial debates
- [ ] Local government elections
- [ ] Production chains
- [ ] Foreign affairs system

### Phase 5 (Expansion)
- [ ] Alternative government forms (monarchy, dictatorship)
- [ ] Era system (communication restrictions)
- [ ] Advanced NPC behavior
- [ ] Mobile app
- [ ] Streaming/spectator mode

## Quick Start (Local Development)

### Prerequisites
- Node.js 18+ installed
- MongoDB running locally or MongoDB Atlas account
- Git installed

### 1. Clone and Install
```bash
git clone https://github.com/NathanielJL/polsim.git
cd polsim

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Configure Environment

**Backend (.env)** - Create in `backend/` folder:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost:27017/polsim
JWT_SECRET=your-super-secret-jwt-key-change-this
```

**Frontend (.env)** - Create in `frontend/` folder:
```env
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

### 3. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev  # Runs on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start    # Runs on http://localhost:3000
```

### 4. Create Your First Account
1. Open http://localhost:3000
2. Click "Register"
3. Create account (you'll be auto-assigned to a random province)
4. To make yourself a Game Master, run in MongoDB:
   ```javascript
   db.players.updateOne(
     { username: "YourUsername" },
     { $set: { isGameMaster: true } }
   )
   ```

## Deployment (Production)

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for detailed instructions on deploying to:
- Railway.app (recommended)
- Render.com
- Heroku
- Custom VPS

## API Documentation

See the following documentation files:
- **`/docs/API.md`** - Comprehensive endpoint documentation
- **`/REPUTATION_SYSTEM_COMPLETE.md`** - Complete reputation system guide
  - Demographic slicing architecture
  - Political positioning formulas
  - Campaign and endorsement mechanics
  - Integration points and usage examples
- **`/IMPLEMENTATION_SUMMARY.md`** - Implementation overview and statistics

## Quick Start with Reputation System

### 1. Populate the Database
```bash
cd backend
node populate-demographic-slices.js
```

### 2. Start a Campaign
```bash
POST /api/campaigns/start
{
  "sessionId": "session-123",
  "targetDemographicSliceId": "southland-euro-1"
}
```

### 3. Endorse Another Player
```bash
POST /api/endorsements/endorse
{
  "sessionId": "session-123",
  "endorsedId": "player-456",
  "turn": 5
}
```

### 4. Check Your Reputation
```bash
GET /api/reputation/player-123/province/Southland
```

See `REPUTATION_SYSTEM_COMPLETE.md` for detailed usage examples.

## Design Philosophy

- **Immersive Sandbox**: Players should feel their decisions matter
- **Passive Accessibility**: Turn-based design allows checking in when convenient
- **AI as World**: Automation handles NPCs, events, markets
- **GM as Narrative Guide**: Game Masters ensure story coherence
- **Reputation > Power**: Success comes from influencing populations, not domination

## Contributing

[Guidelines TBD]

## License

[License TBD]
