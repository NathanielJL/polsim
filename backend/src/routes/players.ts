import { Router, Response } from 'express';
import { models } from '../models/mongoose';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/players/:playerId
 * Get player profile (public)
 */
router.get('/:playerId', async (req: AuthRequest, res: Response) => {
  try {
    const { playerId } = req.params;

    const player = await models.Player.findById(playerId).select('-password');
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json(player);
  } catch (error) {
    console.error('Get player error:', error);
    res.status(500).json({ error: 'Failed to fetch player' });
  }
});

/**
 * GET /api/players/me/profile
 * Get current player's profile (protected)
 */
router.get('/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const player = await models.Player.findById(req.playerId).select('-password');
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json(player);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

/**
 * PUT /api/players/me/profile
 * Update player profile (protected)
 */
router.put('/me/profile', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { bio, displayName } = req.body;

    const player = await models.Player.findByIdAndUpdate(
      req.playerId,
      {
        $set: {
          bio,
          displayName,
        },
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json(player);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/players/leaderboard
 * Get top players by overall reputation
 */
router.get('/leaderboard', async (req: AuthRequest, res: Response) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = parseInt(req.query.skip as string) || 0;

    const players = await models.Player.find()
      .select('-password')
      .sort({ overallApproval: -1 })
      .limit(limit)
      .skip(skip);

    const total = await models.Player.countDocuments();

    res.json({
      players,
      total,
      limit,
      skip,
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * GET /api/players/:playerId/reputation
 * Get detailed reputation breakdown for a player
 */
router.get('/:playerId/reputation', async (req: AuthRequest, res: Response) => {
  try {
    const { playerId } = req.params;

    const player = await models.Player.findById(playerId).select('approval overallApproval');
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    res.json({
      overall: player.overallApproval,
      byGroup: player.approval || {},
    });
  } catch (error) {
    console.error('Get reputation error:', error);
    res.status(500).json({ error: 'Failed to fetch reputation' });
  }
});

export default router;
