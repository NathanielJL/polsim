import axios, { AxiosInstance } from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface PlayerProfile {
  id: string;
  username: string;
  email: string;
  bio?: string;
  displayName?: string;
  overallApproval: number;
  approval: Record<string, number>;
  isGameMaster?: boolean;
}

/**
 * API client service for frontend
 */
class APIClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Load token from localStorage on init
    this.token = localStorage.getItem('authToken');
    if (this.token) {
      this.setAuthHeader(this.token);
    }

    // Add request interceptor for auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.logout();
        }
        return Promise.reject(error);
      }
    );
  }

  private setAuthHeader(token: string): void {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Register a new player
   */
  async register(data: RegisterRequest): Promise<{ token: string; player: PlayerProfile }> {
    const response = await this.client.post('/auth/register', data);
    const { token, player } = response.data;
    this.setToken(token);
    return { token, player };
  }

  /**
   * Login with credentials
   */
  async login(data: LoginRequest): Promise<{ token: string; player: PlayerProfile }> {
    const response = await this.client.post('/auth/login', data);
    const { token, player } = response.data;
    this.setToken(token);
    return { token, player };
  }

  /**
   * Verify current token
   */
  async verify(): Promise<{ valid: boolean; player: PlayerProfile }> {
    return (await this.client.post('/auth/verify')).data;
  }

  /**
   * Logout (clears local token)
   */
  async logout(): Promise<void> {
    try {
      await this.client.post('/auth/logout');
    } catch (error) {
      // Ignore errors on logout
    }
    this.clearToken();
  }

  /**
   * Get player profile by ID
   */
  async getPlayer(playerId: string): Promise<PlayerProfile> {
    return (await this.client.get(`/api/players/${playerId}`)).data;
  }

  /**
   * Get current player's profile (protected)
   */
  async getMyProfile(): Promise<PlayerProfile> {
    return (await this.client.get('/api/players/me/profile')).data;
  }

  /**
   * Update current player's profile (protected)
   */
  async updateMyProfile(data: { bio?: string; displayName?: string }): Promise<PlayerProfile> {
    return (await this.client.put('/api/players/me/profile', data)).data;
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(limit: number = 50, skip: number = 0): Promise<{
    players: PlayerProfile[];
    total: number;
    limit: number;
    skip: number;
  }> {
    return (
      await this.client.get('/api/players/leaderboard', {
        params: { limit, skip },
      })
    ).data;
  }

  /**
   * Get player's reputation breakdown
   */
  async getPlayerReputation(playerId: string): Promise<{
    overall: number;
    byGroup: Record<string, number>;
  }> {
    return (await this.client.get(`/api/players/${playerId}/reputation`)).data;
  }

  // ===== GAME SESSIONS =====

  /**
   * Create a new game session
   */
  async createGameSession(sessionName: string): Promise<{
    message: string;
    session: {
      id: string;
      name: string;
      currentTurn: number;
      startedAt: string;
      turnEndTime: string;
      world: {
        numProvinces: number;
        numMarkets: number;
        numPopulationGroups: number;
      };
    };
  }> {
    return (await this.client.post('/api/sessions', { sessionName })).data;
  }

  /**
   * Get current active game session
   */
  async getCurrentGameSession(): Promise<{
    id: string;
    name: string;
    currentTurn: number;
    startedAt: string;
    turnEndTime: string;
    world: {
      numProvinces: number;
      numMarkets: number;
      numPopulationGroups: number;
    };
  }> {
    return (await this.client.get('/api/sessions/current')).data;
  }

  /**
   * Get specific game session
   */
  async getGameSession(sessionId: string): Promise<{
    id: string;
    name: string;
    currentTurn: number;
    startedAt: string;
    turnEndTime: string;
    world: {
      numProvinces: number;
      numMarkets: number;
      numPopulationGroups: number;
    };
  }> {
    return (await this.client.get(`/api/sessions/${sessionId}`)).data;
  }

  /**
   * Get world data (all provinces, markets, population groups, companies)
   */
  async getWorldData(sessionId: string): Promise<{
    provinces: any[];
    markets: any[];
    populationGroups: any[];
    companies: any[];
  }> {
    return (await this.client.get(`/api/sessions/${sessionId}/world`)).data;
  }

  /**
   * Get all markets in session
   */
  async getMarkets(sessionId: string): Promise<any[]> {
    return (await this.client.get(`/api/sessions/${sessionId}/markets`)).data;
  }

  /**
   * Get all population groups in session
   */
  async getPopulationGroups(sessionId: string): Promise<any[]> {
    return (await this.client.get(`/api/sessions/${sessionId}/population-groups`)).data;
  }

  /**
   * Get all companies in session
   */
  async getCompanies(sessionId: string): Promise<any[]> {
    return (await this.client.get(`/api/sessions/${sessionId}/companies`)).data;
  }

  /**
   * Create a new game session
   */
  async createGameSession(sessionName: string, playerIds?: string[]): Promise<any> {
    const response = await this.client.post('/api/sessions', {
      sessionName,
      playerIds,
    });
    return response.data;
  }

  /**
   * Get player dashboard
   */
  async getGameDashboard(sessionId: string): Promise<any> {
    const response = await this.client.get(`/api/dashboard/${sessionId}`);
    return response.data;
  }

  /**
   * Get market data
   */
  async getMarketData(sessionId: string): Promise<any> {
    const response = await this.client.get(`/api/dashboard/${sessionId}/markets`);
    return response.data;
  }

  /**
   * Get population sentiment
   */
  async getPopulationSentiment(sessionId: string): Promise<any> {
    const response = await this.client.get(`/api/dashboard/${sessionId}/population`);
    return response.data;
  }

  /**
   * Get player portfolio
   */
  async getPortfolio(sessionId: string): Promise<any> {
    const response = await this.client.get(`/api/dashboard/${sessionId}/portfolio`);
    return response.data;
  }

  /**
   * Buy stock
   */
  async buyStock(sessionId: string, stockMarketId: string, shares: number): Promise<any> {
    const response = await this.client.post(`/api/trading/${sessionId}/buy-stock`, {
      stockMarketId,
      shares,
    });
    return response.data;
  }

  /**
   * Sell stock
   */
  async sellStock(sessionId: string, stockMarketId: string, shares: number): Promise<any> {
    const response = await this.client.post(`/api/trading/${sessionId}/sell-stock`, {
      stockMarketId,
      shares,
    });
    return response.data;
  }

  /**
   * Buy market item
   */
  async buyMarketItem(sessionId: string, marketItemId: string, quantity: number): Promise<any> {
    const response = await this.client.post(`/api/trading/${sessionId}/buy-item`, {
      marketItemId,
      quantity,
    });
    return response.data;
  }

  /**
   * Sell market item
   */
  async sellMarketItem(sessionId: string, marketItemId: string, quantity: number): Promise<any> {
    const response = await this.client.post(`/api/trading/${sessionId}/sell-item`, {
      marketItemId,
      quantity,
    });
    return response.data;
  }

  /**
   * Get turn status
   */
  async getTurnStatus(sessionId: string): Promise<any> {
    const response = await this.client.get(`/api/dashboard/${sessionId}/turn-status`);
    return response.data;
  }

  /**
   * Set auth token and save to localStorage
   */
  private setToken(token: string): void {
    this.token = token;
    localStorage.setItem('authToken', token);
    this.setAuthHeader(token);
  }

  /**
   * Clear auth token
   */
  private clearToken(): void {
    this.token = null;
    localStorage.removeItem('authToken');
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Get all provinces for a session
   */
  async getProvinces(sessionId: string): Promise<any[]> {
    const response = await this.client.get(`/api/map/${sessionId}/provinces`);
    return response.data.provinces || [];
  }

  /**
   * Get all cells for map rendering
   */
  async getCells(sessionId: string): Promise<any[]> {
    const response = await this.client.get(`/api/map/${sessionId}/cells`, {
      headers: { 'Cache-Control': 'no-cache' },
      params: { _t: Date.now() } // Cache buster
    });
    return response.data.cells || [];
  }

  /**
   * Get province details including cells
   */
  async getProvinceDetails(sessionId: string, provinceId: string): Promise<any> {
    const response = await this.client.get(`/api/map/${sessionId}/provinces/${provinceId}`);
    return response.data;
  }
}

// Export singleton instance
export default new APIClient();
