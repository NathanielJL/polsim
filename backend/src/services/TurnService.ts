/**
 * Turn System Service
 * Manages turn progression, auto-processing every 24 hours
 * 
 * Turn length: 1 month in-game = 24 hours real-time
 * Turn processing:
 * - Calculate company profits
 * - Distribute dividends (every 6 turns)
 * - Distribute office income (every 6 turns)
 * - Process policies (apply effects)
 * - Generate AI news articles
 * - Reset player action points
 * - Grant party leadership bonuses (+3 AP leader, +2 AP second leader)
 * - Generate court cases
 * - Process campaign completions
 * - Apply reputation decay
 * - Archive old turns (keep last 12-24 per player)
 * - Trigger annual events (immigration, elections)
 */

import { models } from '../models/mongoose';
import { resetActionPoints } from '../middleware/actionPoints';
import { AIService } from './AIService';
import ImmigrationService from './ImmigrationService';
import CourtCaseService from './CourtCaseService';
import { ReputationCalculationService } from './ReputationCalculationService';
import { Campaign, DemographicSlice, ReputationScore } from '../models/ReputationModels';

interface TurnState {
  sessionId: string;
  turnNumber: number;
  startTime: Date;
  endTime: Date;
  inGameDate: Date;
  status: 'active' | 'processing' | 'completed';
}

export class TurnService {
  private aiService: AIService;
  private turnTimers: Map<string, NodeJS.Timeout>;
  
  constructor() {
    this.aiService = new AIService();
    this.turnTimers = new Map();
  }
  
  /**
   * Initialize turn system for a session
   */
  async initializeTurnSystem(sessionId: string, startDate: Date): Promise<TurnState> {
    const gameState = await models.GameState.findOne({ sessionId });
    
    if (!gameState) {
      throw new Error('Game state not found');
    }
    
    const turnState: TurnState = {
      sessionId,
      turnNumber: 1,
      startTime: new Date(),
      endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      inGameDate: startDate,
      status: 'active'
    };
    
    gameState.currentTurn = 1;
    gameState.turnStartTime = turnState.startTime;
    gameState.turnEndTime = turnState.endTime;
    await gameState.save();
    
    // Schedule auto-processing
    this.scheduleTurnEnd(sessionId);
    
    console.log(`✅ Turn system initialized for session ${sessionId}`);
    console.log(`   Turn 1 starts: ${turnState.startTime}`);
    console.log(`   Turn 1 ends: ${turnState.endTime}`);
    
    return turnState;
  }
  
  /**
   * Schedule automatic turn processing in 24 hours
   */
  scheduleTurnEnd(sessionId: string): void {
    // Clear existing timer if any
    const existingTimer = this.turnTimers.get(sessionId);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }
    
    // Schedule turn end in 24 hours
    const timer = setTimeout(() => {
      this.processTurnEnd(sessionId).catch(err => {
        console.error(`❌ Turn processing error for session ${sessionId}:`, err);
      });
    }, 24 * 60 * 60 * 1000);
    
    this.turnTimers.set(sessionId, timer);
    
    console.log(`⏰ Turn auto-processing scheduled for session ${sessionId} in 24 hours`);
  }
  
  /**
   * Process turn end (called automatically or manually by GM)
   */
  async processTurnEnd(sessionId: string): Promise<void> {
    console.log(`🔄 Processing turn end for session ${sessionId}...`);
    
    const gameState = await models.GameState.findOne({ sessionId });
    
    if (!gameState) {
      throw new Error('Game state not found');
    }
    
    gameState.status = 'processing';
    await gameState.save();
    
    try {
      // 1. Calculate company profits
      await this.calculateCompanyProfits(sessionId);
      
      // 2. Distribute dividends (every 6 turns = twice per year)
      if (session.currentTurn % 6 === 0) {
        await this.distributeDividends(sessionId);
        await this.distributeOfficeIncome(sessionId);
      }
      
      // 3. Process enacted policies
      await this.processPolicies(sessionId);
      
      // 4. Generate court cases for lawyers
      await this.generateCourtCases(sessionId);
      
      // 5. Process campaign completions and apply reputation boosts
      await this.processCampaigns(sessionId, newTurnNumber);
      
      // 6. Apply turn decay to reputation scores
      await this.applyReputationDecay(sessionId, newTurnNumber);
      
      // 7. Reset action points
      const playersReset = await resetActionPoints(sessionId);
      console.log(`   ✅ Reset AP for ${playersReset} players`);
      
      // 8. Advance turn number and in-game date
      const newTurnNumber = gameState.currentTurn + 1;
      const newInGameDate = this.advanceInGameDate(gameState.inGameDate);
      
      gameState.currentTurn = newTurnNumber;
      gameState.inGameDate = newInGameDate;
      gameState.turnStartTime = new Date();
      gameState.turnEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      gameState.status = 'active';
      await gameState.save();
      
      // 9. Check for annual events (elections, immigration)
      await this.checkAnnualEvents(sessionId, newInGameDate);
      
      // 10. Update reputation metrics (every 3 turns as per spec)
      if (newTurnNumber % 3 === 0) {
        await this.updateReputationMetrics(sessionId, newTurnNumber);
      }
      
      // 11. Archive old turns (keep last 24)
      await this.archiveOldTurns(sessionId, newTurnNumber);
      
      // 12. Schedule next turn
      this.scheduleTurnEnd(sessionId);
      
      console.log(`✅ Turn ${newTurnNumber} started`);
      console.log(`   In-game date: ${newInGameDate.toISOString().split('T')[0]}`);
      
    } catch (error) {
      console.error('Turn processing error:', error);
      gameState.status = 'active'; // Restore to active on error
      await gameState.save();
      throw error;
    }
  }
  
  /**
   * Advance in-game date by 1 month
   */
  advanceInGameDate(currentDate: Date): Date {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1); // 1 month per turn
    return newDate;
  }
  
  /**
   * Calculate company profits based on market conditions
   */
  async calculateCompanyProfits(sessionId: string): Promise<void> {
    const companies = await models.Company.find({ sessionId });
    const session = await models.GameState.findOne({ sessionId });
    const currentTurn = session?.currentTurn || 0;
    
    for (const company of companies) {
      // Ensure valuation exists
      if (!company.valuation || company.valuation === 0) {
        company.valuation = (company.cash || 500) + (company.employees * 100);
      }
      
      // Base profit calculation
      const revenue = company.valuation * 0.05; // 5% of valuation per turn
      const profit = revenue * 0.3; // 30% profit margin
      
      company.cash = (company.cash || 0) + profit;
      company.monthlyProfit = profit;
      
      // Track profit history
      company.profitHistory = company.profitHistory || [];
      company.profitHistory.push({
        turn: currentTurn,
        profit
      });
      
      // Trim history to last 24 turns (2 years)
      if (company.profitHistory.length > 24) {
        company.profitHistory = company.profitHistory.slice(-24);
      }
      
      // Simple valuation growth: 2% per turn + employee bonus
      const employeeBonus = Math.min(0.01 * (company.employees || 1), 0.10);
      const growthRate = 0.02 + employeeBonus;
      company.valuation = Math.round(company.valuation * (1 + growthRate));
      
      await company.save();
    }
    
    console.log(`   ✅ Calculated profits for ${companies.length} companies`);
  }
  
  /**
   * Distribute dividends to shareholders
   */
  async distributeDividends(sessionId: string): Promise<void> {
    const companies = await models.Company.find({ sessionId });
    
    for (const company of companies) {
      if (!company.cash || company.cash <= 0) continue;
      if (!company.shareholders || company.shareholders.length === 0) continue;
      
      // Distribute 50% of cash as dividends
      const totalDividends = company.cash * 0.5;
      const dividendPerShare = totalDividends / (company.totalShares || 10000);
      
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
    
    console.log(`   ✅ Distributed dividends for ${companies.length} companies`);
  }
  
  /**
   * Distribute office income (every 6 turns = twice per year)
   */
  async distributeOfficeIncome(sessionId: string): Promise<void> {
    // Get all office holders
    const governor = await models.Player.findOne({ sessionId, office: 'Governor' });
    const assemblyMembers = await models.Player.find({ sessionId, office: 'General Assembly Member' });
    const superintendents = await models.Player.find({ sessionId, office: 'Superintendent' });
    const counselMembers = await models.Player.find({ sessionId, office: 'Provincial Counsel Member' });
    const judges = await models.Player.find({ sessionId, office: 'Judge' });
    
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
    
    const totalOfficials = (governor ? 1 : 0) + assemblyMembers.length + superintendents.length + counselMembers.length + judges.length;
    console.log(`   ✅ Distributed office income to ${totalOfficials} officials`);
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
      
      // Grant +2 AP to second leader (if exists)
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
  
  /**
   * Process enacted policies (apply effects to game state)
   */
  async processPolicies(sessionId: string): Promise<void> {
    const policies = await models.Policy.find({ 
      sessionId, 
      status: 'passed',
      enacted: { $ne: true }
    });
    
    for (const policy of policies) {
      if (!policy.structuredData) continue;
      
      // Apply economic impacts
      if (policy.economicImpact) {
        const { gdpChange, priceChanges, unemploymentChange } = policy.economicImpact;
        
        // Update province GDPs
        if (gdpChange && policy.structuredData.affectedProvinces) {
          for (const provinceName of policy.structuredData.affectedProvinces) {
            const province = await models.Province.findOne({ sessionId, name: provinceName });
            if (province) {
              province.gdp = Math.round((province.gdp || 0) * (1 + gdpChange / 100));
              await province.save();
            }
          }
        }
        
        // Update resource prices
        if (priceChanges) {
          for (const [resource, priceChange] of Object.entries(priceChanges)) {
            const market = await models.Market.findOne({ sessionId, name: resource });
            if (market) {
              market.currentPrice = Math.round(market.currentPrice * (1 + (priceChange as number) / 100));
              await market.save();
            }
          }
        }
      }
      
      policy.enacted = true;
      policy.enactedAt = new Date();
      await policy.save();
    }
    
    console.log(`   ✅ Processed ${policies.length} policies`);
  }
  
  /**
   * Check for annual events (elections, immigration, etc.)
   */
  async checkAnnualEvents(sessionId: string, inGameDate: Date): Promise<void> {
    const month = inGameDate.getMonth();
    const year = inGameDate.getFullYear();
    
    // Check if it's election year (every 3 years, starting 1855)
    if ((year - 1855) % 3 === 0 && month === 10) { // November elections
      console.log(`   🗳️ Election year! Triggering election event...`);
      // TODO: Trigger election event
    }
    
    // Annual immigration (January)
    if (month === 0) {
      console.log(`   🚢 Annual immigration processing...`);
      await this.processAnnualImmigration(sessionId);
    }
  }
  
  /**
   * Process annual immigration (uses ImmigrationService)
   */
  async processAnnualImmigration(sessionId: string): Promise<void> {
    try {
      const result = await ImmigrationService.processAnnualImmigration(sessionId);
      console.log(`   ✅ Annual immigration: ${result.totalImmigrants} settlers (${(result.policyModifier * 100).toFixed(0)}% policy modifier)`);
    } catch (error) {
      console.error('Annual immigration error:', error);
    }
  }
  
  /**
   * Generate court cases for all lawyers
   */
  async generateCourtCases(sessionId: string): Promise<void> {
    try {
      const result = await CourtCaseService.generateCasesForTurn(sessionId);
      if (result.casesGenerated > 0) {
        console.log(`   ✅ Generated ${result.casesGenerated} court cases for ${result.lawyers} lawyers`);
      }
    } catch (error) {
      console.error('Court case generation error:', error);
    }
  }
  
  /**
   * Archive old turns (keep last 24 turns)
   */
  async archiveOldTurns(sessionId: string, currentTurn: number): Promise<void> {
    const cutoffTurn = currentTurn - 24;
    
    if (cutoffTurn <= 0) return;
    
    // Archive old actions
    const result = await models.Action.deleteMany({ 
      sessionId, 
      turn: { $lt: cutoffTurn } 
    });
    
    console.log(`   🗄️ Archived ${result.deletedCount} old actions`);
  }
  
  /**
   * Process campaign completions and apply reputation boosts
   */
  async processCampaigns(sessionId: string, currentTurn: number): Promise<void> {
    // Find all campaigns completing this turn
    const completingCampaigns = await Campaign.find({
      sessionId,
      endTurn: currentTurn,
      status: 'active'
    });
    
    let boostsApplied = 0;
    
    for (const campaign of completingCampaigns) {
      try {
        // Apply campaign boost to reputation
        await ReputationCalculationService.applyReputationChange(
          campaign.playerId,
          campaign.targetDemographicSliceId,
          campaign.boost,
          'campaign',
          campaign._id.toString(),
          currentTurn,
          { campaignDuration: campaign.duration }
        );
        
        // Mark campaign as completed
        campaign.status = 'completed';
        await campaign.save();
        
        boostsApplied++;
      } catch (error) {
        console.error(`Failed to apply campaign ${campaign._id}:`, error);
      }
    }
    
    console.log(`   ✅ Applied ${boostsApplied} campaign boosts`);
  }
  
  /**
   * Apply turn decay to reputation scores (drift toward neutral)
   */
  async applyReputationDecay(sessionId: string, currentTurn: number): Promise<void> {
    // Get all players in this session
    const players = await models.Player.find({ /* sessionId filter if needed */ });
    
    // Get all demographic slices
    const demographicSlices = await DemographicSlice.find({}).limit(100); // Process in batches
    
    let decaysApplied = 0;
    
    for (const player of players) {
      for (const demographic of demographicSlices) {
        try {
          await ReputationCalculationService.applyTurnDecay(
            player.id,
            demographic.id,
            currentTurn
          );
          decaysApplied++;
        } catch (error) {
          // Ignore errors for missing reputation scores (not all players have rep with all demographics)
        }
      }
    }
    
    console.log(`   ✅ Applied reputation decay (${decaysApplied} updates)`);
  }
  
  /**
   * Update reputation metrics every 3 turns
   */
  async updateReputationMetrics(sessionId: string, currentTurn: number): Promise<void> {
    // Clean up old reputation change records (keep last 50 per player)
    const players = await models.Player.find({ /* sessionId filter */ });
    
    for (const player of players) {
      // Keep only the most recent 50 reputation changes per demographic
      const demographics = await DemographicSlice.find({}).limit(50);
      
      for (const demographic of demographics) {
        const reputationScore = await ReputationScore.findOne({
          playerId: player.id,
          demographicSliceId: demographic.id
        });
        
        if (reputationScore && reputationScore.approvalHistory.length > 50) {
          // Keep only last 50 entries
          reputationScore.approvalHistory = reputationScore.approvalHistory.slice(-50);
          await reputationScore.save();
        }
      }
    }
    
    console.log(`   ✅ Updated reputation metrics (Turn ${currentTurn})`);
  }
  
  /**
   * Pause turn timer (GM can pause game)
   */
  pauseTurn(sessionId: string): void {
    const timer = this.turnTimers.get(sessionId);
    if (timer) {
      clearTimeout(timer);
      this.turnTimers.delete(sessionId);
      console.log(`⏸️ Turn timer paused for session ${sessionId}`);
    }
  }
  
  /**
   * Resume turn timer
   */
  resumeTurn(sessionId: string): void {
    this.scheduleTurnEnd(sessionId);
    console.log(`▶️ Turn timer resumed for session ${sessionId}`);
  }
  
  /**
   * Get current turn info
   */
  async getTurnInfo(sessionId: string): Promise<any> {
    const gameState = await models.GameState.findOne({ sessionId });
    
    if (!gameState) {
      throw new Error('Game state not found');
    }
    
    const now = new Date();
    const timeRemaining = gameState.turnEndTime.getTime() - now.getTime();
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
    
    return {
      currentTurn: gameState.currentTurn,
      inGameDate: gameState.inGameDate,
      turnStartTime: gameState.turnStartTime,
      turnEndTime: gameState.turnEndTime,
      timeRemaining: {
        hours: hoursRemaining,
        minutes: minutesRemaining,
        milliseconds: timeRemaining
      },
      status: gameState.status
    };
  }
}
