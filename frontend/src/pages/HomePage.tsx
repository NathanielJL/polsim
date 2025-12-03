/**
 * HOME PAGE - Player Dashboard/Game Session Hub
 * 
 * Central hub showing:
 * - Active game session or create new game
 * - Game world information
 * - Quick start guide
 * - Player statistics
 */

import React, { useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import '../styles/HomePage.css';

function HomePage() {
  const { player } = useAuth();
  const { session, loading, error, loadCurrentSession, createNewSession, clearError } = useGameStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [sessionName, setSessionName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadCurrentSession();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    setIsCreating(true);
    try {
      await createNewSession(sessionName);
      setSessionName('');
      setShowCreateForm(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="home-page">
      <div className="home-container">
        {/* Header */}
        <div className="home-header">
          <h1>POLSIM - Political Economy Simulator</h1>
          <p>Welcome back, {player?.username}!</p>
        </div>

        {/* Game Status */}
        {error && (
          <div className="error-message">
            {error}
            <button onClick={clearError} className="close-btn">×</button>
          </div>
        )}

        {loading ? (
          <div className="loading">Loading game session...</div>
        ) : session ? (
          <div className="game-status">
            <div className="session-card">
              <h2>{session.name}</h2>
              <div className="session-info">
                <div className="info-row">
                  <span className="label">Current Turn:</span>
                  <span className="value">{session.currentTurn}</span>
                </div>
                <div className="info-row">
                  <span className="label">World Provinces:</span>
                  <span className="value">{session.world.numProvinces}</span>
                </div>
                <div className="info-row">
                  <span className="label">Active Markets:</span>
                  <span className="value">{session.world.numMarkets}</span>
                </div>
                <div className="info-row">
                  <span className="label">Population Groups:</span>
                  <span className="value">{session.world.numPopulationGroups}</span>
                </div>
                <div className="info-row">
                  <span className="label">Turn Ends:</span>
                  <span className="value">{new Date(session.turnEndTime).toLocaleString()}</span>
                </div>
              </div>
              <div className="session-actions">
                <button className="btn-primary">Continue Playing</button>
                <button className="btn-secondary">View World</button>
                <button className="btn-secondary">View Markets</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="no-session">
            <div className="empty-state">
              <h2>No Active Game Session</h2>
              <p>Create a new game to begin exploring the world of POLSIM.</p>
              
              {!showCreateForm ? (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="btn-primary"
                >
                  Create New Game
                </button>
              ) : (
                <form onSubmit={handleCreateSession} className="create-form">
                  <div className="form-group">
                    <label htmlFor="sessionName">Game Name</label>
                    <input
                      type="text"
                      id="sessionName"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="e.g., My First Game"
                      required
                      disabled={isCreating}
                      autoFocus
                    />
                  </div>
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={isCreating || !sessionName.trim()}
                    >
                      {isCreating ? 'Creating...' : 'Create Game'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => setShowCreateForm(false)}
                      disabled={isCreating}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Game Overview */}
        <div className="game-overview">
          <div className="overview-card">
            <h3>Game Features</h3>
            <ul>
              <li>9 Political Archetypes with dynamic evolution</li>
              <li>6 Major Markets with supply/demand dynamics</li>
              <li>5 Provinces with independent governments</li>
              <li>Real-time action queue system (5 actions/turn)</li>
              <li>AI-driven event generation and news</li>
              <li>Game Master tools for world management</li>
            </ul>
          </div>

          <div className="overview-card">
            <h3>Quick Start</h3>
            <ol>
              <li>Create a new game session</li>
              <li>Explore the world and population groups</li>
              <li>Build influence through actions</li>
              <li>Trade in markets</li>
              <li>Propose policies and laws</li>
              <li>Watch your archetype evolve</li>
            </ol>
          </div>

          <div className="overview-card">
            <h3>Player Stats</h3>
            <div className="stats">
              <div className="stat">
                <span className="stat-label">Overall Approval:</span>
                <span className="stat-value">{player?.overallApproval || 0}%</span>
              </div>
              <div className="stat">
                <span className="stat-label">Active Games:</span>
                <span className="stat-value">{session ? 1 : 0}</span>
              </div>
              <div className="stat">
                <span className="stat-label">Total Turns Played:</span>
                <span className="stat-value">{session?.currentTurn || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
