import { useState, useEffect, useCallback } from 'react';
import api, { PlayerProfile } from '../services/api';

export interface UseAuthReturn {
  player: PlayerProfile | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

/**
 * Hook to manage authentication state
 */
export function useAuth(): UseAuthReturn {
  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    const initializeAuth = async () => {
      if (api.isAuthenticated()) {
        try {
          const response = await api.verify();
          setPlayer(response.player);
          setError(null);
        } catch (err) {
          api.logout();
          setPlayer(null);
          setError('Session expired, please login again');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { player: playerData } = await api.login({ username, password });
      setPlayer(playerData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Login failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { player: playerData } = await api.register({ username, email, password });
      setPlayer(playerData);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Registration failed';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      setLoading(true);
      await api.logout();
      setPlayer(null);
      setError(null);
    } catch (err) {
      setError('Logout failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    player,
    loading,
    error,
    isAuthenticated: !!player,
    login,
    register,
    logout,
    clearError,
  };
}
