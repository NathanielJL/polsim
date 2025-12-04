/**
 * Political Party & Faction System
 * 
 * 3 Factions (from Zealandia.txt):
 * 1. Loyalty League (Conservative)
 * 2. Miscegenation Block (Progressive)
 * 3. Broader Reform Faction (Moderate)
 * 
 * Players can create parties aligned with factions
 * Parties can fundraise, campaign, endorse candidates
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { 
  requireActionPoints, 
  consumeActionPoints,
  grantActionPoints,
  ActionPointRequest 
} from '../middleware/actionPoints';

const router = Router();

/**
 * GET /api/parties/:sessionId
 * Get all parties in session
 */
router.get('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const parties = await models.Party.find({ sessionId })
      .populate('leaderId', 'username')
      .populate('members', 'username')
      .lean();
    
    res.json({ parties });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties/create
 * Create a new political party
 * Cost: 1 AP
 */
router.post('/create', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
  try {
    const { playerId, sessionId, name, faction, platform } = req.body;
    
    if (!name || !faction) {
      return res.status(400).json({ error: 'Party name and faction required' });
    }
    
    const validFactions = ['Loyalty League', 'Miscegenation Block', 'Broader Reform Faction'];
    if (!validFactions.includes(faction)) {
      return res.status(400).json({ 
        error: 'Invalid faction',
        validFactions 
      });
    }
    
    const player = req.player;
    
    // Check if player already leads a party
    const existingParty = await models.Party.findOne({ 
      sessionId, 
      leaderId: playerId 
    });
    
    if (existingParty) {
      return res.status(400).json({ 
        error: 'You already lead a party',
        party: existingParty.name 
      });
    }
    
    const party = await models.Party.create({
      id: `party-${Date.now()}`,
      sessionId,
      name,
      faction,
      platform: platform || '',
      leaderId: playerId,
      members: [playerId],
      treasury: 0,
      founded: new Date(),
    });
    
    // Consume action point
    await consumeActionPoints(player, req.apCost || 1);
    
    res.json({ 
      success: true, 
      party,
      actionsRemaining: player.actionsRemaining
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties/join
 * Join a political party
 * Free action (0 AP)
 */
router.post('/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, partyId } = req.body;
    
    const party = await models.Party.findOne({ id: partyId });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Check if already a member
    if (party.members.some((m: any) => m.toString() === playerId)) {
      return res.status(400).json({ error: 'Already a party member' });
    }
    
    party.members.push(playerId);
    await party.save();
    
    res.json({ 
      success: true,
      party: party.name,
      memberCount: party.members.length
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties/leave
 * Leave a political party
 * Free action (0 AP)
 */
router.post('/leave', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, partyId } = req.body;
    
    const party = await models.Party.findOne({ id: partyId });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Can't leave if you're the leader
    if (party.leaderId?.toString() === playerId) {
      return res.status(400).json({ 
        error: 'Party leader cannot leave. Transfer leadership or dissolve party.' 
      });
    }
    
    party.members = party.members.filter((m: any) => m.toString() !== playerId);
    await party.save();
    
    res.json({ 
      success: true,
      message: `Left ${party.name}`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties/fundraise
 * Party fundraising (leader only)
 * Cost: 1 AP, but grants +3 AP bonus to leader
 */
router.post('/fundraise', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
  try {
    const { playerId, partyId } = req.body;
    
    const party = await models.Party.findOne({ id: partyId });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Must be party leader
    if (party.leaderId?.toString() !== playerId) {
      return res.status(403).json({ error: 'Only party leader can fundraise' });
    }
    
    const player = req.player;
    
    // Fundraising amount based on party size and faction
    const baseFunds = 1000; // £1,000 base
    const memberBonus = party.members.length * 100; // £100 per member
    const totalRaised = baseFunds + memberBonus;
    
    party.treasury = (party.treasury || 0) + totalRaised;
    await party.save();
    
    // Consume 1 AP, then grant +3 AP bonus
    await consumeActionPoints(player, 1);
    await grantActionPoints(playerId, 3);
    
    res.json({ 
      success: true,
      amountRaised: totalRaised,
      partyTreasury: party.treasury,
      actionsRemaining: player.actionsRemaining + 3, // Show net result
      message: `Raised £${totalRaised}. Party leader gains +3 AP bonus!`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties/campaign
 * Party campaign for a candidate
 * Cost: 1 AP, uses party treasury
 */
router.post('/campaign', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
  try {
    const { playerId, partyId, candidateId, provinceId } = req.body;
    
    const party = await models.Party.findOne({ id: partyId });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Must be party member
    if (!party.members.some((m: any) => m.toString() === playerId)) {
      return res.status(403).json({ error: 'Must be party member to campaign' });
    }
    
    const campaignCost = 500; // £500 per campaign
    if ((party.treasury || 0) < campaignCost) {
      return res.status(400).json({ 
        error: 'Insufficient party funds',
        required: campaignCost,
        available: party.treasury || 0
      });
    }
    
    const player = req.player;
    
    // Deduct from party treasury
    party.treasury -= campaignCost;
    await party.save();
    
    // Boost candidate reputation (future: integrate with reputation system)
    const candidate = await models.Player.findById(candidateId);
    if (candidate) {
      candidate.reputation = (candidate.reputation || 50) + 5; // +5 reputation boost
      await candidate.save();
    }
    
    // Consume action point
    await consumeActionPoints(player, req.apCost || 1);
    
    res.json({ 
      success: true,
      message: `Campaigned for ${candidate?.username || 'candidate'}`,
      costPaid: campaignCost,
      partyTreasury: party.treasury,
      reputationBoost: 5,
      actionsRemaining: player.actionsRemaining
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/parties/endorse
 * Party endorsement of a policy
 * Cost: 1 AP
 */
router.post('/endorse', authMiddleware, requireActionPoints(1), async (req: ActionPointRequest, res: Response) => {
  try {
    const { playerId, partyId, policyId } = req.body;
    
    const party = await models.Party.findOne({ id: partyId });
    if (!party) {
      return res.status(404).json({ error: 'Party not found' });
    }
    
    // Must be party leader
    if (party.leaderId?.toString() !== playerId) {
      return res.status(403).json({ error: 'Only party leader can endorse policies' });
    }
    
    const policy = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    const player = req.player;
    
    // Add party endorsement
    if (!policy.partyEndorsements) {
      policy.partyEndorsements = [];
    }
    
    if (!policy.partyEndorsements.includes(partyId)) {
      policy.partyEndorsements.push(partyId);
      await policy.save();
    }
    
    // Consume action point
    await consumeActionPoints(player, req.apCost || 1);
    
    res.json({ 
      success: true,
      message: `${party.name} endorsed "${policy.title}"`,
      actionsRemaining: player.actionsRemaining
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/parties/factions
 * Get information about the 3 factions
 */
router.get('/factions/info', async (req: Request, res: Response) => {
  const factions = [
    {
      name: 'Loyalty League',
      ideology: 'Conservative',
      platform: [
        'Maintain British sovereignty and loyalty to Crown',
        'Gradual, cautious reform only',
        'Property rights for established landowners',
        'Limited Māori political participation',
        'Fiscal conservatism and debt reduction'
      ],
      strongProvinces: ['Tasminata', 'Southland'],
      support: 'Landowners, British loyalists, fiscal conservatives'
    },
    {
      name: 'Miscegenation Block',
      ideology: 'Progressive',
      platform: [
        'Bi-cultural governance and Māori rights',
        'Enforce Treaty of Waitangi protections',
        'Expand suffrage beyond property owners',
        'Recognize mixed-heritage rights',
        'Social and land reform'
      ],
      strongProvinces: ['Vulteralia'],
      support: 'Mixed-heritage population, progressive reformers, Māori advocates'
    },
    {
      name: 'Broader Reform Faction',
      ideology: 'Moderate',
      platform: [
        'Balanced economic and social reform',
        'Provincial autonomy and self-governance',
        'Infrastructure development',
        'Compromise on bi-cultural issues',
        'Pragmatic policy approach'
      ],
      strongProvinces: ['New Zealand', 'Cooksland', 'New Caledonia'],
      support: 'Middle-class merchants, moderate reformers, provincial interests'
    }
  ];
  
  res.json({ factions });
});

export default router;
