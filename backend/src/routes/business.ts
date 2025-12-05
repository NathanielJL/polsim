/**
 * Business Routes
 * Company creation, management, and economic simulation
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';

const router = Router();

/**
 * POST /api/business/found
 * Found a new company
 */
router.post('/found', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, sessionId, name, type, initialCapital } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }
    
    if (player.companyOwned) {
      return res.status(400).json({ error: 'Already own a company' });
    }
    
    const cost = initialCapital || 500;
    
    if (player.cash < cost) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    // Valid company types
    const validTypes = [
      'Hotel', 'Construction', 'Medicine', 'Finance', 'Technology',
      'Agriculture', 'Manufacturing', 'Transport', 'Mining', 'Retail'
    ];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid company type' });
    }
    
    // Deduct cost
    player.cash -= cost;
    await player.save();
    
    // Create company
    const company = await models.Company.create({
      id: `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId,
      ownerId: playerId,
      name,
      type,
      cash: cost,
      employees: 1, // Just the owner
      marketInfluence: new Map(),
      monthlyProfit: 0,
      valuation: cost, // Initial valuation = starting capital
      totalShares: 10000,
      shareholders: [{
        playerId: playerId,
        shares: 10000 // Founder gets 100% ownership
      }],
      profitHistory: [],
    });
    
    // Link to player
    player.companyOwned = company.id;
    await player.save();
    
    res.json({ 
      success: true,
      message: `Founded ${name}`,
      company,
      newBalance: player.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/business/invest
 * Invest additional capital in company
 */
router.post('/invest', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { playerId, companyId, amount } = req.body;
    
    const player = await models.Player.findById(playerId);
    if (!player || player.cash < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }
    
    const company = await models.Company.findOne({ id: companyId });
    if (!company || company.ownerId !== playerId) {
      return res.status(403).json({ error: 'Not company owner' });
    }
    
    player.cash -= amount;
    await player.save();
    
    company.cash += amount;
    await company.save();
    
    res.json({ 
      success: true,
      companyCash: company.cash,
      playerCash: player.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/business/hire
 * Hire employees
 */
router.post('/hire', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId, count } = req.body;
    
    const company = await models.Company.findOne({ id: companyId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const costPerEmployee = 70; // Hiring cost
    const totalCost = costPerEmployee * count;
    
    if (company.cash < totalCost) {
      return res.status(400).json({ error: 'Company cannot afford hiring' });
    }
    
    company.cash -= totalCost;
    company.employees += count;
    await company.save();
    
    res.json({ 
      success: true,
      newEmployees: company.employees,
      companyCash: company.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/business/set-influence
 * Set market influence (what market this company affects)
 */
router.post('/set-influence', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { companyId, marketName, influence } = req.body;
    
    const company = await models.Company.findOne({ id: companyId });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    company.marketInfluence.set(marketName, influence);
    await company.save();
    
    res.json({ 
      success: true,
      marketInfluence: Object.fromEntries(company.marketInfluence) 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/business/company/:id
 * Get company details
 */
router.get('/company/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const company = await models.Company.findOne({ id })
      .lean();
    
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    res.json({ company });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/business/session/:sessionId
 * List all companies in session
 */
router.get('/session/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const companies = await models.Company.find({ sessionId })
      .populate('ownerId', 'username')
      .lean();
    
    res.json({ companies });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/business/calculate-profits
 * Calculate monthly profits for all companies (run on turn advance)
 */
router.post('/calculate-profits', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    const companies = await models.Company.find({ sessionId });
    const session = await models.Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    const results = [];
    
    for (const company of companies) {
      // Calculate profit based on:
      // 1. Base capital
      // 2. Market health
      // 3. Employee efficiency
      // 4. Economic conditions
      
      const baseReturn = company.cash * 0.05; // 5% monthly return on capital
      
      // Employee productivity (diminishing returns)
      const employeeBonus = Math.log(company.employees + 1) * 100;
      
      // Market health (simplified - could pull from actual market data)
      const marketHealth = 1.0; // TODO: Get from session economic indicators
      
      // Unemployment affects consumer spending
      const unemployment = session.unemploymentRate || 5;
      const unemploymentPenalty = 1 - (unemployment / 100);
      
      // Calculate profit
      const profit = Math.round(
        (baseReturn + employeeBonus) * marketHealth * unemploymentPenalty
      );
      
      company.monthlyProfit = profit;
      company.cash += profit;
      await company.save();
      
      // Pay owner dividends (50% of profit)
      const dividends = Math.floor(profit * 0.5);
      
      const owner = await models.Player.findById(company.ownerId);
      if (owner) {
        owner.cash += dividends;
        await owner.save();
      }
      
      results.push({
        companyId: company.id,
        profit,
        dividends,
        newCash: company.cash,
      });
    }
    
    res.json({ 
      success: true,
      results 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/business/close/:id
 * Close a company (bankruptcy or voluntary)
 */
router.delete('/close/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { playerId } = req.body;
    
    const company = await models.Company.findOne({ id });
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    if (company.ownerId !== playerId) {
      return res.status(403).json({ error: 'Not company owner' });
    }
    
    // Return remaining cash to owner
    const owner = await models.Player.findById(playerId);
    if (owner) {
      owner.cash += company.cash;
      owner.companyOwned = undefined;
      await owner.save();
    }
    
    await models.Company.deleteOne({ id });
    
    res.json({ 
      success: true,
      message: 'Company closed',
      cashReturned: company.cash 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
