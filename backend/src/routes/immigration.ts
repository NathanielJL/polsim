/**
 * Immigration Routes
 * API for immigration statistics and GM event-triggered immigration
 */

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/auth';
import ImmigrationService from '../services/ImmigrationService';
import { models } from '../models/mongoose';

const router = Router();

/**
 * GET /api/immigration/stats/:sessionId
 * Get immigration statistics and projections
 */
router.get('/stats/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const stats = await ImmigrationService.getImmigrationStats(sessionId);
    
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/immigration/event
 * Trigger event-driven immigration (GM only)
 * Examples: Irish Potato Famine (+5000 Irish), Gold Rush (+2000 miners), War refugees
 */
router.post('/event', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      gmId, 
      sessionId, 
      eventId, 
      immigrants, 
      culturalMakeup, 
      targetProvinces 
    } = req.body;
    
    // Check if user is GM
    const gm = await models.Player.findById(gmId);
    if (!gm || !gm.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const result = await ImmigrationService.processEventImmigration(
      sessionId,
      eventId,
      immigrants,
      culturalMakeup,
      targetProvinces
    );
    
    res.json({ 
      success: true,
      ...result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/immigration/forecast/:sessionId
 * Get next year's immigration forecast
 */
router.get('/forecast/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const stats = await ImmigrationService.getImmigrationStats(sessionId);
    
    res.json({
      expectedImmigrants: stats.expectedNextYear,
      baseRate: stats.baseAnnualRate,
      policyModifier: stats.policyModifier,
      modifiedRate: stats.modifiedAnnualRate,
      affectingPolicies: stats.activePolicies
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
