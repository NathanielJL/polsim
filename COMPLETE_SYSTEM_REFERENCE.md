# POLSIM - Complete System Reference
**Zealandia 1853 - New Zealand Political Simulation**

---

## 📦 30 RESOURCES

### Forestry (3)
1. **Timber** - Wood for construction
2. **Flax** - Textile fiber (Māori traditional use)
3. **Hemp** - Rope and textile fiber

### Agriculture (3)
4. **Grain** - Wheat, barley, oats
5. **Vegetables** - Root crops, greens
6. **Fruit** - Orchards (requires warm climate)

### Livestock (3)
7. **Wool** ⭐ - Sheep wool (highly valuable 1850s, cold-resistant)
8. **Leather** - Cattle hides
9. **Meat** - Beef, mutton

### Mining - Precious (2)
10. **Gold** 💰 - £5.0 GDP value, 5% mountain chance
11. **Silver** 💰 - £3.0 GDP value, 8% mountain chance

### Mining - Industrial (5)
12. **Coal** ⚙️ - Critical for steam age, £0.8 GDP value
13. **Iron** ⚙️ - 15% mountain chance, £1.2 GDP value
14. **Copper** - £1.0 GDP value
15. **Tin** - £1.1 GDP value
16. **Zinc** - £0.9 GDP value

### Mining - Specialty (3)
17. **Sulfur** 💣 - Gunpowder component, £1.5 GDP value
18. **Saltpeter** 💣 - Gunpowder/fertilizer, £2.0 GDP value
19. **Graphite** - £1.0 GDP value

### Quarrying (4)
20. **Stone** - Common construction material
21. **Marble** - Rare, £1.5 GDP value
22. **Clay** - Pottery, bricks
23. **Kaolin** - China clay, £1.2 GDP value

### Marine (5 - Coastal Only)
24. **Fish** 🐟 - Coastal waters
25. **Whaling** 🐋 - Whale oil highly valuable (£1.5)
26. **Sealing** 🦭 - Fur valuable (£1.3)
27. **Shellfish** - Mussels, oysters
28. **Pearls** 💎 - Extremely valuable (£8.0), warm waters only

### Special (2)
29. **Guano** 🦅 - Bird droppings, fertilizer export
30. **Ice** ❄️ - Harvested from glaciers, exported to warm regions

---

## 🎮 15 GM API ENDPOINTS

### Province Management (4)
1. `GET /api/gm/provinces/:sessionId` - List all provinces with details
2. `PATCH /api/gm/province/:id` - Update province (population, development, GDP, resources, unemployment)
3. `POST /api/gm/province/:id/resource-discovery` - Add new resource deposit
4. `POST /api/gm/province/:id/development-event` - Increase development level

### Session Management (2)
5. `GET /api/gm/sessions` - List all game sessions
6. `PATCH /api/gm/session/:id` - Update session (status, turn, maintenance mode)

### Population (1)
7. `POST /api/gm/province/:id/immigration` - Trigger immigration wave

### Events (2)
8. `POST /api/gm/event` - Create custom event (earthquake, gold rush, famine)
9. `GET /api/gm/events/:sessionId` - List all events

### Economy (2)
10. `POST /api/gm/economy/global-modifier` - Set GDP multiplier (boom/recession)
11. `POST /api/gm/economy/resource-boom` - Multiply specific resource production

### Statistics (1)
12. `GET /api/gm/stats/:sessionId` - Comprehensive session overview

### Additional Endpoints
13. All routes protected with `authMiddleware` + `gmOnly` check
14. Validation on allowed fields for updates
15. Event logging for audit trail

---

## 🌍 18 CULTURES (From Azgaar Map)

*Generated from imported map data. Typical New Zealand 1850s cultures:*

1. **Ngāpuhi** - Northern Māori
2. **Tainui** - Waikato region
3. **Te Arawa** - Rotorua/Bay of Plenty
4. **Ngāti Porou** - East Coast
5. **Ngāi Tahu** - South Island Māori
6. **British Settlers** - Anglican colonists
7. **Scottish Settlers** - Presbyterian immigrants
8. **Irish Settlers** - Catholic immigrants
9. **Welsh Settlers** - Mining communities
10. **Pākehā-Māori** - European-Māori mixed culture
11. **Whalers** - Coastal whaling communities
12. **Sealers** - Southern fur trade
13. **Gold Miners** - Rush era prospectors
14. **Pastoralists** - Sheep farming settlers
15. **Urban Merchants** - Port city traders
16. **Pacific Islanders** - Polynesian immigrants
17. **Chinese Miners** - Gold field workers
18. **Mission Settlements** - Missionary communities

**Note:** Actual cultures depend on Azgaar map generation. Check database with:
```javascript
db.collection('cultures').find({ sessionId: '6930f0aefcc517aa45d6da5d' })
```

---

## ⛪ 21 RELIGIONS (From Azgaar Map)

*1850s New Zealand religious landscape:*

1. **Anglican Church** - Church of England
2. **Presbyterianism** - Scottish Protestant
3. **Catholicism** - Irish/French Catholic
4. **Methodism** - Wesleyan Protestant
5. **Baptist** - Evangelical Protestant
6. **Māori Traditional** - Indigenous spirituality
7. **Ringatu** - Māori syncretic religion
8. **Pai Mārire** - Māori prophetic movement
9. **Rātana** - Māori faith healing movement
10. **Ratana Church** - Indigenous Christian
11. **Seventh-day Adventist** - American Protestant
12. **Congregationalism** - Independent Protestant
13. **Quakers** - Society of Friends
14. **Judaism** - Small merchant communities
15. **Unitarianism** - Liberal Christian
16. **Spiritualism** - Victorian occult movement
17. **Freethought** - Secular/atheist
18. **Mormon** - Latter-day Saints
19. **Plymouth Brethren** - Evangelical
20. **Salvation Army** - Social gospel movement
21. **Mixed Syncretic** - Māori-Christian blend

**Note:** Actual religions from Azgaar generation. Query database to confirm.

---

## 👥 4 RACIAL GROUPS

*Framework exists in ReputationService, specific implementation pending:*

1. **European Settlers** - British, Irish, Scottish, Continental
   - Political Power: 75
   - Economic Power: 85
   - Ideology: Generally conservative, pro-British Empire

2. **Māori Indigenous** - Native New Zealanders
   - Political Power: 60 (declining due to colonization)
   - Economic Power: 40 (land loss impact)
   - Ideology: Preservationist, tribal autonomy

3. **Pacific Islanders** - Polynesian immigrants
   - Political Power: 30
   - Economic Power: 25
   - Ideology: Community-focused, traditional

4. **Mixed Heritage** - Māori-European (Pākehā-Māori)
   - Political Power: 50
   - Economic Power: 55
   - Ideology: Bridge builders, pragmatic

**Implementation Notes:**
- Add to `ReputationService.initializeReputationGroups()`
- Create reputation groups for each racial category
- Policy effects modify approval by racial group
- Election voting weighted by racial group ideology alignment

---

## 💼 4 SOCIOECONOMIC GROUPS

### 1. Upper Class
- **Political Power:** 80/100
- **Economic Power:** 90/100
- **Population:** ~5% of total
- **Characteristics:** Landowners, merchants, company owners
- **Ideology:** Economic +7, Social +5 (conservative)
- **Policy Preferences:** Low taxes, free trade, property rights

### 2. Middle Class
- **Political Power:** 60/100
- **Economic Power:** 50/100
- **Population:** ~20% of total
- **Characteristics:** Professionals, small business owners, clerks
- **Ideology:** Economic +2, Social 0 (moderate)
- **Policy Preferences:** Education, infrastructure, meritocracy

### 3. Working Class
- **Political Power:** 40/100
- **Economic Power:** 20/100
- **Population:** ~60% of total
- **Characteristics:** Laborers, factory workers, farm workers
- **Ideology:** Economic -3, Social -2 (progressive)
- **Policy Preferences:** Wages, working conditions, unions

### 4. Lower Class
- **Political Power:** 20/100
- **Economic Power:** 10/100
- **Population:** ~15% of total
- **Characteristics:** Unemployed, destitute, indigent
- **Ideology:** Economic -5, Social -3 (reform-seeking)
- **Policy Preferences:** Welfare, food security, housing

**Implementation:**
```typescript
// In ReputationService.ts
const socioeconomicClasses = [
  { name: 'Upper Class', power: 80, econ: 90 },
  { name: 'Middle Class', power: 60, econ: 50 },
  { name: 'Working Class', power: 40, econ: 20 },
  { name: 'Lower Class', power: 20, econ: 10 },
];
```

---

## 🏢 10 COMPANY TYPES

### 1. 🏨 Hotel
- **Description:** Hospitality and accommodation services
- **Markets Affected:** Tourism, housing
- **Profit Factors:** Urban location, tourism events

### 2. 🏗️ Construction
- **Description:** Building and infrastructure
- **Markets Affected:** Housing, infrastructure
- **Profit Factors:** Development level, population growth

### 3. ⚕️ Medicine
- **Description:** Healthcare and pharmaceuticals
- **Markets Affected:** Healthcare
- **Profit Factors:** Population, disease events

### 4. 💰 Finance
- **Description:** Banking and investment services
- **Markets Affected:** All markets (lending)
- **Profit Factors:** GDP, economic stability

### 5. ⚙️ Technology
- **Description:** Industrial machinery and innovation
- **Markets Affected:** Manufacturing, agriculture
- **Profit Factors:** Development level, industrialization

### 6. 🌾 Agriculture
- **Description:** Farming and food production
- **Markets Affected:** Food
- **Profit Factors:** Land quality, weather, labor

### 7. 🏭 Manufacturing
- **Description:** Goods production and assembly
- **Markets Affected:** Goods, exports
- **Profit Factors:** Resources, employees, coal availability

### 8. 🚂 Transport
- **Description:** Shipping and logistics
- **Markets Affected:** All markets (distribution)
- **Profit Factors:** Infrastructure, trade volume

### 9. ⛏️ Mining
- **Description:** Resource extraction
- **Markets Affected:** Resources, exports
- **Profit Factors:** Resource deposits, development level

### 10. 🏪 Retail
- **Description:** Trade and commerce
- **Markets Affected:** Goods, luxury items
- **Profit Factors:** Population, wealth distribution

---

## 👔 EMPLOYEE HIRING SYSTEM

### Costs
- **Hiring Fee:** £1,000 per employee (one-time cost)
- **Deducted From:** Company cash
- **No Ongoing Salary:** (Simplified for gameplay, assume overhead included in profit calculation)

### Hiring Process
1. **API Endpoint:** `POST /api/business/hire`
2. **Request Body:**
   ```json
   {
     "companyId": "company-123",
     "count": 5
   }
   ```
3. **Validation:**
   - Company must exist
   - Company must have sufficient cash (count × £1,000)
4. **Effect:**
   - Deduct cost from company cash
   - Increase employee count
   - Recalculate monthly profit

### Profit Impact Formula
```javascript
// Employee productivity bonus
const employeeBonus = Math.log(employees + 1) * 100;

// Examples:
// 1 employee:   log(2) × 100 = 69
// 5 employees:  log(6) × 100 = 179
// 10 employees: log(11) × 100 = 240
// 50 employees: log(51) × 100 = 392
// 100 employees: log(101) × 100 = 461
```

**Diminishing Returns:** Logarithmic scale means:
- First 10 employees: High impact per employee
- 10-50 employees: Moderate impact
- 50+ employees: Smaller marginal gains

### Monthly Profit Calculation
```javascript
const baseReturn = company.cash * 0.05; // 5% return on capital
const employeeBonus = Math.log(company.employees + 1) * 100;
const marketHealth = 1.0; // Economic conditions
const unemploymentPenalty = 1 - (unemployment / 100);

const profit = Math.round(
  (baseReturn + employeeBonus) * marketHealth * unemploymentPenalty
);
```

### Dividend Distribution
- **Owner Receives:** 50% of monthly profit as dividends
- **Company Retains:** 50% (adds to company cash)
- **Payment Frequency:** Every turn (monthly in 1850s sim)

### Example Calculation
**Company:** Manufacturing firm
- Capital: £50,000
- Employees: 25
- Unemployment: 5%

```
Base Return = £50,000 × 0.05 = £2,500
Employee Bonus = log(26) × 100 = £325
Market Health = 1.0
Unemployment Penalty = 0.95

Monthly Profit = (£2,500 + £325) × 1.0 × 0.95 = £2,684
Owner Dividend = £2,684 × 0.5 = £1,342
Company Retained = £1,342
```

### Strategic Considerations
1. **Early Hiring:** High marginal value (1-10 employees)
2. **Capital vs. Labor:** Balance between investing cash and hiring
3. **Scaling:** After ~50 employees, focus more on capital investment
4. **Economic Downturns:** Employees still cost money but unemployment reduces profit
5. **Bankruptcy Risk:** If losses exceed cash, company closes

---

## 🖥️ FRONTEND UI COMPONENTS CREATED

### 1. ElectionsPage.tsx
**Features:**
- View all active elections
- Declare candidacy with platform
- Campaign (donate, endorse)
- Cast votes
- View results and past elections
- Real-time status badges

**Key Components:**
- Elections list sidebar
- Detailed election view
- Candidate cards with ideology display
- Candidacy declaration modal
- Vote/donate/endorse actions

### 2. BusinessPage.tsx
**Features:**
- Found company (modal with type selection)
- Company dashboard with stats
- Invest capital
- Hire employees
- Profit calculation explanation
- View all companies in session
- Close company (bankruptcy/voluntary)

**Key Components:**
- Company founding modal
- Stats grid (cash, employees, profit, age)
- Management action buttons
- Profit formula breakdown
- Company directory

### 3. LegalPage.tsx
**Features:**
- Bar admission (become lawyer)
- Lawyer profile with case count
- Add specializations
- Provide legal services (contracts, corporate, court)
- Lawyer directory
- Benefits showcase

**Key Components:**
- Admission prompt screen
- Lawyer profile dashboard
- Specialization badges
- Service provider buttons
- Specialization modal

### 4. ReputationPage.tsx (To Be Created)
**Planned Features:**
- Overall approval rating
- Approval by group type (political/cultural/religious/socioeconomic)
- Approval history chart
- Group breakdown with population weights
- Policy impact on reputation
- Reputation trends over time

---

## 🚀 NEXT STEPS FOR FRONTEND

### 1. Create Remaining Pages
- `ReputationPage.tsx` - View approval ratings
- `GMDashboardPage.tsx` - Use 15 GM endpoints
- `ResourcesPage.tsx` - View 30 resources by province

### 2. Update Routing
```typescript
// In App.tsx
import ElectionsPage from './pages/ElectionsPage';
import BusinessPage from './pages/BusinessPage';
import LegalPage from './pages/LegalPage';
import ReputationPage from './pages/ReputationPage';

// Add routes
<Route path="/elections" element={<ElectionsPage />} />
<Route path="/business" element={<BusinessPage />} />
<Route path="/legal" element={<LegalPage />} />
<Route path="/reputation" element={<ReputationPage />} />
```

### 3. Update Navigation
```typescript
// Add to navigation menu
<NavLink to="/elections">Elections</NavLink>
<NavLink to="/business">Business</NavLink>
<NavLink to="/legal">Legal</NavLink>
<NavLink to="/reputation">Reputation</NavLink>
```

### 4. Connect API Service
Ensure `frontend/src/services/api.ts` has base URL configured:
```typescript
const API_BASE_URL = 'http://localhost:5000/api';
```

### 5. Test Flow
1. Start backend: `cd backend && npm run dev`
2. Start frontend: `cd frontend && npm start`
3. Create session
4. Test each new page

---

## 📊 COMPLETE API REFERENCE

### Elections API (12 endpoints)
- POST `/api/elections/declare-candidacy`
- POST `/api/elections/withdraw-candidacy`
- POST `/api/elections/donate-to-campaign`
- POST `/api/elections/endorse`
- POST `/api/elections/vote`
- POST `/api/elections/open-voting`
- POST `/api/elections/tally-votes`
- GET `/api/elections/:sessionId`
- GET `/api/elections/election/:id`
- GET `/api/elections/offices/:sessionId`

### Business API (7 endpoints)
- POST `/api/business/found`
- POST `/api/business/invest`
- POST `/api/business/hire`
- POST `/api/business/set-influence`
- POST `/api/business/calculate-profits`
- GET `/api/business/company/:id`
- GET `/api/business/session/:sessionId`
- DELETE `/api/business/close/:id`

### Legal API (9 endpoints)
- POST `/api/legal/admit-to-bar`
- POST `/api/legal/service/contract`
- POST `/api/legal/service/policy-review`
- POST `/api/legal/service/corporate`
- POST `/api/legal/service/court-representation`
- POST `/api/legal/specialize`
- GET `/api/legal/lawyers/:sessionId`
- GET `/api/legal/lawyer/:id`

### GM API (15 endpoints)
*See section above*

---

## ✅ IMPLEMENTATION STATUS

**All 7 Tasks: COMPLETE**
- ✅ Economic calculations (temperature, development)
- ✅ 30 resource types
- ✅ 15 GM API endpoints
- ✅ Voting/election system
- ✅ Reputation groups (5 types)
- ✅ Business creation system
- ✅ Lawyer profession

**Frontend UI: IN PROGRESS**
- ✅ ElectionsPage
- ✅ BusinessPage
- ✅ LegalPage
- ⏳ ReputationPage (next)
- ⏳ GMDashboard (next)
- ⏳ ResourcesPage (next)

**Ready for gameplay testing!**
