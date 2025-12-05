/**
 * HOME PAGE - Map-Centric Game Interface
 * 
 * Main interface:
 * - Central map of Zealandia
 * - Player stats panel (right side, open/closable)
 * - Game menus (left side)
 * - Single continuous multiplayer lobby
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { player } = useAuth();
  const { session, loading, error, loadCurrentSession, clearError } = useGameStore();
  const [statsOpen, setStatsOpen] = useState(true);

  useEffect(() => {
    loadCurrentSession();
  }, []);

  if (loading) {
    return (
      <div className="home-page loading-screen">
        <div className="loading-content">
          <h1>Loading Zealandia...</h1>
          <p>Connecting to global session</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="home-page error-screen">
        <div className="error-content">
          <h1>Unable to Load Game</h1>
          <p>{error || 'There was a problem connecting to the global game session.'}</p>
          <div className="error-actions">
            <button onClick={() => loadCurrentSession()} className="btn-primary">
              Retry Connection
            </button>
            <button onClick={clearError} className="btn-secondary">
              Dismiss
            </button>
          </div>
          <div className="help-text">
            <h3>First time here?</h3>
            <p>This is a single continuous multiplayer lobby. No signup beyond registration is needed.</p>
            <p>If you just registered, try refreshing the page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page game-interface">
      {/* Left Menu Bar */}
      <div className="left-menu">
        <div className="menu-header">
          <h2>Zealandia</h2>
          <p className="turn-info">Turn {session.currentTurn}</p>
        </div>
        
        <nav className="game-nav">
          <button onClick={() => navigate('/government')} className="nav-btn">
            <span className="icon">🏛️</span>
            <span>Government</span>
          </button>
          <button onClick={() => navigate('/markets')} className="nav-btn">
            <span className="icon">💰</span>
            <span>Markets</span>
          </button>
          <button onClick={() => navigate('/business')} className="nav-btn">
            <span className="icon">🏢</span>
            <span>Business</span>
          </button>
          <button onClick={() => navigate('/news')} className="nav-btn">
            <span className="icon">📰</span>
            <span>News</span>
          </button>
          <button onClick={() => navigate('/legal')} className="nav-btn">
            <span className="icon">⚖️</span>
            <span>Legal</span>
          </button>
          <button onClick={() => navigate('/elections')} className="nav-btn">
            <span className="icon">🗳️</span>
            <span>Elections</span>
          </button>
        </nav>
      </div>

      {/* Central Map */}
      <div className="map-container">
        <div className="map-placeholder">
          <h2>Map of Zealandia</h2>
          <p>Interactive map will be displayed here</p>
          <p className="map-note">Click provinces to interact, manage resources, and view demographics</p>
        </div>
      </div>

      {/* Right Stats Panel */}
      <div className={`right-panel ${statsOpen ? 'open' : 'closed'}`}>
        <button 
          className="panel-toggle"
          onClick={() => setStatsOpen(!statsOpen)}
          aria-label={statsOpen ? 'Close panel' : 'Open panel'}
        >
          {statsOpen ? '→' : '←'}
        </button>
        
        {statsOpen && (
          <div className="panel-content">
            <div className="player-header">
              <h3>{player?.username}</h3>
              <p className="player-location">Location: Province Name</p>
            </div>

            <div className="player-stats">
              <div className="stat-item">
                <span className="label">Cash:</span>
                <span className="value">£{player?.cash?.toLocaleString() || 0}</span>
              </div>
              <div className="stat-item">
                <span className="label">Reputation:</span>
                <span className="value">{player?.reputation || 0}%</span>
              </div>
              <div className="stat-item">
                <span className="label">Actions:</span>
                <span className="value">{player?.actionsRemaining || 0} / 5</span>
              </div>
            </div>

            <div className="session-info">
              <h4>Global Session</h4>
              <p><strong>{session.name}</strong></p>
              <p>Turn ends: {new Date(session.turnEndTime).toLocaleTimeString()}</p>
              <p>Players: {session.world.numPopulationGroups} active</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
