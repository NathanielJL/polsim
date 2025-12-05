import express from 'express';
import mongoose from 'mongoose';
import { authMiddleware } from '../middleware/auth';
import { useActionPoints } from '../middleware/actionPoints';
import { CampaignModel, DemographicSliceModel } from '../models/ReputationModels';
import { ReputationCalculationService } from '../services/ReputationCalculationService';

const router = express.Router();

/**
 * POST /api/campaigns/start
 * Start a new campaign targeting a demographic slice
 */
router.post('/start', authMiddleware, async (req, res) => {
  try {
    const { sessionId, targetDemographicSliceId, targetProvince } = req.body;
    const playerId = req.user!.userId;

    // Validate required fields
    if (!sessionId || !targetDemographicSliceId) {
      return res.status(400).json({ error: 'sessionId and targetDemographicSliceId are required' });
    }

    // Check if demographic slice exists
    const demographicSlice = await DemographicSlice.findOne({ id: targetDemographicSliceId });
    if (!demographicSlice) {
      return res.status(404).json({ error: 'Demographic slice not found' });
    }

    // Check if player already has an active campaign for this demographic
    const existingCampaign = await Campaign.findOne({
      sessionId,
      playerId,
      targetDemographicSliceId,
      status: 'active'
    });

    if (existingCampaign) {
      return res.status(400).json({ 
        error: 'You already have an active campaign for this demographic. Wait for it to complete before starting a new one.',
        existingCampaign: {
          startTurn: existingCampaign.startTurn,
          endTurn: existingCampaign.endTurn,
          turnsRemaining: existingCampaign.endTurn - existingCampaign.startTurn
        }
      });
    }

    // Get current turn from session (you'll need to implement this based on your session model)
    const currentTurn = 1; // TODO: Get from session

    // Create campaign
    const campaign = new Campaign({
      sessionId,
      playerId,
      targetDemographicSliceId,
      targetProvince: targetProvince || demographicSlice.locational.province,
      startTurn: currentTurn,
      duration: 12,
      endTurn: currentTurn + 12,
      actionPointCost: 1,
      moneyCost: 100,
      boost: Math.floor(Math.random() * 5) + 1, // Random 1-5%
      status: 'active'
    });

    await campaign.save();

    // Deduct action points and money (you'll need to implement this)
    // await useActionPoints(playerId, sessionId, 1);
    // await deductMoney(playerId, sessionId, 100);

    res.json({
      success: true,
      campaign: {
        id: campaign._id,
        targetDemographic: {
          id: demographicSlice.id,
          occupation: demographicSlice.economic.occupation,
          class: demographicSlice.economic.class,
          province: demographicSlice.locational.province,
          population: demographicSlice.population,
          canVote: demographicSlice.canVote
        },
        startTurn: campaign.startTurn,
        endTurn: campaign.endTurn,
        duration: campaign.duration,
        boost: campaign.boost,
        cost: {
          actionPoints: campaign.actionPointCost,
          money: campaign.moneyCost
        }
      }
    });

  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({ error: 'Failed to start campaign' });
  }
});

/**
 * GET /api/campaigns/active/:playerId
 * Get all active campaigns for a player
 */
router.get('/active/:playerId', authMiddleware, async (req, res) => {
  try {
    const { playerId } = req.params;
    const { sessionId } = req.query;

    if (!sessionId) {
      return res.status(400).json({ error: 'sessionId is required' });
    }

    const campaigns = await Campaign.find({
      sessionId,
      playerId,
      status: 'active'
    }).sort({ startTurn: -1 });

    // Get demographic details for each campaign
    const campaignsWithDetails = await Promise.all(
      campaigns.map(async (campaign) => {
        const demographic = await DemographicSlice.findOne({ id: campaign.targetDemographicSliceId });
        return {
          id: campaign._id,
          targetDemographic: demographic ? {
            id: demographic.id,
            occupation: demographic.economic.occupation,
            class: demographic.economic.class,
            province: demographic.locational.province,
            population: demographic.population,
            canVote: demographic.canVote
          } : null,
          startTurn: campaign.startTurn,
          endTurn: campaign.endTurn,
          turnsRemaining: campaign.endTurn - campaign.startTurn,
          boost: campaign.boost,
          status: campaign.status
        };
      })
    );

    res.json({
      campaigns: campaignsWithDetails,
      totalActive: campaigns.length
    });

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

/**
 * POST /api/campaigns/cancel/:campaignId
 * Cancel an active campaign
 */
router.post('/cancel/:campaignId', authMiddleware, async (req, res) => {
  try {
    const { campaignId } = req.params;
    const playerId = req.user!.userId;

    const campaign = await Campaign.findOne({
      _id: campaignId,
      playerId,
      status: 'active'
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Active campaign not found' });
    }

    campaign.status = 'cancelled';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign cancelled successfully'
    });

  } catch (error) {
    console.error('Error cancelling campaign:', error);
    res.status(500).json({ error: 'Failed to cancel campaign' });
  }
});

/**
 * GET /api/campaigns/available-targets
 * Get available demographic slices that can be targeted for campaigns
 */
router.get('/available-targets', authMiddleware, async (req, res) => {
  try {
    const { sessionId, province, canVoteOnly } = req.query;
    const playerId = req.user!.userId;

    // Build query
    const query: any = {};
    if (province) {
      query['locational.province'] = province;
    }
    if (canVoteOnly === 'true') {
      query.canVote = true;
    }

    // Get all demographic slices
    const demographics = await DemographicSlice.find(query).sort({ population: -1 });

    // Get player's active campaigns to filter out already-targeted demographics
    const activeCampaigns = await Campaign.find({
      sessionId,
      playerId,
      status: 'active'
    });

    const activeDemographicIds = new Set(activeCampaigns.map(c => c.targetDemographicSliceId));

    // Filter and format demographics
    const availableTargets = demographics
      .filter(d => !activeDemographicIds.has(d.id))
      .map(d => ({
        id: d.id,
        economic: {
          class: d.economic.class,
          occupation: d.economic.occupation,
          gender: d.economic.gender,
          propertyOwnership: d.economic.propertyOwnership
        },
        cultural: {
          ethnicity: d.cultural.ethnicity,
          religion: d.cultural.religion,
          indigenous: d.cultural.indigenous
        },
        locational: {
          province: d.locational.province,
          settlement: d.locational.settlement
        },
        population: d.population,
        canVote: d.canVote
      }));

    res.json({
      targets: availableTargets,
      totalAvailable: availableTargets.length,
      filters: {
        province: province || 'all',
        canVoteOnly: canVoteOnly === 'true'
      }
    });

  } catch (error) {
    console.error('Error fetching available targets:', error);
    res.status(500).json({ error: 'Failed to fetch available targets' });
  }
});

/**
 * POST /api/campaigns/process-turn
 * Process campaign effects at turn end (called by turn system)
 */
router.post('/process-turn', authMiddleware, async (req, res) => {
  try {
    const { sessionId, currentTurn } = req.body;

    if (!sessionId || currentTurn === undefined) {
      return res.status(400).json({ error: 'sessionId and currentTurn are required' });
    }

    // Find all campaigns that should complete this turn
    const completingCampaigns = await Campaign.find({
      sessionId,
      endTurn: currentTurn,
      status: 'active'
    });

    const results = [];

    for (const campaign of completingCampaigns) {
      // Apply campaign boost to reputation
      const demographic = await DemographicSlice.findOne({ id: campaign.targetDemographicSliceId });
      
      if (demographic) {
        await ReputationCalculationService.applyReputationChange(
          campaign.playerId,
          campaign.targetDemographicSliceId,
          campaign.boost,
          'campaign',
          campaign._id.toString(),
          currentTurn,
          { campaignDuration: campaign.duration }
        );

        results.push({
          playerId: campaign.playerId,
          demographic: campaign.targetDemographicSliceId,
          boost: campaign.boost
        });
      }

      // Mark campaign as completed
      campaign.status = 'completed';
      await campaign.save();
    }

    res.json({
      success: true,
      campaignsCompleted: completingCampaigns.length,
      results
    });

  } catch (error) {
    console.error('Error processing campaign turn:', error);
    res.status(500).json({ error: 'Failed to process campaign turn' });
  }
});

export default router;
