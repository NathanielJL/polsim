/**
 * Policy Supersession Service
 * 
 * Handles automatic policy supersession when new policies in the same category are enacted.
 * - New tax policy → old tax modifiers deleted
 * - New immigration policy → old immigration modifiers deleted
 * - Delayed effects can be cancelled or prorated based on completion
 * 
 * GMs manually archive text/narrative to external wiki (Notion, etc.)
 */

import { models } from '../models/mongoose';

// Policy categories that supersede each other (only 1 active per category)
const SUPERSEDING_CATEGORIES: { [key: string]: { maxActive: number | null, allowStacking?: boolean } } = {
  // Tax policies (only one active per type)
  'tax_income': { maxActive: 1 },
  'tax_property': { maxActive: 1 },
  'tax_corporate': { maxActive: 1 },
  'tariff': { maxActive: 1 },
  'tax_sales': { maxActive: 1 },
  
  // Immigration (only one framework active)
  'immigration': { maxActive: 1 },
  
  // Resource regulations (one per resource type)
  'resource_timber': { maxActive: 1 },
  'resource_gold': { maxActive: 1 },
  'resource_coal': { maxActive: 1 },
  'resource_whaling': { maxActive: 1 },
  
  // Land reform (major frameworks supersede)
  'land_reform': { maxActive: 1 },
  
  // Labor law (one active framework per type)
  'labor': { maxActive: 1 },
  
  // Electoral reform
  'electoral_reform': { maxActive: 1 },
  
  // Maori rights framework
  'maori_rights': { maxActive: 1 },
  
  // Non-superseding categories (multiple can be active - they stack)
  'infrastructure': { maxActive: null, allowStacking: true },
  'education': { maxActive: null, allowStacking: true },
  'other': { maxActive: null, allowStacking: true },
};

export class PolicySupersessionService {
  
  /**
   * Check if new policy should supersede existing policies
   * Called when policy is enacted
   */
  async checkSupersession(newPolicyId: string, sessionId: string): Promise<any> {
    try {
      const newPolicy = await models.Policy.findById(newPolicyId);
      if (!newPolicy) {
        throw new Error('Policy not found');
      }
      
      const category = newPolicy.policyType || 'other';
      const categoryConfig = SUPERSEDING_CATEGORIES[category];
      
      // If category allows stacking, no supersession
      if (!categoryConfig || categoryConfig.allowStacking) {
        return {
          superseded: false,
          message: 'Category allows multiple active policies'
        };
      }
      
      // Find other active policies in same category
      const activePolicies = await models.Policy.find({
        sessionId,
        policyType: category,
        status: 'enacted',
        _id: { $ne: newPolicyId } // Exclude the new policy itself
      });
      
      if (activePolicies.length === 0) {
        return {
          superseded: false,
          message: 'No existing policies to supersede'
        };
      }
      
      const supersededPolicies = [];
      
      for (const oldPolicy of activePolicies) {
        const result = await this.deletePolicy(oldPolicy, newPolicyId.toString(), 'superseded_by_policy');
        supersededPolicies.push(result);
      }
      
      // Update new policy with supersession info
      newPolicy.supersedes = activePolicies.map(p => p._id.toString());
      await newPolicy.save();
      
      return {
        superseded: true,
        count: supersededPolicies.length,
        policies: supersededPolicies,
        message: `Superseded ${supersededPolicies.length} existing ${category} policy/policies`
      };
      
    } catch (error: any) {
      console.error('Policy supersession error:', error);
      throw error;
    }
  }
  
  /**
   * GM deletes policy during event
   * Called when GM removes policy as consequence of event
   */
  async deletePolicyByEvent(policyId: string, eventId: string, reason: string): Promise<any> {
    try {
      const policy = await models.Policy.findById(policyId);
      if (!policy) {
        throw new Error('Policy not found');
      }
      
      const result = await this.deletePolicy(policy, eventId, 'deleted_by_event', reason);
      
      return {
        success: true,
        policy: result,
        message: `Policy deleted due to event: ${reason}`
      };
    } catch (error: any) {
      console.error('Policy deletion error:', error);
      throw error;
    }
  }
  
  /**
   * Core policy deletion logic
   * Deletes modifiers but preserves historical record
   */
  private async deletePolicy(
    policy: any, 
    triggerId: string, 
    deletionType: 'superseded_by_policy' | 'deleted_by_event',
    reason?: string
  ): Promise<any> {
    // Mark as superseded/deleted
    policy.status = 'superseded' as any;
    
    if (deletionType === 'superseded_by_policy') {
      policy.supersededBy = triggerId;
    } else {
      policy.deletedByEvent = triggerId;
      policy.deletionReason = reason;
    }
    
    policy.supersededAt = new Date();
    
    // Delete modifiers (keep for historical reference in separate field)
    if (policy.economicImpact) {
      policy.supersededEconomicImpact = policy.economicImpact;
      policy.economicImpact = null as any;
    }
    
    if (policy.reputationImpact) {
      policy.supersededReputationImpact = policy.reputationImpact;
      policy.reputationImpact = null as any;
    }
    
    if (policy.resourcePriceChanges) {
      policy.supersededResourcePriceChanges = policy.resourcePriceChanges;
      policy.resourcePriceChanges = null as any;
    }
    
    if (policy.culturalModifiers) {
      policy.supersededCulturalModifiers = policy.culturalModifiers;
      policy.culturalModifiers = null as any;
    }
    
    // Handle delayed effects
    if (policy.delayedEffect && policy.delayedEffect.applyAtTurn > (await this.getCurrentTurn(policy.sessionId))) {
      const completion = await this.calculateDelayedEffectCompletion(policy, policy.sessionId);
      
      if (completion >= 0.5) {
        // >50% done - prorate and let complete
        policy.delayedEffect.prorated = true;
        policy.delayedEffect.completionPercentage = completion;
        this.prorateDelayedEffect(policy.delayedEffect, completion);
      } else {
        // <50% done - cancel
        policy.supersededDelayedEffect = policy.delayedEffect;
        policy.delayedEffect = null as any;
      }
    }
    
    await policy.save();
    
    return {
      id: policy.id,
      title: policy.title,
      modifiersDeleted: true,
      deletionType,
      reason
    };
  }
  
  /**
   * Calculate how much of delayed effect has completed
   */
  private async calculateDelayedEffectCompletion(policy: any, sessionId: string): Promise<number> {
    const currentTurn = await this.getCurrentTurn(sessionId);
    const enactedTurn = policy.turnEnacted || policy.turnApproved || 1;
    const applyAtTurn = policy.delayedEffect?.applyAtTurn || enactedTurn + 5;
    
    const totalDuration = applyAtTurn - enactedTurn;
    const elapsed = currentTurn - enactedTurn;
    
    return Math.min(elapsed / totalDuration, 1.0);
  }
  
  /**
   * Prorate delayed effect based on completion percentage
   */
  private prorateDelayedEffect(delayedEffect: any, completion: number): void {
    if (delayedEffect.gdpChange) {
      delayedEffect.gdpChange *= completion;
    }
    if (delayedEffect.unemploymentChange) {
      delayedEffect.unemploymentChange *= completion;
    }
    if (delayedEffect.revenue) {
      delayedEffect.revenue *= completion;
    }
  }
  
  /**
   * Get current turn for session
   */
  private async getCurrentTurn(sessionId: string): Promise<number> {
    const session = await models.Session.findById(sessionId);
    return session?.currentTurn || 1;
  }
  
  /**
   * Get all active modifiers by category (for fast lookup)
   */
  async getActiveModifiers(sessionId: string): Promise<any> {
    const activePolicies = await models.Policy.find({
      sessionId,
      status: 'enacted'
    });
    
    const modifiersByCategory: any = {};
    
    for (const policy of activePolicies) {
      const category = policy.policyType || 'other';
      
      if (!modifiersByCategory[category]) {
        modifiersByCategory[category] = [];
      }
      
      modifiersByCategory[category].push({
        policyId: policy.id,
        title: policy.title,
        economicImpact: policy.economicImpact,
        reputationImpact: policy.reputationImpact,
        resourcePriceChanges: policy.resourcePriceChanges,
        turnEnacted: policy.turnEnacted
      });
    }
    
    return modifiersByCategory;
  }
  
  /**
   * Get supersession history for a policy
   */
  async getSupersessionHistory(policyId: string): Promise<any> {
    const policy = await models.Policy.findById(policyId);
    if (!policy) {
      throw new Error('Policy not found');
    }
    
    const history: any = {
      current: {
        id: policy.id,
        title: policy.title,
        status: policy.status
      },
      supersededBy: null,
      supersedes: []
    };
    
    // What superseded this policy?
    if (policy.supersededBy) {
      const supersedingPolicy = await models.Policy.findById(policy.supersededBy);
      if (supersedingPolicy) {
        history.supersededBy = {
          id: supersedingPolicy.id,
          title: supersedingPolicy.title,
          turnEnacted: supersedingPolicy.turnEnacted
        };
      }
    }
    
    // What did this policy supersede?
    if (policy.supersedes && Array.isArray(policy.supersedes)) {
      for (const supersededId of policy.supersedes) {
        const supersededPolicy = await models.Policy.findById(supersededId);
        if (supersededPolicy) {
          history.supersedes.push({
            id: supersededPolicy.id,
            title: supersededPolicy.title,
            turnSuperseded: supersededPolicy.supersededAt
          });
        }
      }
    }
    
    return history;
  }
}

export default new PolicySupersessionService();
