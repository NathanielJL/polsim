/**
 * News Routes - AI-Generated + Player-Created Articles
 * 3 AI National Newspapers + Player Provincial Newspapers
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { AIService } from '../services/AIService';

const router = Router();
const aiService = new AIService();

/**
 * GET /api/news/:sessionId
 * Get all news articles for a session
 */
router.get('/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50, outlet, provinceId } = req.query;
    
    const filter: any = { sessionId };
    if (outlet) {
      filter.outletId = outlet;
    }
    if (provinceId) {
      filter.provinceId = provinceId;
    }
    
    const articles = await models.NewsArticle.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('authorId', 'username')
      .lean();
    
    res.json({ articles });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/outlets/:sessionId
 * Get all news outlets (AI National + Player Provincial)
 */
router.get('/outlets/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const outlets = await models.NewsOutlet.find({ sessionId }).lean();
    
    res.json({ outlets });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/news/submit
 * Submit a player-written article to provincial newspaper
 */
router.post('/submit', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      playerId, 
      sessionId, 
      outletId, 
      title, 
      content,
      provinceId 
    } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content required' });
    }
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Check if outlet exists and is player-owned
    const outlet = await models.NewsOutlet.findOne({ id: outletId });
    if (!outlet) {
      return res.status(404).json({ error: 'News outlet not found' });
    }
    
    if (outlet.type !== 'provincial') {
      return res.status(400).json({ error: 'Can only submit to provincial newspapers' });
    }
    
    // Check if player is authorized to write for this outlet
    const isOwner = outlet.ownerId?.toString() === playerId;
    const isEmployee = outlet.employees?.some((e: any) => e.toString() === playerId);
    
    if (!isOwner && !isEmployee) {
      return res.status(403).json({ 
        error: 'Not authorized to write for this outlet' 
      });
    }
    
    // Create article
    const article = await models.NewsArticle.create({
      id: `article-${Date.now()}`,
      sessionId,
      outletId,
      provinceId,
      authorId: playerId,
      title,
      content,
      aiGenerated: false,
      createdAt: new Date(),
    });
    
    // Apply reputation impacts for publishing article
    // Import here to avoid circular dependencies
    const { ReputationCalculationService } = await import('../services/ReputationCalculationService');
    const { DemographicSliceModel } = await import('../models/ReputationModels');
    
    const session = await models.Session.findById(sessionId);
    const currentTurn = session?.currentTurn || 0;
    
    // Get outlet's ideological position for reputation calculation
    const outletPosition = {
      cube: (outlet as any).ideologicalPosition || { economic: 0, authority: 0, social: 0 },
      issues: (outlet as any).issuePositions || {}
    };
    
    // Apply base ±5 reputation impact modified by ideological alignment
    // For provincial papers, impact is strongest in home province
    const provinceDemographics = await DemographicSliceModel.find({ 
      'locational.province': provinceId 
    });
    
    let reputationImpactsApplied = 0;
    for (const demographic of provinceDemographics) {
      // Simplified alignment calculation (TODO: Use proper method when available)
      // For now, just use a default positive impact
      const alignment = 0.5; // Placeholder: neutral-positive alignment
      
      // Base impact ±5, scaled by alignment (-1 to 1)
      // Positive alignment = positive reputation boost
      // Negative alignment = reputation penalty
      const baseImpact = 5;
      const impact = baseImpact * alignment;
      
      await ReputationCalculationService.applyReputationChange(
        playerId,
        demographic.id,
        impact,
        'policy', // Using 'policy' as source since 'news' not yet added
        article.id,
        currentTurn,
        { 
          outletId, 
          articleTitle: title,
          provinceId,
          alignment 
        }
      );
      
      reputationImpactsApplied++;
    }
    
    console.log(`✅ Applied ${reputationImpactsApplied} news reputation impacts for article "${title}"`);
    
    res.json({ 
      success: true,
      article,
      reputationImpactsApplied
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/news/outlet/create
 * Create a provincial newspaper (players only)
 */
router.post('/outlet/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { 
      playerId, 
      sessionId, 
      name, 
      provinceId,
      politicalStance 
    } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    // Check if player already owns a newspaper
    const existingOwned = await models.NewsOutlet.findOne({ ownerId: playerId });
    if (existingOwned) {
      return res.status(400).json({ error: 'You already own a newspaper' });
    }
    
    // Check province limit (max 5 newspapers per province)
    const provinceCount = await models.NewsOutlet.countDocuments({ 
      provinceId,
      type: 'provincial'
    });
    
    if (provinceCount >= 5) {
      return res.status(400).json({ 
        error: 'This province already has the maximum of 5 newspapers' 
      });
    }
    
    // Cost to create newspaper
    const cost = 700; // £700 to found a newspaper
    if (player.cash < cost) {
      return res.status(400).json({ error: 'Insufficient funds to create newspaper' });
    }
    
    player.cash -= cost;
    
    const outlet = await models.NewsOutlet.create({
      id: `outlet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      name,
      type: 'provincial',
      provinceId,
      politicalStance,
      ownerId: playerId,
      employees: [],
      readership: 100,
      cash: 0,
      reputation: 50,
      staff: 1,
      createdAt: new Date(),
    });
    
    // Link to player
    player.newsOutletOwned = outlet.id;
    await player.save();
    
    res.json({ 
      success: true,
      outlet,
      newBalance: player.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/news/my-newspaper/:playerId
 * Get player's owned newspaper
 */
router.get('/my-newspaper/:playerId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId } = req.params;
    
    const newspaper = await models.NewsOutlet.findOne({ ownerId: playerId })
      .populate('provinceId', 'name')
      .lean();
    
    if (!newspaper) {
      return res.json({ newspaper: null });
    }
    
    res.json({ newspaper });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/news/outlet/hire
 * Hire a player to write for your newspaper
 */
router.post('/outlet/hire', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { outletId, employeeId, ownerId } = req.body;
    
    const outlet = await models.NewsOutlet.findOne({ id: outletId });
    if (!outlet) {
      return res.status(404).json({ error: 'Outlet not found' });
    }
    
    if (outlet.ownerId?.toString() !== ownerId) {
      return res.status(403).json({ error: 'Only owner can hire employees' });
    }
    
    if (!outlet.employees) {
      outlet.employees = [];
    }
    
    if (outlet.employees.some((e: any) => e.toString() === employeeId)) {
      return res.status(400).json({ error: 'Player already employed' });
    }
    
    outlet.employees.push(employeeId);
    await outlet.save();
    
    res.json({ 
      success: true,
      employees: outlet.employees.length 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Internal function: Generate AI news for GM event
 * Called automatically when GM creates an event
 */
export async function generateAINewsForEvent(
  sessionId: string,
  eventId: string,
  eventTitle: string,
  eventDescription: string,
  eventType: string,
  affectedProvinces: string[]
): Promise<void> {
  try {
    console.log(`📰 Generating AI news for event: ${eventTitle}`);
    
    const newsData = await aiService.generateNewsFromEvent(
      eventTitle,
      eventDescription,
      eventType,
      affectedProvinces
    );
    
    if (!newsData.success) {
      console.error('Failed to generate news:', newsData.error);
      return;
    }
    
    // Create articles for each AI newspaper
    for (const article of newsData.articles) {
      await models.NewsArticle.create({
        id: `article-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        sessionId,
        outletId: article.outlet.toLowerCase().replace(/\s+/g, '-'),
        title: article.headline,
        content: article.content,
        tone: article.tone,
        eventId,
        aiGenerated: true,
        createdAt: new Date(),
      });
    }
    
    console.log(`✅ Generated ${newsData.articles.length} AI news articles`);
  } catch (error: any) {
    console.error('Error generating AI news:', error.message);
  }
}

export default router;
