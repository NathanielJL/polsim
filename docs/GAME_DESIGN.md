# POLSIM - Game Design Document

## Core Systems Overview

### 1. Political Ideology Spectrum

**Three Dimensions:**
- Economic Axis: -100 (Socialist) to +100 (Capitalist)
- Social Axis: -100 (Liberal) to +100 (Conservative)
- Personal Freedom: -100 (Restrictive) to +100 (Libertarian)

**Nine Archetypes:**
1. **Authoritarian Right**: High economic right, high social conservative, low personal freedom
2. **Libertarian Right**: High economic right, neutral social, high personal freedom
3. **Libertarian Left**: Left economic, liberal social, high personal freedom
4. **Communist**: Far left economic, liberal social, variable freedom
5. **Centrist**: Neutral across all dimensions
6. **Right Moderate**: Right-leaning on economic, neutral social, moderate freedom
7. **Left Moderate**: Left-leaning on economic, neutral social, moderate freedom
8. **Libertarian Moderate**: Moderate economic, liberal social, high freedom
9. **Authoritarian Moderate**: Moderate economic, variable social, low freedom

**Class Levels:**
- Level 1: Lower class (affects employment, market purchasing)
- Level 2: Working class
- Level 3: Middle class
- Level 4: Upper class

### 2. Population & Opinion System

**Initial Distribution:**
- 5% Extremists (far left)
- 10% Strong Left
- 20% Left Moderate
- 30% Centrist
- 20% Right Moderate
- 10% Strong Right
- 5% Extremists (far right)

Class distribution is randomized but weighted toward middle class.

**Approval Mechanics:**
- Each population group has an approval score (-100 to 100)
- Influenced by:
  - Event outcomes
  - Media coverage (articles in aligned outlets)
  - Policy effects on economy
  - Character-specific achievements
  - Twitter engagement (for prominent figures)

**Bias Shifting:**
- Gradual drift toward center over time (stability factor)
- Event-driven spikes (+/- 5 to 20 points depending on severity)
- Media impact varies by outlet reach and ideology
- Economic conditions hit lower classes harder

### 3. Market System

**Market Types:**
1. **Healthcare**: Supply limited by regulations, demand varies by population health
2. **Transportation**: Supply from companies, demand seasonal/policy-dependent
3. **Housing**: Supply from construction, affected by interest rates/regulations
4. **Food**: Supply from agriculture/imports, affected by weather/trade policy
5. **Technology**: Supply from tech companies, demand varies with innovation policies
6. **Goods**: Consumer goods, affected by consumer spending power

**Price Calculation:**
```
NewPrice = CurrentPrice × (1 + ((Demand - Supply) / Supply) × 0.05)
```

**Influencing Factors:**
- Population demand (varies by class)
- Policy effects (direct multipliers)
- Company production (supply increase)
- Economic health (consumer spending)
- International trade (import/export availability)

### 4. Company Operations

**Company Types:**
- Hotels & Hospitality
- Construction
- Medicine & Healthcare
- Finance & Banking
- Technology
- Agriculture
- Manufacturing
- Transportation

**Mechanics:**
- Founded with initial capital from player
- Monthly profit calculated automatically
- Employees hired based on market demand
- Market influence reflects company market share
- Can go bankrupt if losses exceed cash reserves

**Profit Formula:**
```
Profit = BaseCapital × 0.05 × MarketHealth × (1 - UnemploymentRate) × CompanyEfficiency
```

### 5. Policy System

**Policy Components:**
```
{
  title: string
  description: string
  type: "Tax" | "Regulation" | "Budget" | "Healthcare" | "Education" | etc.
  ideology: IdeologyPoint
  duration: number (turns)
  numericEffects: {
    unemploymentChange: number,      // +/- percentage points
    gdpChange: number,               // % growth/decline
    governmentBudgetChange: number   // % change in available budget
  }
  eventTriggerChance: number         // 0-100% probability
  affectedMarkets: string[]
}
```

**Examples:**
- **Progressive Tax Hike**: Increases government budget +20%, affects unemployment +2%, right archetype disapproval
- **Deregulation**: GDP +5%, unemployment -1%, costs healthcare market -10% price
- **Healthcare Subsidy**: Budget -15%, healthcare supply +30%, left archetype approval

### 6. Event Generation

**Base Probability:** 15% per turn

**Probability Modifiers:**
- Economic crisis (GDP < -50): +20%
- Population unrest (average mood < -50): +15%
- Recent major event (within 3 turns): +10%
- Specific policy active: varies

**Event Attributes:**
- Severity (1-10): Affects duration, population impact, AI memory
- Type: Economic, Political, Natural, Foreign, Social
- Duration: 1-10 turns (GM adjustable)
- Affected Groups: Subset of population archetypes
- Impact: GDP change, unemployment, population mood shift

**Example Events:**
- "Market Crash": Severity 8, GDP -20%, unemployment +5%, centrist approval -15
- "Worker Strike": Severity 6, unemployment effect, worker class approval +10
- "Foreign Dispute": Severity 5, affects relations, event-based outcomes
- "Natural Disaster": Severity 7, regional GDP impact, humanitarian aid needed

### 7. News & Media System

**Outlets:**
- 3 National (AI-operated):
  - Conservative Times (AuthRight-leaning)
  - Progressive Voice (LibLeft-leaning)
  - Centrist Daily (Neutral/Centrist)
  
- Unlimited Local (player-owned if press role)

**Article Generation:**
- AI creates articles about events (1-3 per event)
- Players can submit articles to aligned outlets only
- Ideology alignment checked (3D distance in spectrum)
- Each article can shift group approval (+/- 0-5 points)

**Article Attributes:**
```
{
  title: string
  content: string
  outlet: NewsOutlet
  event: Event (optional)
  author: Player (optional) | "AI"
  turn: number
  approvalImpact: Map<GroupArchetype, number>
}
```

### 8. Government & Politics

**Government Types:**
1. **Direct Democracy** (initial):
   - All policies voted on by population
   - Referendum mechanics
   - Players can run Twitter campaigns to influence vote

2. **Representative Democracy** (via policy):
   - Parliament of players/NPCs
   - Legislative debates
   - Player voting on bills

3. **Monarchy** (event-driven):
   - Temporary (days), typically via coup/revolution
   - Player as monarch makes decisions
   - Can transition back to democracy via event

4. **Dictatorship** (event-driven):
   - Temporary event state
   - Single player control
   - Revolution threshold high but possible

**Elections & Campaigns:**
- Reputation directly affects election chances
- Twitter campaigns cost $1000 per action
- Article sponsorships cost $2500, boost media reach
- Campaign duration: last 3-5 turns before election
- Winning margin affects term length

### 9. Action System

**5 Actions Per Turn (24 hours):**
- Political: Debate, vote, propose policy, campaign tweet
- Economic: Buy/sell stocks, trade goods, found company, hire employees
- Media: Submit article, craft tweet, sponsor article
- Administrative: Manage company, view detailed stats

**Paid Actions:**
- Twitter campaign boost: $1000 (increases reach +50%)
- Article sponsorship: $2500 (amplifies outlet reach +30%)

**Queue Management:**
- Actions processed simultaneously at turn end
- Order doesn't matter for most actions
- Voting conflicts resolved by timestamp
- Failed actions (insufficient funds, etc.) return error

### 10. Reputation System

**Single Overall Score:**
- Starts at 0
- Range: -100 to 100
- Visible to self only
- Affects:
  - Election chances
  - Policy success rates
  - Company confidence
  - News outlet willingness to publish

**Per-Group Breakdown (Self-Visible):**
- 9 archetypes × 4 classes = 36 potential groups
- Shown on Reputation page
- Individual approval scores visible
- Trend indicators (rising/falling)

**Reputation Drivers:**
- Policy proposals aligned with group
- Article/media coverage
- Political debate performance
- Company success (if owner)
- Twitter engagement
- Event outcomes
- Charitable/community actions (future)

## AI Integration Points

### Event Generation & Description
- Use Claude API to generate contextual event descriptions
- Consider past events, current policies, population state
- Create narratively coherent consequences

### News Article Generation
- AI writes articles about events
- Maintains outlet bias in reporting
- Generates plausible quotes/sources
- Creates follow-up articles about ongoing events

### NPC Behavior (Future)
- NPC politicians vote based on ideology + pressure
- NPC journalists pitch stories
- NPC population responses to major events

## Turn Resolution Flow

```
START OF TURN
  ↓
PLAYER ACTIONS SUBMITTED (5 per player, queued)
  ↓
MAINTENANCE WINDOW (3-6 hours)
  ├─ GM reviews pending events
  ├─ GM communicates AI instructions
  ├─ System processes GM overrides
  ↓
TURN RESOLUTION (simultaneous processing)
  ├─ Process all submitted actions
  ├─ Update markets
  ├─ Generate new events (AI + GM approved)
  ├─ Calculate policy effects
  ├─ Shift population opinion
  ├─ Distribute company profits
  ├─ Generate news articles
  ├─ Update elections/government status
  ↓
TURN ADVANCEMENT
  └─ Increment turn counter
     Reset action points
     Update turn-based timers
```

## Balance Considerations

- Player cash starts at $100,000 (enough for ~10-20 actions or one company)
- Stock market provides alternate wealth building (lower risk, slower)
- Paid actions (Twitter, sponsorship) create spending decisions
- Government positions provide salary/income (future feature)
- Company profits scale with success but risk bankruptcy
- Reputation high ceiling but slow gains (encourages long-term play)

## Immersion Goals

1. **Decisions Matter**: Player actions visible in markets, opinion, events
2. **Organic Narrative**: Events follow from conditions, not random
3. **World Feels Alive**: NPC actions, AI-generated content, dynamic population
4. **Passive Playability**: No mandatory daily login, can catch up in minutes
5. **Competitive Cooperation**: Players compete for influence but need allies
