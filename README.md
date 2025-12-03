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

### Action System
- **5 Actions per Turn** (24-hour cycle) across all activities
- **Optional Paid Actions**: 
  - Twitter campaign boost ($1000) - increases campaign visibility
  - Article sponsorship ($2500) - amplifies media impact

### Population & Politics
- **9 Political Archetypes**: AuthRight, LibRight, LibLeft, Communist, Centrist, RightMod, LeftMod, LibMod, AuthMod
- **4 Class Levels**: Lower, working, middle, upper
- **Population Bias**: Weighted by ideology + event/media influence
- **Approval Tracking**: Per-group approval affects elections and policy success

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

## Setup Instructions

### Backend
```bash
cd backend
npm install
npm run dev  # Start development server on port 5000
```

### Frontend
```bash
cd frontend
npm install
npm start    # Start development server on port 3000
```

## Environment Configuration

Create `.env` files:

**Backend (.env)**
```
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
MONGODB_URI=mongodb://localhost/polsim
JWT_SECRET=your-secret-key
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

## API Documentation

See `/docs/API.md` for comprehensive endpoint documentation.

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
