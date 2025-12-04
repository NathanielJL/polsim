# AI-Powered Systems Summary

## Overview
Built AI-powered natural language systems for Zealandia political simulation. Players and GMs write in plain English, AI extracts structured data and auto-calculates economic/reputation impacts. No coding required.

## System Architecture

### ZealandiaContext Service
**File:** `backend/src/services/ZealandiaContext.ts`

**Purpose:** Load Constitution/Lore into AI context for historically accurate 1854 Zealandia analysis

**Content Loaded:**
- **Constitution (Zealandia Constitution.txt):**
  - 7 provinces with capitals
  - Bicameral legislature structure
  - Voting qualifications (male property owners)
  - Bi-cultural rights provision (Vulteralia)
  - Governor powers and veto procedures
  - Treaty of Waitangi protections

- **Lore (Zealandia Lore.txt):**
  - Polynesian settlement (800-1000 years ago)
  - European contact timeline (Dutch 1642, British 1815-1820)
  - Musket Wars (late 1700s-1820s)
  - Land conflicts (Southland Skirmishes, Central Land Wars)
  - 1854 Constitutional Crisis (provincial debt, bi-cultural conflict)

- **Game State:**
  - 3 political factions (Loyalty League, Miscegenation Block, Broader Reform)
  - Current crisis (Auckland Dissolution June 1854)
  - Province characteristics
  - Government structure

**Methods:**
```typescript
ZealandiaContext.loadContext()  // Reads files from disk
ZealandiaContext.getGameContext()  // Returns formatted context for AI
ZealandiaContext.getConstitution()  // Constitutional framework
ZealandiaContext.getLore()  // Historical background
ZealandiaContext.getCurrentCrisis()  // 1854 crisis state
```

**Integration:** Context injected into all AI prompts via `${ZealandiaContext.getGameContext()}`

---

## 1. AI Policy Submission System

### Overview
Players write policies in natural language. AI extracts structured data, calculates economic effects, and determines reputation impacts.

### API Endpoint
```
POST /api/policies/submit
Body: {
  playerId,
  sessionId,
  title: "Timber Export Tax",
  description: "20% tariff on timber exports to protect domestic industry"
}
```

### AI Analysis Output
```json
{
  "policyType": "tariff",
  "affectedResources": ["timber"],
  "affectedProvinces": ["Southland", "Cooksland"],
  "economicImpact": {
    "gdpChange": -2.5,
    "priceChanges": { "timber": 15 },
    "unemploymentChange": 0.3
  },
  "reputationImpact": {
    "landowners": -10,
    "workers": +5,
    "māori": 0,
    "settlers": +3
  },
  "estimatedRevenue": 12000,
  "salience": 65,
  "summary": "Protectionist policy that will reduce timber exports..."
}
```

### Player Workflow
1. **Submit Policy**: Write title + description in plain English
2. **AI Analysis**: Extracts policy parameters
3. **Sponsor/Vote**: Other players can sponsor or vote
4. **Enact**: Once passed, effects auto-apply to game state

### Database Schema
```typescript
Policy {
  id, sessionId, playerId, title, description,
  aiAnalysis: { /* full AI response */ },
  structuredData: { policyType, affectedProvinces, etc. },
  economicImpact: { gdpChange, priceChanges, unemployment },
  reputationImpact: { byDemographicGroup },
  estimatedRevenue: number,
  salience: number (0-100),
  votes: [{ playerId, vote: "yes"|"no"|"abstain" }],
  sponsors: [playerId],
  status: "proposed" | "passed" | "rejected",
  createdAt, enactedAt
}
```

### Caching
- First "timber tax 20%" → Calls Claude ($0.02)
- Second similar policy → Uses cache ($0.00)
- Cache expires after 24 hours
- Reduces costs by ~60%

---

## 2. AI GM Event Creation

### Overview
GMs describe events in narrative form. AI analyzes and calculates severity, duration, GDP impacts, population changes.

### API Endpoint
```
POST /api/gm/event
Body: {
  sessionId,
  title: "Otago Gold Rush",
  description: "Rich deposits discovered in Gabriel's Gully. Thousands flooding in from Australia.",
  useAI: true  // Default
}
```

### AI Analysis Output
```json
{
  "success": true,
  "eventType": "resource_discovery",
  "severity": 8,
  "duration": 12,
  "affectedProvinces": ["Otago", "Southland"],
  "summary": "Gold discovery will trigger mass immigration...",
  "effects": {
    "population": {
      "change": 5000,
      "provinces": ["Otago"]
    },
    "gdp": {
      "changePercent": 0.45,
      "provinces": ["Otago", "Southland"]
    },
    "resources": {
      "gold": {
        "supplyChange": 200,
        "priceChange": -0.40
      }
    },
    "unemployment": {
      "changePercent": -2.5,
      "provinces": ["all"]
    }
  }
}
```

### Auto-Application
Effects automatically applied to game state:
- **Population**: Province.population += change
- **GDP**: Province.gdp *= (1 + changePercent)
- **Resources**: Update Market supply/price
- **Unemployment**: Province.unemployment += change

### AI Context
Prompt includes:
- Zealandia Constitution
- Historical period (1854)
- Political factions
- Current crisis state
- Province characteristics

---

## 3. AI News Generation System

### Overview
When GM creates event, AI auto-generates 3 news articles (one per national newspaper) with different editorial perspectives.

### 3 AI National Newspapers

**The Zealandia Gazette** (Moderate/Government-aligned)
- Bias: 0 (Center)
- Stance: Populist, supports status quo
- Readership: Middle-class

**The Progressive Herald** (Progressive/Reformist)
- Bias: -30 (Left)
- Stance: Bi-cultural rights, social progress
- Readership: Reform-minded

**The Frontier Economist** (Conservative/Business-focused)
- Bias: +30 (Right)
- Stance: Economic expansion, laissez-faire
- Readership: Business/landowners

### Auto-Generation Workflow
1. **GM Creates Event**: `POST /api/gm/event` with `useAI: true`
2. **AI Analyzes Event**: Severity, type, affected provinces
3. **AI Generates News**: 3 articles (one per newspaper)
4. **Database Storage**: NewsArticle documents created
5. **Player Visibility**: All articles visible in news feed immediately

### AI Prompt
```typescript
const prompt = `You are a news writer for Zealandia's national newspapers in 1854.

${ZealandiaContext.getGameContext()}

EVENT TO REPORT:
Title: ${eventTitle}
Description: ${eventDescription}
Type: ${eventType}
Affected Provinces: ${affectedProvinces.join(', ')}

Generate THREE news articles about this event, one for each newspaper with their editorial stance.

{
  "success": true,
  "articles": [
    {
      "outlet": "The Zealandia Gazette",
      "stance": "Moderate/Government-Aligned/Populist",
      "headline": "...",
      "content": "... (300-400 words, 1854 newspaper style)",
      "tone": "neutral/factual"
    },
    { "outlet": "The Progressive Herald", ... },
    { "outlet": "The Frontier Economist", ... }
  ]
}
`;
```

### Example Output

**Event:** "Otago Gold Rush"

**The Zealandia Gazette:**
- Headline: "Gold Discovered in Otago - Thousands Expected to Arrive"
- Tone: Neutral, factual
- Focus: Economic opportunity, government response

**The Progressive Herald:**
- Headline: "Gold Rush Raises Questions of Māori Land Rights"
- Tone: Critical, reform-focused
- Focus: Bi-cultural rights, land ownership controversy

**The Frontier Economist:**
- Headline: "Otago Gold Strike to Boost Colonial Prosperity"
- Tone: Optimistic, economic analysis
- Focus: GDP growth, business opportunities

### Player Newspaper System
**Players can:**
- Create provincial newspapers (£5,000 cost)
- Choose political stance (moderate/progressive/conservative/populist)
- Write articles about events
- Hire other players as journalists

**API Endpoints:**
```
POST /api/news/outlet/create  // Create newspaper
POST /api/news/submit         // Write article
POST /api/news/outlet/hire    // Hire employee
GET /api/news/:sessionId      // Get all news
GET /api/news/outlets/:sessionId  // Get all newspapers
```

---

## Cost Analysis

### Claude 3.5 Sonnet Pricing
- **Policy Analysis**: ~600 tokens input + 800 tokens output = $0.02 per policy
- **Event Analysis**: ~700 tokens input + 1000 tokens output = $0.025 per event
- **News Generation**: ~1000 tokens input + 2500 tokens output (3 articles) = $0.03 per event

**Total per GM Event (with news):** $0.055

**With Caching:**
- First analysis: $0.055
- Duplicate event: $0.00
- **Average Cost:** ~$0.025 per event (60% reduction)

### Cost Projection
**10 players, 20 turns:**
- 50 policies submitted → $1.00 (with caching)
- 30 GM events → $1.65 (with caching + news)
- **Total:** ~$2.65 for entire 20-turn game

**Very affordable for AI-powered simulation!**

---

## Key Features

### 1. Natural Language Input
- **No JSON required**: Players write plain English descriptions
- **No coding knowledge**: GMs describe events narratively
- **AI extraction**: Converts prose to structured game data

### 2. Historical Accuracy
- **Context Injection**: Constitution/Lore in every prompt
- **1854 Setting**: AI knows government structure, factions, crisis
- **Authentic Language**: News articles use Victorian prose style

### 3. Automated Calculations
- **Economic Impacts**: GDP, prices, unemployment auto-calculated
- **Reputation Effects**: Demographic-specific reputation changes
- **Resource Discovery**: Supply/demand auto-updated

### 4. Editorial Diversity
- **3 Perspectives**: Same event, different editorial stances
- **Bias Simulation**: Newspapers have ideological leanings
- **Player Engagement**: Players can create own newspapers

### 5. Cost Efficiency
- **Caching**: 24-hour TTL saves money on duplicates
- **Batch Operations**: Event + news generated in one go
- **Small Model**: Claude 3.5 Sonnet ($0.02/analysis vs GPT-4o $0.10)

---

## File Structure

```
backend/
  src/
    services/
      ZealandiaContext.ts       # Load Constitution/Lore
      AIService.ts              # AI analysis methods
    routes/
      policies.ts               # Policy submission API
      gm.ts                     # GM event creation (with news generation)
      news.ts                   # News articles + player newspapers
    models/
      mongoose.ts               # Policy, Event, NewsArticle, NewsOutlet schemas
  create-news-outlets.js        # Initialize 3 AI newspapers

frontend/
  src/
    pages/
      NewsPage.tsx              # News feed + article submission

context/
  Zealandia Constitution.txt    # Constitutional Act of 1852
  Zealandia Lore.txt            # Historical narrative
  Zealandia.txt                 # Comprehensive game Q&A

docs/
  NEWS_SYSTEM.md                # News system documentation
  AI_SYSTEMS_SUMMARY.md         # This file
```

---

## Setup Instructions

### 1. Environment Variables
```bash
# .env
ANTHROPIC_API_KEY=sk-ant-...
MONGO_URI=mongodb://localhost:27017/polsim
```

### 2. Initialize AI Newspapers
```bash
cd backend
node create-news-outlets.js <sessionId>
```

### 3. Test Policy Submission
```bash
POST /api/policies/submit
{
  "playerId": "...",
  "sessionId": "...",
  "title": "Land Reform Act",
  "description": "Redistribute crown land to Māori iwi in recognition of Treaty rights"
}
```

### 4. Test GM Event
```bash
POST /api/gm/event
{
  "sessionId": "...",
  "title": "Southland Drought",
  "description": "Severe drought hits Southland. Crop failures expected.",
  "useAI": true
}
```

Check generated news:
```bash
GET /api/news/<sessionId>
```

Should return 3 AI-generated articles with different perspectives.

---

## Future Enhancements

### 1. Court Case Generation
- AI generates civil/criminal cases for lawyers
- 1 case per lawyer per turn
- Historical legal issues (land disputes, treaty violations)

### 2. NPC Politician Dialogue
- AI-powered NPC responses to player proposals
- Faction-aligned debate arguments
- Dynamic political positioning

### 3. Economic Forecasting
- AI predicts GDP/unemployment trends
- Players can request economic reports
- "What if?" policy scenario analysis

### 4. Immigration Events
- AI generates immigration waves
- Cultural/religious diversity impacts
- Province-specific immigration patterns

### 5. Legislative Debate AI
- AI moderates parliamentary debates
- Generates NPC speeches pro/con policies
- Tracks debate effectiveness → vote influence

---

## Testing Checklist

**Policy System:**
- [ ] Submit natural language policy
- [ ] Verify AI extracts structured data
- [ ] Check economic impact calculations
- [ ] Verify reputation changes by demographic
- [ ] Test voting/sponsorship mechanics
- [ ] Test policy enactment (auto-apply effects)

**GM Event System:**
- [ ] Create event with narrative description
- [ ] Verify AI analyzes severity/duration
- [ ] Check GDP/population auto-updates
- [ ] Verify province-specific impacts
- [ ] Test manual mode (`useAI: false`)

**News System:**
- [ ] Initialize 3 AI newspapers
- [ ] Create GM event
- [ ] Verify 3 articles generated
- [ ] Check articles have different tones
- [ ] Test player newspaper creation
- [ ] Test player article submission
- [ ] Verify news feed displays correctly

**Context System:**
- [ ] Verify Constitution loaded on startup
- [ ] Check Lore included in AI prompts
- [ ] Test AI knows province names
- [ ] Test AI references Treaty of Waitangi
- [ ] Verify 1854 historical accuracy

---

## Status

✅ **COMPLETE:**
- ZealandiaContext service (Constitution/Lore loader)
- AI Policy Submission (`/api/policies`)
- AI GM Event Creation (`/api/gm/event`)
- AI News Generation (3 national newspapers)
- Player newspaper creation
- Player article submission
- Frontend NewsPage component
- Caching system (24hr TTL)
- Database schemas
- Auto-application of effects

🚧 **IN PROGRESS:**
- Action Point System (5 AP per turn)
- Turn auto-processing (24hr timer)

❌ **PENDING:**
- NPC Politician Database (140 NPCs)
- Political Party/Faction System
- Legislature System (35 Lower, 14 Upper)
- Court Case AI generation
- Resource discovery mechanics
- Immigration system
- Demographics dashboard

---

## Key Takeaways

### Why This Approach Works

1. **Accessibility**: No coding required → More players can participate
2. **Realism**: AI understands historical context → Authentic 1854 simulation
3. **Automation**: GDP/reputation auto-calculated → GM doesn't need spreadsheets
4. **Engagement**: 3 news perspectives → Players see diverse interpretations
5. **Cost-Effective**: $0.025/event → Sustainable for long campaigns

### Design Philosophy

**"Write what you mean, AI handles the math"**

- Players describe policies in natural language
- GMs narrate events like storytelling
- AI extracts structured data
- Game engine applies effects automatically
- News system creates narrative consequences

**Result:** Political simulation feels like role-playing, not spreadsheet management.

---

## Contact & Support

**Documentation:**
- NEWS_SYSTEM.md (detailed news system guide)
- API_REFERENCE.md (all backend endpoints)
- GAME_INITIALIZATION.md (setup instructions)

**Key Files:**
- `backend/src/services/AIService.ts` - AI analysis methods
- `backend/src/services/ZealandiaContext.ts` - Context loader
- `backend/src/routes/policies.ts` - Policy submission API
- `backend/src/routes/gm.ts` - GM event creation
- `backend/src/routes/news.ts` - News system API

**For Questions:**
- Check `docs/` folder for comprehensive guides
- Review `context/` folder for game lore/rules
- Test using `backend/create-news-outlets.js` script
