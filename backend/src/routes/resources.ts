/**
 * Resource Exploration System
 * 
 * Players can explore provinces for hidden resources (gold, silver, copper, etc.)
 * Discoveries trigger GM events and update market data
 * Probability-based with technology modifiers
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { requireActionPoints, consumeActionPoints } from '../middleware/actionPoints';

const router = Router();

/**
 * POST /api/resources/explore
 * Explore a province for hidden resources (1 AP)
 */
router.post('/explore', authMiddleware, requireActionPoints(1), async (req: Request, res: Response) => {
  try {
    const { playerId, provinceId } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    const province = await models.Province.findById(provinceId);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    // Check if player is in the province
    if (player.provinceId?.toString() !== provinceId) {
      return res.status(400).json({ 
        error: 'Must be in province to explore',
        currentProvince: player.provinceId,
        targetProvince: provinceId
      });
    }
    
    // Check if player has already explored this province this turn
    const session = await models.Session.findById(player.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const explorationKey = `exploration_${provinceId}_${session.currentTurn}`;
    const recentExploration = await models.Player.findOne({
      _id: playerId,
      [`metadata.${explorationKey}`]: { $exists: true }
    });
    
    if (recentExploration) {
      return res.status(400).json({ 
        error: 'Already explored this province this turn',
        nextExploration: `Turn ${session.currentTurn + 1}`
      });
    }
    
    // Base discovery probability: 5%
    let baseProbability = 0.05;
    
    // Technology modifiers
    const techModifiers = {
      'geological_survey': 0.10, // +10% if player has surveying tech
      'advanced_mining': 0.05,   // +5% if player has mining tech
      'metallurgy': 0.03         // +3% if player has metallurgy
    };
    
    // Check player's technologies (if implemented)
    const playerTech = player.technologies || [];
    for (const tech of playerTech) {
      if (techModifiers[tech as keyof typeof techModifiers]) {
        baseProbability += techModifiers[tech as keyof typeof techModifiers];
      }
    }
    
    // Check if province has hidden resources
    const hiddenResources = province.hiddenResources || [];
    
    if (hiddenResources.length === 0) {
      // Consume AP but no discovery
      await consumeActionPoints(player, 1);
      
      // Mark exploration
      if (!player.metadata) player.metadata = {};
      player.metadata[explorationKey] = true;
      await player.save();
      
      return res.json({ 
        success: true,
        discovered: false,
        message: 'Exploration complete. No significant deposits found.',
        probability: (baseProbability * 100).toFixed(1) + '%'
      });
    }
    
    // Roll for discovery
    const roll = Math.random();
    
    if (roll < baseProbability) {
      // Discovery!
      const discoveredResource = hiddenResources[0]; // Take first hidden resource
      
      // Remove from hidden, add to known resources
      province.hiddenResources = hiddenResources.filter((r: string) => r !== discoveredResource);
      if (!province.resources) province.resources = [];
      province.resources.push(discoveredResource);
      await province.save();
      
      // Create GM event for the discovery
      await models.Event.create({
        id: `event-discovery-${Date.now()}`,
        sessionId: player.sessionId,
        title: `Major ${discoveredResource.charAt(0).toUpperCase() + discoveredResource.slice(1)} Discovery in ${province.name}`,
        description: `${player.username} has discovered significant ${discoveredResource} deposits in ${province.name}! This could transform the province's economy and attract new settlers.`,
        severity: 7,
        type: 'resource_discovery',
        duration: 5,
        affectedGroups: ['investors', 'miners', 'provincial_government'],
        gdpImpact: 0.15, // +15% GDP growth
        triggeredBy: playerId.toString(),
        gmApproved: true, // Auto-approve resource discoveries
        turnCreated: session.currentTurn,
        turnEnds: session.currentTurn + 5
      });
      
      // Update market data for the resource
      const market = await models.Market.findOne({ sessionId: player.sessionId });
      if (market && market.resources) {
        const resourceData = market.resources.get(discoveredResource);
        if (resourceData) {
          // Increase supply, decrease price (20% drop)
          resourceData.supply = (resourceData.supply || 0) + 1000;
          resourceData.basePrice = resourceData.basePrice * 0.80;
          market.resources.set(discoveredResource, resourceData);
          await market.save();
        }
      }
      
      // Grant reputation bonus
      player.reputation = (player.reputation || 50) + 10;
      
      // Consume AP and mark exploration
      await consumeActionPoints(player, 1);
      if (!player.metadata) player.metadata = {};
      player.metadata[explorationKey] = true;
      await player.save();
      
      return res.json({ 
        success: true,
        discovered: true,
        resource: discoveredResource,
        message: `Major discovery! You found ${discoveredResource} deposits in ${province.name}!`,
        reputationGain: 10,
        economicImpact: '+15% provincial GDP over 5 turns'
      });
    } else {
      // No discovery this time
      await consumeActionPoints(player, 1);
      
      // Mark exploration
      if (!player.metadata) player.metadata = {};
      player.metadata[explorationKey] = true;
      await player.save();
      
      return res.json({ 
        success: true,
        discovered: false,
        message: 'Exploration complete. No significant deposits found in this area.',
        probability: (baseProbability * 100).toFixed(1) + '%',
        hint: hiddenResources.length > 0 ? 'There may be resources here, keep exploring!' : 'This area has been thoroughly surveyed.'
      });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/resources/provinces/:provinceId
 * Get known and potential resources for a province
 */
router.get('/provinces/:provinceId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { provinceId } = req.params;
    
    const province = await models.Province.findById(provinceId);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    res.json({ 
      knownResources: province.resources || [],
      hasHiddenResources: (province.hiddenResources || []).length > 0,
      hiddenCount: (province.hiddenResources || []).length,
      // Don't reveal what the hidden resources are!
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/resources/initialize/:sessionId
 * Initialize hidden resources (GM only, run once per session)
 */
router.post('/initialize/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check if user is GM
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const provinces = await models.Province.find({ sessionId });
    
    const hiddenResourcePool = [
      'gold', 'silver', 'copper', 'iron', 'coal', 
      'gemstones', 'platinum', 'uranium', 'rare_earth'
    ];
    
    const results: any[] = [];
    
    for (const province of provinces) {
      // 40% chance of hidden resource per province
      if (Math.random() < 0.4) {
        // Pick 1-2 random resources
        const numResources = Math.random() < 0.7 ? 1 : 2;
        const hidden = [];
        
        for (let i = 0; i < numResources; i++) {
          const resource = hiddenResourcePool[Math.floor(Math.random() * hiddenResourcePool.length)];
          if (!hidden.includes(resource) && !(province.resources || []).includes(resource)) {
            hidden.push(resource);
          }
        }
        
        if (hidden.length > 0) {
          province.hiddenResources = hidden;
          await province.save();
          
          results.push({
            province: province.name,
            hiddenResources: hidden
          });
        }
      }
    }
    
    res.json({ 
      success: true,
      message: `Initialized hidden resources for ${results.length} provinces`,
      details: results // GM can see what's hidden where
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/resources/market/:sessionId
 * Get current resource market data
 */
router.get('/market/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const market = await models.Market.findOne({ sessionId });
    if (!market) {
      return res.status(404).json({ error: 'Market not found' });
    }
    
    const resourceData: any = {};
    
    if (market.resources) {
      for (const [resource, data] of market.resources.entries()) {
        resourceData[resource] = {
          basePrice: data.basePrice,
          currentPrice: data.currentPrice,
          supply: data.supply,
          demand: data.demand,
          trend: data.supply > data.demand ? 'falling' : 'rising'
        };
      }
    }
    
    res.json({ resources: resourceData });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
