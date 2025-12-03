# POLSIM - Implementation Priority Matrix

## Critical Path to MVP

### Week 1: Foundation
**Estimated Effort: 40 hours**

#### Backend
- [ ] MongoDB connection & Mongoose setup
- [ ] User authentication (register/login)
- [ ] Session creation & management
- [ ] Player profile endpoints
- [ ] Home page data endpoint
- [ ] WebSocket connection validation

#### Frontend
- [ ] API client service (axios wrapper)
- [ ] Authentication context
- [ ] Basic routing working
- [ ] Home page full integration
- [ ] Mock data for testing other pages

**Success Criteria**: Players can login, see home page with their stats

---

### Week 2: Core Systems
**Estimated Effort: 40 hours**

#### Backend
- [ ] GameSimulationEngine:
  - Market update calculations
  - Event generation (basic probability)
  - Population opinion shifts
- [ ] ActionQueueManager full implementation
- [ ] Turn advancement system
- [ ] Market endpoints
- [ ] News endpoints (basic)

#### Frontend
- [ ] Markets page full integration
- [ ] News page listing
- [ ] Government page (laws display)
- [ ] Reputation page integration
- [ ] Real-time WebSocket updates

**Success Criteria**: One turn cycle completes, markets update, players see changes

---

### Week 3: Game Master & Refinement
**Estimated Effort: 40 hours**

#### Backend
- [ ] GameMasterTools implementation
- [ ] Event review system
- [ ] Value override system
- [ ] AI instruction queue
- [ ] Game state persistence
- [ ] Error handling & validation

#### Frontend
- [ ] GM Dashboard full functionality
- [ ] Event review UI
- [ ] Override form
- [ ] AI instruction form
- [ ] Audit log viewing

**Success Criteria**: GMs can manage events, game runs without errors

---

### Week 4: Polish & Testing
**Estimated Effort: 40 hours**

#### Backend
- [ ] Integration tests for core systems
- [ ] Database query optimization
- [ ] API error responses standardized
- [ ] Input validation everywhere
- [ ] Logging & debugging

#### Frontend
- [ ] UI polish
- [ ] Loading states
- [ ] Error messages
- [ ] Responsive design
- [ ] Browser testing

**Success Criteria**: Game is playable end-to-end, no crashes

---

## Critical Features (Must Have)

### Tier 1: Playable
- [x] Data models designed
- [ ] Authentication working
- [ ] Turn system functional
- [ ] 5-action limit working
- [ ] Markets updating
- [ ] Events generating
- [ ] News displaying
- [ ] GM approval system

### Tier 2: Immersive
- [ ] Population opinion calculations
- [ ] Policy effect integration
- [ ] Company profit system
- [ ] Reputation tracking
- [ ] Stock market basics
- [ ] Detailed event descriptions
- [ ] News article generation

### Tier 3: Engaging
- [ ] Campaign system
- [ ] Election mechanics
- [ ] Debate participation
- [ ] Advanced market dynamics
- [ ] Provincial differences
- [ ] NPC politicians

---

## Feature Implementation Order

### Phase 1 - Turn System & Actions
1. Turn timer and advancement
2. Action submission & validation
3. Action processing engine
4. Market updates
5. Event generation

### Phase 2 - Population & Opinion
1. Population group creation
2. Approval calculation
3. Bias shifting
4. Economic impact on mood
5. Media influence

### Phase 3 - Government & Policy
1. Policy proposal system
2. Voting mechanics
3. Policy effects
4. Direct democracy implementation
5. Parliament system

### Phase 4 - News & Media
1. Article submission
2. Outlet ideology matching
3. Article generation (AI)
4. Impact calculation
5. Player-owned outlets

### Phase 5 - Economy & Companies
1. Company creation
2. Market influence
3. Profit calculation
4. Stock market
5. ETF system

### Phase 6 - Advanced Systems
1. Foreign affairs
2. Alternative government forms
3. Provincial independence
4. NPC behavior
5. Seasonal events

---

## Effort Estimates (Days)

### Backend Development
- Database setup: 1 day
- Authentication: 2 days
- Game engine: 5 days
- API endpoints: 4 days
- GM tools: 2 days
- Testing: 2 days
- **Total: 16 days**

### Frontend Development
- Setup & routing: 1 day
- API integration: 2 days
- Home page: 1 day
- Markets page: 2 days
- News page: 2 days
- Government page: 2 days
- Reputation page: 1 day
- GM dashboard: 2 days
- Polish & testing: 2 days
- **Total: 15 days**

### Documentation & Planning
- Design finalization: 1 day
- API documentation: 1 day
- Deployment setup: 1 day
- **Total: 3 days**

---

## Risk Factors & Mitigation

### Risk: Simulation Complexity
- **Mitigation**: Start with simplified formulas, iterate
- **Contingency**: Pre-defined market behaviors if dynamic fails

### Risk: Real-Time Scaling
- **Mitigation**: WebSocket optimization, connection pooling
- **Contingency**: HTTP polling as fallback

### Risk: AI Cost
- **Mitigation**: Start with templated events, add AI later
- **Contingency**: Simplified event descriptions

### Risk: GM Overhead
- **Mitigation**: Automate what possible, clear tools
- **Contingency**: Limit concurrent sessions initially

---

## Code Quality Standards

- **TypeScript**: Strict mode enabled
- **Error Handling**: Try-catch with meaningful messages
- **Validation**: Input validation on all endpoints
- **Testing**: Unit tests for simulation, integration tests for APIs
- **Documentation**: JSDoc comments on complex logic
- **Logging**: Debug-level logging for game events

---

## Performance Targets

| Metric | Target | Monitor |
|--------|--------|---------|
| API Response | < 500ms | New Relic |
| WebSocket Latency | < 200ms | Browser DevTools |
| Page Load | < 3s | Lighthouse |
| Turn Processing | < 5s | Server logs |
| Concurrent Users | 100+ | Load testing |
| Database Queries | < 100ms | Query logs |

---

## Deployment Checklist

Before going live:
- [ ] Environment variables set correctly
- [ ] Database backed up
- [ ] Error logging configured
- [ ] CORS properly restricted
- [ ] Rate limiting enabled
- [ ] JWT secrets secure
- [ ] HTTPS enforced
- [ ] Monitoring set up
- [ ] Incident response plan

---

## Team Assignments (If Multi-Person)

### Backend Lead
- Database design
- API implementation
- Game engine
- Testing

### Frontend Lead
- UI components
- State management
- Real-time updates
- Mobile responsiveness

### Game Design Lead
- Balancing
- Event creation
- GM training
- Community feedback

---

## Weekly Check-In Questions

1. **Are core systems stable?** (No crashes, predictable behavior)
2. **Is database performing?** (Queries < 100ms)
3. **Are players engaged?** (Playing daily, trying different strategies)
4. **Are GMs effective?** (Events feel narrative, not random)
5. **Are any systems overpowered?** (Too easy to win)
6. **Do we have technical debt?** (Refactoring needed?)

---

## Success Metrics for MVP

- 20+ active players
- 30% day-7 retention
- 10+ concurrent peak (local)
- No critical bugs blocking play
- Average session 30+ minutes
- GMs report game feels organic
- 4+ rating on usability survey
