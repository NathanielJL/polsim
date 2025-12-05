# Business Profit Model - Zealandia Political Simulation

## **Current System Overview**

### **Company Creation**
- **Cost**: £500 (initial capital)
- **Founder Gets**: 100% ownership (tracked via `ownerId` field)
- **Initial State**: 
  - Cash: £500
  - Employees: 1 (the owner)
  - Monthly Profit: £0

---

## **Profit Calculation (Every Turn = 1 Month)**

### **Revenue Formula**
```
Revenue = Company Valuation × 5%
```

### **Profit Formula**
```
Profit = Revenue × 30% (profit margin)
Company Cash += Profit
```

### **Example: £10,000 Valuation Company**
- **Revenue per turn**: £10,000 × 5% = £500
- **Profit per turn**: £500 × 30% = £150
- **After 6 turns**: £150 × 6 = £900 accumulated

---

## **Dividend Distribution (Every 6 Turns)**

### **Distribution Formula**
```
Total Dividends = Company Cash × 50%
Dividend Per Share = Total Dividends ÷ Total Shares
Player Gets = Dividend Per Share × Player's Shares
Company Retains = Company Cash × 50%
```

### **Current Issue**
⚠️ **No shareholding system for player-owned companies!**
- Company has `ownerId` but no share tracking
- PlayerPortfolio tracks stocks (StockMarket) but not Company ownership
- **Dividends currently don't work for player businesses**

---

## **Recommended Implementation**

### **Add Share Tracking to Company Model**
```typescript
const CompanySchema = new Schema({
  id: { type: String, unique: true, required: true },
  ownerId: { type: String, required: true },
  name: { type: String, required: true },
  type: String,
  cash: { type: Number, default: 0 },
  employees: { type: Number, default: 0 },
  
  // NEW: Share tracking
  totalShares: { type: Number, default: 10000 },
  shareholders: [{
    playerId: { type: Schema.Types.ObjectId, ref: 'Player' },
    shares: { type: Number },
    _id: false
  }],
  
  valuation: { type: Number, default: 0 }, // Market value
  monthlyProfit: { type: Number, default: 0 },
  profitHistory: [{
    turn: Number,
    profit: Number,
    _id: false
  }],
  createdAt: { type: Date, default: Date.now },
});
```

### **Updated Distribution Logic**
```typescript
async distributeDividends(sessionId: string): Promise<void> {
  const companies = await models.Company.find({ sessionId });
  
  for (const company of companies) {
    if (!company.cash || company.cash <= 0) continue;
    
    // Distribute 50% of cash as dividends
    const totalDividends = company.cash * 0.5;
    const dividendPerShare = totalDividends / company.totalShares;
    
    // Distribute to all shareholders
    for (const shareholder of company.shareholders) {
      const dividend = dividendPerShare * shareholder.shares;
      
      const player = await models.Player.findById(shareholder.playerId);
      if (player) {
        player.cash = (player.cash || 0) + dividend;
        await player.save();
      }
    }
    
    // Company retains 50%
    company.cash -= totalDividends;
    await company.save();
  }
}
```

---

## **Income Examples**

### **Small Business (£2,000 valuation)**
- **Revenue/turn**: £2,000 × 5% = £100
- **Profit/turn**: £100 × 30% = £30
- **6-turn accumulation**: £30 × 6 = £180
- **Dividend (100% owner)**: £180 × 50% = £90
- **Annual income** (2 payments): £90 × 2 = **£180/year**
- **ROI**: 9% annual return

### **Medium Business (£10,000 valuation)**
- **Revenue/turn**: £10,000 × 5% = £500
- **Profit/turn**: £500 × 30% = £150
- **6-turn accumulation**: £150 × 6 = £900
- **Dividend (100% owner)**: £900 × 50% = £450
- **Annual income** (2 payments): £450 × 2 = **£900/year**
- **ROI**: 9% annual return

### **Large Business (£50,000 valuation)**
- **Revenue/turn**: £50,000 × 5% = £2,500
- **Profit/turn**: £2,500 × 30% = £750
- **6-turn accumulation**: £750 × 6 = £4,500
- **Dividend (100% owner)**: £4,500 × 50% = £2,250
- **Annual income** (2 payments): £2,250 × 2 = **£4,500/year**
- **ROI**: 9% annual return

---

## **Comparison with Top 5% Population**

### **Zealandia Economic Data (1854)**
- **Total Population**: 97,292
- **Economic Population**: 21,461
- **GDP per Capita**: £418
- **Total GDP**: £8,971,952

### **Top 5% Threshold**
- **Estimated wealth**: £10,000-£15,000 total assets
- **Estimated annual income**: £1,500-£3,000/year
- **Occupation**: Landowners, merchants, lawyers, doctors

### **Business vs. Office Income**

| Position | Annual Income | Equivalent Business Valuation |
|----------|--------------|------------------------------|
| Governor | £1,200 | £13,300 business |
| Superintendent | £800 | £8,900 business |
| General Assembly | £400 | £4,400 business |
| Provincial Counsel | £300 | £3,300 business |
| Judge | £600 | £6,700 business |
| **Top 5% Average** | **£2,000** | **£22,000 business** |

### **Key Insight**
- **9% annual ROI** is reasonable for 1850s colonial economy
- Players need **£11,000+ valuation** to match low-end office income (£1,000/year)
- Players need **£22,000+ valuation** to reach top 5% (£2,000/year)
- **Prevents runaway wealth** while rewarding successful business owners

---

## **Valuation Growth Model (Optional)**

### **Factors Affecting Valuation**
1. **Employee Count**: More employees = higher productivity
2. **Province GDP**: Businesses in wealthy provinces grow faster
3. **Market Type**: Different industries have different growth rates
4. **Policy Effects**: Tax policies, regulations affect growth

### **Sample Growth Formula**
```typescript
async calculateValuationGrowth(company: Company, province: Province): Promise<number> {
  // Base growth: 2% per turn (24% per year)
  let growthRate = 0.02;
  
  // Employee productivity bonus
  const employeeBonus = Math.min(0.01 * company.employees, 0.10); // Max +10%
  
  // GDP multiplier (wealthy provinces grow faster)
  const gdpMultiplier = (province.gdp / 1000000); // 0.1-0.9 multiplier
  
  // Industry modifier
  const industryModifiers = {
    'Mining': 1.5,       // High risk, high reward
    'Finance': 1.3,      // Profitable but volatile
    'Manufacturing': 1.1,
    'Agriculture': 1.0,  // Stable
    'Retail': 0.9,
  };
  
  const modifier = industryModifiers[company.type] || 1.0;
  
  const totalGrowth = growthRate + employeeBonus;
  const newValuation = company.valuation * (1 + totalGrowth * gdpMultiplier * modifier);
  
  return Math.round(newValuation);
}
```

### **Growth Example (£10,000 business, 5 employees)**
- **Base growth**: 2%
- **Employee bonus**: 5 × 1% = +5%
- **Total growth**: 7% per turn
- **After 12 turns** (1 year): £10,000 × (1.07)^12 = **£22,500**
- **Annual dividend**: £22,500 × 0.05 × 0.3 × 6 × 0.5 × 2 = **£2,025/year**

---

## **Balance Recommendations**

### **Keep Players from Getting Too Rich**
1. **Cap max employees**: Limit to 50-100 employees
2. **Diminishing returns**: Each employee adds less growth
3. **Market saturation**: Companies in same province compete
4. **Random events**: Fires, theft, economic downturns reduce valuation
5. **Tax policies**: Progressive taxation on high-value companies

### **Keep System Engaging**
1. **Investment opportunities**: Buy shares in other players' companies
2. **Mergers & acquisitions**: Combine companies for economies of scale
3. **Innovation**: Spend cash on R&D for growth boosts
4. **Expansion**: Open branches in other provinces (costs AP + cash)

---

## **Implementation Priority**

### **Phase 1: Fix Current System**
- [x] Add shareholding to Company model
- [ ] Fix dividend distribution to use shareholders array
- [ ] On company creation, give founder 10,000 shares

### **Phase 2: Add Valuation**
- [ ] Add valuation field to Company model
- [ ] Calculate initial valuation from employee count + capital
- [ ] Add valuation growth logic to turn processing

### **Phase 3: Player Trading**
- [ ] Allow players to sell shares to each other
- [ ] Stock market interface for company shares
- [ ] Voting rights based on shareholding (>50% = control)

---

## **Current Status**

✅ **Implemented**:
- Company creation (£500)
- Profit calculation (5% revenue, 30% margin)
- Dividend timing (every 6 turns)
- Office income distribution (every 6 turns)

⚠️ **Needs Fix**:
- Shareholding system (currently missing)
- Dividend distribution (doesn't work without shares)
- Valuation tracking (used in formulas but not stored)

📋 **Future Enhancements**:
- Valuation growth mechanics
- Player-to-player share trading
- Market competition
- Random events affecting businesses
