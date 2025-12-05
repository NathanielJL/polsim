import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth';
import { useActionPoints } from '../middleware/actionPoints';
import { EndorsementModel, ReputationScoreModel, DemographicSliceModel } from '../models/ReputationModels';
import { ReputationCalculationService } from '../services/ReputationCalculationService';

const router = express.Router();

/**
 * POST /api/endorsements/endorse
 * Endorse another player
 */
router.post('/endorse', authMiddleware, async (req, res) => {
  try {
    const { sessionId, endorsedId, turn } = req.body;
    const endorserId = req.user!.userId;

    // Validate required fields
    if (!sessionId || !endorsedId || turn === undefined) {
      return res.status(400).json({ error: 'sessionId, endorsedId, and turn are required' });
    }

    // Cannot endorse yourself
    if (endorserId === endorsedId) {
      return res.status(400).json({ error: 'You cannot endorse yourself' });
    }

    // Check if already endorsed this turn
    const existingEndorsement = await Endorsement.findOne({
      sessionId,
      endorserId,
      turn
    });

    if (existingEndorsement) {
      return res.status(400).json({ 
        error: 'You have already made an endorsement this turn',
        existingEndorsement: {
          endorsedId: existingEndorsement.endorsedId,
          turn: existingEndorsement.turn
        }
      });
    }

    // Get all demographic slices for transfer calculation
    const allDemographics = await DemographicSlice.find({});
    const transfers = [];

    for (const demographic of allDemographics) {
      // Get endorser's current reputation with this demographic
      const endorserReputation = await ReputationCalculationService.getReputation(
        endorserId,
        demographic.id
      );

      // Calculate transfer rate based on endorser's approval
      const transferRate = ReputationCalculationService.calculateEndorsementTransfer(endorserReputation);

      // Apply transfer to endorsed player
      if (transferRate !== 0) {
        await ReputationCalculationService.applyReputationChange(
          endorsedId,
          demographic.id,
          transferRate,
          'endorsement',
          endorserId,
          turn,
          { 
            endorserReputation,
            transferRate 
          }
        );

        transfers.push({
          demographicSliceId: demographic.id,
          endorserApproval: endorserReputation,
          transferRate
        });
      }
    }

    // Create endorsement record
    const endorsement = new Endorsement({
      sessionId,
      endorserId,
      endorsedId,
      turn,
      transfers,
      actionPointCost: 1
    });

    await endorsement.save();

    // Deduct action point (you'll need to implement this)
    // await useActionPoints(endorserId, sessionId, 1);

    res.json({
      success: true,
      endorsement: {
        id: endorsement._id,
        endorserId,
        endorsedId,
        turn,
        transfersApplied: transfers.length,
        averageTransfer: transfers.reduce((sum, t) => sum + t.transferRate, 0) / transfers.length,
        positiveTransfers: transfers.filter(t => t.transferRate > 0).length,
        negativeTransfers: transfers.filter(t => t.transferRate < 0).length
      }
    });

  } catch (error) {
    console.error('Error creating endorsement:', error);
    res.status(500).json({ error: 'Failed to create endorsement' });
  }
});

/**
 * GET /api/endorsements/history/:playerId
 * Get endorsement history for a player
 */
router.get('/history/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { sessionId, asEndorser, asEndorsed } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const query: any = { sessionId };

    if (asEndorser === 'true') {
      query.endorserId = playerId;
    } else if (asEndorsed === 'true') {
      query.endorsedId = playerId;
    } else {
      // Get both
      query.$or = [
        { endorserId: playerId },
        { endorsedId: playerId }
      ];
    }

    const endorsements = await Endorsement.find(query).sort({ turn: -1 });

    const formattedEndorsements = endorsements.map(e => ({
      id: e._id,
      endorserId: e.endorserId,
      endorsedId: e.endorsedId,
      turn: e.turn,
      transfersApplied: e.transfers.length,
      averageTransfer: e.transfers.reduce((sum, t) => sum + t.transferRate, 0) / e.transfers.length,
      positiveTransfers: e.transfers.filter(t => t.transferRate > 0).length,
      negativeTransfers: e.transfers.filter(t => t.transferRate < 0).length,
      role: e.endorserId === playerId ? 'endorser' : 'endorsed'
    }));

    res.json({
      endorsements: formattedEndorsements,
      totalEndorsements: endorsements.length,
      asEndorser: endorsements.filter(e => e.endorserId === playerId).length,
      asEndorsed: endorsements.filter(e => e.endorsedId === playerId).length
    });

  } catch (error) {
    console.error('Error fetching endorsement history:', error);
    res.status(500).json({ error: 'Failed to fetch endorsement history' });
  }
});

/**
 * GET /api/endorsements/turn/:turn
 * Get all endorsements for a specific turn
 */
router.get('/turn/:turn', authMiddleware, async (req, res) => {
  try {
    const { turn } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const endorsements = await Endorsement.find({
      sessionId,
      turn: parseInt(turn)
    });

    res.json({
      endorsements: endorsements.map(e => ({
        id: e._id,
        endorserId: e.endorserId,
        endorsedId: e.endorsedId,
        transfersApplied: e.transfers.length
      })),
      total: endorsements.length
    });

  } catch (error) {
    console.error('Error fetching turn endorsements:', error);
    res.status(500).json({ error: 'Failed to fetch turn endorsements' });
  }
});

/**
 * GET /api/endorsements/preview
 * Preview what an endorsement would do (without creating it)
 */
router.get('/preview', authMiddleware, async (req, res) => {
  try {
    const { sessionId, endorsedId } = req.query;
    const endorserId = req.user!.userId;

    if (!sessionId || !endorsedId) {
      return res.status(400).json({ error: 'sessionId and endorsedId are required' });
    }

    // Cannot endorse yourself
    if (endorserId === endorsedId) {
      return res.status(400).json({ error: 'You cannot endorse yourself' });
    }

    // Get all demographic slices
    const allDemographics = await DemographicSlice.find({}).limit(100); // Limit for preview
    const previewTransfers = [];

    for (const demographic of allDemographics) {
      // Get endorser's current reputation
      const endorserReputation = await ReputationCalculationService.getReputation(
        endorserId as string,
        demographic.id
      );

      // Calculate what the transfer would be
      const transferRate = ReputationCalculationService.calculateEndorsementTransfer(endorserReputation);

      if (Math.abs(transferRate) > 0) {
        previewTransfers.push({
          demographic: {
            id: demographic.id,
            occupation: demographic.economic.occupation,
            class: demographic.economic.class,
            province: demographic.locational.province,
            population: demographic.population,
            canVote: demographic.canVote
          },
          yourApproval: endorserReputation,
          transferToEndorsed: transferRate
        });
      }
    }

    // Sort by impact (population * transfer rate)
    previewTransfers.sort((a, b) => 
      Math.abs(b.demographic.population * b.transferToEndorsed) - 
      Math.abs(a.demographic.population * a.transferToEndorsed)
    );

    res.json({
      preview: {
        endorserId,
        endorsedId,
        estimatedTransfers: previewTransfers.slice(0, 20), // Top 20
        summary: {
          totalDemographics: previewTransfers.length,
          averageTransfer: previewTransfers.reduce((sum, t) => sum + t.transferToEndorsed, 0) / previewTransfers.length,
          positiveTransfers: previewTransfers.filter(t => t.transferToEndorsed > 0).length,
          negativeTransfers: previewTransfers.filter(t => t.transferToEndorsed < 0).length,
          neutralTransfers: previewTransfers.filter(t => t.transferToEndorsed === 0).length
        }
      }
    });

  } catch (error) {
    console.error('Error generating endorsement preview:', error);
    res.status(500).json({ error: 'Failed to generate endorsement preview' });
  }
});

/**
 * GET /api/endorsements/impact/:endorsementId
 * Get detailed impact of a specific endorsement
 */
router.get('/impact/:endorsementId', authMiddleware, async (req, res) => {
  try {
    const { endorsementId } = req.params;

    const endorsement = await Endorsement.findById(endorsementId);
    if (!endorsement) {
      return res.status(404).json({ error: 'Endorsement not found' });
    }

    // Get demographic details for each transfer
    const impactDetails = await Promise.all(
      endorsement.transfers.map(async (transfer) => {
        const demographic = await DemographicSlice.findOne({ id: transfer.demographicSliceId });
        return {
          demographic: demographic ? {
            id: demographic.id,
            occupation: demographic.economic.occupation,
            class: demographic.economic.class,
            province: demographic.locational.province,
            population: demographic.population,
            canVote: demographic.canVote
          } : null,
          endorserApproval: transfer.endorserApproval,
          transferRate: transfer.transferRate,
          totalImpact: demographic ? demographic.population * transfer.transferRate : 0
        };
      })
    );

    // Sort by absolute impact
    impactDetails.sort((a, b) => Math.abs(b.totalImpact) - Math.abs(a.totalImpact));

    res.json({
      endorsement: {
        id: endorsement._id,
        endorserId: endorsement.endorserId,
        endorsedId: endorsement.endorsedId,
        turn: endorsement.turn
      },
      impact: {
        transfers: impactDetails,
        summary: {
          totalTransfers: impactDetails.length,
          averageTransfer: impactDetails.reduce((sum, t) => sum + t.transferRate, 0) / impactDetails.length,
          totalPopulationImpact: impactDetails.reduce((sum, t) => sum + Math.abs(t.totalImpact), 0)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching endorsement impact:', error);
    res.status(500).json({ error: 'Failed to fetch endorsement impact' });
  }
});

export default router;
