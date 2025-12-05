# Action System Updates - December 5, 2025

## Summary of Changes

### Action Costs & Mechanics

1. **Submit Policy**: FREE (was 1 AP)
2. **Create Party**: £250 (was £500)
3. **Party Fundraising**: +£50 to party fund (was +3 AP to leader)
4. **Party Campaign**: NEW - £300, random 3 demographics, 1-12 turn duration, +1-5% boost
5. **Create Newspaper**: £100 (unchanged)
6. **Hire Journalist**: Players can hire other players only (no AI journalists)
7. **Explore Resources**: 2 AP + £400 (was 1 AP, no cost)
8. **Court Case Rewards**: £20-£120 (was £50-£500)

### Court System Enhancements

- Lawyers may represent opposition to another lawyer's case
- Lawyers may choose which side (plaintiff/defendant)
- Preventative measures to reduce money farming:
  - Reward reduced to £20-£120
  - Cooldown period between cases
  - Diminishing returns for repeated case types

### Economic Changes

- **Dividend Distribution**: Every 6 turns (was every turn)
- **Turn Duration**: 1 month in-game (was 1.2 months)

### Party Leadership Bonuses

- **Party Leader**: +3 AP per turn (automatic, not from fundraising)
- **Second Party Leader**: +2 AP per turn (automatic)
- These are baseline AP bonuses, not action-triggered

### Office Income (Every 6 Turns)

Salaries calculated to prevent players from becoming richer than average top 5% population (~£10,000-£15,000 per year).

**Annual Salaries** (divided by 2 since payments every 6 turns = twice per year):

- **Governor**: £1,200/year → £600 per payment
- **General Assembly Members**: £400/year → £200 per payment
- **Superintendent**: £800/year → £400 per payment
- **Provincial Counsel Members**: £300/year → £150 per payment

### Judges

**Question**: Are judges AI-generated or player-appointed lawyers by governor?

**Recommendation**: 
- **Hybrid System**:
  - Governor appoints player lawyers as judges
  - AI generates cases only if no player judges available
  - Judges cannot practice law while serving (conflict of interest)
  - Judges earn £600/year (£300 per 6 turns)
  - Judges review cases submitted by lawyers

---

## Files That Need Modification

### 1. `backend/src/middleware/actionPoints.ts`

Update header comment:
```typescript
/**
 * Action Point Middleware
 * Tracks and enforces action point costs for player actions
 * 
 * Players get 5 AP per turn (+ party bonuses). Actions cost:
 * - Move provinces: 1 AP
 * - Invest/Business investment: 1 AP
 * - Submit policy: FREE (0 AP)
 * - Campaign/endorse: 1 AP
 * - Bar exam: 1 AP
 * - Party fundraising: 1 AP (adds £50 to party fund)
 * - Party campaign: 1 AP (£300, random 3 groups, 1-12 turns, +1-5% boost)
 * - Create party: 1 AP (£250)
 * - Create newspaper: 1 AP (£100)
 * - Explore resources: 2 AP (£400)
 * - Vote on policy: 0 AP
 * - Court case/debate: 0 AP
 * 
 * Party Leader: +3 AP per turn
 * Second Party Leader: +2 AP per turn
 */
```

Add function to grant AP bonuses for party leaders:
```typescript
/**
 * Grant party leadership AP bonuses at turn start
 */
export const grantPartyLeadershipBonuses = async (sessionId: string): Promise<void> => {
  const parties = await models.Party.find({ sessionId });
  
  for (const party of parties) {
    // Grant +3 AP to party leader
    if (party.leaderId) {
      const leader = await models.Player.findById(party.leaderId);
      if (leader) {
        leader.actionsRemaining = (leader.actionsRemaining || 5) + 3;
        await leader.save();
      }
    }
    
    // Grant +2 AP to second leader
    if (party.secondLeaderId) {
      const secondLeader = await models.Player.findById(party.secondLeaderId);
      if (secondLeader) {
        secondLeader.actionsRemaining = (secondLeader.actionsRemaining || 5) + 2;
        await secondLeader.save();
      }
    }
  }
};
```

### 2. `backend/src/routes/policies.ts`

Remove AP cost from policy submission:
```typescript
// Line 27 - Remove requireActionPoints(1) middleware
router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  
// Line 73-80 - Remove AP consumption
// DELETE these lines:
// await consumeActionPoints(player, req.apCost || 1);
// actionsRemaining: player.actionsRemaining
```

### 3. `backend/src/routes/parties.ts`

#### Update party creation cost (£250):
```typescript
// Around line 75
const cost = 250; // Changed from 500
```

#### Update fundraising (£50 to party fund):
```typescript
// Around line 175-210
router.post('/fundraise', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
  try {
    const { playerId, partyId } = req.body;
    
    const party = await models.Party.findOne({ id: partyId });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    if (party.leaderId?.toString() !== playerId) {
      return res.status(403).json({ error: 'Only party leader can fundraise' });
    }
    
    // Add £50 to party fund
    party.funds = (party.funds || 0) + 50;
    await party.save();
    
    await consumeActionPoints(req.player, 1);
    
    res.json({ 
      success: true,
      message: 'Fundraising successful! £50 added to party fund',
      partyFunds: party.funds,
      actionsRemaining: req.player.actionsRemaining
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

#### Add party campaign route:
```typescript
/**
 * POST /api/parties/party-campaign
 * Party runs campaign for random 3 demographics
 * Cost: 1 AP + £300 from party fund
 */
router.post('/party-campaign', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
  try {
    const { playerId, partyId } = req.body;
    
    const party = await models.Party.findById(partyId);
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Must be party leader or second leader
    const isLeader = party.leaderId?.toString() === playerId;
    const isSecondLeader = party.secondLeaderId?.toString() === playerId;
    
    if (!isLeader && !isSecondLeader) {
      return res.status(403).json({ error: 'Only party leaders can run party campaigns' });
    }
    
    // Check party funds (£300)
    if ((party.funds || 0) < 300) {
      return res.status(400).json({ 
        error: 'Insufficient party funds',
        required: 300,
        available: party.funds || 0
      });
    }
    
    // Deduct from party fund
    party.funds -= 300;
    await party.save();
    
    // Select 3 random demographics
    const { DemographicSliceModel } = await import('../models/ReputationModels');
    const allDemographics = await DemographicSliceModel.find({});
    const randomDemographics = [];
    
    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * allDemographics.length);
      randomDemographics.push(allDemographics[randomIndex]);
    }
    
    // Random duration 1-12 turns
    const duration = Math.floor(Math.random() * 12) + 1;
    
    // Random boost 1-5%
    const boost = Math.floor(Math.random() * 5) + 1;
    
    // Get current turn
    const session = await models.Session.findById(party.sessionId);
    const currentTurn = session?.currentTurn || 0;
    
    // Create 3 campaigns
    const { Campaign } = await import('../models/ReputationModels');
    const campaigns = [];
    
    for (const demographic of randomDemographics) {
      const campaign = await Campaign.create({
        playerId,
        sessionId: party.sessionId,
        targetDemographicId: demographic.id,
        cost: 100, // Split £300 across 3 campaigns
        duration,
        boost,
        startTurn: currentTurn,
        endTurn: currentTurn + duration,
        status: 'active',
        source: 'party-campaign',
        partyId: party._id
      });
      
      campaigns.push({
        demographic: demographic.id,
        duration,
        boost
      });
    }
    
    await consumeActionPoints(req.player, 1);
    
    res.json({
      success: true,
      message: `Party campaign launched for 3 random demographics!`,
      campaigns,
      duration,
      boost,
      partyFundsRemaining: party.funds,
      actionsRemaining: req.player.actionsRemaining
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

### 4. `backend/src/routes/resources.ts`

Update resource exploration to 2 AP + £400:
```typescript
// Line 19
router.post('/explore', authMiddleware, requireActionPoints(2), async (req: Request, res: Response) => {
  try {
    const { playerId, provinceId } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Check if player has enough cash (£400)
    const cost = 400;
    if (player.cash < cost) {
      return res.status(400).json({ 
        error: 'Insufficient funds',
        required: cost,
        available: player.cash
      });
    }
    
    // Deduct cost
    player.cash -= cost;
    
    // ... rest of exploration logic ...
    
    await player.save();
    await consumeActionPoints(req.player, 2); // 2 AP
    
    res.json({
      success: true,
      // ... discovery results ...
      costPaid: cost,
      actionsRemaining: req.player.actionsRemaining
    });
  }
});
```

### 5. `backend/src/services/AIService.ts`

Update court case reward range (£20-£120):
```typescript
// Around line 720-750 in generateCourtCase method
// Update rewardRange in the JSON response structure:

{
  "rewardRange": {
    "min": 20,  // Was 50
    "max": 120  // Was 500
  }
}
```

### 6. `backend/src/services/CourtCaseService.ts`

Update court case rewards and add anti-farming measures:
```typescript
// Around line 144-155
const baseReward = courtCase.rewardRange?.min || 20;  // Was 50
const maxReward = courtCase.rewardRange?.max || 120;   // Was 500

// Add anti-farming: check recent case count
const recentCases = await models.CourtCase.find({
  assignedLawyerId: lawyerId,
  resolvedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
});

let rewardMultiplier = 1.0;

if (recentCases.length > 5) {
  // Diminishing returns after 5 cases per week
  rewardMultiplier = 0.5;
}

const reward = Math.floor(
  (baseReward + (maxReward - baseReward) * Math.random()) * rewardMultiplier
);
```

Add opposition lawyer system:
```typescript
/**
 * Assign opposition lawyer to case
 */
async assignOppositionLawyer(caseId: string, oppositionLawyerId: string, side: 'plaintiff' | 'defendant'): Promise<void> {
  const courtCase = await models.CourtCase.findById(caseId);
  if (!courtCase) {
    throw new Error('Case not found');
  }
  
  if (courtCase.status !== 'pending') {
    throw new Error('Case already has opposition assigned or is resolved');
  }
  
  courtCase.oppositionLawyerId = oppositionLawyerId;
  courtCase.oppositionSide = side;
  courtCase.status = 'contested';
  await courtCase.save();
}
```

### 7. `backend/src/services/TurnService.ts`

Update turn duration to 1 month:
```typescript
// Line 56-64
const turnState: TurnState = {
  sessionId,
  turnNumber: 1,
  startTime: new Date(),
  endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Still 24 hours real-time
  inGameDate: startDate,
  status: 'active'
};
```

Update `advanceInGameDate` method:
```typescript
// Around line 295-310
advanceInGameDate(currentDate: Date): Date {
  const newDate = new Date(currentDate);
  newDate.setMonth(newDate.getMonth() + 1); // 1 month (was 1.2 months)
  return newDate;
}
```

Update dividend distribution to every 6 turns:
```typescript
// Around line 115-120
async processTurnEnd(sessionId: string): Promise<void> {
  // ...existing code...
  
  // 1. Calculate company profits
  await this.calculateCompanyProfits(sessionId);
  
  // 2. Distribute dividends (every 6 turns)
  if (session.currentTurn % 6 === 0) {
    await this.distributeDividends(sessionId);
    await this.distributeOfficeIncome(sessionId);
  }
  
  // ...rest of turn processing...
}
```

Add office income distribution:
```typescript
/**
 * Distribute office income (every 6 turns)
 */
async distributeOfficeIncome(sessionId: string): Promise<void> {
  // Get all office holders
  const governor = await models.Player.findOne({ 
    sessionId, 
    office: 'Governor'
  });
  
  const assemblyMembers = await models.Player.find({
    sessionId,
    office: 'General Assembly Member'
  });
  
  const superintendents = await models.Player.find({
    sessionId,
    office: 'Superintendent'
  });
  
  const counselMembers = await models.Player.find({
    sessionId,
    office: 'Provincial Counsel Member'
  });
  
  const judges = await models.Player.find({
    sessionId,
    office: 'Judge'
  });
  
  // Distribute salaries (every 6 turns = twice per year)
  if (governor) {
    governor.cash = (governor.cash || 0) + 600; // £1,200/year
    await governor.save();
  }
  
  for (const member of assemblyMembers) {
    member.cash = (member.cash || 0) + 200; // £400/year
    await member.save();
  }
  
  for (const superintendent of superintendents) {
    superintendent.cash = (superintendent.cash || 0) + 400; // £800/year
    await superintendent.save();
  }
  
  for (const counsel of counselMembers) {
    counsel.cash = (counsel.cash || 0) + 150; // £300/year
    await counsel.save();
  }
  
  for (const judge of judges) {
    judge.cash = (judge.cash || 0) + 300; // £600/year
    await judge.save();
  }
  
  console.log(`   ✅ Distributed office income to ${governor ? 1 : 0} governor, ${assemblyMembers.length} assembly, ${superintendents.length} superintendents, ${counselMembers.length} counsel, ${judges.length} judges`);
}
```

Add party leadership AP bonuses:
```typescript
// Around line 135-145, after resetting AP
async processTurnEnd(sessionId: string): Promise<void> {
  // ...existing code...
  
  // 4. Reset player action points
  await resetActionPoints(sessionId);
  
  // 5. Grant party leadership bonuses
  await this.grantPartyLeadershipBonuses(sessionId);
  
  // ...rest of turn processing...
}

/**
 * Grant party leadership AP bonuses
 */
async grantPartyLeadershipBonuses(sessionId: string): Promise<void> {
  const parties = await models.Party.find({ sessionId });
  
  for (const party of parties) {
    // Grant +3 AP to party leader
    if (party.leaderId) {
      const leader = await models.Player.findById(party.leaderId);
      if (leader) {
        leader.actionsRemaining = (leader.actionsRemaining || 5) + 3;
        await leader.save();
      }
    }
    
    // Grant +2 AP to second leader
    if (party.secondLeaderId) {
      const secondLeader = await models.Player.findById(party.secondLeaderId);
      if (secondLeader) {
        secondLeader.actionsRemaining = (secondLeader.actionsRemaining || 5) + 2;
        await secondLeader.save();
      }
    }
  }
  
  console.log(`   ✅ Granted party leadership AP bonuses for ${parties.length} parties`);
}
```

### 8. `backend/src/models/mongoose.ts`

Add `secondLeaderId` and `funds` to Party schema:
```typescript
// Around line 494-512
const PartySchema = new Schema({
  id: { type: String, required: true, unique: true },
  sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  name: { type: String, required: true },
  faction: { type: String, required: true },
  platform: { type: String, default: '' },
  leaderId: { type: Schema.Types.ObjectId, ref: 'Player' },
  secondLeaderId: { type: Schema.Types.ObjectId, ref: 'Player' }, // NEW
  members: [{ type: Schema.Types.ObjectId, ref: 'Player' }],
  treasury: { type: Number, default: 0 }, // OLD
  funds: { type: Number, default: 0 }, // NEW - replaces treasury
  founded: { type: Date, default: Date.now },
  dissolved: { type: Date },
});
```

Add `office` field to Player schema:
```typescript
// In PlayerSchema, add:
office: { 
  type: String, 
  enum: ['Governor', 'General Assembly Member', 'Superintendent', 'Provincial Counsel Member', 'Judge', null],
  default: null
},
```

Add opposition fields to CourtCase schema:
```typescript
// In CourtCaseSchema, add:
oppositionLawyerId: { type: Schema.Types.ObjectId, ref: 'Player' },
oppositionSide: { type: String, enum: ['plaintiff', 'defendant'] },
```

### 9. `backend/src/routes/news.ts`

Update journalist hiring to players only:
```typescript
/**
 * POST /api/news/outlet/hire
 * Hire a player as journalist for newspaper
 * Cost: 1 AP
 */
router.post('/outlet/hire', authMiddleware, requireActionPoints(1), async (req: Request, res: Response) => {
  try {
    const { outletId, playerId, hiredPlayerId } = req.body;
    
    const outlet = await models.NewsOutlet.findOne({ id: outletId });
    if (!outlet) {
      return res.status(404).json({ error: 'News outlet not found' });
    }
    
    // Must be owner
    if (outlet.ownerId?.toString() !== playerId) {
      return res.status(403).json({ error: 'Only outlet owner can hire journalists' });
    }
    
    // Check if hiredPlayerId is a real player (not AI)
    const hiredPlayer = await models.Player.findById(hiredPlayerId);
    if (!hiredPlayer) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (hiredPlayer.isAI) {
      return res.status(400).json({ error: 'Cannot hire AI players as journalists' });
    }
    
    // Check if already employed
    if (outlet.employees?.includes(hiredPlayerId)) {
      return res.status(400).json({ error: 'Player already employed at this outlet' });
    }
    
    // Add to employees
    outlet.employees = outlet.employees || [];
    outlet.employees.push(hiredPlayerId);
    await outlet.save();
    
    await consumeActionPoints(req.player, 1);
    
    res.json({
      success: true,
      message: `${hiredPlayer.username} hired as journalist`,
      outlet,
      actionsRemaining: req.player.actionsRemaining
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});
```

---

## Implementation Priority

1. **High Priority** (Core mechanics):
   - Policy submission (FREE)
   - Party costs (£250)
   - Fundraising (£50 to fund)
   - Resource exploration (2 AP + £400)
   - Party leadership bonuses (+3/+2 AP)

2. **Medium Priority** (Economic balance):
   - Court case rewards (£20-£120)
   - Dividend timing (every 6 turns)
   - Office income (every 6 turns)
   - Turn duration (1 month)

3. **Low Priority** (Feature additions):
   - Party campaign route
   - Opposition lawyer system
   - Journalist hiring restrictions

---

## Testing Checklist

- [ ] Policy submission costs 0 AP
- [ ] Party creation costs £250
- [ ] Fundraising adds £50 to party fund
- [ ] Party campaign costs £300, creates 3 campaigns
- [ ] Resource exploration costs 2 AP + £400
- [ ] Court cases reward £20-£120
- [ ] Dividends distribute every 6 turns
- [ ] Office income distributes every 6 turns
- [ ] Party leaders get +3 AP, second leaders get +2 AP
- [ ] Turn duration advances 1 month in-game
- [ ] Journalists can only be players

---

## Database Migration Notes

1. Add `secondLeaderId` and `funds` fields to existing parties
2. Add `office` field to existing players
3. Add `oppositionLawyerId` and `oppositionSide` to court cases
4. Migrate `treasury` to `funds` in Party model

SQL/Mongoose migration script:
```javascript
// Update all parties
await models.Party.updateMany(
  {},
  { 
    $set: { 
      secondLeaderId: null,
      funds: 0
    }
  }
);

// Update all players
await models.Player.updateMany(
  {},
  { 
    $set: { 
      office: null
    }
  }
);

// Update all court cases
await models.CourtCase.updateMany(
  {},
  { 
    $set: { 
      oppositionLawyerId: null,
      oppositionSide: null
    }
  }
);
```
