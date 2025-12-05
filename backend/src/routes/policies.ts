/**
 * Policy Routes - AI-Powered Policy Submission
 * Players submit policies in natural language, AI extracts structured data
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/AIService';
import { 
  requireActionPoints, 
  consumeActionPoints,
  ActionPointRequest 
} from '../middleware/actionPoints';
import PolicySupersessionService from '../services/PolicySupersessionService';
import { PolicyReputationService } from '../services/PolicyReputationService';

const router = Router();
const aiService = new AIService();

/**
 * POST /api/policies/submit
 * Submit a policy proposal in natural language
 * AI will extract structured data and calculate impacts
 * Cost: FREE (0 AP)
 */
router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, sessionId, title, description } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({ error: 'Title and description required' });
    }
    
    const player = req.player; // From action points middleware
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // AI extracts structured policy data
    console.log('🤖 AI analyzing policy proposal...');
    const aiAnalysis = await aiService.analyzePolicyProposal(title, description);
    
    if (!aiAnalysis.success) {
      return res.status(400).json({ 
        error: 'Could not analyze policy', 
        details: aiAnalysis.error 
      });
    }
    
    // Create policy with AI-extracted data
    const policy = await models.Policy.create({
      sessionId,
      proposedBy: playerId,
      title,
      description,
      
      // AI-extracted structured data
      policyType: aiAnalysis.policyType,
      affectedResources: aiAnalysis.affectedResources || [],
      affectedProvinces: aiAnalysis.affectedProvinces || [],
      
      // AI-calculated impacts
      economicImpact: aiAnalysis.economicImpact || {},
      reputationImpact: aiAnalysis.reputationImpact || {},
      resourcePriceChanges: aiAnalysis.resourcePriceChanges || {},
      
      // Metadata
      estimatedRevenue: aiAnalysis.estimatedRevenue || 0,
      estimatedCost: aiAnalysis.estimatedCost || 0,
      
      status: 'pending',
      votingDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      votes: { yes: 0, no: 0, abstain: 0 },
      sponsors: [],
    });
    
    // Consume action point
    await consumeActionPoints(player, req.apCost || 1);
    
    res.json({
      success: true,
      policy,
      actionsRemaining: player.actionsRemaining,
      aiAnalysis: {
        type: aiAnalysis.policyType,
        summary: aiAnalysis.summary,
        impacts: {
          economic: aiAnalysis.economicImpact,
          reputation: aiAnalysis.reputationImpact,
          resources: aiAnalysis.resourcePriceChanges,
        }
      }
    });
  } catch (error: any) {
    console.error('Policy submission error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/policies/:sessionId
 * Get all policies for a session
 */
router.get('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { status } = req.query;
    
    const filter: any = { sessionId };
    if (status) {
      filter.status = status;
    }
    
    const policies = await models.Policy.find(filter)
      .populate('proposedBy', 'username reputation')
      .sort({ createdAt: -1 })
      .lean();
    
    res.json({ policies });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/policies/detail/:policyId
 * Get detailed policy information
 */
router.get('/detail/:policyId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    
    const policy = await models.Policy.findById(policyId)
      .populate('proposedBy', 'username reputation ideology')
      .populate('sponsors', 'username')
      .lean();
    
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    res.json({ policy });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/policies/:policyId/vote
 * Vote on a policy
 */
router.post('/:policyId/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { playerId, vote } = req.body; // vote: 'yes' | 'no' | 'abstain'
    
    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Invalid vote type' });
    }
    
    const policy: any = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    // Check if policy is voteable (using 'proposed' status)
    if (policy.status !== 'proposed') {
      return res.status(400).json({ error: 'Policy voting is closed' });
    }
    
    // Check if already voted
    const hasVoted = policy.voters?.some((v: any) => v.playerId.toString() === playerId);
    if (hasVoted) {
      return res.status(400).json({ error: 'Already voted on this policy' });
    }
    
    // Record vote
    if (!policy.votes) {
      policy.votes = { yes: 0, no: 0, abstain: 0 };
    }
    policy.votes[vote as 'yes' | 'no' | 'abstain']++;
    
    if (!policy.voters) {
      policy.voters = [];
    }
    policy.voters.push({ playerId, vote, timestamp: new Date() });
    
    await policy.save();
    
    // Apply reputation impacts for the vote (if not abstaining)
    // Note: This applies immediate impacts. Full impacts applied when policy is enacted.
    let reputationImpactsApplied = 0;
    if (vote !== 'abstain') {
      const player: any = await models.Player.findById(playerId);
      
      if (player) {
        // Convert AI analysis to policy position
        const policyPosition = PolicyReputationService.convertAIPolicyToPolicyPosition(
          policy.aiAnalysis || {}
        );
        
        // Get current turn
        const session = await models.Session.findById(player.sessionId);
        const currentTurn = session?.currentTurn || 0;
        
        // Apply reputation impacts for this vote
        const role = vote === 'yes' ? 'yes-voter' : 'no-voter';
        const impacts = await PolicyReputationService.applyPolicyReputationImpacts(
          policyId,
          policyPosition,
          player.sessionId.toString(),
          currentTurn
        );
        
        reputationImpactsApplied = vote === 'yes' ? impacts.yesVoterImpacts : impacts.noVoterImpacts;
      }
    }
    
    res.json({ 
      success: true,
      votes: policy.votes,
      reputationImpactsApplied
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/policies/:policyId/sponsor
 * Sponsor a policy
 */
router.post('/:policyId/sponsor', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { playerId } = req.body;
    
    const policy: any = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    if (!policy.sponsors) {
      policy.sponsors = [];
    }
    
    if (policy.sponsors.some((s: any) => s.toString() === playerId)) {
      return res.status(400).json({ error: 'Already sponsoring this policy' });
    }
    
    policy.sponsors.push(playerId);
    await policy.save();
    
    res.json({ 
      success: true,
      sponsors: policy.sponsors.length 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/policies/:policyId/enact
 * Enact a passed policy (GM or automatic after vote passes)
 */
router.post('/:policyId/enact', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    
    const policy: any = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    // Check if policy is voteable (using 'proposed' status)
    if (policy.status !== 'proposed') {
      return res.status(400).json({ error: 'Policy already processed' });
    }
    
    // Check if policy passed
    const totalVotes = (policy.votes?.yes || 0) + (policy.votes?.no || 0);
    const yesPercentage = totalVotes > 0 ? (policy.votes?.yes || 0) / totalVotes : 0;
    
    if (yesPercentage < 0.5) {
      policy.status = 'repealed'; // Using 'repealed' for rejected policies
      await policy.save();
      return res.json({ success: false, message: 'Policy did not pass' });
    }
    
    // Apply policy effects
    if (policy.economicImpact) {
      // Apply economic changes to provinces
      for (const provinceId of policy.affectedProvinces || []) {
        const province = await models.Province.findById(provinceId);
        if (province && policy.economicImpact.gdpChange) {
          (province as any).gdp = ((province as any).gdp || 0) * (1 + policy.economicImpact.gdpChange);
          await province.save();
        }
      }
    }
    
    // Apply comprehensive reputation impacts (proposer gets full impact on enactment)
    const policyPosition = PolicyReputationService.convertAIPolicyToPolicyPosition(
      policy.aiAnalysis || {}
    );
    
    const session = await models.Session.findById((policy as any).sessionId);
    const currentTurn = session?.currentTurn || 0;
    
    // Apply proposer reputation impacts (highest weight)
    const proposerImpacts = await PolicyReputationService.applyPolicyReputationImpacts(
      policy._id.toString(),
      policyPosition,
      (policy as any).sessionId.toString(),
      currentTurn
    );
    
    if (policy.resourcePriceChanges) {
      // Apply resource price changes
      // TODO: Update market prices in Session model
    }
    
    policy.status = 'active'; // Using 'active' for enacted policies
    policy.enactedAt = new Date();
    await policy.save();
    
    // Check for policy supersession
    const supersessionResult = await PolicySupersessionService.checkSupersession(
      policy._id.toString(),
      (policy as any).sessionId.toString()
    );
    
    res.json({ 
      success: true, 
      message: 'Policy enacted successfully',
      supersession: supersessionResult,
      effects: {
        economic: policy.economicImpact,
        reputation: {
          oldSystem: policy.reputationImpact, // AI-estimated (legacy)
          newSystem: {
            proposerImpacts: proposerImpacts.proposerImpacts,
            yesVoterImpacts: proposerImpacts.yesVoterImpacts,
            noVoterImpacts: proposerImpacts.noVoterImpacts
          }
        },
        resources: policy.resourcePriceChanges,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/policies/active-modifiers/:sessionId
 * Get all currently active policy modifiers by category
 */
router.get('/active-modifiers/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const modifiers = await PolicySupersessionService.getActiveModifiers(sessionId);
    
    res.json({ 
      modifiers,
      message: 'Active policy modifiers (superseded policies excluded)'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/policies/supersession-history/:policyId
 * Get supersession chain for a policy
 */
router.get('/supersession-history/:policyId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    
    const history = await PolicySupersessionService.getSupersessionHistory(policyId);
    
    res.json(history);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/policies/:policyId/predict-impact
 * Predict reputation impacts of voting on a policy
 * Shows player what will happen to their reputation with top demographics
 */
router.post('/:policyId/predict-impact', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { policyId } = req.params;
    const { playerId, voteChoice } = req.body; // voteChoice: 'yes' | 'no' | 'abstain'
    
    if (!['yes', 'no', 'abstain'].includes(voteChoice)) {
      return res.status(400).json({ error: 'Invalid vote choice' });
    }
    
    const policy: any = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    // Abstain has no reputation impact
    if (voteChoice === 'abstain') {
      return res.json({ 
        predictions: [],
        message: 'Abstaining has no reputation impact'
      });
    }
    
    // Convert AI analysis to policy position
    const policyPosition = PolicyReputationService.convertAIPolicyToPolicyPosition(
      policy.aiAnalysis || {}
    );
    
    // Get predicted impacts for the chosen vote
    const role = voteChoice === 'yes' ? 'yes-voter' : 'no-voter';
    const predictions = await PolicyReputationService.predictPolicyImpacts(
      playerId,
      policyPosition,
      role
    );
    
    res.json({ 
      predictions,
      summary: {
        positiveImpacts: predictions.filter(p => p.predictedImpact > 0).length,
        negativeImpacts: predictions.filter(p => p.predictedImpact < 0).length,
        neutralImpacts: predictions.filter(p => p.predictedImpact === 0).length,
        totalPopulationShown: predictions.reduce((sum, p) => sum + p.demographic.population, 0)
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
