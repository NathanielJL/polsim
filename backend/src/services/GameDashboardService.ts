/**
 * POLSIM - GAME DASHBOARD SERVICE
 * 
 * Provides comprehensive game data for player dashboards
 * Aggregates market data, population sentiment, player stats, events
 */

import { models } from '../models/mongoose';
import { TradingService } from './TradingService';

export class GameDashboardService {
  private tradingService: TradingService;

  constructor() {
    this.tradingService = new TradingService();
  }

  /**
   * Get complete game dashboard data for a player
   */
  async getPlayerDashboard(sessionId: string, playerId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId)
        .populate('gamemaster', 'username')
        .populate('players', 'username');

      if (!session) throw new Error('Session not found');

      const gameState = await models.GameState.findOne({ sessionId });
      const portfolio = await this.tradingService.getPortfolio(sessionId, playerId);
      const returns = await this.tradingService.calculateReturns(sessionId, playerId);
      const marketData = await this.getMarketData(sessionId);
      const populationSentiment = await this.getPopulationSentiment(sessionId);
      const playerStats = await this.getPlayerStats(sessionId, playerId);
      const recentEvents = await this.getRecentEvents(sessionId);

      return {
        session: {
          name: session.name,
          gamemaster: session.gamemaster.username,
          players: session.players.map((p: any) => p.username),
          currentTurn: session.currentTurn,
          status: session.status,
          autoAdvanceEnabled: session.autoAdvanceEnabled,
          turnEndTime: session.turnEndTime,
        },
        gameState: {
          economicIndex: gameState?.economicIndex || 0,
          socialStability: gameState?.socialStability || 0,
          politicalStability: gameState?.politicalStability || 0,
        },
        playerStats,
        portfolio: {
          cash: portfolio.cash,
          value: portfolio.portfolioValue.total,
          stockValue: portfolio.portfolioValue.stocks,
          itemValue: portfolio.portfolioValue.items,
          holdings: portfolio.stocks.length + portfolio.marketItems.length,
        },
        returns,
        markets: marketData,
        populationSentiment,
        recentEvents,
      };
    } catch (error) {
      console.error('Get player dashboard error:', error);
      throw error;
    }
  }

  /**
   * Get all market data (prices, trends, volatility)
   */
  async getMarketData(sessionId: string): Promise<any> {
    try {
      const stockMarkets = await models.StockMarket.find({ sessionId });
      const marketItems = await models.MarketItem.find({ sessionId });

      const stocks = stockMarkets.map((market: any) => {
        const priceHistory = market.priceHistory;
        const currentPrice = market.currentPrice;
        const prevPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : currentPrice;
        const change = ((currentPrice - prevPrice) / prevPrice) * 100;

        return {
          id: market._id,
          sector: market.sector,
          currentPrice,
          basePrice: market.basePrice,
          change: parseFloat(change.toFixed(2)),
          volatility: market.volatility,
          supply: market.supply,
          demand: market.demand,
          sharesAvailable: market.outstandingShares,
          priceHistory: priceHistory.slice(-10), // Last 10 turns
        };
      });

      const items = marketItems.map((item: any) => {
        const priceHistory = item.priceHistory;
        const currentPrice = item.currentPrice;
        const prevPrice = priceHistory.length > 1 ? priceHistory[priceHistory.length - 2].price : currentPrice;
        const change = ((currentPrice - prevPrice) / prevPrice) * 100;

        return {
          id: item._id,
          name: item.name,
          category: item.category,
          market: item.market,
          currentPrice,
          basePrice: item.basePrice,
          change: parseFloat(change.toFixed(2)),
          quantity: item.quantity,
          priceHistory: priceHistory.slice(-10),
        };
      });

      return {
        stocks,
        items,
      };
    } catch (error) {
      console.error('Get market data error:', error);
      throw error;
    }
  }

  /**
   * Get population sentiment and approval by archetype
   */
  async getPopulationSentiment(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      const populationGroups = session.world.populationGroups;
      const archetypes = new Map();

      // Group by archetype and calculate aggregate approval
      populationGroups.forEach((group: any) => {
        if (!archetypes.has(group.archetype)) {
          archetypes.set(group.archetype, {
            archetype: group.archetype,
            totalApproval: 0,
            groups: [],
            size: 0,
          });
        }

        const arcData = archetypes.get(group.archetype);
        arcData.totalApproval += group.approval * (group.size / 100);
        arcData.groups.push({
          id: group.id,
          class: this.getClassName(group.classLevel),
          approval: group.approval,
          size: group.size,
          employed: group.employed,
        });
        arcData.size += group.size;
      });

      // Convert to array and calculate average approval
      const sentiment = Array.from(archetypes.values()).map((arc: any) => ({
        archetype: arc.archetype,
        approval: parseFloat((arc.totalApproval / (arc.size / 100) || 0).toFixed(2)),
        size: arc.size,
        groups: arc.groups,
      }));

      return sentiment.sort((a, b) => b.approval - a.approval);
    } catch (error) {
      console.error('Get population sentiment error:', error);
      throw error;
    }
  }

  /**
   * Get player statistics and rankings
   */
  async getPlayerStats(sessionId: string, playerId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      const player = await models.Player.findById(playerId);

      if (!session || !player) throw new Error('Session or player not found');

      // Get all player portfolios for comparison
      const allPortfolios = await models.PlayerPortfolio.find({ sessionId }).populate(
        'playerId',
        'username'
      );

      // Calculate player ranking by total portfolio value
      const playerValues = allPortfolios.map(async (portfolio: any) => {
        let stockValue = 0;
        let itemValue = 0;

        for (const stock of portfolio.stocks) {
          const stockMarket = await models.StockMarket.findById(stock.stockMarketId);
          if (stockMarket) stockValue += stockMarket.currentPrice * stock.shares;
        }

        for (const item of portfolio.marketItems) {
          const marketItem = await models.MarketItem.findById(item.marketItemId);
          if (marketItem) itemValue += marketItem.currentPrice * item.quantity;
        }

        return {
          playerId: portfolio.playerId._id,
          username: portfolio.playerId.username,
          totalValue: portfolio.cash + stockValue + itemValue,
          cash: portfolio.cash,
        };
      });

      const playerValuesResolved = await Promise.all(playerValues);
      const ranked = playerValuesResolved.sort((a, b) => b.totalValue - a.totalValue);

      const playerRank = ranked.findIndex((p) => p.playerId.toString() === playerId) + 1;
      const playerData = playerValuesResolved.find((p) => p.playerId.toString() === playerId);

      // Get player action history
      const playerActions = await models.Action.find({
        sessionId,
        playerId,
        processed: true,
      })
        .sort({ processedAt: -1 })
        .limit(10);

      return {
        username: player.username,
        rank: playerRank,
        totalRanked: ranked.length,
        totalPortfolioValue: playerData?.totalValue || 0,
        cash: playerData?.cash || 0,
        recentActions: playerActions.map((action: any) => ({
          type: action.type,
          turn: action.turn,
          submitted: action.submitted,
          processed: action.processedAt,
        })),
      };
    } catch (error) {
      console.error('Get player stats error:', error);
      throw error;
    }
  }

  /**
   * Get recent events affecting game
   */
  async getRecentEvents(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) throw new Error('Session not found');

      // Get approved events from current turn
      const approvedEvents = await models.Event.find({
        _id: { $in: session.approvedEvents || [] },
      }).sort({ createdAt: -1 });

      // Get pending events awaiting approval
      const pendingEvents = await models.Event.find({
        _id: { $in: session.pendingEvents || [] },
      }).sort({ createdAt: -1 });

      return {
        approved: approvedEvents.map((event: any) => ({
          id: event._id,
          title: event.title,
          description: event.description,
          severity: event.severity,
          type: event.type,
          duration: event.duration,
          createdAt: event.createdAt,
        })),
        pending: pendingEvents.map((event: any) => ({
          id: event._id,
          title: event.title,
          description: event.description,
          severity: event.severity,
          type: event.type,
          duration: event.duration,
          createdAt: event.createdAt,
        })),
      };
    } catch (error) {
      console.error('Get recent events error:', error);
      throw error;
    }
  }

  /**
   * Get economic summary for game
   */
  async getEconomicSummary(sessionId: string): Promise<any> {
    try {
      const gameState = await models.GameState.findOne({ sessionId });
      const stockMarkets = await models.StockMarket.find({ sessionId });
      const session = await models.Session.findById(sessionId);

      if (!session || !gameState) throw new Error('Session or game state not found');

      // Calculate sector performance
      const sectorPerformance = stockMarkets.map((market: any) => {
        const priceHistory = market.priceHistory;
        const startPrice = priceHistory[0]?.price || market.basePrice;
        const endPrice = market.currentPrice;
        const performance = ((endPrice - startPrice) / startPrice) * 100;

        return {
          sector: market.sector,
          currentPrice: market.currentPrice,
          basePrice: market.basePrice,
          performance: parseFloat(performance.toFixed(2)),
          volatility: market.volatility,
        };
      });

      return {
        turn: session.currentTurn,
        economicIndex: gameState.economicIndex,
        socialStability: gameState.socialStability,
        politicalStability: gameState.politicalStability,
        sectorPerformance: sectorPerformance.sort(
          (a, b) => b.performance - a.performance
        ),
        topPerformer: sectorPerformance[0] || {},
        worstPerformer: sectorPerformance[sectorPerformance.length - 1] || {},
      };
    } catch (error) {
      console.error('Get economic summary error:', error);
      throw error;
    }
  }

  /**
   * Helper: Get class name from level
   */
  private getClassName(level: number): string {
    const names = ['', 'Poor', 'Working', 'Middle', 'Rich'];
    return names[level] || 'Unknown';
  }
}

export default new GameDashboardService();
