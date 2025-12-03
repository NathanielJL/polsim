/**
 * POLSIM - GAME SIMULATION ENGINE
 * 
 * Core systems for turn-based political economy simulation:
 * - Market dynamics influenced by policies and companies
 * - Population opinion shifts based on events and media
 * - Event generation weighted by current conditions
 * - Policy effects (both numeric and event triggers)
 * - Turn advancement and action processing
 */

import { models } from '../models/mongoose';

export class GameSimulationEngine {
  /**
   * Execute a full turn cycle
   * Called every 24 hours per session
   */
  async executeTurn(sessionId: string): Promise<void> {
    try {
      console.log(`Executing turn for session ${sessionId}`);

      // 1. Update market prices
      await this.updateMarkets(sessionId);

      // 2. Calculate population opinion changes
      await this.updatePopulationOpinion(sessionId);

      // 3. Process player actions
      await this.processActions(sessionId);

      // 4. Generate random events
      await this.generateEvents(sessionId);

      // 5. Update company profits
      await this.distributeCompanyProfits(sessionId);

      // 6. Calculate player reputation changes
      await this.updatePlayerReputation(sessionId);

      // 7. Advance turn counter
      await this.advanceTurn(sessionId);

      console.log(`Turn completed for session ${sessionId}`);
    } catch (error) {
      console.error('Turn execution error:', error);
      throw error;
    }
  }

  /**
   * Update market prices based on supply/demand
   * Uses simple economic model: price = base * (demand / supply)
   */
  private async updateMarkets(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const markets = session.world.markets;

      markets.forEach((market: any) => {
        // Simulate supply/demand changes
        const supplyChange = (Math.random() - 0.5) * 20; // -10 to +10
        const demandChange = (Math.random() - 0.5) * 30; // -15 to +15

        market.supply = Math.max(10, market.supply + supplyChange);
        market.demand = Math.max(10, market.demand + demandChange);

        // Calculate new price
        const priceMultiplier = market.demand / market.supply;
        const volatilityFactor = 1 + (Math.random() - 0.5) * market.volatility;
        const newPrice = market.currentPrice * priceMultiplier * volatilityFactor;

        market.currentPrice = Math.max(10, newPrice);
        market.priceHistory.push({
          turn: (session as any).currentTurn + 1,
          price: market.currentPrice,
        });
      });

      await session.save();
    } catch (error) {
      console.error('Update markets error:', error);
      throw error;
    }
  }

  /**
   * Update population opinion based on economic conditions
   */
  private async updatePopulationOpinion(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const gameState = await models.GameState.findOne({ sessionId });
      const populationGroups = session.world.populationGroups;

      populationGroups.forEach((group: any) => {
        // Base approval changes based on economic index
        const economicImpact = (gameState?.economicIndex || 100 - 100) * 0.1;

        // Random opinion drift
        const drift = (Math.random() - 0.5) * 5;

        // Calculate new approval (keep within -100 to +100)
        group.approval = Math.max(-100, Math.min(100, group.approval + economicImpact + drift));
      });

      await session.save();
    } catch (error) {
      console.error('Update population opinion error:', error);
      throw error;
    }
  }

  /**
   * Process player actions from the action queue
   */
  private async processActions(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) return;

      // Get all actions for this turn
      const actions = await models.Action.find({
        sessionId,
        turn: session.currentTurn,
        processed: false,
      });

      for (const action of actions) {
        await this.executeAction(action, sessionId, session);
        action.processed = true;
        await action.save();
      }
    } catch (error) {
      console.error('Process actions error:', error);
      throw error;
    }
  }

  /**
   * Execute a single player action
   */
  private async executeAction(action: any, sessionId: string, session: any): Promise<void> {
    try {
      const player = await models.Player.findById(action.playerId);

      if (!player) return;

      switch (action.type) {
        case 'campaign':
          // Increase approval for target archetype
          this.applyCampaignEffect(session, action.targetArchetype, 5);
          break;

        case 'policy_proposal':
          // Propose a new policy
          const policy = new models.Policy({
            sessionId,
            proposedBy: action.playerId,
            title: action.title,
            description: action.description,
            effects: action.effects,
            turn: session.currentTurn,
          });
          await policy.save();
          break;

        case 'market_trade':
          // Execute market trade (deferred to trading system)
          console.log(`Market trade for player ${action.playerId}: ${action.details}`);
          break;

        case 'event_response':
          // Respond to event (affects player reputation)
          const approvalChange = action.responseType === 'positive' ? 10 : -10;
          this.applyCampaignEffect(session, action.targetArchetype, approvalChange);
          break;

        default:
          console.warn(`Unknown action type: ${action.type}`);
      }
    } catch (error) {
      console.error('Execute action error:', error);
      throw error;
    }
  }

  /**
   * Apply campaign effects to population groups
   */
  private applyCampaignEffect(session: any, targetArchetype: string, approvalDelta: number): void {
    const groups = session.world.populationGroups;

    groups.forEach((group: any) => {
      if (group.archetype === targetArchetype) {
        group.approval = Math.max(-100, Math.min(100, group.approval + approvalDelta));
      }
    });
  }

  /**
   * Generate random events based on game conditions
   * Base probability: 15%, scaled by political stability
   */
  private async generateEvents(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      const gameState = await models.GameState.findOne({ sessionId });

      if (!session || !gameState) return;

      // Adjust event probability by stability
      const stabilityFactor = gameState.politicalStability / 100;
      const baseEventChance = 0.15;
      const eventChance = baseEventChance * (2 - stabilityFactor); // Higher instability = more events

      if (Math.random() < eventChance) {
        const event = this.generateRandomEvent(session, gameState);
        const savedEvent = new models.Event(event);
        await savedEvent.save();

        gameState.globalEvents.push(savedEvent._id);
        await gameState.save();
      }
    } catch (error) {
      console.error('Generate events error:', error);
      throw error;
    }
  }

  /**
   * Create a random event based on game state
   */
  private generateRandomEvent(session: any, gameState: any): any {
    const eventTypes = [
      { name: 'Economic Boom', severity: 5, effects: { economicIndex: 15 } },
      { name: 'Market Crash', severity: 8, effects: { economicIndex: -20 } },
      { name: 'Political Scandal', severity: 6, effects: { politicalStability: -15 } },
      { name: 'Population Unrest', severity: 7, effects: { socialStability: -20 } },
      { name: 'Natural Disaster', severity: 9, effects: { economicIndex: -30, socialStability: -25 } },
      { name: 'Tech Breakthrough', severity: 4, effects: { economicIndex: 10 } },
      { name: 'Trade Agreement', severity: 5, effects: { economicIndex: 12 } },
      { name: 'Labor Strike', severity: 7, effects: { economicIndex: -15, socialStability: -10 } },
    ];

    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

    return {
      sessionId: session._id,
      name: eventType.name,
      description: `${eventType.name} has occurred in the world.`,
      severity: eventType.severity,
      type: 'global',
      effects: eventType.effects,
      turn: session.currentTurn,
      status: 'pending', // Awaiting GM approval
      duration: Math.floor(Math.random() * 5) + 1, // 1-5 turns
    };
  }

  /**
   * Distribute company profits to shareholders/owners
   * Each market's companies distribute quarterly profits
   */
  private async distributeCompanyProfits(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const companies = session.world.companies;

      companies.forEach((company: any) => {
        // Calculate quarterly profit
        const quarterlyProfit = company.profit * 0.25; // 25% of annual profit per quarter

        // Distribute 70% to shareholders, 30% reinvest
        company.profit = company.profit * 0.70 + (quarterlyProfit * 0.30);

        // Employee satisfaction based on profit
        company.publicSentiment = Math.min(100, company.publicSentiment + (quarterlyProfit > 50000 ? 2 : -1));
      });

      await session.save();
    } catch (error) {
      console.error('Distribute company profits error:', error);
      throw error;
    }
  }

  /**
   * Update player reputation based on population approval
   */
  private async updatePlayerReputation(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      const players = await models.Player.find({ currentSessionId: sessionId });

      if (!session) return;

      const groups = session.world.populationGroups;

      for (const player of players) {
        let totalApproval = 0;
        let count = 0;

        // Average approval from all groups
        groups.forEach((group: any) => {
          if (player.approval && player.approval[group.name] !== undefined) {
            totalApproval += player.approval[group.name];
            count++;
          }
        });

        if (count > 0) {
          player.overallApproval = totalApproval / count;
          await player.save();
        }
      }
    } catch (error) {
      console.error('Update player reputation error:', error);
      throw error;
    }
  }

  /**
   * Advance the turn counter and reset daily actions
   */
  private async advanceTurn(sessionId: string): Promise<void> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      session.currentTurn += 1;
      session.turnStartTime = new Date();
      session.turnEndTime = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await session.save();
    } catch (error) {
      console.error('Advance turn error:', error);
      throw error;
    }
  }

  /**
   * Apply policy effects to markets and population
   */
  async applyPolicy(sessionId: string, policyId: string): Promise<void> {
    try {
      const policy = await models.Policy.findById(policyId);
      const session = await models.Session.findById(sessionId);
      const gameState = await models.GameState.findOne({ sessionId });

      if (!policy || !session || !gameState) return;

      // Apply numeric effects
      if ((policy as any).effects) {
        if ((policy as any).effects.economicIndex) gameState.economicIndex += (policy as any).effects.economicIndex;
        if ((policy as any).effects.socialStability) gameState.socialStability += (policy as any).effects.socialStability;
        if ((policy as any).effects.politicalStability) gameState.politicalStability += (policy as any).effects.politicalStability;
      }

      // Apply population group effects
      const groups = session.world.populationGroups;
      groups.forEach((group: any) => {
        if ((policy as any).supportedArchetypes?.includes(group.archetype)) {
          group.approval += 10;
        }
        if ((policy as any).opposedArchetypes?.includes(group.archetype)) {
          group.approval -= 10;
        }
      });

      // Clamp values
      gameState.economicIndex = Math.max(0, Math.min(200, gameState.economicIndex));
      gameState.socialStability = Math.max(0, Math.min(200, gameState.socialStability));
      gameState.politicalStability = Math.max(0, Math.min(200, gameState.politicalStability));

      (policy as any).status = 'active';
      await policy.save();
      await gameState.save();
      await session.save();
    } catch (error) {
      console.error('Apply policy error:', error);
      throw error;
    }
  }

  /**
   * Get current game state for display
   */
  async getGameState(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      const gameState = await models.GameState.findOne({ sessionId });

      if (!session || !gameState) return null;

      return {
        turn: session.currentTurn,
        sessionName: session.name,
        economicIndex: gameState.economicIndex,
        socialStability: gameState.socialStability,
        politicalStability: gameState.politicalStability,
        turnEndTime: session.turnEndTime,
        recentEvents: gameState.globalEvents.slice(-5),
      };
    } catch (error) {
      console.error('Get game state error:', error);
      throw error;
    }
  }
}

export default new GameSimulationEngine();
