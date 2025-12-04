/**
 * Action Routes - Track Player Actions and AP Usage
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { 
  getActionPoints, 
  resetActionPoints,
  logAction 
} from '../middleware/actionPoints';

const router = Router();

/**
 * GET /api/actions/remaining/:playerId
 * Get remaining action points for a player
 */
router.get('/remaining/:playerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    
    const ap = await getActionPoints(playerId);
    
    res.json({ 
      actionsRemaining: ap,
      maxActions: 5 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/actions/history/:playerId
 * Get action history for a player (current turn)
 */
router.get('/history/:playerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    const { limit = 20, turn } = req.query;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const filter: any = { playerId };
    if (turn) {
      filter.turn = Number(turn);
    }
    
    const actions = await models.Action.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .lean();
    
    res.json({ 
      actions,
      totalActions: actions.length,
      actionsRemaining: player.actionsRemaining || 5
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/actions/session/:sessionId
 * Get all actions for a session (GM view)
 */
router.get('/session/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { turn, playerId, limit = 100 } = req.query;
    
    const filter: any = { sessionId };
    if (turn) filter.turn = Number(turn);
    if (playerId) filter.playerId = playerId;
    
    const actions = await models.Action.find(filter)
      .sort({ timestamp: -1 })
      .limit(Number(limit))
      .populate('playerId', 'username')
      .lean();
    
    res.json({ actions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/actions/reset/:sessionId
 * Reset all player action points (called on turn change)
 * GM only
 */
router.post('/reset/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check if user is GM
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const resetCount = await resetActionPoints(sessionId);
    
    res.json({ 
      success: true,
      message: `Reset action points for ${resetCount} players`,
      playersReset: resetCount
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/actions/costs
 * Get reference list of action point costs
 */
router.get('/costs', async (req: Request, res: Response) => {
  const costs = {
    'move_province': 1,
    'invest': 1,
    'business_investment': 1,
    'submit_policy': 1,
    'campaign': 1,
    'endorse': 1,
    'bar_exam': 1,
    'party_fundraise': 1, // +3 AP bonus if party leader
    'vote_policy': 0,
    'court_case': 0,
    'debate': 0,
    'view_dashboard': 0,
    'create_business': 1,
    'create_newspaper': 1,
  };
  
  res.json({ 
    costs,
    maxActionsPerTurn: 5,
    resetFrequency: '24 hours (1.2 in-game months)',
    bonuses: {
      'party_leader_fundraise': '+3 AP'
    }
  });
});

export default router;
