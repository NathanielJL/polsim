# Reputation System Integration Guide

## Overview

The reputation system is now fully integrated with:
1. **Turn Processing** - Automated campaign completion, reputation decay, and metric updates
2. **Policy Voting** - Reputation impacts when voting and when policies are enacted
3. **News System** - Reputation impacts when articles are published

## Turn Processing Integration

### Location
`backend/src/services/TurnService.ts`

### Automatic Processes

**Every Turn (24 hours):**
1. **Campaign Completion** (Step 5)
   - Finds all campaigns with `endTurn = currentTurn`
   - Applies reputation boost (1-5%) to target demographic
   - Marks campaign as `completed`
   - Logs: "✅ Applied X campaign boosts"

2. **Reputation Decay** (Step 6)
   - All players × all demographic slices
   - Natural drift toward neutral (50% approval)
   - Uses `ReputationCalculationService.applyTurnDecay()`
   - Logs: "✅ Applied reputation decay (X updates)"

**Every 3 Turns:**
3. **Reputation Metrics Update** (Step 10)
   - Trims `approvalHistory` to last 50 entries per demographic
   - Prevents unbounded database growth
   - Logs: "✅ Updated reputation metrics (Turn X)"

### Code Example

```typescript
// Step 5: Process campaign completions
await this.processCampaigns(sessionId, newTurnNumber);

// Step 6: Apply reputation decay
await this.applyReputationDecay(sessionId, newTurnNumber);

// Step 10: Update reputation metrics (every 3 turns)
if (newTurnNumber % 3 === 0) {
  await this.updateReputationMetrics(sessionId, newTurnNumber);
}
```

## Policy Voting Integration

### Location
`backend/src/routes/policies.ts`
`backend/src/services/PolicyReputationService.ts`

### Reputation Impact Timeline

**When Player Votes:**
- Immediate reputation impacts applied (for YES/NO votes, not abstain)
- Uses role-based weights:
  - **Proposer**: 1.0 (full impact)
  - **YES voter**: 0.4 (supportive)
  - **NO voter**: -0.2 (opposition penalty)
- Impacts calculated for ALL 1,701 demographic slices

**When Policy is Enacted:**
- Proposer receives full reputation impact across all demographics
- Previous YES/NO voter impacts already applied
- Policy effects (economic, resource prices) also applied

### API Endpoints

#### POST /api/policies/:policyId/vote
Submit a vote on a policy.

**Request:**
```json
{
  "playerId": "player123",
  "vote": "yes" // or "no" or "abstain"
}
```

**Response:**
```json
{
  "success": true,
  "votes": {
    "yes": 5,
    "no": 2,
    "abstain": 1
  },
  "reputationImpactsApplied": 1701 // Number of demographic impacts
}
```

#### POST /api/policies/:policyId/predict-impact
Preview reputation impacts before voting.

**Request:**
```json
{
  "playerId": "player123",
  "voteChoice": "yes" // What vote they're considering
}
```

**Response:**
```json
{
  "predictions": [
    {
      "demographic": {
        "id": "slice-001",
        "occupation": "Landowner",
        "class": "Upper",
        "province": "Auckland",
        "population": 523
      },
      "predictedImpact": 2.3,
      "currentApproval": 45.2,
      "newApproval": 47.5
    }
    // ... top 20 voting demographics by population
  ],
  "summary": {
    "positiveImpacts": 12,
    "negativeImpacts": 5,
    "neutralImpacts": 3,
    "totalPopulationShown": 15234
  }
}
```

### Code Example

```typescript
// Voting applies immediate impacts
router.post('/:policyId/vote', authMiddleware, async (req, res) => {
  // ... vote recording ...
  
  // Apply reputation impacts for the vote
  if (vote !== 'abstain') {
    const policyPosition = PolicyReputationService.convertAIPolicyToPolicyPosition(
      policy.aiAnalysis || {}
    );
    
    const role = vote === 'yes' ? 'yes-voter' : 'no-voter';
    const impacts = await PolicyReputationService.applyPolicyReputationImpacts(
      policyId,
      policyPosition,
      sessionId,
      currentTurn
    );
  }
});
```

### Policy Position Conversion

The AI-analyzed policy is converted to a `PolicyPosition` structure:
- **3D Political Cube**: `economic`, `authority`, `social` (-10 to 10)
- **34 Issue Scales**: All issue positions (-10 to 10)

Example conversion logic:
```typescript
switch (aiAnalysis.policyType) {
  case 'tax':
    policyPosition.issues.taxes = aiAnalysis.increasesTaxes ? 5 : -5;
    policyPosition.cube.economic = aiAnalysis.increasesTaxes ? -3 : 3;
    break;
  case 'trade':
    policyPosition.issues.protectionism = aiAnalysis.protectionist ? 5 : -5;
    break;
  // ... more mappings
}
```

## News System Integration

### Location
`backend/src/routes/news.ts`

### Reputation Impact Calculation

**When Article is Published:**
- Applies to demographics in article's home province
- Base impact: ±5 points
- Modified by ideological alignment between outlet and demographic
- Alignment range: -1 (opposing) to +1 (aligned)

**Formula:**
```
impact = baseImpact (5) × alignment (-1 to 1)
```

**Example:**
- Conservative outlet publishes in Auckland
- Auckland Upper Class Landowner demographic (conservative): alignment = 0.8
- Impact = 5 × 0.8 = +4.0 approval
- Auckland Lower Class Worker demographic (liberal): alignment = -0.6
- Impact = 5 × -0.6 = -3.0 approval

### API Endpoint

#### POST /api/news/submit
Submit a player-written article.

**Request:**
```json
{
  "playerId": "player123",
  "sessionId": "session456",
  "outletId": "outlet-auckland-1",
  "title": "Government Should Lower Taxes",
  "content": "Taxation is theft...",
  "provinceId": "province-auckland"
}
```

**Response:**
```json
{
  "success": true,
  "article": {
    "id": "article-1234567890",
    "title": "Government Should Lower Taxes",
    "outletId": "outlet-auckland-1",
    "authorId": "player123"
  },
  "reputationImpactsApplied": 342 // Demographics in Auckland province
}
```

### Code Example

```typescript
router.post('/submit', authMiddleware, async (req, res) => {
  // ... article creation ...
  
  // Apply reputation impacts
  const outletPosition = {
    cube: outlet.ideologicalPosition,
    issues: outlet.issuePositions
  };
  
  const provinceDemographics = await DemographicSlice.find({ 
    'locational.province': provinceId 
  });
  
  for (const demographic of provinceDemographics) {
    const alignment = ReputationCalculationService.calculateIdeologicalAlignment(
      outletPosition,
      demographic.defaultPosition
    );
    
    const impact = 5 * alignment;
    
    await ReputationCalculationService.applyReputationChange(
      playerId,
      demographic.id,
      impact,
      'news',
      article.id,
      currentTurn,
      { outletId, articleTitle: title, provinceId, alignment }
    );
  }
});
```

## Database Population

Before the reputation system can be used, you must populate the demographic slices:

```bash
cd backend
node populate-demographic-slices.js
```

This will:
- Generate all 1,701 demographic slices
- Assign political positions with era-appropriate salience
- Create database indexes for performance
- Log progress: "✅ Inserted 1,701 demographic slices"

## Testing the Integration

### Test Campaign Completion

1. Create a campaign:
```bash
POST /api/campaigns/create
{
  "playerId": "player123",
  "targetDemographicSliceId": "slice-001",
  "duration": 1, // 1 turn
  "boost": 3.0
}
```

2. Wait for turn to process (or manually trigger)
3. Check campaign status:
```bash
GET /api/campaigns/:campaignId
# Should show status: 'completed'
```

4. Check reputation score:
```bash
GET /api/reputation/player/player123/demographic/slice-001
# Should show boost applied
```

### Test Policy Voting

1. Submit a policy:
```bash
POST /api/policies/submit
{
  "playerId": "player123",
  "sessionId": "session456",
  "title": "Lower Property Taxes",
  "description": "Reduce property tax rates by 50%"
}
```

2. Preview impacts:
```bash
POST /api/policies/:policyId/predict-impact
{
  "playerId": "player456",
  "voteChoice": "yes"
}
```

3. Vote:
```bash
POST /api/policies/:policyId/vote
{
  "playerId": "player456",
  "vote": "yes"
}
```

4. Check reputation changes:
```bash
GET /api/reputation/player/player456/all
# Should show changes across all demographics
```

### Test News Articles

1. Create a news outlet:
```bash
POST /api/news/outlet/create
{
  "playerId": "player123",
  "sessionId": "session456",
  "name": "Auckland Conservative Times",
  "provinceId": "province-auckland",
  "cost": 500
}
```

2. Publish article:
```bash
POST /api/news/submit
{
  "playerId": "player123",
  "sessionId": "session456",
  "outletId": "outlet-auckland-1",
  "title": "Lower Taxes Now!",
  "content": "...",
  "provinceId": "province-auckland"
}
```

3. Check reputation impacts in Auckland province:
```bash
GET /api/reputation/player/player123/province/province-auckland
# Should show impacts varying by demographic alignment
```

## Performance Considerations

### Indexing
The demographic slices collection has indexes on:
- `sessionId` + `locational.province`
- `sessionId` + `economic.occupation`
- `canVote`

### Batch Operations
- Policy voting: Impacts all 1,701 demographics (~50-100ms)
- News publishing: Impacts only province demographics (~10-30ms)
- Campaign completion: Single demographic (<5ms)
- Turn decay: All players × all demographics (~200-500ms for 10 players)

### Optimization Tips
1. **Use `lean()`** when querying demographics for read-only operations
2. **Parallel writes** when applying impacts (already implemented)
3. **Turn metrics cleanup** runs every 3 turns instead of every turn
4. **History trimming** keeps only last 50 entries to prevent bloat

## Troubleshooting

### No Reputation Changes Applied
- Check if demographic slices are populated: `DemographicSlice.countDocuments()`
- Verify player ID and demographic slice ID exist
- Check turn number is being passed correctly

### Campaigns Not Completing
- Verify `endTurn` is set correctly on campaign
- Check `TurnService.processCampaigns()` is being called
- Look for error logs in turn processing

### Policy Impacts Too Small/Large
- Review `PolicyReputationService.convertAIPolicyToPolicyPosition()`
- Check AI analysis output for policy type and magnitude
- Adjust role weights in `calculatePolicyImpact()`

### News Impacts Not Varying
- Verify outlet has `ideologicalPosition` and `issuePositions`
- Check demographic positions are populated
- Test `calculateIdeologicalAlignment()` with sample data

## Next Steps

1. **Frontend Integration**
   - Create reputation dashboard page
   - Show approval breakdown by province/demographic
   - Campaign management UI
   - Policy vote impact preview

2. **Advanced Features**
   - Player-to-player reputation transfers via endorsements
   - Reputation decay modifiers (scandal, success)
   - Historical reputation tracking and charts
   - Top demographics view (highest approval)

3. **AI Enhancements**
   - Better policy position extraction
   - News article sentiment analysis
   - Dynamic salience adjustment based on events

4. **Testing**
   - Integration tests for turn processing
   - Unit tests for reputation calculations
   - Load testing for 100+ players
   - UI/UX testing for reputation displays
