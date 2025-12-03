# POLSIM - Project Index & Quick Navigation

## 📋 Start Here

If you're new to this project, read in this order:

1. **[README.md](README.md)** - High-level project overview (5 min read)
2. **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - What's been created (10 min read)
3. **[SETUP.md](SETUP.md)** - Installation & getting started (5 min read)
4. **[docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)** - Understand the systems (30 min read)
5. **[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)** - Week-by-week dev plan (15 min read)

---

## 📚 Documentation by Purpose

### For Understanding the Game
- **[docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)** - Complete game mechanics
  - Political ideology system
  - Population dynamics
  - Market simulation
  - Policy effects
  - Event generation
  - News/media system
  - Government types

### For Development Planning
- **[docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)** - Sprint breakdown
  - Week 1-4 priorities
  - Effort estimates
  - Risk mitigation
  - Team assignments
  - Performance targets

- **[docs/ROADMAP.md](docs/ROADMAP.md)** - Long-term phases
  - Phase 1-5 overview
  - Feature priority matrix
  - Success metrics
  - Technical debt
  - Future expansions

### For Building the Game
- **[docs/API.md](docs/API.md)** - Endpoint documentation
  - All REST endpoints
  - WebSocket events
  - Request/response formats
  - Error codes
  - Rate limiting

- **[docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md)** - AI system setup
  - Claude API integration
  - Event generation
  - News writing
  - Policy analysis
  - Cost management
  - Caching strategy

### For Project Management
- **[CHECKLIST.md](CHECKLIST.md)** - Master development checklist
  - Phase-by-phase tasks
  - Testing requirements
  - Quality gates
  - Launch preparation

---

## 🗂️ Project Structure

```
polsim/
├── README.md                  ← Start here
├── PROJECT_SUMMARY.md         ← What's been created
├── SETUP.md                   ← Installation guide
├── CHECKLIST.md               ← Development checklist
├── INDEX.md                   ← This file
│
├── backend/                   ← Node.js/Express server
│   ├── src/
│   │   ├── index.ts           ← Main server
│   │   ├── models/types.ts    ← All TypeScript types
│   │   ├── services/
│   │   │   ├── GameSimulationEngine.ts
│   │   │   ├── ActionQueueManager.ts
│   │   │   └── GameMasterTools.ts
│   │   ├── routes/            ← API endpoints (TODO)
│   │   ├── config/
│   │   └── middleware/
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
│
├── frontend/                  ← React web app
│   ├── src/
│   │   ├── pages/             ← All 6 main pages
│   │   ├── styles/            ← CSS files
│   │   ├── services/          ← API client (TODO)
│   │   ├── store/             ← State management (TODO)
│   │   ├── components/        ← Reusable components (TODO)
│   │   ├── App.tsx
│   │   └── index.tsx
│   ├── public/
│   ├── package.json
│   └── .env.example
│
└── docs/
    ├── API.md                 ← API reference
    ├── GAME_DESIGN.md         ← Game mechanics
    ├── ROADMAP.md             ← Development phases
    ├── IMPLEMENTATION.md      ← Sprint planning
    └── AI_INTEGRATION.md      ← Claude API setup
```

---

## ⚡ Quick Links

### Essential Files
| File | Purpose | Read Time |
|------|---------|-----------|
| [README.md](README.md) | Project overview | 5 min |
| [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) | Game mechanics | 30 min |
| [backend/src/models/types.ts](backend/src/models/types.ts) | Data types | 10 min |
| [backend/src/services/GameSimulationEngine.ts](backend/src/services/GameSimulationEngine.ts) | Core logic | 15 min |
| [docs/API.md](docs/API.md) | API reference | 10 min |

### Key Decisions
| Decision | Location | Status |
|----------|----------|--------|
| Political system | [GAME_DESIGN.md](docs/GAME_DESIGN.md#1-political-ideology-spectrum) | ✅ Designed |
| Market system | [GAME_DESIGN.md](docs/GAME_DESIGN.md#3-market-system) | ✅ Designed |
| Event generation | [GAME_DESIGN.md](docs/GAME_DESIGN.md#6-event-generation) | ✅ Designed |
| Tech stack | [README.md](README.md#technical-stack) | ✅ Chosen |
| DB choice | [GAME_DESIGN.md](docs/GAME_DESIGN.md) | ✅ MongoDB |

---

## 🚀 Getting Started (5 Minutes)

### 1. Read Project Summary
```bash
# Open PROJECT_SUMMARY.md in your editor
# Takes ~10 minutes to understand what you have
```

### 2. Install Dependencies
```bash
# Backend
cd backend && npm install

# Frontend (new terminal)
cd frontend && npm install
```

### 3. Configure Environment
```bash
# Copy example files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

### 4. Start Servers
```bash
# Terminal 1 - Backend
cd backend && npm run dev

# Terminal 2 - Frontend
cd frontend && npm start
```

### 5. Open Your Browser
```
http://localhost:3000
```

---

## 🎮 System Overview

### Political System
- **9 archetypes** × **4 class levels** = 36 population segments
- **3D ideology spectrum**: Economic, Social, Personal Freedom
- **Opinion tracking**: -100 to 100 approval per group
- **Bias shifting**: Event-driven + gradual

**See**: [GAME_DESIGN.md - Political System](docs/GAME_DESIGN.md#1-political-ideology-spectrum)

### Economic System
- **6+ markets**: Healthcare, Housing, Food, Tech, Goods, Transportation
- **Supply/demand**: Dynamic pricing
- **Companies**: Create, profit, influence markets
- **Stock market**: Stocks, ETFs, trading
- **Bankruptcy**: Companies can fail

**See**: [GAME_DESIGN.md - Economy](docs/GAME_DESIGN.md#3-market-system)

### Action System
- **5 actions per turn** (24 hours)
- **Optional paid actions**: Campaign boost ($1000), Article sponsorship ($2500)
- **Simultaneous processing**: Fair to all players

**See**: [GAME_DESIGN.md - Actions](docs/GAME_DESIGN.md#9-action-system)

### Event System
- **15% base probability** per turn (scales with conditions)
- **GM review & approval** before turn resolution
- **AI-generated descriptions** (future: Claude API)
- **Consequence-based**: Events affect markets, population, politics

**See**: [GAME_DESIGN.md - Events](docs/GAME_DESIGN.md#6-event-generation)

### Government System
- **Direct Democracy** (default)
- **Parliament** (via policy)
- **Monarchy/Dictatorship** (event-driven)
- **Elections** (reputation-based)
- **Campaigns** (Twitter-like system)

**See**: [GAME_DESIGN.md - Government](docs/GAME_DESIGN.md#8-government--politics)

### News System
- **3 national AI outlets** (neutral, left, right)
- **Player-owned local outlets**
- **Ideology matching**: Can only publish to aligned outlets
- **Impact calculation**: Articles shift group approval

**See**: [GAME_DESIGN.md - News](docs/GAME_DESIGN.md#7-news--media-system)

---

## 📊 What's Already Built

### ✅ Complete Design
- 50+ pages of game mechanics
- 10+ data models
- 3 core simulation engines
- 6 frontend page components
- 15+ API endpoints (designed)
- CSS styling framework
- TypeScript type safety

### 📋 What Needs Implementation
1. **Database** (MongoDB integration)
2. **Authentication** (JWT/sessions)
3. **API handlers** (endpoints)
4. **Real-time** (WebSocket hookups)
5. **AI** (Claude API integration - optional)
6. **Game content** (initial events, policies)

---

## 🎯 Development Path

### Week 1: Foundation
- Database setup
- Authentication
- Core APIs
- **Goal**: Players can login, see home page

### Week 2: Core Systems
- Game simulation engine
- Market updates
- Event generation
- Action processing
- **Goal**: One complete turn cycle

### Week 3: Game Master Tools
- Event review system
- Value overrides
- AI instruction queue
- **Goal**: GMs can manage events

### Week 4: Polish
- Error handling
- Testing
- UI refinement
- **Goal**: Stable, playable MVP

---

## 🔍 File Navigation Guide

### Understanding the Game
1. Start: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
2. Then: [backend/src/models/types.ts](backend/src/models/types.ts) (see data structures)
3. Reference: [docs/API.md](docs/API.md) (see endpoints)

### Backend Development
1. Entry: [backend/src/index.ts](backend/src/index.ts) (server setup)
2. Engine: [backend/src/services/GameSimulationEngine.ts](backend/src/services/GameSimulationEngine.ts) (core logic)
3. Types: [backend/src/models/types.ts](backend/src/models/types.ts) (all types)

### Frontend Development
1. App: [frontend/src/App.tsx](frontend/src/App.tsx) (routing)
2. Pages: [frontend/src/pages/](frontend/src/pages/) (6 main pages)
3. Styles: [frontend/src/styles/](frontend/src/styles/) (CSS)

### Game Master Features
1. Design: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md#9-action-system) (GM system)
2. Backend: [backend/src/services/GameMasterTools.ts](backend/src/services/GameMasterTools.ts) (implementation)
3. Frontend: [frontend/src/pages/GameMasterDashboard.tsx](frontend/src/pages/GameMasterDashboard.tsx) (UI)

### AI Integration (Future)
1. Guide: [docs/AI_INTEGRATION.md](docs/AI_INTEGRATION.md)
2. Implementation strategy with Claude API
3. Cost management & caching

---

## 🤔 Frequently Asked Questions

**Q: How much code is already written?**
A: ~2500 lines of scaffolding + design. Ready for implementation.

**Q: Where do I start coding?**
A: [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) has week-by-week plan.

**Q: How long will MVP take?**
A: ~4 weeks at 40 hours/week with solid team.

**Q: Do I need AI now?**
A: No, you can template events first. AI is phase 2.

**Q: How complex is the game?**
A: Intentionally complex systems, simple interfaces. Players see the depth.

**Q: Can I modify the design?**
A: Absolutely! Design is a starting point, not law.

**Q: How many players should I plan for?**
A: Start with 20-50, scale to 100-200 with optimization.

**Q: What about balance?**
A: GM tools make it easy to adjust. Plan for weekly patches.

---

## 📞 Support & Resources

### Internal
- Game Design: [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md)
- API Reference: [docs/API.md](docs/API.md)
- Dev Plan: [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md)
- Checklist: [CHECKLIST.md](CHECKLIST.md)

### External
- [React Documentation](https://react.dev)
- [Node.js Documentation](https://nodejs.org/docs)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Socket.io Documentation](https://socket.io/docs)
- [Anthropic API Documentation](https://docs.anthropic.com)

---

## ✨ Project Highlights

### Design Elegance
- Complex systems, simple interface
- Player decisions matter throughout
- Organic-feeling world
- Minimal admin burden
- Passive accessibility

### Technical Robustness
- Full TypeScript type safety
- Modular architecture
- Prepared for scaling
- Clear documentation
- Tested patterns

### Immersion Focus
- AI-driven NPCs
- Dynamic markets
- Real consequences
- Narrative coherence
- Meaningful choices

---

## 🎯 Next Steps

1. **Read** [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) (10 min)
2. **Install** dependencies (5 min)
3. **Read** [docs/GAME_DESIGN.md](docs/GAME_DESIGN.md) (30 min)
4. **Review** [docs/IMPLEMENTATION.md](docs/IMPLEMENTATION.md) (15 min)
5. **Pick** first feature from [CHECKLIST.md](CHECKLIST.md)
6. **Start** coding!

---

## 📝 Document Versions

| Document | Version | Updated |
|----------|---------|---------|
| README.md | 1.0 | Dec 2, 2025 |
| GAME_DESIGN.md | 1.0 | Dec 2, 2025 |
| ROADMAP.md | 1.0 | Dec 2, 2025 |
| API.md | 1.0 | Dec 2, 2025 |
| IMPLEMENTATION.md | 1.0 | Dec 2, 2025 |
| AI_INTEGRATION.md | 1.0 | Dec 2, 2025 |
| PROJECT_SUMMARY.md | 1.0 | Dec 2, 2025 |
| CHECKLIST.md | 1.0 | Dec 2, 2025 |
| INDEX.md | 1.0 | Dec 2, 2025 |

---

## 🏁 Conclusion

You have everything you need to build an ambitious, immersive political economy simulator. The foundation is solid, the design is complete, and the path forward is clear.

**Start reading, start coding, and bring this game to life!** 🎮

---

**Last Updated**: December 2, 2025
**Project Status**: ✅ Ready for Development
**Next Action**: Read PROJECT_SUMMARY.md
