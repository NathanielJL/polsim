import {
  DemographicSlice,
  ReputationScore,
  ReputationChange,
  PoliticalPosition,
  IssuePositions,
  IssueSalience,
  PolicyPosition,
  ReputationChangeSource
} from '../models/ReputationTypes';
import { DemographicSliceModel, ReputationScoreModel, ReputationChangeModel } from '../models/ReputationModels';

/**
 * Reputation Calculation Service
 * Handles all reputation change calculations based on political positions,
 * issue salience, and the 3D political cube
 */
export class ReputationCalculationService {
  
  /**
   * Calculate reputation change for a player based on a policy action
   */
  static async calculatePolicyImpact(
    playerId: string,
    policy: PolicyPosition,
    playerPosition: PoliticalPosition,
    demographicSlice: DemographicSlice,
    role: 'proposer' | 'yes-voter' | 'no-voter' | 'abstain-voter'
  ): Promise<number> {
    
    // Get impact weight based on role
    const weights = {
      'proposer': 1.0,
      'yes-voter': 0.4,
      'no-voter': -0.2, // Negative because voting against
      'abstain-voter': 0.0
    };
    
    const baseWeight = weights[role];
    
    if (baseWeight === 0) return 0;
    
    // Calculate issue-based impact
    const issueImpact = this.calculateIssueMatch(
      playerPosition,
      demographicSlice.defaultPosition,
      policy.issuePositions
    );
    
    // Calculate cube-based impact
    const cubeImpact = this.calculateCubeMatch(
      policy.cubePosition,
      demographicSlice.defaultPosition.cube
    );
    
    // Weighted combination
    const totalImpact = (issueImpact * 0.7 + cubeImpact * 0.3) * baseWeight;
    
    // For no-voters, flip the impact (they're voting against the policy)
    if (role === 'no-voter') {
      return -totalImpact;
    }
    
    return totalImpact;
  }
  
  /**
   * Calculate match between player position and demographic position on specific issues
   * Returns value between -100 and +100
   */
  private static calculateIssueMatch(
    playerPosition: PoliticalPosition,
    groupPosition: PoliticalPosition,
    policyIssues: Partial<IssuePositions>
  ): number {
    
    let totalImpact = 0;
    let totalSalience = 0;
    
    // For each issue in the policy
    for (const [issue, policyValue] of Object.entries(policyIssues)) {
      if (policyValue === undefined) continue;
      
      const issueKey = issue as keyof IssuePositions;
      
      // Get group's position and salience for this issue
      const groupValue = groupPosition.issues[issueKey];
      const salience = groupPosition.salience[issueKey];
      
      if (salience === 0) continue; // Group doesn't care about this issue
      
      // Calculate distance between policy and group position (-20 to +20)
      const distance = policyValue - groupValue;
      
      // Convert distance to approval change
      // If policy matches group (distance = 0), positive impact
      // If policy opposes group (distance = ±20), negative impact
      const matchScore = -Math.abs(distance); // -20 to 0
      const normalizedScore = (matchScore / 20) * 100; // -100 to 0
      
      // Weight by salience
      const weightedImpact = normalizedScore * salience;
      
      totalImpact += weightedImpact;
      totalSalience += salience;
    }
    
    // Normalize by total salience (avoid division by zero)
    if (totalSalience === 0) return 0;
    
    return totalImpact / totalSalience;
  }
  
  /**
   * Calculate match between policy cube position and demographic cube position
   * Returns value between -100 and +100
   */
  private static calculateCubeMatch(
    policyCube: any,
    groupCube: any
  ): number {
    
    // Calculate 3D Euclidean distance
    const dx = policyCube.economic - groupCube.economic;
    const dy = policyCube.authority - groupCube.authority;
    const dz = policyCube.social - groupCube.social;
    
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    // Maximum possible distance in the cube is sqrt(20^2 + 20^2 + 20^2) ≈ 34.64
    const maxDistance = Math.sqrt(20 * 20 + 20 * 20 + 20 * 20);
    
    // Convert to approval change (-100 to +100)
    // distance 0 = +100, distance maxDistance = -100
    const matchScore = 100 - (distance / maxDistance) * 200;
    
    return matchScore;
  }
  
  /**
   * Apply reputation change to a player for a specific demographic
   */
  static async applyReputationChange(
    playerId: string,
    demographicSliceId: string,
    delta: number,
    source: ReputationChangeSource,
    sourceId: string,
    calculation: any,
    turn: number
  ): Promise<void> {
    
    // Find or create reputation score
    let reputationScore = await ReputationScoreModel.findOne({
      playerId,
      demographicSliceId
    });
    
    if (!reputationScore) {
      reputationScore = new ReputationScoreModel({
        playerId,
        demographicSliceId,
        approval: 40, // Start at slight distrust (must earn reputation)
        approvalHistory: [],
        lastUpdated: new Date(),
        turnUpdated: turn
      });
    }
    
    // Apply change (clamped to 0-100)
    const oldApproval = reputationScore.approval;
    reputationScore.approval = Math.max(0, Math.min(100, oldApproval + delta));
    reputationScore.lastUpdated = new Date();
    reputationScore.turnUpdated = turn;
    
    // Add to history
    reputationScore.approvalHistory.push({
      turn,
      approval: reputationScore.approval,
      change: delta,
      reason: this.generateReasonText(source, delta)
    });
    
    // Trim history to last 50 entries
    if (reputationScore.approvalHistory.length > 50) {
      reputationScore.approvalHistory = reputationScore.approvalHistory.slice(-50);
    }
    
    await reputationScore.save();
    
    // Create reputation change record
    const change = new ReputationChangeModel({
      playerId,
      demographicSliceId,
      delta,
      source,
      sourceId,
      calculation,
      timestamp: new Date(),
      turn
    });
    
    await change.save();
  }
  
  /**
   * Generate human-readable reason for reputation change
   */
  private static generateReasonText(source: ReputationChangeSource, delta: number): string {
    const direction = delta > 0 ? 'increased' : 'decreased';
    const amount = Math.abs(delta).toFixed(1);
    
    switch (source) {
      case 'bill-proposal':
        return `Proposed bill (${direction} by ${amount}%)`;
      case 'bill-vote-yes':
        return `Voted YES on bill (${direction} by ${amount}%)`;
      case 'bill-vote-no':
        return `Voted NO on bill (${direction} by ${amount}%)`;
      case 'bill-vote-abstain':
        return `Abstained from vote`;
      case 'campaign':
        return `Campaign effect (+${amount}%)`;
      case 'endorsement':
        return `Received endorsement (${direction} by ${amount}%)`;
      case 'news-article':
        return `News coverage (${direction} by ${amount}%)`;
      case 'scandal':
        return `Scandal (-${amount}%)`;
      case 'turn-decay':
        return `Natural decay (${direction} by ${amount}%)`;
      default:
        return `Reputation ${direction} by ${amount}%`;
    }
  }
  
  /**
   * Calculate campaign boost (random 1-5%)
   */
  static calculateCampaignBoost(): number {
    return Math.floor(Math.random() * 5) + 1;
  }
  
  /**
   * Calculate endorsement transfer rate based on endorser's approval
   */
  static calculateEndorsementTransfer(endorserApproval: number): number {
    if (endorserApproval < 40) {
      // 0-39%: Random between -7 and +1
      return Math.floor(Math.random() * 9) - 7;
    } else if (endorserApproval < 60) {
      // 40-59%: Random between -5 and +5
      return Math.floor(Math.random() * 11) - 5;
    } else {
      // 60-100%: Random between -1 and +7
      return Math.floor(Math.random() * 9) - 1;
    }
  }
  
  /**
   * Apply news article impact
   */
  static async applyNewsImpact(
    playerId: string,
    demographicSliceId: string,
    sentiment: 'positive' | 'negative' | 'neutral',
    outletType: 'ai-conservative' | 'ai-moderate' | 'ai-progressive' | 'player-provincial',
    demographicPosition: PoliticalPosition,
    turn: number,
    articleId: string
  ): Promise<number> {
    
    if (sentiment === 'neutral') return 0;
    
    // Determine ideological alignment
    let baseImpact = 0;
    
    if (outletType.startsWith('ai-')) {
      // AI outlets have ideological alignment
      const outletBias = outletType === 'ai-conservative' ? 8 :
                        outletType === 'ai-moderate' ? 0 : -8;
      
      const demographicSocial = demographicPosition.cube.social;
      
      // If outlet and demographic align, amplify impact
      const alignment = 1 - Math.abs(outletBias - demographicSocial) / 20;
      
      // Base impact -5 to +5, modified by alignment
      baseImpact = (Math.random() * 10 - 5) * alignment;
    } else {
      // Player provincial outlets have standard impact
      baseImpact = Math.random() * 10 - 5;
    }
    
    // Apply sentiment
    const delta = sentiment === 'positive' ? Math.abs(baseImpact) : -Math.abs(baseImpact);
    
    // Apply to reputation
    await this.applyReputationChange(
      playerId,
      demographicSliceId,
      delta,
      'news-article',
      articleId,
      { outletType, sentiment, baseImpact },
      turn
    );
    
    return delta;
  }
  
  /**
   * Apply turn-based decay (old scandals forgotten, natural drift)
   */
  static async applyTurnDecay(
    playerId: string,
    demographicSliceId: string,
    decayRate: number,
    turn: number
  ): Promise<void> {
    
    const reputationScore = await ReputationScoreModel.findOne({
      playerId,
      demographicSliceId
    });
    
    if (!reputationScore) return;
    
    // Natural drift toward base reputation (40 = slight distrust)
    const BASE_REPUTATION = 40;
    const currentApproval = reputationScore.approval;
    const distanceFromBase = currentApproval - BASE_REPUTATION;
    const decay = distanceFromBase * decayRate;
    
    if (Math.abs(decay) < 0.1) return; // Insignificant decay
    
    await this.applyReputationChange(
      playerId,
      demographicSliceId,
      -decay,
      'turn-decay',
      `turn-${turn}`,
      { decayRate, distanceFromBase },
      turn
    );
  }
  
  /**
   * Get player's reputation with a demographic
   */
  static async getReputation(playerId: string, demographicSliceId: string): Promise<number> {
    const score = await ReputationScoreModel.findOne({
      playerId,
      demographicSliceId
    });
    
    return score ? score.approval : 40; // Default to slight distrust
  }
  
  /**
   * Get player's reputation breakdown by province
   */
  static async getReputationByProvince(playerId: string): Promise<Map<string, number>> {
    const slices = await DemographicSliceModel.find({});
    const result = new Map<string, number>();
    
    for (const slice of slices) {
      const approval = await this.getReputation(playerId, slice.id);
      const province = slice.locational.province;
      
      if (!result.has(province)) {
        result.set(province, 0);
      }
      
      // Weighted average by population
      const currentAvg = result.get(province)!;
      const totalPop = slices
        .filter(s => s.locational.province === province)
        .reduce((sum, s) => sum + s.population, 0);
      
      result.set(province, currentAvg + (approval * slice.population / totalPop));
    }
    
    return result;
  }
}

export default ReputationCalculationService;
