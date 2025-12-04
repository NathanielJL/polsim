/**
 * NPC Voting Service
 * Simulates population voting behavior based on ideology, reputation, and demographics
 */

import { models } from '../models/mongoose';
import type { Election, Player } from '../models/types';

interface IdeologyScore {
  economic: number;
  social: number;
  personal: number;
}

interface VotingDemographic {
  cultureId?: string;
  religionId?: string;
  socioeconomicClass?: number;
  population: number;
  ideologyProfile: IdeologyScore;
}

export class NPCVotingService {
  /**
   * Calculate ideology distance between voter and candidate
   * Lower score = better alignment
   */
  private static calculateIdeologyDistance(
    voterIdeology: IdeologyScore,
    candidateIdeology: IdeologyScore
  ): number {
    const economicDist = Math.abs(voterIdeology.economic - candidateIdeology.economic);
    const socialDist = Math.abs(voterIdeology.social - candidateIdeology.social);
    const personalDist = Math.abs(voterIdeology.personal - candidateIdeology.personal);
    
    // Weighted average (economic issues matter most in 1850s)
    return (economicDist * 0.5) + (socialDist * 0.3) + (personalDist * 0.2);
  }
  
  /**
   * Get voting demographics for a province
   */
  private static async getProvinceDemographics(provinceId: string): Promise<VotingDemographic[]> {
    const province = await models.Province.findById(provinceId);
    if (!province) return [];
    
    const demographics: VotingDemographic[] = [];
    
    // Get cultures in province
    const cells = await models.Cell.find({ province: provinceId });
    const cultureMap = new Map<string, number>();
    
    cells.forEach(cell => {
      if (cell.culture) {
        const pop = cell.pop || 0;
        cultureMap.set(cell.culture, (cultureMap.get(cell.culture) || 0) + pop);
      }
    });
    
    // Create demographic groups by culture
    for (const [cultureId, population] of cultureMap) {
      const culture = await models.Culture.findById(cultureId);
      
      // Assign ideology based on culture type (simplified)
      let ideologyProfile: IdeologyScore = { economic: 0, social: 0, personal: 0 };
      
      if (culture) {
        // Rural cultures: More conservative
        // Urban cultures: More liberal
        // This is simplified - could be much more complex
        const isUrban = culture.urban || false;
        
        ideologyProfile = {
          economic: isUrban ? -2 : 2,  // Urban = more liberal economy
          social: isUrban ? -1 : 1,     // Urban = more socially liberal
          personal: 0,                   // Neutral on personal freedoms
        };
      }
      
      demographics.push({
        cultureId,
        population,
        ideologyProfile,
      });
    }
    
    return demographics;
  }
  
  /**
   * Simulate NPC voting for an election
   * Returns Map of candidate ID -> number of votes
   */
  static async simulateVoting(
    electionId: string,
    sessionId: string
  ): Promise<Map<string, number>> {
    const election = await models.Election.findById(electionId);
    if (!election) {
      throw new Error('Election not found');
    }
    
    const voteCount = new Map<string, number>();
    
    // Initialize all candidates with 0 votes
    election.candidates.forEach(candidate => {
      voteCount.set(candidate.playerId.toString(), 0);
    });
    
    // Get demographics
    const demographics = election.provinceId 
      ? await this.getProvinceDemographics(election.provinceId.toString())
      : [];
    
    if (demographics.length === 0) {
      // Fallback: Simple random distribution
      const province = await models.Province.findById(election.provinceId);
      const totalPopulation = province?.population || 10000;
      
      election.candidates.forEach(candidate => {
        // Random distribution with ±30% variation
        const baseVotes = totalPopulation / election.candidates.length;
        const variation = (Math.random() * 0.6) - 0.3;
        const votes = Math.round(baseVotes * (1 + variation));
        voteCount.set(candidate.playerId.toString(), votes);
      });
      
      return voteCount;
    }
    
    // For each demographic group, calculate preference
    for (const demo of demographics) {
      // Calculate distance to each candidate
      const candidateScores: Array<{ id: string; score: number; reputation: number }> = [];
      
      for (const candidate of election.candidates) {
        // Get candidate player for reputation
        const player = await models.Player.findById(candidate.playerId);
        
        const ideologyDistance = this.calculateIdeologyDistance(
          demo.ideologyProfile,
          candidate.ideology
        );
        
        // Reputation bonus (0-100 scale)
        const reputationBonus = player?.reputation || 50;
        
        // Funding advantage (more funding = more visibility)
        const fundingFactor = Math.log(candidate.fundingRaised + 1) / 10;
        
        // Endorsement factor
        const endorsementFactor = candidate.endorsements.length * 0.5;
        
        // Combined score (lower is better for ideology distance)
        // But reputation/funding/endorsements are bonuses
        const score = ideologyDistance - (reputationBonus / 50) - fundingFactor - endorsementFactor;
        
        candidateScores.push({
          id: candidate.playerId.toString(),
          score,
          reputation: reputationBonus,
        });
      }
      
      // Sort by score (lower is better)
      candidateScores.sort((a, b) => a.score - b.score);
      
      // Distribute votes with preference for top candidates
      // Top candidate gets 50% + random, 2nd gets 30% + random, rest split remainder
      const voters = demo.population;
      
      if (candidateScores.length > 0) {
        // Winner-take-most system
        const winnerVotes = Math.round(voters * (0.4 + Math.random() * 0.2)); // 40-60%
        voteCount.set(
          candidateScores[0].id, 
          (voteCount.get(candidateScores[0].id) || 0) + winnerVotes
        );
        
        let remainingVotes = voters - winnerVotes;
        
        if (candidateScores.length > 1) {
          const runnerUpVotes = Math.round(remainingVotes * (0.5 + Math.random() * 0.2)); // ~60% of remainder
          voteCount.set(
            candidateScores[1].id,
            (voteCount.get(candidateScores[1].id) || 0) + runnerUpVotes
          );
          remainingVotes -= runnerUpVotes;
        }
        
        // Split rest among other candidates
        if (candidateScores.length > 2) {
          const perCandidate = Math.floor(remainingVotes / (candidateScores.length - 2));
          for (let i = 2; i < candidateScores.length; i++) {
            voteCount.set(
              candidateScores[i].id,
              (voteCount.get(candidateScores[i].id) || 0) + perCandidate
            );
          }
        }
      }
    }
    
    return voteCount;
  }
  
  /**
   * Record NPC votes in database
   */
  static async recordNPCVotes(
    electionId: string,
    sessionId: string,
    voteCount: Map<string, number>
  ): Promise<void> {
    const session = await models.Session.findById(sessionId);
    const currentTurn = session?.currentTurn || 0;
    
    // Create aggregated NPC vote records
    for (const [candidateId, votes] of voteCount) {
      if (votes > 0) {
        // Create one vote record per 100 NPCs (to avoid millions of records)
        const voteRecords = Math.ceil(votes / 100);
        
        for (let i = 0; i < voteRecords; i++) {
          await models.Vote.create({
            id: `npc-vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            sessionId,
            voterId: `npc-block-${i}`,
            isNPC: true,
            electionId,
            choice: candidateId,
            turn: currentTurn,
          });
        }
      }
    }
  }
  
  /**
   * Full election simulation with NPC voting
   */
  static async runElection(electionId: string, sessionId: string): Promise<{
    winner: string;
    results: Map<string, number>;
    turnout: number;
  }> {
    const election = await models.Election.findById(electionId);
    if (!election) {
      throw new Error('Election not found');
    }
    
    // Get player votes
    const playerVotes = await models.Vote.find({ 
      electionId, 
      sessionId,
      isNPC: false 
    });
    
    const voteCount = new Map<string, number>();
    
    // Count player votes
    playerVotes.forEach(vote => {
      voteCount.set(vote.choice, (voteCount.get(vote.choice) || 0) + 1);
    });
    
    // Simulate NPC votes
    const npcVotes = await this.simulateVoting(electionId, sessionId);
    
    // Combine votes
    npcVotes.forEach((votes, candidateId) => {
      voteCount.set(candidateId, (voteCount.get(candidateId) || 0) + votes);
    });
    
    // Record NPC votes
    await this.recordNPCVotes(electionId, sessionId, npcVotes);
    
    // Find winner
    let winner = '';
    let maxVotes = 0;
    
    voteCount.forEach((votes, candidateId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = candidateId;
      }
    });
    
    // Calculate turnout
    const province = await models.Province.findById(election.provinceId);
    const totalPopulation = province?.population || 10000;
    const totalVotes = Array.from(voteCount.values()).reduce((sum, v) => sum + v, 0);
    const turnout = Math.round((totalVotes / totalPopulation) * 100);
    
    return { winner, results: voteCount, turnout };
  }
}
