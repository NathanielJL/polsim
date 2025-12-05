/**
 * Action Point Middleware
 * Tracks and enforces action point costs for player actions
 * 
 * Players get 5 AP per turn (+ party bonuses). Actions cost:
 * - Move provinces: 1 AP
 * - Invest/Business investment: 1 AP
 * - Submit policy: FREE (0 AP)
 * - Campaign/endorse: 1 AP
 * - Bar exam: 1 AP
 * - Party fundraising: 1 AP (adds £50 to party fund)
 * - Party campaign: 1 AP (£300, random 3 groups, 1-12 turns, +1-5% boost)
 * - Create party: 1 AP (£250)
 * - Create newspaper: 1 AP (£100)
 * - Explore resources: 2 AP (£400)
 * - Vote on policy: 0 AP
 * - Court case/debate: 0 AP
 * 
 * Party Leader: +3 AP per turn (automatic)
 * Second Party Leader: +2 AP per turn (automatic)
 */

import { Request, Response, NextFunction } from 'express';
import { models } from '../models/mongoose';

export interface ActionPointRequest extends Request {
  apCost?: number;
  player?: any;
}

/**
 * Middleware to check if player has enough AP for an action
 */
export const requireActionPoints = (cost: number) => {
  return async (req: ActionPointRequest, res: Response, next: NextFunction) => {
    try {
      const playerId = req.body.playerId || req.query.playerId;
      
      if (!playerId) {
        return res.status(400).json({ error: 'Player ID required' });
      }
      
      const player = await models.Player.findById(playerId);
      
      if (!player) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      // Check if player has enough AP
      const currentAP = player.actionsRemaining || 5;
      
      if (currentAP < cost) {
        return res.status(403).json({ 
          error: 'Insufficient action points',
          required: cost,
          available: currentAP,
          message: `This action requires ${cost} AP, but you only have ${currentAP} AP remaining this turn.`
        });
      }
      
      // Attach player and AP cost to request for consumption after action succeeds
      req.player = player;
      req.apCost = cost;
      
      next();
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  };
};

/**
 * Consume action points after successful action
 * Call this at the end of route handlers
 */
export const consumeActionPoints = async (
  player: any,
  cost: number
): Promise<void> => {
  if (cost > 0) {
    player.actionsRemaining = Math.max(0, (player.actionsRemaining || 5) - cost);
    await player.save();
  }
};

/**
 * Grant bonus action points (e.g., party leader fundraising)
 */
export const grantActionPoints = async (
  playerId: string,
  bonus: number
): Promise<number> => {
  const player = await models.Player.findById(playerId);
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  player.actionsRemaining = (player.actionsRemaining || 5) + bonus;
  await player.save();
  
  return player.actionsRemaining;
};

/**
 * Reset action points for all players in a session (called on turn change)
 */
export const resetActionPoints = async (sessionId: string): Promise<number> => {
  const result = await models.Player.updateMany(
    { sessionId },
    { $set: { actionsRemaining: 5 } }
  );
  
  return result.modifiedCount;
};

/**
 * Get current AP for a player
 */
export const getActionPoints = async (playerId: string): Promise<number> => {
  const player = await models.Player.findById(playerId);
  
  if (!player) {
    throw new Error('Player not found');
  }
  
  return player.actionsRemaining || 5;
};

/**
 * Middleware for free actions (0 AP cost, but still tracks action)
 */
export const freeAction = async (req: ActionPointRequest, res: Response, next: NextFunction) => {
  const playerId = req.body.playerId || req.query.playerId;
  
  if (playerId) {
    const player = await models.Player.findById(playerId);
    req.player = player;
    req.apCost = 0;
  }
  
  next();
};

/**
 * Log action to Action model (for turn history)
 */
export const logAction = async (
  playerId: string,
  sessionId: string,
  actionType: string,
  details: any,
  apCost: number
): Promise<void> => {
  await models.Action.create({
    playerId,
    sessionId,
    actionType,
    details,
    apCost,
    timestamp: new Date(),
  });
};
