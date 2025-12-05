/**
 * Archive Routes (GM Manual Tools)
 * 
 * GMs manually export policies/events/news to external wiki (Notion, etc.)
 * System only manages modifiers - GMs handle narrative/flavor text
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * GET /api/archive/policies/:sessionId
 * Get policies ready for archival (superseded or >24 turns old)
 */
router.get('/policies/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check GM access
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const session = await models.Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const currentTurn = session.currentTurn;
    const cutoffTurn = currentTurn - 24;
    
    // Find policies ready for archival
    const archivablePolicies = await models.Policy.find({
      sessionId,
      $or: [
        { status: 'superseded' },
        { status: 'rejected' },
        { 
          status: 'enacted',
          turnEnacted: { $lt: cutoffTurn }
        }
      ],
      archivedUrl: { $exists: false } // Not already archived
    }).sort({ turnEnacted: -1 });
    
    const policies = archivablePolicies.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      proposedBy: p.proposedBy,
      status: p.status,
      turnEnacted: p.turnEnacted,
      supersededBy: p.supersededBy,
      supersedes: p.supersedes,
      // Include original modifiers if superseded
      originalEconomicImpact: p.supersededEconomicImpact,
      originalReputationImpact: p.supersededReputationImpact,
      voters: p.voters,
      hasModifiers: !!(p.economicImpact || p.reputationImpact)
    }));
    
    res.json({ 
      policies,
      count: policies.length,
      currentTurn,
      message: `${policies.length} policies ready for manual archival`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/archive/mark-archived
 * Mark policy/event as archived after GM exports to external wiki
 */
router.post('/mark-archived', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { userId, itemType, itemId, archiveUrl, notes } = req.body;
    
    // Check GM access
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    let item;
    let itemName = '';
    
    if (itemType === 'policy') {
      item = await models.Policy.findById(itemId);
      itemName = item?.title || 'Unknown Policy';
    } else if (itemType === 'event') {
      item = await models.Event.findById(itemId);
      itemName = item?.title || 'Unknown Event';
    } else if (itemType === 'article') {
      item = await models.NewsArticle.findById(itemId);
      itemName = item?.headline || 'Unknown Article';
    }
    
    if (!item) {
      return res.status(404).json({ error: `${itemType} not found` });
    }
    
    // Mark as archived
    item.archivedUrl = archiveUrl;
    item.archivedAt = new Date();
    item.archivedBy = userId;
    item.archiveNotes = notes;
    await item.save();
    
    res.json({ 
      success: true,
      message: `${itemName} marked as archived`,
      archiveUrl 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archive/events/:sessionId
 * Get events ready for archival (ended events >24 turns old)
 */
router.get('/events/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check GM access
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const session = await models.Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const currentTurn = session.currentTurn;
    const cutoffTurn = currentTurn - 24;
    
    // Find ended events ready for archival
    const archivableEvents = await models.Event.find({
      sessionId,
      turnEnds: { $lt: currentTurn },
      turnCreated: { $lt: cutoffTurn },
      archivedUrl: { $exists: false }
    }).sort({ turnCreated: -1 });
    
    const events = archivableEvents.map(e => ({
      id: e.id,
      title: e.title,
      description: e.description,
      severity: e.severity,
      type: e.type,
      turnCreated: e.turnCreated,
      turnEnds: e.turnEnds,
      gdpImpact: e.gdpImpact
    }));
    
    res.json({ 
      events,
      count: events.length,
      message: `${events.length} events ready for manual archival`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archive/articles/:sessionId
 * Get old news articles ready for archival
 */
router.get('/articles/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { userId } = req.body;
    
    // Check GM access
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    const session = await models.Session.findById(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const currentTurn = session.currentTurn;
    const cutoffTurn = currentTurn - 24;
    
    // Find old articles
    const archivableArticles = await models.NewsArticle.find({
      sessionId,
      turn: { $lt: cutoffTurn },
      archivedUrl: { $exists: false }
    })
    .populate('outletId', 'name')
    .sort({ turn: -1 });
    
    const articles = archivableArticles.map(a => ({
      id: a.id,
      headline: a.headline,
      content: a.content?.substring(0, 200) + '...', // Preview
      outlet: (a.outletId as any)?.name || 'Unknown',
      turn: a.turn
    }));
    
    res.json({ 
      articles,
      count: articles.length,
      message: `${articles.length} articles ready for manual archival`
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/archive/export-data/:itemId
 * Get full data for item to export to wiki
 */
router.get('/export-data/:itemType/:itemId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { itemType, itemId } = req.params;
    const { userId } = req.body;
    
    // Check GM access
    const user = await models.Player.findById(userId);
    if (!user || !user.isGameMaster) {
      return res.status(403).json({ error: 'Game Master access required' });
    }
    
    let item;
    let exportData: any = {};
    
    if (itemType === 'policy') {
      item = await models.Policy.findById(itemId)
        .populate('proposedBy', 'username')
        .populate('voters.playerId', 'username');
      
      if (item) {
        exportData = {
          title: item.title,
          description: item.description,
          proposedBy: (item.proposedBy as any)?.username,
          policyType: item.policyType,
          status: item.status,
          turnProposed: item.turnProposed,
          turnEnacted: item.turnEnacted,
          votes: item.voters?.map((v: any) => ({
            player: v.playerId?.username,
            vote: v.vote,
            timestamp: v.timestamp
          })),
          economicImpact: item.supersededEconomicImpact || item.economicImpact,
          reputationImpact: item.supersededReputationImpact || item.reputationImpact,
          supersededBy: item.supersededBy,
          supersedes: item.supersedes
        };
      }
    } else if (itemType === 'event') {
      item = await models.Event.findById(itemId);
      
      if (item) {
        exportData = {
          title: item.title,
          description: item.description,
          severity: item.severity,
          type: item.type,
          duration: item.duration,
          affectedGroups: item.affectedGroups,
          turnCreated: item.turnCreated,
          turnEnds: item.turnEnds,
          gdpImpact: item.gdpImpact,
          triggeredBy: item.triggeredBy
        };
      }
    } else if (itemType === 'article') {
      item = await models.NewsArticle.findById(itemId)
        .populate('outletId', 'name politicalStance');
      
      if (item) {
        exportData = {
          headline: item.headline,
          content: item.content,
          outlet: (item.outletId as any)?.name,
          stance: (item.outletId as any)?.politicalStance,
          turn: item.turn,
          eventId: item.eventId,
          policyId: item.policyId
        };
      }
    }
    
    if (!item) {
      return res.status(404).json({ error: `${itemType} not found` });
    }
    
    res.json({ 
      exportData,
      message: 'Copy this data to your external wiki (Notion, etc.)'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
