/**
 * Turn Routes - Turn Management and Timer Control
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { TurnService } from '../services/TurnService';

const router = Router();
const turnService = new TurnService();

/**
 * GET /api/turns/info/:sessionId
 * Get current turn information
 */
router.get('/info/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const turnInfo = await turnService.getTurnInfo(sessionId);
    
    res.json(turnInfo);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/turns/initialize/:sessionId
 * Initialize turn system for a new session
 * GM only
 */
router.post('/initialize/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId, startDate } = req.body;
    
    // Check if user is GM
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const inGameStartDate = startDate ? new Date(startDate) : new Date('1854-06-01');
    
    const turnState = await turnService.initializeTurnSystem(sessionId, inGameStartDate);
    
    res.json({ 
      success: true,
      turnState,
      message: 'Turn system initialized. Turns will auto-process every 24 hours.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/turns/process/:sessionId
 * Manually trigger turn processing (GM override)
 * GM only
 */
router.post('/process/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check if user is GM
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    await turnService.processTurnEnd(sessionId);
    
    res.json({ 
      success: true,
      message: 'Turn processed successfully'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/turns/pause/:sessionId
 * Pause turn timer
 * GM only
 */
router.post('/pause/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check if user is GM
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    turnService.pauseTurn(sessionId);
    
    res.json({ 
      success: true,
      message: 'Turn timer paused'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/turns/resume/:sessionId
 * Resume turn timer
 * GM only
 */
router.post('/resume/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check if user is GM
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    turnService.resumeTurn(sessionId);
    
    res.json({ 
      success: true,
      message: 'Turn timer resumed'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
