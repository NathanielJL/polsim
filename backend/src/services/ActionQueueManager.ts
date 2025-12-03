/**
 * POLSIM - ACTION QUEUE MANAGER
 * 
 * Handles player action submissions and turn processing
 * Ensures simultaneous action execution within turn windows
 * Validates actions against current game state
 */

import { models } from '../models/mongoose';

export class ActionQueueManager {
  /**
   * Submit a new action to the queue
   * Validates action and adds to pending actions for current turn
   */
  async submitAction(
    sessionId: string,
    playerId: string,
    actionType: 'campaign' | 'policy_proposal' | 'market_trade' | 'event_response',
    details: any
  ): Promise<string> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const player = await models.Player.findById(playerId);
      if (!player) throw new Error('Player not found');

      // Check if player is in this session
      if (player.currentSessionId?.toString() !== sessionId) {
        throw new Error('Player not in this session');
      }

      // Check if player has actions remaining this turn
      const remainingActions = await this.getRemainingActionsForPlayer(sessionId, playerId);
      if (remainingActions <= 0) {
        throw new Error('No actions remaining this turn');
      }

      // Validate action details based on type
      this.validateActionDetails(actionType, details);

      // Create action document
      const action = new models.Action({
        sessionId,
        playerId,
        type: actionType,
        details,
        turn: session.currentTurn,
        submitted: new Date(),
        processed: false,
      });

      await action.save();

      // Track action in session
      if (!session.pendingActions) session.pendingActions = [];
      session.pendingActions.push(action._id);
      await session.save();

      return action._id.toString();
    } catch (error) {
      console.error('Submit action error:', error);
      throw error;
    }
  }

  /**
   * Get remaining actions available to player this turn
   * Each player gets 5 actions per turn
   */
  async getRemainingActionsForPlayer(sessionId: string, playerId: string): Promise<number> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      // Count actions submitted this turn
      const actionsThisTurn = await models.Action.countDocuments({
        sessionId,
        playerId,
        turn: session.currentTurn,
      });

      const actionsPerTurn = 5;
      return Math.max(0, actionsPerTurn - actionsThisTurn);
    } catch (error) {
      console.error('Get remaining actions error:', error);
      throw error;
    }
  }

  /**
   * Get all pending actions for a turn
   * Used by game engine to process turn
   */
  async getActionsForTurn(sessionId: string, turn?: number): Promise<any[]> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const targetTurn = turn !== undefined ? turn : session.currentTurn;

      const actions = await models.Action.find({
        sessionId,
        turn: targetTurn,
        processed: false,
      }).populate('playerId');

      return actions;
    } catch (error) {
      console.error('Get actions for turn error:', error);
      throw error;
    }
  }

  /**
   * Mark action as processed
   * Called after game engine executes the action
   */
  async markActionProcessed(actionId: string): Promise<void> {
    try {
      const action = await models.Action.findByIdAndUpdate(
        actionId,
        { processed: true, processedAt: new Date() },
        { new: true }
      );

      if (!action) throw new Error('Action not found');

      console.log(`Action ${actionId} marked as processed`);
    } catch (error) {
      console.error('Mark action processed error:', error);
      throw error;
    }
  }

  /**
   * Get action by ID with populated references
   */
  async getAction(actionId: string): Promise<any> {
    try {
      const action = await models.Action.findById(actionId)
        .populate('playerId')
        .populate('sessionId');

      return action;
    } catch (error) {
      console.error('Get action error:', error);
      throw error;
    }
  }

  /**
   * Validate action details based on action type
   * Throws error if validation fails
   */
  private validateActionDetails(
    type: 'campaign' | 'policy_proposal' | 'market_trade' | 'event_response',
    details: any
  ): void {
    if (!details) {
      throw new Error('Action details required');
    }

    switch (type) {
      case 'campaign':
        if (!details.targetArchetype || typeof details.approvalDelta !== 'number') {
          throw new Error('Campaign requires targetArchetype and approvalDelta');
        }
        if (details.approvalDelta < -50 || details.approvalDelta > 50) {
          throw new Error('Approval delta must be between -50 and +50');
        }
        break;

      case 'policy_proposal':
        if (!details.policyId || !details.description) {
          throw new Error('Policy proposal requires policyId and description');
        }
        break;

      case 'market_trade':
        if (!details.marketId || !details.quantity || typeof details.quantity !== 'number') {
          throw new Error('Market trade requires marketId and quantity');
        }
        if (details.quantity <= 0) {
          throw new Error('Trade quantity must be positive');
        }
        break;

      case 'event_response':
        if (!details.eventId || !details.responseType) {
          throw new Error('Event response requires eventId and responseType');
        }
        if (!['accept', 'mitigate', 'exploit'].includes(details.responseType)) {
          throw new Error('Response type must be accept, mitigate, or exploit');
        }
        break;

      default:
        throw new Error(`Unknown action type: ${type}`);
    }
  }

  /**
   * Clear processed actions from session queue
   * Called after turn is finalized
   */
  async clearProcessedActions(sessionId: string, turn: number): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      // Remove processed actions from pending queue
      const processedActions = await models.Action.find({
        sessionId,
        turn,
        processed: true,
      });

      if (session.pendingActions) {
        session.pendingActions = session.pendingActions.filter(
          (actionId: any) => !processedActions.some((a: any) => a._id.equals(actionId))
        );
        await session.save();
      }

      console.log(`Cleared ${processedActions.length} processed actions from session ${sessionId}`);
    } catch (error) {
      console.error('Clear processed actions error:', error);
      throw error;
    }
  }

  /**
   * Get summary of actions for a player this turn
   */
  async getPlayerActionSummary(sessionId: string, playerId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const submitted = await models.Action.countDocuments({
        sessionId,
        playerId,
        turn: session.currentTurn,
      });

      const processed = await models.Action.countDocuments({
        sessionId,
        playerId,
        turn: session.currentTurn,
        processed: true,
      });

      return {
        turn: session.currentTurn,
        submitted,
        processed,
        remaining: 5 - submitted,
      };
    } catch (error) {
      console.error('Get player action summary error:', error);
      throw error;
    }
  }
}

export default new ActionQueueManager();

