/**
 * Legislature System
 * 
 * Bicameral legislature:
 * - Lower House (House of Representatives): 35 seats, elected
 * - Upper House (Legislative Council): 14 seats, appointed initially
 * 
 * Voting procedures:
 * - Simple majority for policies
 * - 2/3rds majority for Constitutional amendments
 * - Governor veto (requires 5/7 provinces to override)
 */

import { Router, Request, Response } from 'express';
import { models } from '../models/mongoose';
import { authMiddleware } from '../middleware/auth';
import { freeAction } from '../middleware/actionPoints';

const router = Router();

/**
 * GET /api/legislature/seats/:sessionId
 * Get all legislative seats
 */
router.get('/seats/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    
    const seats = await models.Office.find({ 
      sessionId,
      type: { $in: ['parliament', 'legislative-council'] }
    })
    .populate('holderId', 'username')
    .lean();
    
    const lowerHouse = seats.filter(s => s.type === 'parliament');
    const upperHouse = seats.filter(s => s.type === 'legislative-council');
    
    res.json({ 
      lowerHouse: {
        totalSeats: 35,
        filledSeats: lowerHouse.filter(s => s.holderId).length,
        seats: lowerHouse
      },
      upperHouse: {
        totalSeats: 14,
        filledSeats: upperHouse.filter(s => s.holderId).length,
        seats: upperHouse
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legislature/vote
 * Vote on a policy (legislature members only)
 * Free action (0 AP)
 */
router.post('/vote', authMiddleware, freeAction, async (req: Request, res: Response) => {
  try {
    const { playerId, policyId, vote } = req.body;
    
    if (!['yes', 'no', 'abstain'].includes(vote)) {
      return res.status(400).json({ error: 'Vote must be yes, no, or abstain' });
    }
    
    const policy = await models.Policy.findById(policyId);
    if (!policy) {
      return res.status(404).json({ error: 'Policy not found' });
    }
    
    // Check if player holds a legislative office
    const office = await models.Office.findOne({ 
      holderId: playerId,
      type: { $in: ['parliament', 'legislative-council'] }
    });
    
    if (!office) {
      return res.status(403).json({ 
        error: 'Must hold a legislative office to vote' 
      });
    }
    
    // Record vote
    if (!policy.legislatureVotes) {
      policy.legislatureVotes = [];
    }
    
    // Remove previous vote if exists
    policy.legislatureVotes = policy.legislatureVotes.filter(
      (v: any) => v.playerId?.toString() !== playerId
    );
    
    // Add new vote
    policy.legislatureVotes.push({
      playerId,
      vote,
      house: office.type === 'parliament' ? 'lower' : 'upper',
      timestamp: new Date()
    });
    
    await policy.save();
    
    // Check if policy has passed
    const result = await checkPolicyResult(policy);
    
    res.json({ 
      success: true,
      vote,
      result
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legislature/initialize/:sessionId
 * Initialize legislature seats (GM only, run once per session)
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
    
    // Check if already initialized
    const existing = await models.Office.find({ 
      sessionId,
      type: { $in: ['parliament', 'legislative-council'] }
    });
    
    if (existing.length > 0) {
      return res.status(400).json({ 
        error: 'Legislature already initialized',
        seats: existing.length 
      });
    }
    
    // Get provinces for seat distribution
    const provinces = await models.Province.find({ sessionId });
    const totalPopulation = provinces.reduce((sum, p) => sum + (p.population || 0), 0);
    
    // Lower House: 35 seats distributed by population (1 per 815 people)
    const lowerHouseSeats = [];
    for (const province of provinces) {
      const seats = Math.max(1, Math.round((province.population || 0) / 815));
      
      for (let i = 0; i < seats && lowerHouseSeats.length < 35; i++) {
        await models.Office.create({
          sessionId,
          type: 'parliament',
          name: `${province.name} - House Seat ${i + 1}`,
          provinceId: province._id,
          holderId: null,
          salary: 200, // £200 per turn
          term: 3, // 3 years
          electedAt: null,
        });
        lowerHouseSeats.push(province.name);
      }
    }
    
    // Upper House: 14 seats (initially appointed by Governor)
    // 2 seats per province
    const upperHouseSeats = [];
    for (const province of provinces) {
      for (let i = 0; i < 2; i++) {
        await models.Office.create({
          sessionId,
          type: 'legislative-council',
          name: `${province.name} - Council Seat ${i + 1}`,
          provinceId: province._id,
          holderId: null,
          salary: 300, // £300 per turn
          term: 7, // 7 years
          appointedAt: null,
        });
        upperHouseSeats.push(province.name);
      }
    }
    
    res.json({ 
      success: true,
      lowerHouse: {
        totalSeats: lowerHouseSeats.length,
        seatsByProvince: lowerHouseSeats.reduce((acc: any, prov) => {
          acc[prov] = (acc[prov] || 0) + 1;
          return acc;
        }, {})
      },
      upperHouse: {
        totalSeats: upperHouseSeats.length,
        seatsByProvince: upperHouseSeats.reduce((acc: any, prov) => {
          acc[prov] = (acc[prov] || 0) + 1;
          return acc;
        }, {})
      },
      message: 'Legislature initialized. 35 Lower House + 14 Upper House seats created.'
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/legislature/appoint
 * Appoint member to Upper House (Governor only)
 */
router.post('/appoint', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { governorId, memberId, seatId } = req.body;
    
    // Check if user is Governor
    const governorOffice = await models.Office.findOne({ 
      holderId: governorId,
      type: 'governor'
    });
    
    if (!governorOffice) {
      return res.status(403).json({ error: 'Governor access required' });
    }
    
    const seat = await models.Office.findById(seatId);
    if (!seat || seat.type !== 'legislative-council') {
      return res.status(404).json({ error: 'Upper House seat not found' });
    }
    
    if (seat.holderId) {
      return res.status(400).json({ error: 'Seat already filled' });
    }
    
    seat.holderId = memberId;
    seat.appointedAt = new Date();
    await seat.save();
    
    res.json({ 
      success: true,
      message: `Appointed to ${seat.name}` 
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Helper: Check if policy has passed legislature
 */
async function checkPolicyResult(policy: any): Promise<any> {
  if (!policy.legislatureVotes || policy.legislatureVotes.length === 0) {
    return { status: 'pending', message: 'Awaiting votes' };
  }
  
  const lowerHouseVotes = policy.legislatureVotes.filter((v: any) => v.house === 'lower');
  const upperHouseVotes = policy.legislatureVotes.filter((v: any) => v.house === 'upper');
  
  const lowerYes = lowerHouseVotes.filter((v: any) => v.vote === 'yes').length;
  const lowerNo = lowerHouseVotes.filter((v: any) => v.vote === 'no').length;
  const lowerTotal = lowerHouseVotes.length;
  
  const upperYes = upperHouseVotes.filter((v: any) => v.vote === 'yes').length;
  const upperNo = upperHouseVotes.filter((v: any) => v.vote === 'no').length;
  const upperTotal = upperHouseVotes.length;
  
  // Need simple majority in both houses
  const lowerPassed = lowerYes > lowerNo && lowerYes > lowerTotal / 2;
  const upperPassed = upperYes > upperNo && upperYes > upperTotal / 2;
  
  if (lowerPassed && upperPassed) {
    policy.status = 'passed';
    await policy.save();
    return { 
      status: 'passed', 
      message: 'Policy passed both houses',
      votes: {
        lowerHouse: { yes: lowerYes, no: lowerNo, total: lowerTotal },
        upperHouse: { yes: upperYes, no: upperNo, total: upperTotal }
      }
    };
  }
  
  // Check if enough votes to determine rejection
  const lowerMaxPossibleYes = lowerYes + (35 - lowerTotal);
  const upperMaxPossibleYes = upperYes + (14 - upperTotal);
  
  if (lowerMaxPossibleYes <= lowerTotal / 2 || upperMaxPossibleYes <= upperTotal / 2) {
    policy.status = 'rejected';
    await policy.save();
    return { 
      status: 'rejected', 
      message: 'Policy rejected',
      votes: {
        lowerHouse: { yes: lowerYes, no: lowerNo, total: lowerTotal },
        upperHouse: { yes: upperYes, no: upperNo, total: upperTotal }
      }
    };
  }
  
  return { 
    status: 'pending', 
    message: 'Awaiting more votes',
    votes: {
      lowerHouse: { yes: lowerYes, no: lowerNo, total: lowerTotal },
      upperHouse: { yes: upperYes, no: upperNo, total: upperTotal }
    }
  };
}

export default router;
