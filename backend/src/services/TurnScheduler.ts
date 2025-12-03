/**
 * POLSIM - TURN SCHEDULER
 * 
 * Automatically advances game turns every 24 hours
 * Uses node-schedule for cron-like scheduling
 * Tracks session timers and handles turn execution
 */

import { models } from '../models/mongoose';
import { GameSimulationEngine } from './GameSimulationEngine';
import { ActionQueueManager } from './ActionQueueManager';

export class TurnScheduler {
  private gameEngine: GameSimulationEngine;
  private actionQueue: ActionQueueManager;
  private activeTimers: Map<string, NodeJS.Timer> = new Map();

  constructor() {
    this.gameEngine = new GameSimulationEngine();
    this.actionQueue = new ActionQueueManager();
  }

  /**
   * Initialize scheduler for a session
   * Sets up 24-hour auto-advance timer
   */
  async initializeSession(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      // Calculate delay until next turn (24 hours from now)
      const turnEndTime = new Date(session.turnEndTime);
      const now = new Date();
      const delayMs = Math.max(0, turnEndTime.getTime() - now.getTime());

      // Set timer for auto-advance
      this.scheduleAutoAdvance(sessionId, delayMs);

      console.log(
        `Turn scheduler initialized for session ${sessionId}. Next advance in ${(
          delayMs / 1000 / 60 / 60
        ).toFixed(2)} hours`
      );
    } catch (error) {
      console.error('Initialize scheduler error:', error);
      throw error;
    }
  }

  /**
   * Schedule auto-advance for a session
   */
  private scheduleAutoAdvance(sessionId: string, delayMs: number): void {
    // Clear existing timer if any
    if (this.activeTimers.has(sessionId)) {
      clearTimeout(this.activeTimers.get(sessionId));
    }

    // Set new timer
    const timer = setTimeout(async () => {
      try {
        console.log(`Auto-advancing turn for session ${sessionId}`);
        await this.advanceTurn(sessionId);
      } catch (error) {
        console.error(`Error auto-advancing session ${sessionId}:`, error);
      }
    }, delayMs);

    this.activeTimers.set(sessionId, timer);
  }

  /**
   * Manually advance turn (called by GM or scheduler)
   */
  async advanceTurn(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      // Check if auto-advance is enabled
      if (!session.autoAdvanceEnabled) {
        throw new Error('Auto-advance is disabled for this session');
      }

      // Execute full turn
      await this.gameEngine.executeTurn(sessionId);

      // Process approved events
      await this.executeApprovedEvents(sessionId);

      // Clear processed actions
      await this.actionQueue.clearProcessedActions(sessionId, session.currentTurn);

      // Reset turn timers
      const updatedSession = await models.Session.findById(sessionId);
      updatedSession!.lastTurnAt = new Date();
      updatedSession!.turnStartTime = new Date();
      updatedSession!.turnEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await updatedSession!.save();

      // Schedule next auto-advance
      this.scheduleAutoAdvance(sessionId, 24 * 60 * 60 * 1000);

      console.log(`Turn advanced for session ${sessionId}. New turn: ${updatedSession?.currentTurn}`);

      return {
        success: true,
        turn: updatedSession?.currentTurn,
        nextAdvanceAt: updatedSession?.turnEndTime,
      };
    } catch (error) {
      console.error('Advance turn error:', error);
      throw error;
    }
  }

  /**
   * Execute all approved events for the turn
   */
  private async executeApprovedEvents(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      const gameState = await models.GameState.findOne({ sessionId });

      if (!session || !gameState) return;

      // Get all approved events
      const approvedEvents = await models.Event.find({
        _id: { $in: session.approvedEvents },
      });

      for (const event of approvedEvents) {
        // Apply event effects
        if (event.effects) {
          if (event.effects.economicIndex !== undefined) {
            gameState.economicIndex += event.effects.economicIndex;
          }
          if (event.effects.socialStability !== undefined) {
            gameState.socialStability += event.effects.socialStability;
          }
          if (event.effects.politicalStability !== undefined) {
            gameState.politicalStability += event.effects.politicalStability;
          }
        }

        // Apply population group effects
        if (event.affectedGroups && event.affectedGroups.length > 0) {
          session.world.populationGroups.forEach((group: any) => {
            if (event.affectedGroups.includes(group.id)) {
              group.approval = Math.max(
                -100,
                Math.min(100, group.approval + (event.effects?.approvalShift || 0))
              );
            }
          });
        }
      }

      // Clamp stability values
      gameState.economicIndex = Math.max(0, Math.min(100, gameState.economicIndex));
      gameState.socialStability = Math.max(0, Math.min(100, gameState.socialStability));
      gameState.politicalStability = Math.max(0, Math.min(100, gameState.politicalStability));

      await gameState.save();
      await session.save();

      // Clear approved events for next turn
      session.approvedEvents = [];
      session.pendingEvents = [];
      await session.save();

      console.log(`Executed ${approvedEvents.length} approved events for session ${sessionId}`);
    } catch (error) {
      console.error('Execute approved events error:', error);
      throw error;
    }
  }

  /**
   * Get turn status for a session
   */
  async getTurnStatus(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const now = new Date();
      const turnEnd = new Date(session.turnEndTime);
      const timeRemainingMs = Math.max(0, turnEnd.getTime() - now.getTime());
      const timeRemainingHours = timeRemainingMs / 1000 / 60 / 60;

      return {
        currentTurn: session.currentTurn,
        turnStartTime: session.turnStartTime,
        turnEndTime: session.turnEndTime,
        timeRemainingMs,
        timeRemainingHours: parseFloat(timeRemainingHours.toFixed(2)),
        autoAdvanceEnabled: session.autoAdvanceEnabled,
        lastAdvancedAt: session.lastTurnAt,
      };
    } catch (error) {
      console.error('Get turn status error:', error);
      throw error;
    }
  }

  /**
   * Toggle auto-advance for a session (GM only)
   */
  async toggleAutoAdvance(sessionId: string, enabled: boolean): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      session.autoAdvanceEnabled = enabled;
      await session.save();

      if (enabled) {
        const now = new Date();
        const turnEnd = new Date(session.turnEndTime);
        const delayMs = Math.max(0, turnEnd.getTime() - now.getTime());
        this.scheduleAutoAdvance(sessionId, delayMs);
      } else {
        if (this.activeTimers.has(sessionId)) {
          clearTimeout(this.activeTimers.get(sessionId));
          this.activeTimers.delete(sessionId);
        }
      }

      console.log(`Auto-advance ${enabled ? 'enabled' : 'disabled'} for session ${sessionId}`);
    } catch (error) {
      console.error('Toggle auto-advance error:', error);
      throw error;
    }
  }

  /**
   * Load all active sessions and initialize schedulers
   * Call this on server startup
   */
  async initializeAllSessions(): Promise<void> {
    try {
      const activeSessions = await models.Session.find({ status: 'active' });

      console.log(`Initializing schedulers for ${activeSessions.length} active sessions`);

      for (const session of activeSessions) {
        if (session.autoAdvanceEnabled) {
          await this.initializeSession(session._id.toString());
        }
      }

      console.log('All session schedulers initialized');
    } catch (error) {
      console.error('Initialize all sessions error:', error);
      throw error;
    }
  }

  /**
   * Cleanup - cancel all active timers
   */
  shutdown(): void {
    console.log(`Shutting down turn scheduler. Clearing ${this.activeTimers.size} timers`);
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();
  }
}

export default new TurnScheduler();
