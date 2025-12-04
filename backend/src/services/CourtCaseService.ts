/**
 * Court Case Generation Service
 * Automatically generates 1 case per lawyer per turn
 * Cases are AI-generated with historical accuracy for 1854 Zealandia
 */

import { models } from '../models/mongoose';
import { AIService } from './AIService';

export class CourtCaseService {
  private aiService: AIService;
  
  constructor() {
    this.aiService = new AIService();
  }
  
  /**
   * Generate cases for all lawyers in a session
   * Called automatically at turn start
   */
  async generateCasesForTurn(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }
      
      // Find all players with lawyer occupation
      const lawyers = await models.Player.find({
        sessionId,
        occupation: 'Lawyer'
      });
      
      if (lawyers.length === 0) {
        return {
          success: true,
          casesGenerated: 0,
          message: 'No lawyers in session'
        };
      }
      
      const cases = [];
      
      for (const lawyer of lawyers) {
        // Get lawyer's province
        const province = await models.Province.findById(lawyer.provinceId);
        const provinceName = province?.name || 'Unknown';
        
        // Generate case via AI
        const caseResult = await this.aiService.generateCourtCase(
          sessionId.toString(),
          lawyer._id.toString(),
          provinceName,
          session.currentTurn
        );
        
        if (caseResult.success && caseResult.case) {
          const caseData = caseResult.case;
          
          // Create court case in database
          const courtCase = await models.CourtCase.create({
            id: caseData.caseId,
            sessionId,
            assignedLawyerId: lawyer._id,
            provinceId: lawyer.provinceId,
            type: caseData.type,
            title: caseData.title,
            plaintiff: caseData.plaintiff,
            defendant: caseData.defendant,
            summary: caseData.summary,
            legalIssues: caseData.legalIssues,
            culturalContext: caseData.culturalContext,
            difficulty: caseData.difficulty,
            potentialOutcomes: caseData.potentialOutcomes,
            rewardRange: caseData.rewardRange,
            status: 'pending',
            turnCreated: session.currentTurn,
            turnDue: session.currentTurn + 3 // 3 turns to resolve
          });
          
          cases.push({
            lawyer: lawyer.username,
            caseTitle: courtCase.title,
            type: courtCase.type,
            difficulty: courtCase.difficulty
          });
        }
      }
      
      console.log(`   ✅ Generated ${cases.length} court cases for ${lawyers.length} lawyers`);
      
      return {
        success: true,
        casesGenerated: cases.length,
        lawyers: lawyers.length,
        cases
      };
    } catch (error: any) {
      console.error('Court case generation error:', error);
      throw error;
    }
  }
  
  /**
   * Resolve a court case (player action)
   */
  async resolveCase(
    caseId: string,
    lawyerId: string,
    strategy: string,
    arguments: string
  ): Promise<any> {
    try {
      const courtCase = await models.CourtCase.findById(caseId);
      if (!courtCase) {
        throw new Error('Case not found');
      }
      
      if (courtCase.assignedLawyerId?.toString() !== lawyerId) {
        throw new Error('Not assigned to this case');
      }
      
      if (courtCase.status !== 'pending') {
        throw new Error('Case already resolved');
      }
      
      // Simple outcome determination (could be enhanced with AI)
      const outcomes = courtCase.potentialOutcomes || [];
      
      // Weight by probability
      const roll = Math.random();
      let cumulative = 0;
      let selectedOutcome = outcomes[0];
      
      for (const outcome of outcomes) {
        cumulative += outcome.probability;
        if (roll <= cumulative) {
          selectedOutcome = outcome;
          break;
        }
      }
      
      // Calculate reward based on difficulty
      const baseReward = courtCase.rewardRange?.min || 50;
      const maxReward = courtCase.rewardRange?.max || 500;
      const reward = Math.floor(
        baseReward + (maxReward - baseReward) * Math.random()
      );
      
      // Update case
      courtCase.status = 'resolved';
      courtCase.outcome = selectedOutcome.outcome;
      courtCase.lawyerStrategy = strategy;
      courtCase.lawyerArguments = arguments;
      courtCase.reward = reward;
      courtCase.reputationChange = selectedOutcome.reputationImpact;
      courtCase.resolvedAt = new Date();
      await courtCase.save();
      
      // Update lawyer
      const lawyer = await models.Player.findById(lawyerId);
      if (lawyer) {
        lawyer.cash = (lawyer.cash || 0) + reward;
        lawyer.reputation = (lawyer.reputation || 50) + selectedOutcome.reputationImpact;
        await lawyer.save();
      }
      
      return {
        success: true,
        outcome: selectedOutcome.outcome,
        reward,
        reputationChange: selectedOutcome.reputationImpact,
        message: `Case resolved. Earned £${reward}, reputation ${selectedOutcome.reputationImpact >= 0 ? '+' : ''}${selectedOutcome.reputationImpact}`
      };
    } catch (error: any) {
      console.error('Case resolution error:', error);
      throw error;
    }
  }
  
  /**
   * Get pending cases for a lawyer
   */
  async getPendingCases(lawyerId: string): Promise<any[]> {
    try {
      const cases = await models.CourtCase.find({
        assignedLawyerId: lawyerId,
        status: 'pending'
      }).sort({ turnCreated: -1 });
      
      return cases;
    } catch (error: any) {
      console.error('Get pending cases error:', error);
      throw error;
    }
  }
}

export default new CourtCaseService();
