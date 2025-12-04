# POLSIM - Systems Overview

## 1. Temperature & Agriculture Issues ❄️

**Problem Identified:** Southland has an average temperature of -4.8°C (range: -39.4°C to 2.0°C), yet produces massive agriculture. This is unrealistic for 1850s technology.

**Current State:**
- Southland: 66% Temperate Grassland, 15.6% Taiga, 10.6% Tundra
- Temperature: Average -4.8°C
- Agriculture production: 613,905 units (highest in all provinces)
- This doesn't account for cold climate limitations

**Solution Needed:**
- Add temperature penalties to agriculture/livestock
- Agriculture should only work in warmer biomes or require greenhouse tech (1900s+)
- Cold climates should focus on mining, fishing, whaling, sealing

---

## 2. Development Limits (1850s Context) 🏗️

**Current Issue:** All available land is being fully exploited, ignoring:
- Low population (95,000 total)
- Limited 1850s technology
- Need for infrastructure development over time

**Proposed System:**
- **Development Level** per province (0-100%)
  - 1850s start: 5-15% developed (based on population density)
  - Increases with: Infrastructure policies, population growth, technology
  - Only developed % of resources are accessible
  
**Example:**
- Southland has 613,905 potential agriculture
- At 10% development: Only 61,390 actually accessible
- GM can trigger "Agricultural Expansion" events to increase development

**GM Controls Needed:**
- Set development % per province
- Trigger development events
- Adjust over time as population/tech grows

---

## 3. Expanded Resource System 💎

**Current Resources:** Timber, Agriculture, Fishing, Whaling, Livestock, Mining (too simple)

**1850s-Era Resources:**

### **Primary Resources** (directly extracted):
- **Forestry**: Timber, Flax, Hemp
- **Agriculture**: Grain, Vegetables, Fruit
- **Livestock**: Wool (sheep), Leather (cattle), Meat
- **Fishing**: Fish, Shellfish, Pearls
- **Marine**: Whaling (oil), Sealing (fur, oil)
- **Mining**: 
  - Precious: Gold, Silver
  - Industrial: Coal, Iron, Copper, Tin, Zinc
  - Specialty: Sulfur, Saltpeter (gunpowder), Graphite
- **Quarrying**: Stone, Marble, Clay, Kaolin (china clay)
- **Other**: Guano (fertilizer), Ice (export from cold regions)

### **Secondary Resources** (manufactured):
- **Textiles**: Wool cloth, Linen (from flax), Hemp rope
- **Metals**: Iron goods, Copper wire, Tin cans
- **Energy**: Coal (heating/steam), Whale oil (lighting)

### **Resource Groups for Player View:**

```typescript
interface ProvinceResources {
  // Forestry & Agriculture
  forestry: {
    timber: number,
    flax: number,
    hemp: number
  },
  agriculture: {
    grain: number,
    vegetables: number,
    fruit: number
  },
  
  // Animal Products
  livestock: {
    wool: number,
    leather: number,
    meat: number
  },
  
  // Marine Resources
  marine: {
    fish: number,
    whaling: number,
    sealing: number,
    shellfish: number,
    pearls: number
  },
  
  // Mining
  mining: {
    precious: { gold: number, silver: number },
    industrial: { coal: number, iron: number, copper: number, tin: number, zinc: number },
    specialty: { sulfur: number, saltpeter: number, graphite: number }
  },
  
  // Quarrying
  quarrying: {
    stone: number,
    marble: number,
    clay: number,
    kaolin: number
  },
  
  // Special
  special: {
    guano: number,
    ice: number
  },
  
  // Development
  developmentLevel: number, // 0-100%
  accessibleResources: number // developmentLevel * totalResources
}
```

**Player-Facing Display:**
Players should see categorized resources with tooltips explaining uses:
- "Gold: 150 units (£2/unit) - Used for currency, jewelry, trade"
- "Coal: 2,500 units (£0.5/unit) - Fuel for steam engines, heating"
- "Wool: 8,000 units (£0.8/unit) - Textile production, export"

---

## 4. GM Dashboard (Non-Code Interface) 🎛️

**Purpose:** Allow GMs to make changes without editing code directly

**Proposed Dashboard Sections:**

### **A. Province Management**
- View all provinces with current stats
- Edit fields:
  - Population (manual adjustment)
  - Development level (%)
  - Resource multipliers (1.0 = normal, 2.0 = double)
  - GDP override
- Actions:
  - "Add Development Event" → increases development %
  - "Resource Discovery" → unlock new resource type
  - "Natural Disaster" → reduce resources/population

### **B. Resource Management**
- View province resources in table format
- Edit any resource value directly
- Bulk operations:
  - "Global Resource Boom" (coal discovery affects all provinces)
  - "Famine" (reduce agriculture in region)
  - "Gold Rush" (spike gold in one province)

### **C. Economic Tools**
- Set base prices for resources
- Trigger market events (boom/crash)
- Adjust global GDP multipliers
- Modify trade routes

### **D. Population & Immigration**
- Adjust province populations
- Trigger immigration waves
- Modify population archetype distributions
- Adjust class levels

### **E. Event Generator**
- Create custom events with:
  - Title, description, severity
  - Duration
  - Affected provinces/groups
  - Resource/economic impacts
- Event templates (pre-made common events)

### **F. Map Management**
- Re-import new Azgaar map
- Merge new map data with existing session
- Add/remove provinces
- Redraw borders

**Implementation Approach:**
- Frontend React dashboard at `/gm-dashboard`
- API endpoints for each edit action
- All changes logged for audit trail
- AI assistant available for complex operations

---

## 5. Player Markets 🏪

**Current System:** Stock market trading, company ownership

**Market Types Defined:**
1. **Stock Market** (TradingService.ts):
   - Sector ETFs (Healthcare, Transport, Housing, Food, Tech, Goods)
   - Players buy/sell shares
   - Price fluctuates based on supply/demand
   - Dividends based on sector performance

2. **Physical Goods Market**:
   - Resources listed above (players can trade resources)
   - Prices determined by provincial supply/demand
   - Transportation costs between provinces

3. **Company Market**:
   - Players found companies (hotels, construction, medicine, etc.)
   - Monthly auto-profit calculation
   - Hire employees
   - Influence specific markets

4. **Real Estate**:
   - Players buy homes (status symbol)
   - Commercial property for companies
   - Land speculation

**What Players Can Do:**
- **Trade stocks** in sector ETFs
- **Found companies** with $100k starting cash
- **Buy/sell resources** (if they control production)
- **Speculate** on resource prices
- **Own news outlets** (local only, national are AI-controlled)

**Missing Implementation:**
- Physical resource trading API
- Land ownership system
- Resource pricing model tied to provincial production

---

## 6. Political Process 🗳️

### **Reputation System**

**Current Implementation (types.ts):**
```typescript
Player {
  reputation: number,              // Overall score
  reputationByGroup: Map<string, number>  // Per-archetype approval
}
```

**How It Works:**
1. **Base Reputation**: Starts at 0 (neutral)
2. **Group-Specific Approval**: Each population archetype has separate approval
   - AuthoritarianRight: -50 (if you're LibLeft)
   - LibertarianLeft: +30 (aligned)
   - Centrist: +10 (moderate)
3. **Approval Influenced By:**
   - Policies you support/oppose
   - Events you trigger
   - News articles you write
   - Company actions
   - Twitter/social media (if implemented)

**Reputation Effects:**
- High approval → More votes in elections
- Low approval → Protests, negative news coverage
- Group-specific → Right-wing voters won't support left policies

### **Government & Voting**

**System States:**

#### **1. Direct Democracy (Initial)**
- All players vote on proposed policies
- Simple majority wins
- Voting power weighted by reputation (optional)
- Referendum mechanics

**Process:**
```
1. Player proposes policy
2. GM reviews (auto-approve or manual)
3. Voting period (1-3 turns)
4. Players cast votes
5. Population NPCs vote based on ideology alignment
6. If approved → Policy becomes active
```

#### **2. Representative Democracy (Unlockable)**
- Players run for Parliament seats
- Elections based on reputation + campaigning
- Parliament votes on bills
- Executive (PM/President) can veto

**Election Process:**
```
1. Campaign period (2 turns)
   - Write news articles
   - Make promises (policies)
   - Gain group approval
2. Election turn
   - Population votes based on:
     - Ideology alignment
     - Reputation scores
     - Recent events
3. Winners form government
4. Legislature operates for fixed term (10 turns)
```

#### **3. Monarchy/Dictatorship (Event-Driven)**
- Triggered by revolution events
- Single player holds power temporarily
- Can enact policies without votes
- Risk of overthrow

**Current Status:**
- ✅ Reputation system defined
- ✅ Population archetypes with approval tracking
- ⚠️ Voting mechanics not fully implemented
- ❌ Election system needs building
- ❌ Parliamentary voting logic missing

**What Needs Building:**
1. Policy voting API endpoint
2. Election campaign system
3. Parliament seat allocation
4. Vote counting with NPC population weights
5. News/media influence on voting

---

## Summary of Immediate Issues

### **Critical Fixes Needed:**
1. ❄️ **Temperature penalties** for agriculture in cold climates
2. 🏗️ **Development levels** to limit resource accessibility
3. 💎 **Expanded resource system** with 20+ resource types
4. 🎛️ **GM dashboard** for non-code editing

### **Systems Status:**
- ✅ **Markets**: Stock trading implemented, resource trading needs API
- ⚠️ **Reputation**: Defined, needs integration with voting
- ❌ **Voting**: Design exists, implementation incomplete
- ❌ **Elections**: Not implemented yet

### **Next Steps:**
1. Fix economic calculations (temperature, development)
2. Expand resource schema in database
3. Build GM dashboard frontend
4. Implement voting/election mechanics
