import { models } from '../models/mongoose';

/**
 * Game initialization and world generation service
 * Handles creation of game worlds, provinces, markets, and population groups
 */

// 9 Base Political Archetypes
const BASE_ARCHETYPES = [
  { name: 'Libertarians', economic: 75, social: 50, personalFreedom: 100 },
  { name: 'Socialists', economic: -80, social: -20, personalFreedom: 20 },
  { name: 'Conservatives', economic: 60, social: -70, personalFreedom: -40 },
  { name: 'Progressives', economic: -40, social: 80, personalFreedom: 70 },
  { name: 'Centrists', economic: 10, social: 10, personalFreedom: 10 },
  { name: 'Nationalists', economic: 20, social: -60, personalFreedom: -30 },
  { name: 'Environmentalists', economic: -50, social: 40, personalFreedom: 30 },
  { name: 'Aristocrats', economic: 80, social: -80, personalFreedom: -60 },
  { name: 'Workers Union', economic: -70, social: 30, personalFreedom: -10 },
];

// 6 Major Markets
const MARKETS = [
  { name: 'Healthcare', basePrice: 100, volatility: 0.15 },
  { name: 'Transportation', basePrice: 100, volatility: 0.12 },
  { name: 'Housing', basePrice: 100, volatility: 0.18 },
  { name: 'Food Production', basePrice: 100, volatility: 0.14 },
  { name: 'Technology', basePrice: 100, volatility: 0.22 },
  { name: 'Manufacturing', basePrice: 100, volatility: 0.16 },
];

// 5 Provinces/Regions
const PROVINCES = [
  { name: 'Northern District', population: 1000000 },
  { name: 'Eastern Region', population: 1500000 },
  { name: 'Southern Territory', population: 1200000 },
  { name: 'Western Zone', population: 900000 },
  { name: 'Central Hub', population: 2000000 },
];

export class GameInitializationService {
  /**
   * Create a new game session (multiplayer - requires GM and players)
   */
  async createGameSession(
    gmId: string,
    sessionName: string,
    playerIds: string[] = []
  ): Promise<any> {
    try {
      // DEV MODE: Create dev player if it doesn't exist
      if (process.env.DEV_MODE === 'true') {
        const existingPlayer = await models.Player.findOne({ username: 'devplayer' });
        if (!existingPlayer) {
          const devPlayer = new models.Player({
            _id: 'dev-player-1',
            username: 'devplayer',
            email: 'dev@polsim.local',
            passwordHash: 'hashed',
            ideologyPoint: { economic: 0, social: 0, personalFreedom: 0 },
            approval: {},
          });
          await devPlayer.save();
        }
        gmId = 'dev-player-1';
      }

      // Create world
      const world = await this.generateWorld();

      // Create game session with GM and players
      const allPlayers = [gmId, ...playerIds.filter(id => id !== gmId)];
      
      const session = new models.Session({
        name: sessionName,
        gamemaster: gmId,
        players: allPlayers,
        status: 'active',
        currentTurn: 1,
        startedAt: new Date(),
        turnStartTime: new Date(),
        turnEndTime: new Date(Date.now() + 24 * 60 * 60 * 1000),
        autoAdvanceEnabled: true,
        world: {
          provinces: world.provinces,
          markets: world.markets,
          populationGroups: world.populationGroups,
          companies: world.companies,
        },
      });

      await session.save();

      // Initialize game state
      const gameState = new models.GameState({
        sessionId: session._id,
        turn: 1,
        economicIndex: 100,
        socialStability: 100,
        politicalStability: 100,
        globalEvents: [],
      });

      await gameState.save();

      // Initialize stock markets
      await this.initializeStockMarkets(session._id, world.markets);

      // Initialize market items
      await this.initializeMarketItems(session._id, world.markets);

      // Initialize portfolios for all players
      for (const playerId of allPlayers) {
        const portfolio = new models.PlayerPortfolio({
          playerId,
          sessionId: session._id,
          cash: 100000,
          stocks: [],
          marketItems: [],
        });
        await portfolio.save();
      }

      return session;
    } catch (error) {
      console.error('Error creating game session:', error);
      throw error;
    }
  }

  /**
   * Initialize stock markets for all sectors
   */
  private async initializeStockMarkets(sessionId: string, markets: any[]): Promise<void> {
    const sectors = ['Healthcare', 'Transportation', 'Housing', 'Food Production', 'Technology', 'Manufacturing'];
    
    for (const sector of sectors) {
      const market = markets.find(m => m.name === sector);
      const basePrice = market ? market.currentPrice : 100;

      const stockMarket = new models.StockMarket({
        id: `stock-${sector}-${sessionId}`,
        sessionId,
        sector,
        currentPrice: basePrice,
        basePrice,
        priceHistory: [{ turn: 1, price: basePrice }],
        volatility: market?.volatility || 0.15,
        totalShares: 10000,
        outstandingShares: 10000,
      });

      await stockMarket.save();
    }
  }

  /**
   * Initialize market items (homes, weapons, companies)
   */
  private async initializeMarketItems(sessionId: string, markets: any[]): Promise<void> {
    const items = [
      { name: 'Residential Home', category: 'home', market: 'Housing', basePrice: 250000 },
      { name: 'Commercial Property', category: 'home', market: 'Housing', basePrice: 500000 },
      { name: 'Handgun', category: 'weapon', market: 'Manufacturing', basePrice: 500 },
      { name: 'Rifle', category: 'weapon', market: 'Manufacturing', basePrice: 1200 },
      { name: 'Defense System', category: 'weapon', market: 'Manufacturing', basePrice: 50000 },
    ];

    for (const item of items) {
      const marketItem = new models.MarketItem({
        id: `item-${item.category}-${item.name}-${sessionId}`,
        sessionId,
        name: item.name,
        category: item.category,
        market: item.market,
        currentPrice: item.basePrice,
        basePrice: item.basePrice,
        quantity: 100,
        priceHistory: [{ turn: 1, price: item.basePrice }],
      });

      await marketItem.save();
    }
  }

  /**
   * Get a game session by ID
   */
  async getGameSessionById(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId)
        .populate('gamemaster', 'username email')
        .populate('players', 'username email');

      return session;
    } catch (error) {
      console.error('Error getting game session:', error);
      throw error;
    }
  }

  /**
   * Get active session for a player (legacy support for single player sessions)
   */
  async getGameSession(playerId: string): Promise<any> {
    try {
      const session = await models.Session.findOne({
        players: playerId,
        status: 'active',
      })
        .populate('gamemaster', 'username email')
        .populate('players', 'username email');

      return session;
    } catch (error) {
      console.error('Error getting game session:', error);
      throw error;
    }
  }

  /**
   * Generate world data (provinces, markets, population groups, companies)
   */
  private async generateWorld(): Promise<any> {
    const provinces = this.generateProvinces();
    const markets = this.generateMarkets();
    const populationGroups = this.generatePopulationGroups();
    const companies = this.generateCompanies(markets);

    return {
      provinces,
      markets,
      populationGroups,
      companies,
    };
  }

  /**
   * Generate provinces with initial government structure
   */
  private generateProvinces(): any[] {
    return PROVINCES.map((province) => ({
      name: province.name,
      population: province.population,
      governmentType: 'democracy', // Default government type
      laws: [], // Will be populated as game progresses
      markets: MARKETS.map((m) => m.name),
      approval: {}, // Will be calculated from population groups
    }));
  }

  /**
   * Generate markets with initial prices and supply/demand
   */
  private generateMarkets(): any[] {
    return MARKETS.map((market) => ({
      name: market.name,
      currentPrice: market.basePrice,
      priceHistory: [{ turn: 1, price: market.basePrice }],
      supply: 100,
      demand: 100,
      volatility: market.volatility,
      producers: [], // Companies that produce this market good
      consumers: [], // Population groups that consume from market
    }));
  }

  /**
   * Generate population groups for each archetype
   * Each archetype has multiple wealth classes
   */
  private generatePopulationGroups(): any[] {
    const groups: any[] = [];

    BASE_ARCHETYPES.forEach((archetype) => {
      // Create 4 wealth classes per archetype: Poor, Working, Middle, Rich
      const classes = [
        { name: 'Poor', percentage: 0.4, wealthMultiplier: 0.5 },
        { name: 'Working', percentage: 0.35, wealthMultiplier: 1.0 },
        { name: 'Middle', percentage: 0.2, wealthMultiplier: 1.8 },
        { name: 'Rich', percentage: 0.05, wealthMultiplier: 4.0 },
      ];

      classes.forEach((cls) => {
        groups.push({
          name: `${cls.name} ${archetype.name}`,
          archetype: archetype.name,
          class: cls.name,
          population: Math.floor(PROVINCES.reduce((sum, p) => sum + p.population, 0) * 0.05 * cls.percentage), // ~5% per group
          ideologyPoint: {
            economic: archetype.economic,
            social: archetype.social,
            personalFreedom: archetype.personalFreedom,
          },
          approval: 50, // Neutral at start
          politicalInfluence: cls.percentage * cls.wealthMultiplier,
          marketPreferences: this.generateMarketPreferences(archetype.name),
        });
      });
    });

    return groups;
  }

  /**
   * Generate market preferences based on archetype
   */
  private generateMarketPreferences(archetype: string): Record<string, number> {
    const basePreferences: Record<string, number> = {
      'Healthcare': 0.5,
      'Transportation': 0.4,
      'Housing': 0.6,
      'Food Production': 0.7,
      'Technology': 0.3,
      'Manufacturing': 0.4,
    };

    // Adjust based on archetype values
    switch (archetype) {
      case 'Socialists':
        basePreferences['Healthcare'] = 0.9;
        basePreferences['Food Production'] = 0.8;
        break;
      case 'Libertarians':
        basePreferences['Manufacturing'] = 0.8;
        basePreferences['Technology'] = 0.8;
        break;
      case 'Environmentalists':
        basePreferences['Transportation'] = 0.2;
        basePreferences['Manufacturing'] = 0.2;
        break;
      case 'Aristocrats':
        basePreferences['Technology'] = 0.9;
        basePreferences['Housing'] = 0.9;
        break;
      case 'Workers Union':
        basePreferences['Housing'] = 0.8;
        basePreferences['Manufacturing'] = 0.7;
        break;
    }

    return basePreferences;
  }

  /**
   * Generate companies that operate in markets
   */
  private generateCompanies(markets: any[]): any[] {
    const companies: any[] = [];

    markets.forEach((market) => {
      // 2-3 companies per market
      const numCompanies = Math.floor(Math.random() * 2) + 2;

      for (let i = 0; i < numCompanies; i++) {
        companies.push({
          name: `${market.name} Corp ${i + 1}`,
          market: market.name,
          revenue: Math.random() * 1000000 + 500000,
          profit: Math.random() * 100000 + 50000,
          marketShare: 1 / (numCompanies + 1),
          employees: Math.floor(Math.random() * 5000) + 500,
          publicSentiment: 50 + Math.random() * 40, // 50-90
        });
      }
    });

    return companies;
  }

  /**
   * Get existing game session for player
   */
  async getGameSession(playerId: string, sessionId?: string): Promise<any> {
    try {
      if (sessionId) {
        return await models.Session.findOne({
          _id: sessionId,
          playerId,
          status: 'active',
        });
      }

      return await models.Session.findOne({
        playerId,
        status: 'active',
      });
    } catch (error) {
      console.error('Error fetching game session:', error);
      throw error;
    }
  }

  /**
   * Get world data for a session
   */
  async getWorldData(sessionId: string): Promise<any> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      return session.world;
    } catch (error) {
      console.error('Error fetching world data:', error);
      throw error;
    }
  }

  /**
   * List all archetype groups in world
   */
  async getPopulationGroups(sessionId: string): Promise<any[]> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      return session.world.populationGroups;
    } catch (error) {
      console.error('Error fetching population groups:', error);
      throw error;
    }
  }

  /**
   * List all markets in world
   */
  async getMarkets(sessionId: string): Promise<any[]> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      return session.world.markets;
    } catch (error) {
      console.error('Error fetching markets:', error);
      throw error;
    }
  }

  /**
   * List all companies in world
   */
  async getCompanies(sessionId: string): Promise<any[]> {
    try {
      const session = await models.Session.findById(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      return session.world.companies;
    } catch (error) {
      console.error('Error fetching companies:', error);
      throw error;
    }
  }
}

export default new GameInitializationService();
