/**
 * HOME PAGE - Game Interface
 * 
 * Main interface:
 * - Player stats panel (right side, open/closable)
 * - Game menus (left side)
 * - Single continuous multiplayer lobby
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useGameStore } from '../store/gameStore';
import api from '../services/api';
import '../styles/HomePage.css';

function HomePage() {
  const navigate = useNavigate();
  const { player } = useAuth();
  const { session, loading, error, loadCurrentSession, clearError } = useGameStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [statsOpen, setStatsOpen] = useState(true);
  const [expandedMenus, setExpandedMenus] = useState<{[key: string]: boolean}>({});
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPaused, setIsPaused] = useState(false);
  const [wikiOpen, setWikiOpen] = useState(false);
  
  const toggleSubmenu = (menu: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menu]: !prev[menu]
    }));
  };

  useEffect(() => {
    loadCurrentSession();
    checkPauseState();
  }, []);

  const checkPauseState = async () => {
    try {
      const response = await api.get('/sessions/current');
      if (response.data) {
        setIsPaused(response.data.isPaused || false);
      }
    } catch (error) {
      console.error('Failed to check pause state:', error);
    }
  };

  const loadMapData = async () => {
    try {
      setLoadingMap(true);
      const response = await fetch('/maps/full.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const rawData = await response.json();
      console.log('Raw data structure:', Object.keys(rawData));
      
      // The actual structure has cells and provinces arrays at the root, not nested
      const data: MapData = {
        cells: rawData.cells || [],
        provinces: rawData.provinces || []
      };
      
      console.log('Map data loaded - Cells:', data.cells?.length, 'Provinces:', data.provinces?.length);
      setMapData(data);
    } catch (error) {
      console.error('Failed to load map data:', error);
    } finally {
      setLoadingMap(false);
    }
  };

  // Update time every second for clock
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Poll for pause state changes
  useEffect(() => {
    const interval = setInterval(() => {
      checkPauseState();
    }, 5000);
    return () => clearInterval(interval);
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
      {/* Top Header */}
      <div className="top-header">
        <button 
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="game-title">Zealandia</h1>
      </div>

      {/* Left Menu Bar */}
      <div className={`left-menu ${menuOpen ? 'open' : 'closed'}`}>
        <nav className="game-nav">
          <button onClick={() => toggleSubmenu('government')} className="nav-btn">
            <span className="icon">🏛️</span>
            <span>Government</span>
            <span className="expand-icon">{expandedMenus['government'] ? '▼' : '▶'}</span>
          </button>
          {expandedMenus['government'] && (
            <>
              <button onClick={() => navigate('/government/federal')} className="nav-btn-sub">
                <span>Federal</span>
              </button>
              <button onClick={() => navigate('/government/provincial')} className="nav-btn-sub">
                <span>Provincial</span>
              </button>
            </>
          )}
          
          <button onClick={() => toggleSubmenu('economy')} className="nav-btn">
            <span className="icon">💰</span>
            <span>Economy</span>
            <span className="expand-icon">{expandedMenus['economy'] ? '▼' : '▶'}</span>
          </button>
          {expandedMenus['economy'] && (
            <>
              <button onClick={() => navigate('/economy/stats')} className="nav-btn-sub">
                <span>Economic Stats</span>
              </button>
              <button onClick={() => navigate('/economy/stock-market')} className="nav-btn-sub">
                <span>Stock Market</span>
              </button>
              <button onClick={() => navigate('/economy/markets')} className="nav-btn-sub">
                <span>Markets</span>
              </button>
            </>
          )}
          
          <button onClick={() => toggleSubmenu('population')} className="nav-btn">
            <span className="icon">👥</span>
            <span>Population</span>
            <span className="expand-icon">{expandedMenus['population'] ? '▼' : '▶'}</span>
          </button>
          {expandedMenus['population'] && (
            <>
              <button onClick={() => navigate('/population/demographics')} className="nav-btn-sub">
                <span>Demographics</span>
              </button>
              <button onClick={() => navigate('/population/reputation')} className="nav-btn-sub">
                <span>Reputation</span>
              </button>
            </>
          )}
          
          <button onClick={() => navigate('/business')} className="nav-btn">
            <span className="icon">🏢</span>
            <span>Business</span>
          </button>
          
          <button onClick={() => toggleSubmenu('news')} className="nav-btn">
            <span className="icon">📰</span>
            <span>News</span>
            <span className="expand-icon">{expandedMenus['news'] ? '▼' : '▶'}</span>
          </button>
          {expandedMenus['news'] && (
            <>
              <button onClick={() => navigate('/news/national')} className="nav-btn-sub">
                <span>National Outlets</span>
              </button>
              <button onClick={() => navigate('/news/provincial')} className="nav-btn-sub">
                <span>Provincial News</span>
              </button>
              <button onClick={() => navigate('/news/create-newspaper')} className="nav-btn-sub">
                <span>Create Newspaper</span>
              </button>
              <button onClick={() => navigate('/news/manage')} className="nav-btn-sub">
                <span>Manage Newspaper</span>
              </button>
            </>
          )}
          
          <button onClick={() => toggleSubmenu('legal')} className="nav-btn">
            <span className="icon">⚖️</span>
            <span>Legal</span>
            <span className="expand-icon">{expandedMenus['legal'] ? '▼' : '▶'}</span>
          </button>
          {expandedMenus['legal'] && (
            <>
              <button onClick={() => navigate('/legal/bar-exam')} className="nav-btn-sub">
                <span>Bar Exam</span>
              </button>
              <button onClick={() => navigate('/legal/cases')} className="nav-btn-sub">
                <span>Cases</span>
              </button>
              <button onClick={() => navigate('/legal/rulings')} className="nav-btn-sub">
                <span>Rulings</span>
              </button>
            </>
          )}
          
          <button onClick={() => navigate('/elections')} className="nav-btn">
            <span className="icon">🗳️</span>
            <span>Elections</span>
          </button>
        </nav>
      </div>

      {/* Central Map Area */}
      <div className="map-area">
        <div className="map-placeholder">
          <h2>Map Coming Soon</h2>
          <p>Interactive game map will be displayed here</p>
        </div>
      </div>

      {/* GM Access Button (lower right) */}
      <button 
        className={`gm-access-btn ${player?.isGameMaster ? '' : 'gm-login-btn'}`}
        onClick={() => player?.isGameMaster ? navigate('/gm-panel') : navigate('/auth')}
        title={player?.isGameMaster ? "Game Master Panel" : "GM Login"}
      >
        🔒
      </button>

      {/* Wiki Button (lower right, rightmost) */}
      <button 
        className="wiki-btn"
        onClick={() => setWikiOpen(!wikiOpen)}
        title="Game Wiki & Documentation"
      >
        📚
      </button>

      {/* Wiki Modal */}
      {wikiOpen && (
        <div className="wiki-modal" onClick={() => setWikiOpen(false)}>
          <div className="wiki-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="wiki-close-btn" onClick={() => setWikiOpen(false)}>✕</button>
            <iframe 
              src="https://special-digit-4d0.notion.site/ebd//70285e221d7741c9a65282f8dd2c518c" 
              width="100%" 
              height="100%" 
              style={{border: 'none'}}
              title="Game Wiki"
            />
          </div>
        </div>
      )}

      {/* Right Stats Panel */}
      <div className={`right-panel ${statsOpen ? '' : 'closed'}`}>
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
                <span className="value">£{player?.cash?.toLocaleString() || 1000}</span>
              </div>
              <div className="stat-item">
                <span className="label">Reputation:</span>
                <span className="value">{player?.reputation || 40}%</span>
              </div>
              <div className="stat-item">
                <span className="label">Actions:</span>
                <span className="value">{player?.actionsRemaining || 5} / 5</span>
              </div>
            </div>

            <div className="turn-info-panel">
              <div className="turn-number">
                <span className="label">Turn:</span>
                <span className="value">{session.currentTurn}</span>
              </div>
              {isPaused ? (
                <div className="pause-message">
                  <span className="pause-icon">⏸️</span>
                  <span className="pause-text">Game is Paused</span>
                  <span className="pause-subtext">Maintenance Ongoing</span>
                </div>
              ) : (
                <div className="turn-timer">
                  <span className="label">Turn Ends In:</span>
                  <span className="value">{Math.floor((new Date(session.turnEndTime).getTime() - currentTime.getTime()) / (1000 * 60 * 60))}h {Math.floor(((new Date(session.turnEndTime).getTime() - currentTime.getTime()) % (1000 * 60 * 60)) / (1000 * 60))}m</span>
                </div>
              )}
              <div className="real-time">
                <span className="label">Time:</span>
                <span className="value">{currentTime.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;
