import { ReputationCalculationService } from './ReputationCalculationService';
import { DemographicSliceModel } from '../models/ReputationModels';
import { PolicyPosition, PoliticalPosition } from '../models/ReputationTypes';

/**
 * Policy Reputation Integration Service
 * Connects policy voting with the reputation system
 */
export class PolicyReputationService {
  
  /**
   * Calculate and apply reputation impacts when a policy is voted on
   */
  static async applyPolicyReputationImpacts(
    policyId: string,
    policyPosition: PolicyPosition,
    sessionId: string,
    turn: number
  ): Promise<{
    proposerImpacts: number;
    yesVoterImpacts: number;
    noVoterImpacts: number;
  }> {
    // Get all demographic slices
    const allDemographics = await DemographicSliceModel.find({});
    
    let proposerImpacts = 0;
    let yesVoterImpacts = 0;
    let noVoterImpacts = 0;
    
    // Get policy and voters
    const Policy = (await import('../models/mongoose')).default.Policy;
    const policy = await Policy.findById(policyId);
    
    if (!policy) {
      throw new Error(`Policy ${policyId} not found`);
    }
    
    // Extract voter IDs from voters array (if it exists)
    const proposerId = policy.proposedBy?.toString() || '';
    const voters = (policy as any).voters || [];
    const yesVoters = voters
      .filter((v: any) => v.vote === 'yes')
      .map((v: any) => v.playerId.toString());
    const noVoters = voters
      .filter((v: any) => v.vote === 'no')
      .map((v: any) => v.playerId.toString());
    
    // Calculate impact for each demographic
    for (const demographic of allDemographics) {
      // Get demographic's political position
      const demographicPosition = demographic.defaultPosition;
      
      // Proposer impact (weight: 1.0)
      if (proposerId) {
        const proposerImpact = await ReputationCalculationService.calculatePolicyImpact(
          proposerId,
          policyPosition,
          policyPosition, // Using policy position as player position (simplified)
          demographic,
          'proposer'
        );
        
        await ReputationCalculationService.applyReputationChange(
          proposerId,
          demographic.id,
          proposerImpact,
          'policy',
          policyId,
          turn,
          { role: 'proposer', policyPosition }
        );
        
        proposerImpacts++;
      }
      
      // YES voters impact (weight: 0.4)
      for (const voterId of yesVoters) {
        const yesImpact = await ReputationCalculationService.calculatePolicyImpact(
          voterId,
          policyPosition,
          policyPosition,
          demographic,
          'yes-voter'
        );
        
        await ReputationCalculationService.applyReputationChange(
          voterId,
          demographic.id,
          yesImpact,
          'policy',
          policyId,
          turn,
          { role: 'yes-voter', policyPosition }
        );
        
        yesVoterImpacts++;
      }
      
      // NO voters impact (weight: -0.2, representing opposition)
      for (const voterId of noVoters) {
        const noImpact = await ReputationCalculationService.calculatePolicyImpact(
          voterId,
          policyPosition,
          policyPosition,
          demographic,
          'no-voter'
        );
        
        await ReputationCalculationService.applyReputationChange(
          voterId,
          demographic.id,
          noImpact,
          'policy',
          policyId,
          turn,
          { role: 'no-voter', policyPosition }
        );
        
        noVoterImpacts++;
      }
    }
    
    console.log(`✅ Applied policy reputation impacts for policy ${policyId}:`);
    console.log(`   - Proposer: ${proposerImpacts} demographics`);
    console.log(`   - YES voters: ${yesVoters.length} players × ${allDemographics.length} = ${yesVoterImpacts} total`);
    console.log(`   - NO voters: ${noVoters.length} players × ${allDemographics.length} = ${noVoterImpacts} total`);
    
    return {
      proposerImpacts,
      yesVoterImpacts,
      noVoterImpacts
    };
  }
  
  /**
   * Convert AI-analyzed policy to PolicyPosition for reputation calculation
   */
  static convertAIPolicyToPolicyPosition(aiAnalysis: any): PolicyPosition {
    // Extract political positioning from AI analysis
    // This is a simplified version - you'll need to enhance based on your AI output
    
    const policyPosition: PolicyPosition = {
      cube: {
        economic: 0,
        authority: 0,
        social: 0
      },
      issues: {
        // Initialize all 34 issues
        sovereignty: 0,
        propertyRights: 0,
        taxes: 0,
        protectionism: 0,
        landSales: 0,
        kingitanga: 0,
        responsibleGovernment: 0,
        centralization: 0,
        propertySuffrage: 0,
        eminentDomain: 0,
        workerRights: 0,
        minimumWage: 0,
        womensSuffrage: 0,
        immigration: 0,
        economicIntervention: 0,
        welfareState: 0,
        healthcare: 0,
        educationRights: 0,
        businessRegulation: 0,
        deathPenalty: 0,
        interventionism: 0,
        indigenousRights: 0,
        environmentalRegulation: 0,
        privatization: 0,
        justice: 0,
        animalRights: 0,
        productiveRights: 0,
        globalism: 0,
        privacyRights: 0,
        policeReform: 0,
        waterRights: 0,
        equity: 0,
        universalIncome: 0,
        gayRights: 0,
        transRights: 0
      }
    };
    
    // Map AI analysis to political position
    // This logic should be enhanced based on your AI output format
    if (aiAnalysis.policyType) {
      switch (aiAnalysis.policyType) {
        case 'tax':
          policyPosition.issues.taxes = aiAnalysis.increasesTaxes ? 5 : -5;
          policyPosition.cube.economic = aiAnalysis.increasesTaxes ? -3 : 3;
          break;
        case 'trade':
          policyPosition.issues.protectionism = aiAnalysis.protectionist ? 5 : -5;
          break;
        case 'labor':
          policyPosition.issues.workerRights = 5;
          policyPosition.cube.economic = -3;
          break;
        case 'land':
          policyPosition.issues.landSales = aiAnalysis.restrictsLandSales ? -5 : 5;
          policyPosition.issues.propertyRights = 3;
          break;
        // Add more policy type mappings
      }
    }
    
    return policyPosition;
  }
  
  /**
   * Get predicted reputation impacts before policy is enacted
   * Useful for showing players what will happen if they vote
   */
  static async predictPolicyImpacts(
    playerId: string,
    policyPosition: PolicyPosition,
    role: 'proposer' | 'yes-voter' | 'no-voter' | 'abstain-voter'
  ): Promise<Array<{
    demographic: any;
    predictedImpact: number;
    currentApproval: number;
    newApproval: number;
  }>> {
    // Get top 20 largest voting demographics for preview
    const demographics = await DemographicSliceModel.find({ canVote: true })
      .sort({ population: -1 })
      .limit(20);
    
    const predictions = [];
    
    for (const demographic of demographics) {
      const currentApproval = await ReputationCalculationService.getReputation(
        playerId,
        demographic.id
      );
      
      const predictedImpact = await ReputationCalculationService.calculatePolicyImpact(
        playerId,
        policyPosition,
        policyPosition, // Simplified - use actual player position
        demographic,
        role
      );
      
      const newApproval = Math.max(0, Math.min(100, currentApproval + predictedImpact));
      
      predictions.push({
        demographic: {
          id: demographic.id,
          occupation: demographic.economic.occupation,
          class: demographic.economic.class,
          province: demographic.locational.province,
          population: demographic.population
        },
        predictedImpact,
        currentApproval,
        newApproval
      });
    }
    
    return predictions;
  }
}
