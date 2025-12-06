import { Router, Response } from 'express';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { GameInitializationService } from '../services/GameInitializationService';
import { GameSimulationEngine } from '../services/GameSimulationEngine';
import { ActionQueueManager } from '../services/ActionQueueManager';
import { models } from '../models/mongoose';

const router = Router();
const gameInit = new GameInitializationService();
const gameEngine = new GameSimulationEngine();
const actionQueue = new ActionQueueManager();

/**
 * POST /api/sessions
 * Create a new game session (start a new game)
 * Can be single-player (just GM) or multiplayer (GM + players)
 */
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionName, playerIds } = req.body;

    if (!sessionName) {
      res.status(400).json({ error: 'Session name is required' });
      return;
    }

    const session = await gameInit.createGameSession(
      req.playerId!,
      sessionName,
      playerIds || []
    );

    res.status(201).json({
      message: 'Game session created successfully',
      session: {
        id: session._id,
        name: session.name,
        gamemaster: session.gamemaster,
        players: session.players,
        currentTurn: session.currentTurn,
        startedAt: session.startedAt,
        status: session.status,
        world: {
          numProvinces: session.world.provinces.length,
          numMarkets: session.world.markets.length,
          numPopulationGroups: session.world.populationGroups.length,
        },
      },
    });
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Failed to create game session' });
  }
});

/**
 * GET /api/sessions/current
 * Get current active game session for player
 */
router.get('/current', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    console.log('🔵 Getting current session for player:', req.playerId);
    const session = await gameInit.getGameSession(req.playerId!);

    if (!session) {
      console.log('❌ No session found for player:', req.playerId);
      res.status(404).json({ error: 'No active game session found' });
      return;
    }

    console.log('✅ Session found:', session.name);

    res.json({
      id: session._id,
      name: session.name,
      currentTurn: session.currentTurn,
      startedAt: session.startedAt,
      turnEndTime: session.turnEndTime,
      world: {
        numProvinces: session.world.provinces.length,
        numMarkets: session.world.markets.length,
        numPopulationGroups: session.world.populationGroups.length,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch game session' });
  }
});

/**
 * GET /api/sessions/:sessionId
 * Get specific game session details
 */
router.get('/:sessionId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await gameInit.getGameSession(req.playerId!, sessionId);

    if (!session) {
      res.status(404).json({ error: 'Game session not found' });
      return;
    }

    res.json({
      id: session._id,
      name: session.name,
      currentTurn: session.currentTurn,
      startedAt: session.startedAt,
      turnEndTime: session.turnEndTime,
      world: {
        numProvinces: session.world.provinces.length,
        numMarkets: session.world.markets.length,
        numPopulationGroups: session.world.populationGroups.length,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch game session' });
  }
});

/**
 * GET /api/sessions/:sessionId/world
 * Get world data (provinces, markets, population groups, companies)
 */
router.get('/:sessionId/world', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const world = await gameInit.getWorldData(sessionId);

    res.json(world);
  } catch (error) {
    console.error('Get world error:', error);
    res.status(500).json({ error: 'Failed to fetch world data' });
  }
});

/**
 * GET /api/sessions/:sessionId/markets
 * Get all markets in session
 */
router.get('/:sessionId/markets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const markets = await gameInit.getMarkets(sessionId);

    res.json(markets);
  } catch (error) {
    console.error('Get markets error:', error);
    res.status(500).json({ error: 'Failed to fetch markets' });
  }
});

/**
 * GET /api/sessions/:sessionId/population-groups
 * Get all population groups in session
 */
router.get('/:sessionId/population-groups', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const groups = await gameInit.getPopulationGroups(sessionId);

    res.json(groups);
  } catch (error) {
    console.error('Get population groups error:', error);
    res.status(500).json({ error: 'Failed to fetch population groups' });
  }
});

/**
 * GET /api/sessions/:sessionId/companies
 * Get all companies in session
 */
router.get('/:sessionId/companies', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const companies = await gameInit.getCompanies(sessionId);

    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ error: 'Failed to fetch companies' });
  }
});

/**
 * GET /api/sessions/:sessionId/game-state
 * Get current game state (markets, events, stability, etc.)
 */
router.get('/:sessionId/game-state', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await models.Session.findById(sessionId);
    const gameState = await models.GameState.findOne({ sessionId });

    if (!session || !gameState) {
      res.status(404).json({ error: 'Session or game state not found' });
      return;
    }

    res.json({
      turn: session.currentTurn,
      sessionName: session.name,
      economicIndex: gameState.economicIndex,
      socialStability: gameState.socialStability,
      politicalStability: gameState.politicalStability,
      turnStartTime: session.turnStartTime,
      turnEndTime: session.turnEndTime,
      recentEvents: gameState.globalEvents.slice(-5),
    });
  } catch (error) {
    console.error('Get game state error:', error);
    res.status(500).json({ error: 'Failed to fetch game state' });
  }
});

/**
 * POST /api/sessions/:sessionId/advance-turn
 * Execute next turn (run full turn cycle)
 * GM only - can be called anytime
 */
router.post('/:sessionId/advance-turn', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await models.Session.findById(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check if player is the GM
    if (session.gamemaster?.toString() !== req.playerId) {
      res.status(403).json({ error: 'Only game master can advance turn' });
      return;
    }

    // Execute full turn
    await gameEngine.executeTurn(sessionId);

    // Clear processed actions
    await actionQueue.clearProcessedActions(sessionId, session.currentTurn);

    // Fetch updated game state
    const updatedSession = await models.Session.findById(sessionId);
    const updatedGameState = await models.GameState.findOne({ sessionId });

    res.json({
      message: 'Turn executed successfully',
      turn: updatedSession?.currentTurn,
      state: {
        economicIndex: updatedGameState?.economicIndex,
        socialStability: updatedGameState?.socialStability,
        politicalStability: updatedGameState?.politicalStability,
        turnEndTime: updatedSession?.turnEndTime,
      },
    });
  } catch (error) {
    console.error('Advance turn error:', error);
    res.status(500).json({ error: 'Failed to advance turn' });
  }
});

/**
 * POST /api/sessions/:sessionId/actions
 * Submit a new action
 */
router.post('/:sessionId/actions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { actionType, details } = req.body;

    if (!actionType || !details) {
      res.status(400).json({ error: 'Action type and details required' });
      return;
    }

    const actionId = await actionQueue.submitAction(
      sessionId,
      req.playerId!,
      actionType,
      details
    );

    res.status(201).json({
      message: 'Action submitted successfully',
      actionId,
    });
  } catch (error) {
    console.error('Submit action error:', error);
    res.status(400).json({ error: (error as Error).message || 'Failed to submit action' });
  }
});

/**
 * GET /api/sessions/:sessionId/actions/remaining
 * Get remaining actions for current player this turn
 */
router.get('/:sessionId/actions/remaining', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const remaining = await actionQueue.getRemainingActionsForPlayer(sessionId, req.playerId!);
    const summary = await actionQueue.getPlayerActionSummary(sessionId, req.playerId!);

    res.json({
      remaining,
      ...summary,
    });
  } catch (error) {
    console.error('Get remaining actions error:', error);
    res.status(500).json({ error: 'Failed to fetch action status' });
  }
});

/**
 * GET /api/sessions/:sessionId/actions
 * Get all pending actions for current turn
 */
router.get('/:sessionId/actions', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const actions = await actionQueue.getActionsForTurn(sessionId);

    res.json(actions.map((a: any) => ({
      id: a._id,
      playerId: a.playerId.username,
      type: a.type,
      details: a.details,
      turn: a.turn,
      submitted: a.submitted,
    })));
  } catch (error) {
    console.error('Get actions error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

/**
 * GET /api/sessions/:sessionId/events/pending
 * Get pending events awaiting GM approval
 */
router.get('/:sessionId/events/pending', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await models.Session.findById(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check if player is GM
    if (session.gamemaster?.toString() !== req.playerId) {
      res.status(403).json({ error: 'Only game master can view pending events' });
      return;
    }

    const pendingEvents = await models.Event.find({
      _id: { $in: session.pendingEvents },
    });

    res.json(pendingEvents);
  } catch (error) {
    console.error('Get pending events error:', error);
    res.status(500).json({ error: 'Failed to fetch pending events' });
  }
});

/**
 * POST /api/sessions/:sessionId/events/:eventId/approve
 * GM approves an event (moves to approved list)
 */
router.post('/:sessionId/events/:eventId/approve', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, eventId } = req.params;
    const session = await models.Session.findById(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check if player is GM
    if (session.gamemaster?.toString() !== req.playerId) {
      res.status(403).json({ error: 'Only game master can approve events' });
      return;
    }

    // Move event from pending to approved
    if (session.pendingEvents) {
      session.pendingEvents = session.pendingEvents.filter(
        (id: any) => id.toString() !== eventId
      );
    }
    
    if (!session.approvedEvents) session.approvedEvents = [];
    session.approvedEvents.push(eventId);
    
    await session.save();

    // Mark event as approved in Event model
    await models.Event.findByIdAndUpdate(eventId, { gmApproved: true });

    res.json({ message: 'Event approved successfully' });
  } catch (error) {
    console.error('Approve event error:', error);
    res.status(500).json({ error: 'Failed to approve event' });
  }
});

/**
 * POST /api/sessions/:sessionId/events/:eventId/reject
 * GM rejects an event (removes it)
 */
router.post('/:sessionId/events/:eventId/reject', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, eventId } = req.params;
    const session = await models.Session.findById(sessionId);

    if (!session) {
      res.status(404).json({ error: 'Session not found' });
      return;
    }

    // Check if player is GM
    if (session.gamemaster?.toString() !== req.playerId) {
      res.status(403).json({ error: 'Only game master can reject events' });
      return;
    }

    // Remove event from pending
    if (session.pendingEvents) {
      session.pendingEvents = session.pendingEvents.filter(
        (id: any) => id.toString() !== eventId
      );
    }
    
    await session.save();

    // Delete event
    await models.Event.findByIdAndDelete(eventId);

    res.json({ message: 'Event rejected and removed' });
  } catch (error) {
    console.error('Reject event error:', error);
    res.status(500).json({ error: 'Failed to reject event' });
  }
});

/**
 * GET /api/sessions/:sessionId/stock-markets
 * Get all stock markets for session
 */
router.get('/:sessionId/stock-markets', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const stockMarkets = await models.StockMarket.find({ sessionId });

    res.json(stockMarkets);
  } catch (error) {
    console.error('Get stock markets error:', error);
    res.status(500).json({ error: 'Failed to fetch stock markets' });
  }
});

/**
 * GET /api/sessions/:sessionId/market-items
 * Get all tradeable market items
 */
router.get('/:sessionId/market-items', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const marketItems = await models.MarketItem.find({ sessionId });

    res.json(marketItems);
  } catch (error) {
    console.error('Get market items error:', error);
    res.status(500).json({ error: 'Failed to fetch market items' });
  }
});

export default router;


