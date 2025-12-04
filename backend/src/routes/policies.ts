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

const router = Router();
const aiService = new AIService();

/**
 * POST /api/policies/submit
 * Submit a policy proposal in natural language
 * AI will extract structured data and calculate impacts
 * Cost: 1 AP
 */
router.post('/submit', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
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
    
    const policy = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    if (policy.status !== 'pending') {
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
    
    res.json({ 
      success: true,
      votes: policy.votes 
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
    
    const policy = await models.Policy.findById(policyId);
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
    
    const policy = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    if (policy.status !== 'pending') {
      return res.status(400).json({ error: 'Policy already processed' });
    }
    
    // Check if policy passed
    const totalVotes = (policy.votes?.yes || 0) + (policy.votes?.no || 0);
    const yesPercentage = totalVotes > 0 ? (policy.votes?.yes || 0) / totalVotes : 0;
    
    if (yesPercentage < 0.5) {
      policy.status = 'rejected';
      await policy.save();
      return res.json({ success: false, message: 'Policy did not pass' });
    }
    
    // Apply policy effects
    if (policy.economicImpact) {
      // Apply economic changes to provinces
      for (const provinceId of policy.affectedProvinces || []) {
        const province = await models.Province.findById(provinceId);
        if (province && policy.economicImpact.gdpChange) {
          province.gdp = (province.gdp || 0) * (1 + policy.economicImpact.gdpChange);
          await province.save();
        }
      }
    }
    
    if (policy.reputationImpact) {
      // Apply reputation changes to proposer
      const proposer = await models.Player.findById(policy.proposedBy);
      if (proposer) {
        for (const [group, change] of Object.entries(policy.reputationImpact)) {
          if (!proposer.reputation) proposer.reputation = {};
          proposer.reputation[group] = (proposer.reputation[group] || 50) + (change as number);
        }
        await proposer.save();
      }
    }
    
    if (policy.resourcePriceChanges) {
      // Apply resource price changes
      // TODO: Update market prices in Session model
    }
    
    policy.status = 'enacted';
    policy.enactedAt = new Date();
    await policy.save();
    
    res.json({ 
      success: true,
      message: 'Policy enacted successfully',
      effects: {
        economic: policy.economicImpact,
        reputation: policy.reputationImpact,
        resources: policy.resourcePriceChanges,
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
