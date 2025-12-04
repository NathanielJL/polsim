/**
 * Turn System Service
 * Manages turn progression, auto-processing every 24 hours
 * 
 * Turn length: 1.2 in-game months = 24 hours real-time
 * Turn processing:
 * - Calculate company profits
 * - Distribute dividends
 * - Process policies (apply effects)
 * - Generate AI news articles
 * - Reset player action points
 * - Archive old turns (keep last 12-24 per player)
 * - Trigger annual events (immigration, elections)
 */

import { models } from '../models/mongoose';
import { resetActionPoints } from '../middleware/actionPoints';
import { AIService } from './AIService';
import ImmigrationService from './ImmigrationService';
import CourtCaseService from './CourtCaseService';

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
      
      // 2. Distribute dividends
      await this.distributeDividends(sessionId);
      
      // 3. Process enacted policies
      await this.processPolicies(sessionId);
      
      // 4. Generate court cases for lawyers
      await this.generateCourtCases(sessionId);
      
      // 5. Reset action points
      const playersReset = await resetActionPoints(sessionId);
      console.log(`   ✅ Reset AP for ${playersReset} players`);
      
      // 6. Advance turn number and in-game date
      const newTurnNumber = gameState.currentTurn + 1;
      const newInGameDate = this.advanceInGameDate(gameState.inGameDate);
      
      gameState.currentTurn = newTurnNumber;
      gameState.inGameDate = newInGameDate;
      gameState.turnStartTime = new Date();
      gameState.turnEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      gameState.status = 'active';
      await gameState.save();
      
      // 7. Check for annual events (elections, immigration)
      await this.checkAnnualEvents(sessionId, newInGameDate);
      
      // 8. Archive old turns (keep last 24)
      await this.archiveOldTurns(sessionId, newTurnNumber);
      
      // 9. Schedule next turn
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
   * Advance in-game date by 1.2 months (36 days)
   */
  advanceInGameDate(currentDate: Date): Date {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 36); // 1.2 months ≈ 36 days
    return newDate;
  }
  
  /**
   * Calculate company profits based on market conditions
   */
  async calculateCompanyProfits(sessionId: string): Promise<void> {
    const companies = await models.Company.find({ sessionId });
    
    for (const company of companies) {
      // Base profit calculation (simplified)
      const revenue = company.valuation * 0.05; // 5% of valuation
      const profit = revenue * 0.3; // 30% profit margin
      
      company.cash = (company.cash || 0) + profit;
      company.profitHistory = company.profitHistory || [];
      company.profitHistory.push({
        turn: (await models.GameState.findOne({ sessionId }))?.currentTurn || 0,
        profit
      });
      
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
      
      // Distribute 50% of cash as dividends
      const totalDividends = company.cash * 0.5;
      const dividendPerShare = totalDividends / company.shares;
      
      // Find all shareholders
      const portfolios = await models.PlayerPortfolio.find({ sessionId });
      
      for (const portfolio of portfolios) {
        const holding = portfolio.holdings.find(
          (h: any) => h.companyId?.toString() === company._id.toString()
        );
        
        if (holding && holding.shares > 0) {
          const dividend = dividendPerShare * holding.shares;
          
          // Add to player cash
          const player = await models.Player.findById(portfolio.playerId);
          if (player) {
            player.cash = (player.cash || 0) + dividend;
            await player.save();
          }
        }
      }
      
      company.cash -= totalDividends;
      await company.save();
    }
    
    console.log(`   ✅ Distributed dividends for ${companies.length} companies`);
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
