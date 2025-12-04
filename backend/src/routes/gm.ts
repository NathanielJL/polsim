/**
 * GM Dashboard Routes
 * API endpoints for Game Master to manage game state without coding
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/AIService';

const router = Router();
const aiService = new AIService();

/**
 * Middleware to check if user is GM
 */
const gmOnly = async (req: Request, res: Response, next: Function) => {
  try {
    const player = await models.Player.findById(req.body.userId || req.query.userId);
    if (!player || !player.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// =======================
// PROVINCE MANAGEMENT
// =======================

/**
 * GET /api/gm/provinces/:sessionId
 * Get all provinces with full details
 */
router.get('/provinces/:sessionId', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const provinces = await models.Province.find({ sessionId })
      .populate('currentGovernor', 'username')
      .populate('currentLtGovernor', 'username')
      .lean();
    
    res.json({ provinces });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/gm/province/:id
 * Update province data (population, development, resources, etc.)
 */
router.patch('/province/:id', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Allowed fields for direct editing
    const allowedFields = [
      'population',
      'developmentLevel',
      'gdp',
      'averageTemperature',
      'resources',
      'unemployment',
      'riverAccessBonus'
    ];
    
    const filteredUpdates: any = {};
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    const province = await models.Province.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true, runValidators: true }
    );
    
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    res.json({ 
      success: true, 
      province,
      message: `Updated ${Object.keys(filteredUpdates).length} fields`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gm/province/:id/resource-discovery
 * Trigger resource discovery event (e.g., gold rush)
 */
router.post('/province/:id/resource-discovery', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { resourceType, amount, category } = req.body;
    
    // resourceType: 'gold', 'coal', etc.
    // category: 'miningPrecious', 'miningIndustrial', etc.
    // amount: number to add
    
    const province = await models.Province.findById(id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    // Update the specific resource
    if (!province.resources) {
      province.resources = {};
    }
    
    if (!province.resources[category]) {
      province.resources[category] = {};
    }
    
    const currentAmount = province.resources[category][resourceType] || 0;
    province.resources[category][resourceType] = currentAmount + amount;
    
    await province.save();
    
    res.json({ 
      success: true,
      message: `Added ${amount} ${resourceType} to ${province.name}`,
      newAmount: province.resources[category][resourceType]
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gm/province/:id/development-event
 * Increase province development level
 */
router.post('/province/:id/development-event', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { increase, reason } = req.body;
    
    const province = await models.Province.findById(id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    const oldLevel = province.developmentLevel || 5;
    const newLevel = Math.min(100, oldLevel + increase);
    province.developmentLevel = newLevel;
    
    await province.save();
    
    // TODO: Create event log entry
    
    res.json({ 
      success: true,
      message: `${province.name} development increased: ${oldLevel}% → ${newLevel}%`,
      reason,
      oldLevel,
      newLevel
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// SESSION MANAGEMENT
// =======================

/**
 * GET /api/gm/sessions
 * Get all game sessions
 */
router.get('/sessions', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const sessions = await models.Session.find()
      .select('name status currentTurn startDate createdAt')
      .sort('-createdAt')
      .lean();
    
    res.json({ sessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/gm/session/:id
 * Update session properties
 */
router.patch('/session/:id', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const allowedFields = ['status', 'currentTurn', 'maintenanceMode'];
    const filteredUpdates: any = {};
    
    allowedFields.forEach(field => {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    });
    
    const session = await models.Session.findByIdAndUpdate(
      id,
      { $set: filteredUpdates },
      { new: true }
    );
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// POPULATION MANAGEMENT
// =======================

/**
 * POST /api/gm/province/:id/immigration
 * Trigger immigration wave
 */
router.post('/province/:id/immigration', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { amount, reason } = req.body;
    
    const province = await models.Province.findById(id);
    if (!province) {
      return res.status(404).json({ error: 'Province not found' });
    }
    
    const oldPop = province.population || 0;
    province.population = oldPop + amount;
    
    await province.save();
    
    res.json({ 
      success: true,
      message: `${province.name} population increased by ${amount.toLocaleString()}`,
      reason,
      oldPopulation: oldPop,
      newPopulation: province.population
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// EVENT CREATION
// =======================

/**
 * POST /api/gm/event
 * Create custom event with AI analysis
 * GM describes event in natural language, AI calculates effects
 */
router.post('/event', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const {
      sessionId,
      title,
      description,
      useAI = true, // Default to AI analysis
      // Manual fields (if useAI = false)
      severity,
      type,
      duration,
      affectedProvinces,
      gdpImpact,
      populationImpact
    } = req.body;
    
    let eventData: any = {
      id: `event-${Date.now()}`,
      sessionId,
      title,
      description,
      gmApproved: true,
      createdAt: new Date()
    };

    if (useAI) {
      // AI analyzes the event description
      console.log('🤖 AI analyzing GM event...');
      const aiAnalysis = await aiService.analyzeGMEvent(title, description);

      if (!aiAnalysis.success) {
        return res.status(400).json({
          error: 'Could not analyze event',
          details: aiAnalysis.error
        });
      }

      // Merge AI analysis with event data
      eventData.type = aiAnalysis.eventType || 'Custom';
      eventData.severity = aiAnalysis.severity || 5;
      eventData.duration = aiAnalysis.duration || 3;
      eventData.summary = aiAnalysis.summary;
      eventData.affectedProvinces = aiAnalysis.affectedProvinces || [];
      eventData.effects = aiAnalysis.effects || {};

      // Auto-apply effects if AI is used
      if (aiAnalysis.effects) {
        // Apply population changes
        if (aiAnalysis.effects.population) {
          const provinces = aiAnalysis.effects.population.provinces;
          const change = aiAnalysis.effects.population.change;

          for (const provinceName of provinces) {
            const province = await models.Province.findOne({ 
              sessionId, 
              name: provinceName 
            });
            if (province) {
              province.population = Math.max(0, (province.population || 0) + change);
              await province.save();
            }
          }
        }

        // Apply GDP changes
        if (aiAnalysis.effects.gdp) {
          const changePercent = aiAnalysis.effects.gdp.changePercent;
          const provinces = aiAnalysis.effects.gdp.provinces;

          if (provinces[0] === 'all') {
            const allProvinces = await models.Province.find({ sessionId });
            for (const province of allProvinces) {
              province.gdp = Math.round((province.gdp || 0) * (1 + changePercent));
              await province.save();
            }
          } else {
            for (const provinceName of provinces) {
              const province = await models.Province.findOne({ 
                sessionId, 
                name: provinceName 
              });
              if (province) {
                province.gdp = Math.round((province.gdp || 0) * (1 + changePercent));
                await province.save();
              }
            }
          }
        }
      }
    } else {
      // Manual mode - GM provides structured data
      eventData.type = type || 'Custom';
      eventData.severity = severity || 5;
      eventData.duration = duration || 3;
      eventData.affectedGroups = [];
      eventData.gdpImpact = gdpImpact;
      
      // Apply immediate effects if specified (manual mode)
      if (affectedProvinces && affectedProvinces.length > 0) {
        for (const provinceId of affectedProvinces) {
          const province = await models.Province.findById(provinceId);
          if (province && gdpImpact) {
            province.gdp = Math.round(province.gdp * (1 + gdpImpact / 100));
            await province.save();
          }
        }
      }
    }
    
    const event = await models.Event.create(eventData);
    
    // Auto-generate AI news articles for this event
    if (useAI) {
      try {
        console.log('📰 Generating AI news articles...');
        const newsData = await aiService.generateNewsFromEvent(
          title,
          description,
          eventData.type,
          eventData.affectedProvinces || []
        );

        if (newsData.success) {
          // Create articles for each AI newspaper
          for (const article of newsData.articles) {
            await models.NewsArticle.create({
              id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              sessionId,
              outletId: article.outlet.toLowerCase().replace(/\s+/g, '-'),
              title: article.headline,
              content: article.content,
              tone: article.tone,
              eventId: event.id,
              aiGenerated: true,
              createdAt: new Date(),
            });
          }
          console.log(`✅ Generated ${newsData.articles.length} AI news articles`);
        }
      } catch (newsError: any) {
        console.error('News generation failed (non-critical):', newsError.message);
      }
    }
    
    res.json({ 
      success: true, 
      event,
      aiAnalysis: useAI ? eventData : undefined
    });
  } catch (error: any) {
    console.error('Event creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/gm/events/:sessionId
 * Get all events for session
 */
router.get('/events/:sessionId', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const events = await models.Event.find({ sessionId })
      .sort('-createdAt')
      .limit(50)
      .lean();
    
    res.json({ events });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// ECONOMIC TOOLS
// =======================

/**
 * POST /api/gm/economy/global-modifier
 * Apply global economic modifier to all provinces
 */
router.post('/economy/global-modifier', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId, gdpMultiplier, reason } = req.body;
    
    const provinces = await models.Province.find({ sessionId });
    
    let updatedCount = 0;
    for (const province of provinces) {
      province.gdp = Math.round(province.gdp * gdpMultiplier);
      await province.save();
      updatedCount++;
    }
    
    res.json({ 
      success: true,
      message: `Applied ${((gdpMultiplier - 1) * 100).toFixed(0)}% GDP modifier to ${updatedCount} provinces`,
      reason
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/gm/economy/resource-boom
 * Trigger resource boom (e.g., coal discovery affects all provinces with coal)
 */
router.post('/economy/resource-boom', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId, resourceType, category, multiplier } = req.body;
    
    const provinces = await models.Province.find({ sessionId });
    
    let affectedCount = 0;
    for (const province of provinces) {
      if (province.resources && 
          province.resources[category] && 
          province.resources[category][resourceType]) {
        
        province.resources[category][resourceType] = Math.round(
          province.resources[category][resourceType] * multiplier
        );
        
        await province.save();
        affectedCount++;
      }
    }
    
    res.json({ 
      success: true,
      message: `${resourceType} boom: ${affectedCount} provinces affected`,
      multiplier
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// =======================
// STATISTICS & OVERVIEW
// =======================

/**
 * GET /api/gm/stats/:sessionId
 * Get comprehensive session statistics
 */
router.get('/stats/:sessionId', authMiddleware, gmOnly, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const provinces = await models.Province.find({ sessionId }).lean();
    const players = await models.Player.find({ sessionId }).lean();
    const events = await models.Event.find({ sessionId }).lean();
    
    const totalPop = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
    const totalGDP = provinces.reduce((sum, p) => sum + (p.gdp || 0), 0);
    const avgDevelopment = provinces.reduce((sum, p) => sum + (p.developmentLevel || 5), 0) / provinces.length;
    
    // Resource totals
    const resourceTotals: any = {};
    provinces.forEach(province => {
      if (province.resources) {
        Object.keys(province.resources).forEach(category => {
          if (!resourceTotals[category]) resourceTotals[category] = {};
          
          Object.keys(province.resources[category]).forEach(resource => {
            if (!resourceTotals[category][resource]) {
              resourceTotals[category][resource] = 0;
            }
            resourceTotals[category][resource] += province.resources[category][resource];
          });
        });
      }
    });
    
    res.json({
      session: await models.Session.findById(sessionId).lean(),
      statistics: {
        provinceCount: provinces.length,
        playerCount: players.length,
        eventCount: events.length,
        totalPopulation: totalPop,
        totalGDP: totalGDP,
        avgGDPPerCapita: totalPop > 0 ? totalGDP / totalPop : 0,
        avgDevelopment: avgDevelopment.toFixed(1),
        resourceTotals
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
