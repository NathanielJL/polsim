/**
 * Elections & Voting Routes
 * Handles candidacy, campaigns, voting, and election results
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// =======================
// CANDIDACY
// =======================

/**
 * POST /api/elections/declare-candidacy
 * Player declares candidacy for an office
 */
router.post('/declare-candidacy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, electionId, platform } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.isCandidate) {
      return res.status(400).json({ error: 'Already running for office' });
    }
    
    const election = await models.Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    if (election.status !== 'announced' && election.status !== 'campaigning') {
      return res.status(400).json({ error: 'Election not accepting candidates' });
    }
    
    // Add candidate to election
    election.candidates.push({
      playerId: player._id as any,
      platform: platform || 'Working for the people',
      ideology: { economic: 0, social: 0, personal: 0 }, // TODO: Get from player
      endorsements: [],
      fundingRaised: 0,
    });
    
    if (election.status === 'announced') {
      election.status = 'campaigning';
    }
    
    await election.save();
    
    // Update player
    player.isCandidate = true;
    player.candidacyFor = electionId;
    await player.save();
    
    res.json({ 
      success: true, 
      message: `${player.username} is now running for ${election.officeType}`,
      election 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/elections/withdraw-candidacy
 * Player withdraws from race
 */
router.post('/withdraw-candidacy', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player || !player.isCandidate) {
      return res.status(400).json({ error: 'Not a candidate' });
    }
    
    const election = await models.Election.findById(player.candidacyFor);
    if (election) {
      election.candidates = election.candidates.filter(
        c => c.playerId.toString() !== playerId
      );
      await election.save();
    }
    
    player.isCandidate = false;
    player.candidacyFor = undefined;
    await player.save();
    
    res.json({ success: true, message: 'Withdrawn from race' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// CAMPAIGNS
// =======================

/**
 * POST /api/elections/donate-to-campaign
 * Donate to a candidate's campaign
 */
router.post('/donate-to-campaign', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { donorId, electionId, candidateId, amount } = req.body;
    
    const donor = await models.Player.findById(donorId);
    if (!donor || donor.cash < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    const election = await models.Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    const candidate = election.candidates.find(c => c.playerId.toString() === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Transfer funds
    donor.cash -= amount;
    await donor.save();
    
    candidate.fundingRaised += amount;
    await election.save();
    
    res.json({ 
      success: true, 
      message: `Donated £${amount} to campaign`,
      newBalance: donor.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/elections/endorse
 * Endorse a candidate
 */
router.post('/endorse', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { endorserId, electionId, candidateId } = req.body;
    
    const endorser = await models.Player.findById(endorserId);
    if (!endorser) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const election = await models.Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    const candidate = election.candidates.find(c => c.playerId.toString() === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    if (candidate.endorsements.includes(endorserId as any)) {
      return res.status(400).json({ error: 'Already endorsed' });
    }
    
    candidate.endorsements.push(endorserId as any);
    await election.save();
    
    res.json({ 
      success: true, 
      message: `${endorser.username} endorsed candidate`,
      endorsements: candidate.endorsements.length 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// VOTING
// =======================

/**
 * POST /api/elections/vote
 * Cast vote in election
 */
router.post('/vote', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { voterId, electionId, candidateId, sessionId } = req.body;
    
    const election = await models.Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    if (!election.votingOpen) {
      return res.status(400).json({ error: 'Voting not open' });
    }
    
    // Check if already voted
    const existingVote = await models.Vote.findOne({ 
      voterId, 
      electionId,
      sessionId 
    });
    
    if (existingVote) {
      return res.status(400).json({ error: 'Already voted' });
    }
    
    // Verify candidate exists
    const candidate = election.candidates.find(c => c.playerId.toString() === candidateId);
    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }
    
    // Get current turn
    const session = await models.Session.findById(sessionId);
    const currentTurn = session?.currentTurn || 0;
    
    // Record vote
    await models.Vote.create({
      id: `vote-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      voterId,
      isNPC: false,
      electionId,
      choice: candidateId,
      turn: currentTurn,
    });
    
    res.json({ 
      success: true, 
      message: 'Vote recorded',
      election: electionId 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/elections/open-voting
 * GM opens voting period
 */
router.post('/open-voting', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { electionId, durationTurns } = req.body;
    
    // TODO: Add GM check
    
    const election = await models.Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    election.votingOpen = true;
    election.status = 'voting';
    
    // Set voting close date
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + (durationTurns || 3));
    election.votingCloses = closeDate;
    
    await election.save();
    
    res.json({ 
      success: true, 
      message: 'Voting is now open',
      votingCloses: election.votingCloses 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/elections/tally-votes
 * Count votes and determine winner (includes NPC voting)
 */
router.post('/tally-votes', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { electionId, sessionId } = req.body;
    
    const election = await models.Election.findById(electionId);
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    // Get player votes
    const playerVotes = await models.Vote.find({ 
      electionId, 
      sessionId,
      isNPC: false 
    });
    
    // Calculate NPC votes based on ideology alignment
    const province = await models.Province.findById(election.provinceId);
    const npcVoteWeight = province ? province.population || 1000 : 1000;
    
    // Vote breakdown
    const voteCount = new Map<string, number>();
    
    // Count player votes
    playerVotes.forEach(vote => {
      const candidateId = vote.choice;
      voteCount.set(candidateId, (voteCount.get(candidateId) || 0) + 1);
    });
    
    // Simulate NPC votes (weighted by population)
    // Simple model: Split based on number of candidates + some randomness
    const numCandidates = election.candidates.length;
    
    if (numCandidates > 0) {
      const baseNPCVotes = Math.floor(npcVoteWeight / numCandidates);
      
      election.candidates.forEach(candidate => {
        const candidateId = candidate.playerId.toString();
        
        // Add base votes + random variation (±20%)
        const variation = Math.random() * 0.4 - 0.2; // -20% to +20%
        const npcVotes = Math.round(baseNPCVotes * (1 + variation));
        
        voteCount.set(candidateId, (voteCount.get(candidateId) || 0) + npcVotes);
      });
    }
    
    // Determine winner
    let winner = '';
    let maxVotes = 0;
    
    voteCount.forEach((votes, candidateId) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winner = candidateId;
      }
    });
    
    // Calculate turnout
    const totalVotes = Array.from(voteCount.values()).reduce((sum, v) => sum + v, 0);
    const turnout = ((totalVotes / (playerVotes.length + npcVoteWeight)) * 100);
    
    // Update election
    election.results = {
      winner: winner as any,
      voteBreakdown: voteCount,
      turnout: Math.round(turnout),
    };
    election.status = 'completed';
    election.votingOpen = false;
    
    await election.save();
    
    // Update winner's player record
    const winningPlayer = await models.Player.findById(winner);
    if (winningPlayer) {
      winningPlayer.isCandidate = false;
      winningPlayer.candidacyFor = undefined;
      
      if (!winningPlayer.electionHistory) {
        winningPlayer.electionHistory = [];
      }
      
      winningPlayer.electionHistory.push({
        electionId: election.id,
        office: election.officeType,
        won: true,
        votes: maxVotes,
        turn: (await models.Session.findById(sessionId))?.currentTurn || 0,
      } as any);
      
      await winningPlayer.save();
    }
    
    // Update losing candidates
    for (const candidate of election.candidates) {
      if (candidate.playerId.toString() !== winner) {
        const loser = await models.Player.findById(candidate.playerId);
        if (loser) {
          loser.isCandidate = false;
          loser.candidacyFor = undefined;
          
          if (!loser.electionHistory) {
            loser.electionHistory = [];
          }
          
          loser.electionHistory.push({
            electionId: election.id,
            office: election.officeType,
            won: false,
            votes: voteCount.get(candidate.playerId.toString()) || 0,
            turn: (await models.Session.findById(sessionId))?.currentTurn || 0,
          } as any);
          
          await loser.save();
        }
      }
    }
    
    res.json({ 
      success: true, 
      results: election.results,
      winner: winningPlayer?.username,
      totalVotes 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// QUERY
// =======================

/**
 * GET /api/elections/:sessionId
 * Get all elections for session
 */
router.get('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const elections = await models.Election.find({ sessionId })
      .populate('candidates.playerId', 'username reputation')
      .populate('results.winner', 'username')
      .sort('-createdAt')
      .lean();
    
    res.json({ elections });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/elections/election/:id
 * Get specific election details
 */
router.get('/election/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const election = await models.Election.findById(id)
      .populate('candidates.playerId', 'username reputation')
      .populate('candidates.endorsements', 'username')
      .populate('results.winner', 'username')
      .lean();
    
    if (!election) {
      return res.status(404).json({ error: 'Election not found' });
    }
    
    res.json({ election });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/elections/offices/:sessionId
 * Get all offices for session
 */
router.get('/offices/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const offices = await models.Office.find({ sessionId })
      .populate('currentHolder', 'username reputation')
      .lean();
    
    res.json({ offices });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
