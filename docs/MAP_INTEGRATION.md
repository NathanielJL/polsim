# Azgaar Map Integration - Complete Guide

## Overview

This integration imports Azgaar Fantasy Map Generator exports into POLSIM, creating a fully functional 1850s Zealandia political simulation with:

- **7 Provinces** (Queensland excluded)
- **95,000 Total Population** (distributed by terrain & cities)
- **1850s New Zealand Economy** (timber, agriculture, fishing, whaling, livestock, mining)
- **Geographic Data** (5,595 cells with vertices for map rendering)
- **Rivers, Cities, Cultures, Religions**

---

## Architecture

### Database Models Created

**Province** - Political divisions
- Geographic: cells, cities, capital, area, color
- Economic: GDP, resources (timber/agriculture/fishing/etc), river bonus
- Political: governor, lt-governor, ideology, legislature flag
- Cultural: culture/religion composition percentages

**Cell** - Terrain units
- Geometry: vertices, connections, position
- Climate: height, temperature, biome
- Data: habitability score, province ownership, culture/religion

**City** - Burgs from Azgaar
- Location: position, cell, province
- Type: port/inland/mining/agricultural
- Population, capital status

**Culture/Religion** - Demographic data for approval ratings

**River** - Transportation infrastructure (GDP bonus)

---

## Services

### 1. **AzgaarMapParser**
Extracts data from Azgaar JSON:
- Filters out Queensland (province 113)
- Parses provinces, cells, cities, rivers, cultures, religions
- CLI: `ts-node backend/src/utils/AzgaarMapParser.ts "map.json" output.json`

### 2. **PopulationDistributionService**
Distributes 95,000 people across provinces:
- **Biome weights**: Temperate forest (0.95), Grassland (0.85), Marine (0.15)
- **City multiplier**: 5x population attraction
- **Formula**: `cellPop = (area × biomeWeight × cityMultiplier) / totalScore × 95000`

### 3. **EconomicInitializationService**
Calculates 1850s economy:

**Resource Mapping:**
| Biome | Resources |
|---|---|
| Marine (1) | Fishing 8, Whaling 3 |
| Grassland (5, 9) | Agriculture 10-12, Livestock 12-14 |
| Forest (6, 7, 8) | Timber 12-18, Agriculture 4-6 |
| Mountains (height > 70) | Mining 20 |

**GDP Formula:**
```
baseGDP = Σ(resource × value × area)
riverBonus = min(riverCells / totalCells × 0.5, 0.25)
finalGDP = baseGDP × (1 + riverBonus)
```

**Temperature (NZ Climate):**
```
temp = 14°C - (height × 0.6) + (latitude × -10)
```

### 4. **MapImportService**
Orchestrates full import pipeline:
1. Parse Azgaar JSON
2. Import cultures & religions → MongoDB
3. Import provinces → create documents
4. Import cells (batch 500 at a time) → calculate temperature
5. Import cities → link to provinces
6. Import rivers
7. Determine city economic types
8. Distribute population
9. Initialize economy
10. Calculate cultural/religious composition

---

## API Endpoints

### Import Map
```http
POST /api/map/import
Content-Type: application/json

{
  "sessionId": "674f5e1a2b3c4d5e6f7g8h9i",
  "mapFilePath": "Aotearoa Full 2025-12-03-19-27.json"
}
```

### Get Provinces
```http
GET /api/map/:sessionId/provinces
```
Returns all provinces with governor info, GDP, population

### Get Province Details
```http
GET /api/map/:sessionId/provinces/:provinceId
```
Returns province + all cells + cities

### Get Map Render Data
```http
GET /api/map/:sessionId/render-data
```
Returns complete data for frontend map rendering:
- Province colors & boundaries
- Cell vertices & positions
- City locations

---

## Player System

### Office Holding
```typescript
player.heldOffice = {
  type: 'governor' | 'lt-governor' | 'prime-minister' | 'cabinet' | 'parliament' | 'supreme-court' | 'provincial-court',
  provinceId: ObjectId,  // For provincial offices
  position: "Minister of Finance",  // For cabinet
  electedAt: Date
}
```

**Rules:**
- One office per player
- Can move between provinces (week cooldown)
- Must resign before moving

### Government Structure

**Federal:**
- Prime Minister (popular vote nationwide)
- Cabinet (appointed by PM)
- Parliament (proportional representation)
- Supreme Court

**Provincial:**
- Governor + Lt. Governor (popular vote in province)
- Cabinet (appointed by Governor)
- Legislature (optional, voted on by province)
- Court System

---

## Approval Rating System

Culture/Religion affect approval when policies target them:

```typescript
function calculateApproval(player, province, policy) {
  let approval = 50;
  
  if (policy.affectsCulture) {
    if (player.culturalAffinity === province.dominantCulture) {
      approval += 15;  // Favoring local culture
    } else {
      approval -= 10;  // Against local culture
    }
  }
  
  if (policy.affectsReligion) {
    if (player.religiousAffinity === province.dominantReligion) {
      approval += 12;
    } else {
      approval -= 8;
    }
  }
  
  return approval;
}
```

---

## Testing the Integration

### 1. Parse the Map
```bash
cd backend/src/utils
ts-node AzgaarMapParser.ts "../../../Aotearoa Full 2025-12-03-19-27.json" parsed-map.json
```

### 2. Create a Session
```bash
# Via API or MongoDB directly
POST /api/sessions/create
{
  "name": "Zealandia 1853",
  "gamemaster": "<your-player-id>"
}
```

### 3. Import the Map
```bash
# Option A: Via API
POST /api/map/import
{
  "sessionId": "<session-id>",
  "mapFilePath": "Aotearoa Full 2025-12-03-19-27.json"
}

# Option B: Test script
ts-node test-import.ts <session-id>
```

### 4. Query Results
```bash
GET /api/map/<session-id>/summary
GET /api/map/<session-id>/provinces
GET /api/map/<session-id>/render-data
```

---

## Frontend Integration

### Render Azgaar Map

1. **Fetch render data:**
```typescript
const response = await fetch(`/api/map/${sessionId}/render-data`);
const { provinces, cells, cities } = await response.json();
```

2. **Render cells with SVG:**
```tsx
{cells.map(cell => {
  const province = provinces.find(p => p._id === cell.provinceId);
  const pathData = cell.vertices.map((v, i) => 
    `${i === 0 ? 'M' : 'L'} ${v.x} ${v.y}`
  ).join(' ') + ' Z';
  
  return (
    <path
      key={cell.azgaarId}
      d={pathData}
      fill={province?.color || '#ccc'}
      stroke="#000"
      strokeWidth={0.5}
    />
  );
})}
```

3. **Render cities:**
```tsx
{cities.map(city => (
  <circle
    key={city.azgaarId}
    cx={city.position[0]}
    cy={city.position[1]}
    r={city.isCapital ? 3 : 2}
    fill={city.isCapital ? 'gold' : 'black'}
  />
))}
```

---

## Automation Integration

### Existing Services Work Automatically

**GameSimulationEngine** - extend to use province geography:
```typescript
async processTurn(sessionId) {
  const provinces = await ProvinceModel.find({ sessionId });
  
  for (const province of provinces) {
    // Calculate GDP from resources
    const gdp = this.econService.calculateGDP(province);
    
    // Update stock prices
    await this.tradingService.updateProvinceStock(province, gdp);
    
    // Trigger events based on geography
    if (province.resources.mining > 1000) {
      await this.triggerMiningEvent(province);
    }
  }
}
```

**AIService** - AI governors manage provinces:
```typescript
async aiGovernorTurn(aiPlayer) {
  const province = await ProvinceModel.findOne({ currentGovernor: aiPlayer._id });
  
  // AI decides policies based on province resources
  if (province.resources.timber > province.resources.agriculture) {
    return this.proposeTimberSubsidy(province);
  }
}
```

**No external API needed** - all automation runs in existing backend loop.

---

## Data Summary

**Expected Results:**

| Province | Population | GDP | Top Resource |
|---|---|---|---|
| New Caledonia | ~9,000 | £850k | Fishing |
| Tasminata | ~17,000 | £2.1M | Timber |
| Vulteralia | ~19,000 | £2.3M | Agriculture |
| New Zealand | ~14,000 | £1.8M | Livestock |
| Cooksland | ~13,000 | £1.7M | Agriculture |
| Orketers | ~2,000 | £180k | Fishing |
| Southland | ~21,000 | £2.8M | Livestock |

**Total:** 95,000 population, ~£11.75M GDP

---

## Next Steps

1. ✅ Import map into session
2. Create AI player service for NPC provinces
3. Create government office assignment system
4. Implement federal policy mechanics (province subdivision/merger)
5. Build frontend map renderer
6. Integrate approval ratings with culture/religion
7. Connect to existing GameSimulationEngine

---

## Troubleshooting

**Import fails with "Session not found":**
- Create session first via `/api/sessions/create`

**Population = 0:**
- Check biome habitability weights
- Verify cells have valid `biome` and `area` fields

**GDP = 0:**
- Check resource calculations
- Verify cells have correct biome IDs
- Check river bonus calculation

**Map won't render:**
- Verify cells have `vertices` array
- Check coordinate system matches Azgaar export
- Use `/api/map/:sessionId/render-data` to debug

---

## Files Created

**Models:**
- `backend/src/models/mongoose.ts` - Extended Province, added Cell, City, Culture, Religion, River

**Services:**
- `backend/src/utils/AzgaarMapParser.ts` - Parse Azgaar JSON
- `backend/src/services/PopulationDistributionService.ts` - Distribute population
- `backend/src/services/EconomicInitializationService.ts` - Calculate economy
- `backend/src/services/MapImportService.ts` - Orchestrate import

**Routes:**
- `backend/src/routes/map.ts` - API endpoints

**Test:**
- `test-import.ts` - CLI test script
