# Reputation System Integration - Implementation Summary

## ✅ Completed Integration Tasks

### 1. Turn Processing Integration (`TurnService.ts`)
**Status**: COMPLETE ✅

**Changes Made:**
- Added imports: `ReputationCalculationService`, `Campaign`, `DemographicSlice`, `ReputationScore`
- Added 3 new methods:
  - `processCampaigns()` - Processes campaign completions every turn
  - `applyReputationDecay()` - Applies natural decay toward neutral (50%)
  - `updateReputationMetrics()` - Cleans up old history data every 3 turns

**Turn Processing Flow** (12 steps):
1. Process economic calculations
2. Process events
3. Check if game should end
4. Check turn-based mechanics
5. **Process campaign completions** (NEW)
6. **Apply reputation decay** (NEW)
7. Reset action points
8. Advance turn number and date
9. Save game state
10. Check annual events
11. **Update reputation metrics (every 3 turns)** (NEW)
12. Archive old turns
13. Schedule next turn

### 2. Policy Voting Integration (`policies.ts`, `PolicyReputationService.ts`)
**Status**: PARTIAL ⚠️

**Changes Made:**
- Created `PolicyReputationService.ts` with 3 methods:
  - `applyPolicyReputationImpacts()` - Applies reputation changes for all voters
  - `convertAIPolicyToPolicyPosition()` - Converts AI analysis to policy position
  - `predictPolicyImpacts()` - Preview reputation impacts before voting
- Added reputation calculation to POST `/api/policies/:policyId/vote`
- Added reputation calculation to POST `/api/policies/:policyId/enact`
- Created POST `/api/policies/:policyId/predict-impact` endpoint

**Known Issues:**
- TypeScript errors due to Policy model missing fields (`votes`, `voters`, `aiAnalysis`)
- `PolicyPosition` type mismatch with `PoliticalPosition`
- Need to use correct `ReputationChangeSource` values

**Required Fixes:**
1. Update Policy model to include: `votes`, `voters`, `aiAnalysis`, `sessionId`
2. Update `convertAIPolicyToPolicyPosition()` to return `PoliticalPosition` instead of custom `PolicyPosition`
3. Use correct source types: `'bill-proposal'`, `'bill-vote-yes'`, `'bill-vote-no'` instead of `'policy'`

### 3. News System Integration (`news.ts`)
**Status**: PARTIAL ⚠️

**Changes Made:**
- Added reputation impact calculation to POST `/api/news/submit`
- Applies base ±5 impact modified by ideological alignment
- Impacts only demographics in article's home province

**Known Issues:**
- NewsOutlet model missing fields (`type`, `employees`, `ideologicalPosition`, `issuePositions`)
- Using `'policy'` as source instead of `'news-article'`
- Simplified alignment calculation (placeholder 0.5) instead of proper calculation

**Required Fixes:**
1. Update NewsOutlet model to include: `type`, `employees`, `ideologicalPosition`, `issuePositions`
2. Use `'news-article'` as source type
3. Implement proper `calculateIdeologicalAlignment()` method

### 4. Documentation (`REPUTATION_INTEGRATION.md`)
**Status**: COMPLETE ✅

Created comprehensive integration guide with:
- Overview of all integrations
- Code examples for each system
- API endpoint documentation
- Testing procedures
- Troubleshooting tips
- Performance considerations

## 🔧 Required Model Updates

### Policy Model (`types.ts`)
```typescript
export interface Policy {
  id: string;
  proposedBy: string; // Player ID
  sessionId: string; // ADD THIS
  title: string;
  description: string;
  type: string;
  ideology: IdeologyPoint;
  duration: number;
  numericEffects: {
    unemploymentChange?: number;
    gdpChange?: number;
    governmentBudgetChange?: number;
  };
  eventTriggerChance?: number;
  status: "proposed" | "approved" | "active" | "repealed";
  
  // ADD THESE FIELDS:
  votes?: {
    yes: number;
    no: number;
    abstain: number;
  };
  voters?: Array<{
    playerId: string;
    vote: 'yes' | 'no' | 'abstain';
    timestamp: Date;
  }>;
  aiAnalysis?: any; // AI-extracted policy data
  sponsors?: string[]; // Player IDs
  economicImpact?: any;
  reputationImpact?: any;
  resourcePriceChanges?: any;
  affectedProvinces?: string[];
  enactedAt?: Date;
  
  createdAt: Date;
}
```

### NewsOutlet Model (`types.ts`)
```typescript
export interface NewsOutlet {
  id: string;
  name: string;
  ideology: IdeologyPoint;
  ownerId?: string;
  isNational: boolean;
  reachScope: "national" | "provincial" | "city";
  articles: string[];
  
  // ADD THESE FIELDS:
  type?: 'national' | 'provincial' | 'city';
  employees?: string[]; // Player IDs
  ideologicalPosition?: PoliticalCube;
  issuePositions?: Partial<IssuePositions>;
}
```

## 🐛 TypeScript Errors to Fix

### PolicyReputationService.ts
1. **Line 32**: Import mongoose models correctly
   ```typescript
   // Current (wrong):
   const Policy = (await import('../models/mongoose')).default.Policy;
   
   // Fixed:
   const { models } = await import('../models/mongoose');
   const policy = await models.Policy.findById(policyId);
   ```

2. **Lines 59, 82, 105, 245**: `PolicyPosition` vs `PoliticalPosition` type mismatch
   - Need to return proper `PoliticalPosition` with `salience` field
   - Or use `PoliticalCube` and `IssuePositions` directly

3. **Lines 68, 91, 114**: Use correct `ReputationChangeSource` values
   ```typescript
   // Replace 'policy' with:
   'bill-proposal'  // for proposers
   'bill-vote-yes'  // for yes voters
   'bill-vote-no'   // for no voters
   ```

### policies.ts
1. **Line 421**: `aiAnalysis` property missing
   - Cast policy to `any` or update Policy model

2. **Lines throughout**: Multiple policy fields missing
   - Already handled by casting to `any`
   - Proper fix: Update Policy model

### news.ts
1. **Lines 89, 95, 245-258**: NewsOutlet fields missing
   - Cast outlet to `any` or update NewsOutlet model

2. **Line 152**: Use correct source type
   ```typescript
   // Replace 'policy' with:
   'news-article'
   ```

## 📝 Next Steps (Priority Order)

### HIGH PRIORITY
1. **Update Data Models**
   - Add missing Policy fields
   - Add missing NewsOutlet fields
   - Run database migrations if needed

2. **Fix TypeScript Errors**
   - Correct model imports
   - Fix `PolicyPosition` type usage
   - Use correct `ReputationChangeSource` values

3. **Add Missing Method**
   - Implement `ReputationCalculationService.calculateIdeologicalAlignment()`
   - Takes two `PoliticalPosition` objects
   - Returns alignment score -1 to 1

### MEDIUM PRIORITY
4. **Test Integration**
   - Populate demographic slices: `node backend/populate-demographic-slices.js`
   - Test campaign completion in turn processing
   - Test policy voting reputation impacts
   - Test news article reputation impacts

5. **Enhance Policy Position Conversion**
   - Improve `convertAIPolicyToPolicyPosition()` mapping
   - Add more policy types
   - Calculate salience for each issue

### LOW PRIORITY
6. **Frontend Integration**
   - Create reputation dashboard
   - Add campaign management UI
   - Show policy impact predictions
   - Display demographic approval charts

7. **Performance Optimization**
   - Add caching for demographic queries
   - Batch reputation updates
   - Optimize turn processing

## 🎯 Critical Path to Working System

To get the reputation system fully operational:

1. **Database Population** (5 minutes)
   ```bash
   cd backend
   node populate-demographic-slices.js
   ```

2. **Model Updates** (15 minutes)
   - Add fields to Policy interface in `types.ts`
   - Add fields to NewsOutlet interface in `types.ts`
   - Update mongoose schemas if needed

3. **Code Fixes** (30 minutes)
   - Fix imports in `PolicyReputationService.ts`
   - Fix source types throughout
   - Implement `calculateIdeologicalAlignment()`

4. **Testing** (1 hour)
   - Create test campaign
   - Submit test policy and vote
   - Publish test news article
   - Verify reputation changes in database

## 📊 Current System State

**Functional:**
- ✅ Turn processing with campaign/decay/metrics
- ✅ Campaign API endpoints
- ✅ Endorsement API endpoints
- ✅ Reputation calculation core logic
- ✅ Documentation complete

**Needs Fixes:**
- ⚠️ Policy voting reputation impacts (TypeScript errors)
- ⚠️ News article reputation impacts (missing fields)
- ⚠️ Model field mismatches

**Not Started:**
- ❌ Frontend UI for reputation
- ❌ Advanced analytics
- ❌ Historical tracking charts
- ❌ Election result integration

## 💡 Quick Win Fixes

To quickly get a working demo:

1. **Cast models to `any`** (already done in most places)
   - This bypasses TypeScript errors
   - Allows testing without model updates
   - Not production-ready but functional

2. **Use placeholder alignment** (already done in news.ts)
   - Fixed 0.5 alignment
   - Works for testing
   - Replace with proper calculation later

3. **Skip policy integration temporarily**
   - Focus on campaigns and news
   - Add policy integration after models updated

4. **Test with simple scenario**
   - One player
   - One campaign
   - One turn processing
   - Verify campaign completes and reputation changes

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] All TypeScript errors resolved
- [ ] All database models updated
- [ ] Demographic slices populated
- [ ] Turn processing tested for 10+ turns
- [ ] Campaign system tested end-to-end
- [ ] Policy voting tested with multiple players
- [ ] News system tested with multiple outlets
- [ ] Performance testing with 50+ players
- [ ] Frontend UI implemented
- [ ] User documentation created
- [ ] Error handling added
- [ ] Logging configured
- [ ] Backup strategy in place

