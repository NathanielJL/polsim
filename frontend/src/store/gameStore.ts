import { create } from 'zustand';
import api from '../services/api';

export interface GameWorld {
  provinces: any[];
  markets: any[];
  populationGroups: any[];
  companies: any[];
}

export interface GameSession {
  id: string;
  name: string;
  gamemaster: string;
  players: string[];
  currentTurn: number;
  status: string;
  startedAt: string;
  turnEndTime: string;
  autoAdvanceEnabled: boolean;
  world: {
    numProvinces: number;
    numMarkets: number;
    numPopulationGroups: number;
  };
}

export interface PlayerDashboard {
  session: any;
  gameState: any;
  playerStats: any;
  portfolio: any;
  returns: any;
  markets: any;
  populationSentiment: any[];
  recentEvents: any;
}

interface GameStore {
  session: GameSession | null;
  world: GameWorld | null;
  dashboard: PlayerDashboard | null;
  loading: boolean;
  error: string | null;

  // Actions
  loadCurrentSession: () => Promise<void>;
  createNewSession: (sessionName: string, playerIds?: string[]) => Promise<void>;
  loadWorld: (sessionId: string) => Promise<void>;
  loadDashboard: (sessionId: string) => Promise<void>;
  clearError: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  session: null,
  world: null,
  dashboard: null,
  loading: false,
  error: null,

  loadCurrentSession: async () => {
    set({ loading: true, error: null });
    try {
      const session = await api.getCurrentGameSession();
      set({ session });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to load session';
      set({ error: errorMsg, session: null });
    } finally {
      set({ loading: false });
    }
  },

  createNewSession: async (sessionName: string, playerIds?: string[]) => {
    set({ loading: true, error: null });
    try {
      const response = await api.createGameSession(sessionName, playerIds);
      set({ session: response.session });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to create session';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  loadWorld: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const world = await api.getWorldData(sessionId);
      set({ world });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to load world';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  loadDashboard: async (sessionId: string) => {
    set({ loading: true, error: null });
    try {
      const dashboard = await api.getGameDashboard(sessionId);
      set({ dashboard });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Failed to load dashboard';
      set({ error: errorMsg });
    } finally {
      set({ loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
