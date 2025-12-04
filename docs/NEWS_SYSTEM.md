# News System Implementation

## Overview
The News System provides AI-generated news articles for GM events plus player-created provincial newspapers in the Zealandia political simulation (1854 setting).

## Architecture

### 3 AI National Newspapers
1. **The Zealandia Gazette** (Moderate/Government-aligned)
   - Bias: 0 (Center)
   - Stance: Populist, supports status quo and gradual reform
   - Middle-class readership

2. **The Progressive Herald** (Progressive/Reformist)
   - Bias: -30 (Left-leaning)
   - Stance: Advocates for bi-cultural rights, expanded suffrage, social progress
   - Reform-minded readership

3. **The Frontier Economist** (Conservative/Business-focused)
   - Bias: +30 (Right-leaning)
   - Stance: Frontier interests, economic expansion, laissez-faire policies
   - Business and landowner readership

### Auto-Generation Workflow
When GM creates an event using `/api/gm/event`:

1. **GM Input**: Natural language event description
   ```javascript
   POST /api/gm/event
   {
     "sessionId": "...",
     "title": "Otago Gold Rush",
     "description": "Rich deposits discovered in Gabriel's Gully...",
     "useAI": true
   }
   ```

2. **AI Analysis**: AIService.analyzeGMEvent()
   - Analyzes event type, severity, duration
   - Calculates GDP/population impacts
   - Identifies affected provinces

3. **News Generation**: AIService.generateNewsFromEvent()
   - Generates 3 unique articles (one per newspaper)
   - Same facts, different editorial perspectives
   - 1854 Victorian newspaper style
   - 300-400 words per article

4. **Database Storage**: NewsArticle model
   - Links to event via `eventId`
   - Marked as `aiGenerated: true`
   - Includes tone ("neutral", "supportive", "critical")

## Backend API

### Routes (`backend/src/routes/news.ts`)

**Get News Feed**
```
GET /api/news/:sessionId
Query Params: limit (default 50), outlet, provinceId
Returns: { articles: NewsArticle[] }
```

**Get All Outlets**
```
GET /api/news/outlets/:sessionId
Returns: { outlets: NewsOutlet[] }
```

**Submit Player Article**
```
POST /api/news/submit
Body: {
  playerId, sessionId, outletId, title, content, provinceId
}
Returns: { success: true, article }
```

**Create Provincial Newspaper**
```
POST /api/news/outlet/create
Body: {
  playerId, sessionId, name, provinceId, politicalStance
}
Cost: £5,000
Returns: { success: true, outlet, newBalance }
```

**Hire Employee**
```
POST /api/news/outlet/hire
Body: { outletId, employeeId, ownerId }
Returns: { success: true, employees: number }
```

### AI Service Method

**generateNewsFromEvent()**
```typescript
async generateNewsFromEvent(
  eventTitle: string,
  eventDescription: string,
  eventType: string,
  affectedProvinces: string[]
): Promise<{
  success: boolean;
  articles: Array<{
    outlet: string;
    stance: string;
    headline: string;
    content: string;
    tone: string;
  }>;
  error?: string;
}>
```

**Prompt Context:**
- Zealandia Constitution (government structure)
- Historical background (1854 setting)
- 3 newspaper stances
- Event details

**AI Output:** JSON with 3 articles, each with unique editorial spin

**Caching:** 24-hour TTL, saves ~$0.03 per duplicate event

## Database Models

### NewsArticle Schema
```typescript
{
  id: string (unique);
  sessionId: ObjectId;
  title: string;
  content: string;
  authorId: ObjectId (Player, optional);
  outletId: string;
  provinceId: ObjectId (optional);
  tone: string ("neutral" | "supportive" | "critical");
  eventId: string (links to GM event);
  aiGenerated: boolean;
  approvalImpact: Map<string, number>;
  turn: number;
  createdAt: Date;
}
```

### NewsOutlet Schema
```typescript
{
  id: string (unique);
  sessionId: ObjectId;
  name: string;
  type: "national" | "provincial";
  politicalStance: string ("moderate" | "progressive" | "conservative" | "populist");
  provinceId: ObjectId (if provincial);
  ownerId: ObjectId (Player, if provincial);
  employees: ObjectId[] (Players who can write);
  bias: number (-100 to +100);
  createdAt: Date;
}
```

## Frontend

### NewsPage Component (`frontend/src/pages/NewsPage.tsx`)

**Features:**
- **News Feed**: Display all articles, sorted by date
- **Filter by Outlet**: Show specific newspaper's articles
- **Create Newspaper**: Players can found provincial newspapers (£5,000 cost)
- **Write Articles**: Players write/publish articles to newspapers they own/work for
- **Visual Design**:
  - Color-coded outlet badges (blue=moderate, green=progressive, orange=conservative)
  - AI-generated vs player-written badges
  - National newspaper badge
  - Article tone indicator

**Player Actions:**
1. **Create Newspaper**: Name it, choose stance, pay £5,000
2. **Write Article**: Select owned newspaper, write headline + content, publish
3. **Hire Employees**: (TODO) Allow other players to write for your newspaper
4. **Read News**: Filter by outlet, see all AI + player news

## Setup Instructions

### 1. Initialize AI National Newspapers

Run once per game session:

```bash
cd backend
node create-news-outlets.js <sessionId>
```

This creates the 3 AI National newspapers in the database.

### 2. Test Event → News Generation

Create a GM event:

```bash
POST /api/gm/event
{
  "sessionId": "...",
  "title": "Southland Drought",
  "description": "Severe drought hits Southland province. Crop failures expected. Livestock dying.",
  "useAI": true
}
```

Check generated news:

```bash
GET /api/news/<sessionId>
```

Should return 3 AI-generated articles about the drought, each with different editorial stance.

### 3. Player Newspaper Creation

Players can create newspapers via frontend:
- Click "Create Newspaper"
- Enter name (e.g., "The Wellington Chronicle")
- Choose stance (moderate/progressive/conservative/populist)
- Pay £5,000
- Now can write articles

### 4. Player Article Submission

Players write articles:
- Click "Write Article"
- Select owned newspaper
- Write headline + content
- Publish (instantly visible in news feed)

## Integration with Other Systems

### GM Events
When GM creates event (`POST /api/gm/event`):
1. Event stored in database
2. AI analyzes event (severity, duration, GDP impact)
3. Auto-generates 3 news articles
4. Articles visible to all players immediately

### Turn System (Future)
- News articles timestamped by turn
- Historical archive of past news
- Players can search by turn, event, outlet

### Reputation System (Future)
- News articles affect player reputation
- Positive coverage → reputation boost
- Negative coverage → reputation loss
- Provincial newspapers have local influence

### Election Campaigns (Future)
- Candidates write op-eds
- Newspapers endorse candidates
- Editorial slant affects voter perception

## Example AI Output

**Event:** "Otago Gold Rush - Rich deposits discovered in Gabriel's Gully"

**The Zealandia Gazette (Moderate):**
```
Headline: "Gold Discovered in Otago - Thousands Expected to Arrive"

On the 23rd of May, in the Year of Our Lord 1861, rich auriferous 
deposits were discovered in Gabriel's Gully, Otago Province. Prospector 
Gabriel Read made the initial discovery whilst traversing the rugged 
terrain of the southern ranges...

(300 words, factual tone, focuses on economic opportunity and government response)
```

**The Progressive Herald (Progressive):**
```
Headline: "Gold Rush Raises Questions of Māori Land Rights"

Whilst the discovery of gold in Otago Province presents undeniable 
economic promise, this newspaper must raise the uncomfortable question 
of land ownership. Gabriel's Gully sits upon territory traditionally 
inhabited by Ngāi Tahu...

(300 words, critical tone, emphasizes social justice and bi-cultural rights)
```

**The Frontier Economist (Conservative):**
```
Headline: "Otago Gold Strike to Boost Colonial Prosperity"

The recent gold discovery in Gabriel's Gully represents a transformative 
opportunity for Zealandia's economic development. Already, ships from 
Melbourne carry thousands of prospectors eager to seek their fortunes...

(300 words, optimistic tone, focuses on GDP growth and business opportunities)
```

## Cost Analysis

**AI Generation Costs:**
- First event analysis: $0.02
- News generation (3 articles): $0.03
- Total per new event: **$0.05**
- Cached duplicate events: **$0.00**

**Player Costs:**
- Create newspaper: £5,000 (in-game currency)
- Write article: Free (no action points)
- Hire employees: Free (future feature)

## Future Enhancements

1. **Newspaper Staff System**
   - Hire journalists (NPCs or players)
   - Assign reporters to provinces
   - Investigative journalism mechanics

2. **Libel/Slander Legal Cases**
   - Players can sue newspapers for false claims
   - Reputation damage from negative articles
   - Court system integration

3. **Circulation/Readership**
   - Track newspaper reach (province vs national)
   - Advertising revenue for player newspapers
   - Subscription system

4. **Editorial Control**
   - Players set newspaper ideology over time
   - Bias affects which events get covered
   - Opinion pieces vs news reporting

5. **News Alerts**
   - Players get notifications for major events
   - "Breaking News" real-time updates
   - Turn-based news digest

## Testing Checklist

- [ ] Run `create-news-outlets.js` to initialize newspapers
- [ ] Create GM event with `useAI: true`
- [ ] Verify 3 AI articles generated
- [ ] Check articles have different tones/perspectives
- [ ] Test player newspaper creation (£5,000 cost)
- [ ] Test player article submission
- [ ] Verify news feed displays correctly
- [ ] Test outlet filtering
- [ ] Check AI-generated vs player badges
- [ ] Verify 1854 newspaper style in AI articles

## Status

✅ **COMPLETE**
- Backend routes (`/api/news`)
- AI news generation (`AIService.generateNewsFromEvent()`)
- Auto-generation on GM event creation
- Database schemas (NewsArticle, NewsOutlet)
- Frontend NewsPage component
- 3 AI National newspapers defined
- Player newspaper creation
- Player article submission
- Newspaper initialization script

🚧 **PENDING**
- Employee hiring system
- Reputation impact from news coverage
- News archive/search by turn
- Libel/slander legal mechanics
- Circulation/advertising revenue
