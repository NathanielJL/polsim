/**
 * POLSIM - DASHBOARD & TRADING ROUTES
 * 
 * API endpoints for player dashboard, trading, and game statistics
 */

import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { GameDashboardService } from '../services/GameDashboardService';
import { TradingService } from '../services/TradingService';
import { TurnScheduler } from '../services/TurnScheduler';
import { models } from '../models/mongoose';

const router = Router();
const dashboard = new GameDashboardService();
const trading = new TradingService();
const turnScheduler = new TurnScheduler();

/**
 * GET /api/dashboard/:sessionId
 * Get complete player dashboard
 */
router.get('/:sessionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const dashboardData = await dashboard.getPlayerDashboard(sessionId, req.playerId!);

    res.json(dashboardData);
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard' });
  }
});

/**
 * GET /api/dashboard/:sessionId/markets
 * Get market data (stocks and items)
 */
router.get('/:sessionId/markets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const marketData = await dashboard.getMarketData(sessionId);

    res.json(marketData);
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Failed to fetch market data' });
  }
});

/**
 * GET /api/dashboard/:sessionId/population
 * Get population sentiment by archetype
 */
router.get('/:sessionId/population', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const sentiment = await dashboard.getPopulationSentiment(sessionId);

    res.json(sentiment);
  } catch (error) {
    console.error('Get population error:', error);
    res.status(500).json({ error: 'Failed to fetch population data' });
  }
});

/**
 * GET /api/dashboard/:sessionId/economic-summary
 * Get economic overview
 */
router.get('/:sessionId/economic-summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const summary = await dashboard.getEconomicSummary(sessionId);

    res.json(summary);
  } catch (error) {
    console.error('Get economic summary error:', error);
    res.status(500).json({ error: 'Failed to fetch economic summary' });
  }
});

/**
 * GET /api/trading/:sessionId/portfolio
 * Get player portfolio
 */
router.get('/:sessionId/portfolio', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const portfolio = await trading.getPortfolio(sessionId, req.playerId!);

    res.json(portfolio);
  } catch (error) {
    console.error('Get portfolio error:', error);
    res.status(500).json({ error: 'Failed to fetch portfolio' });
  }
});

/**
 * GET /api/trading/:sessionId/returns
 * Get portfolio returns and P&L
 */
router.get('/:sessionId/returns', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const returns = await trading.calculateReturns(sessionId, req.playerId!);

    res.json(returns);
  } catch (error) {
    console.error('Get returns error:', error);
    res.status(500).json({ error: 'Failed to fetch returns' });
  }
});

/**
 * POST /api/trading/:sessionId/buy-stock
 * Buy stock market shares
 */
router.post('/:sessionId/buy-stock', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { stockMarketId, shares } = req.body;

    if (!stockMarketId || !shares) {
      res.status(400).json({ error: 'Stock market ID and shares required' });
      return;
    }

    const result = await trading.buyStock(sessionId, req.playerId!, stockMarketId, shares);

    res.json({
      success: true,
      message: 'Stock purchased successfully',
      ...result,
    });
  } catch (error) {
    console.error('Buy stock error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to buy stock' });
  }
});

/**
 * POST /api/trading/:sessionId/sell-stock
 * Sell stock market shares
 */
router.post('/:sessionId/sell-stock', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { stockMarketId, shares } = req.body;

    if (!stockMarketId || !shares) {
      res.status(400).json({ error: 'Stock market ID and shares required' });
      return;
    }

    const result = await trading.sellStock(sessionId, req.playerId!, stockMarketId, shares);

    res.json({
      success: true,
      message: 'Stock sold successfully',
      ...result,
    });
  } catch (error) {
    console.error('Sell stock error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to sell stock' });
  }
});

/**
 * POST /api/trading/:sessionId/buy-item
 * Buy market item (home, weapon, etc.)
 */
router.post('/:sessionId/buy-item', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { marketItemId, quantity } = req.body;

    if (!marketItemId || !quantity) {
      res.status(400).json({ error: 'Market item ID and quantity required' });
      return;
    }

    const result = await trading.buyMarketItem(sessionId, req.playerId!, marketItemId, quantity);

    res.json({
      success: true,
      message: 'Item purchased successfully',
      ...result,
    });
  } catch (error) {
    console.error('Buy item error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to buy item' });
  }
});

/**
 * POST /api/trading/:sessionId/sell-item
 * Sell market item
 */
router.post('/:sessionId/sell-item', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { marketItemId, quantity } = req.body;

    if (!marketItemId || !quantity) {
      res.status(400).json({ error: 'Market item ID and quantity required' });
      return;
    }

    const result = await trading.sellMarketItem(sessionId, req.playerId!, marketItemId, quantity);

    res.json({
      success: true,
      message: 'Item sold successfully',
      ...result,
    });
  } catch (error) {
    console.error('Sell item error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to sell item' });
  }
});

/**
 * GET /api/dashboard/:sessionId/turn-status
 * Get turn timer status
 */
router.get('/:sessionId/turn-status', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const turnStatus = await turnScheduler.getTurnStatus(sessionId);

    res.json(turnStatus);
  } catch (error) {
    console.error('Get turn status error:', error);
    res.status(500).json({ error: 'Failed to fetch turn status' });
  }
});

/**
 * POST /api/dashboard/:sessionId/toggle-auto-advance
 * Toggle auto-advance for session (GM only)
 */
router.post(
  '/:sessionId/toggle-auto-advance',
  authMiddleware,
  async (req: AuthRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const { enabled } = req.body;

      // Verify GM
      const session = await models.Session.findById(sessionId);
      if (!session) {
        res.status(404).json({ error: 'Session not found' });
        return;
      }

      if (session.gamemaster?.toString() !== req.playerId) {
        res.status(403).json({ error: 'Only game master can toggle auto-advance' });
        return;
      }

      await turnScheduler.toggleAutoAdvance(sessionId, enabled);

      res.json({
        success: true,
        message: `Auto-advance ${enabled ? 'enabled' : 'disabled'}`,
        autoAdvanceEnabled: enabled,
      });
    } catch (error) {
      console.error('Toggle auto-advance error:', error);
      res.status(500).json({ error: 'Failed to toggle auto-advance' });
    }
  }
);

export default router;
