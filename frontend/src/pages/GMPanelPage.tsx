import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/GMPanelPage.css';
import WikiAndGMButtons from '../components/WikiAndGMButtons';

const GMPanelPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string>('overview');
  const [aiChatMessages, setAiChatMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [aiInput, setAiInput] = useState('');
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    loadSessionStatus();
  }, []);

  const loadSessionStatus = async () => {
    try {
      const response = await api.get('/sessions/current');
      if (response.data) {
        setSessionId(response.data.id);
        setIsPaused(response.data.isPaused || false);
      }
    } catch (error) {
      console.error('Failed to load session status:', error);
    }
  };

  const handlePauseToggle = async () => {
    if (!sessionId) return;
    
    try {
      const newPausedState = !isPaused;
      await api.patch(`/sessions/${sessionId}`, { isPaused: newPausedState });
      setIsPaused(newPausedState);
    } catch (error) {
      console.error('Failed to toggle pause state:', error);
      alert('Failed to toggle pause state');
    }
  };

  const handleAiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInput.trim()) return;

    // Add user message
    const newMessages = [...aiChatMessages, { role: 'user' as const, content: aiInput }];
    setAiChatMessages(newMessages);
    setAiInput('');

    // TODO: Add API integration for AI chat
    // For now, add a placeholder response
    setTimeout(() => {
      setAiChatMessages([...newMessages, {
        role: 'assistant' as const,
        content: 'AI integration coming soon. This will connect to the Claude API for GM assistance.'
      }]);
    }, 500);
  };

  const renderToolContent = () => {
    switch (selectedTool) {
      case 'overview':
        return (
          <div className="tool-content">
            <h2>Game Master Overview</h2>
            <div className="overview-grid">
              <div className="overview-card">
                <h3>🎮 Active Sessions</h3>
                <p className="stat-number">3</p>
                <p className="stat-label">Running Games</p>
              </div>
              <div className="overview-card">
                <h3>👥 Total Players</h3>
                <p className="stat-number">12</p>
                <p className="stat-label">Active Players</p>
              </div>
              <div className="overview-card">
                <h3>🗓️ Current Turn</h3>
                <p className="stat-number">15</p>
                <p className="stat-label">Turn Number</p>
              </div>
              <div className="overview-card">
                <h3>⏰ Next Advance</h3>
                <p className="stat-number">2.5h</p>
                <p className="stat-label">Time Remaining</p>
              </div>
            </div>
          </div>
        );

      case 'players':
        return (
          <div className="tool-content">
            <h2>Player Management</h2>
            <div className="player-tools">
              <button className="gm-tool-btn">View All Players</button>
              <button className="gm-tool-btn">Add/Remove Player</button>
              <button className="gm-tool-btn">Adjust Player Resources</button>
              <button className="gm-tool-btn">View Player Actions</button>
              <button className="gm-tool-btn">Send Message to Player</button>
            </div>
          </div>
        );

      case 'world':
        return (
          <div className="tool-content">
            <h2>World Management</h2>
            <div className="player-tools">
              <button className="gm-tool-btn">Edit Provinces</button>
              <button className="gm-tool-btn">Modify Resources</button>
              <button className="gm-tool-btn">Trigger Events</button>
              <button className="gm-tool-btn">Adjust Demographics</button>
              <button className="gm-tool-btn">Economic Settings</button>
            </div>
          </div>
        );

      case 'events':
        return (
          <div className="tool-content">
            <h2>Event Management</h2>
            <div className="player-tools">
              <button className="gm-tool-btn">Create Custom Event</button>
              <button className="gm-tool-btn">Schedule Event</button>
              <button className="gm-tool-btn">View Active Events</button>
              <button className="gm-tool-btn">Event Templates</button>
              <button className="gm-tool-btn">AI Event Generator</button>
            </div>
          </div>
        );

      case 'turns':
        return (
          <div className="tool-content">
            <h2>Turn Management</h2>
            <div className="player-tools">
              <button className="gm-tool-btn">Force Turn Advance</button>
              <button 
                className={`gm-tool-btn ${isPaused ? 'active' : 'paused'}`}
                onClick={handlePauseToggle}
              >
                {isPaused ? '▶️ Resume Game' : '⏸️ Pause Game'}
              </button>
              <button className="gm-tool-btn">Adjust Turn Duration</button>
              <button className="gm-tool-btn">View Turn History</button>
              <button className="gm-tool-btn">Rollback Turn</button>
            </div>
          </div>
        );

      case 'ai':
        return (
          <div className="tool-content ai-chat-container">
            <h2>AI Assistant</h2>
            <div className="ai-chat-box">
              <div className="chat-messages">
                {aiChatMessages.length === 0 ? (
                  <div className="empty-chat">
                    <p>💬 Ask the AI assistant for help with game management</p>
                  </div>
                ) : (
                  aiChatMessages.map((msg, idx) => (
                    <div key={idx} className={`chat-message ${msg.role}`}>
                      <div className="message-content">{msg.content}</div>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAiSubmit} className="chat-input-form">
                <input
                  type="text"
                  value={aiInput}
                  onChange={(e) => setAiInput(e.target.value)}
                  placeholder="Ask AI for help..."
                  className="chat-input"
                />
                <button type="submit" className="chat-submit">Send</button>
              </form>
            </div>
          </div>
        );

      case 'logs':
        return (
          <div className="tool-content">
            <h2>System Logs</h2>
            <div className="player-tools">
              <button className="gm-tool-btn">View Action Logs</button>
              <button className="gm-tool-btn">View System Logs</button>
              <button className="gm-tool-btn">Export Logs</button>
              <button className="gm-tool-btn">Clear Old Logs</button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="gm-panel-page">
      <WikiAndGMButtons />
      {/* Top Header */}
      <div className="top-header">
        <button
          className="hamburger-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          ☰
        </button>
        <h1 className="page-title">Game Master Control Panel</h1>
        <button onClick={() => navigate('/')} className="back-btn">Back to Game</button>
      </div>

      {/* Left Menu */}
      <div className={`gm-left-menu ${menuOpen ? 'open' : 'closed'}`}>
        <nav className="gm-nav">
          <button 
            onClick={() => setSelectedTool('overview')} 
            className={`gm-nav-btn ${selectedTool === 'overview' ? 'active' : ''}`}
          >
            <span className="icon">📊</span>
            <span>Overview</span>
          </button>
          <button 
            onClick={() => setSelectedTool('players')} 
            className={`gm-nav-btn ${selectedTool === 'players' ? 'active' : ''}`}
          >
            <span className="icon">👥</span>
            <span>Players</span>
          </button>
          <button 
            onClick={() => setSelectedTool('world')} 
            className={`gm-nav-btn ${selectedTool === 'world' ? 'active' : ''}`}
          >
            <span className="icon">🌍</span>
            <span>World</span>
          </button>
          <button 
            onClick={() => setSelectedTool('events')} 
            className={`gm-nav-btn ${selectedTool === 'events' ? 'active' : ''}`}
          >
            <span className="icon">⚡</span>
            <span>Events</span>
          </button>
          <button 
            onClick={() => setSelectedTool('turns')} 
            className={`gm-nav-btn ${selectedTool === 'turns' ? 'active' : ''}`}
          >
            <span className="icon">🔄</span>
            <span>Turns</span>
          </button>
          <button 
            onClick={() => setSelectedTool('ai')} 
            className={`gm-nav-btn ${selectedTool === 'ai' ? 'active' : ''}`}
          >
            <span className="icon">🤖</span>
            <span>AI Assistant</span>
          </button>
          <button 
            onClick={() => setSelectedTool('logs')} 
            className={`gm-nav-btn ${selectedTool === 'logs' ? 'active' : ''}`}
          >
            <span className="icon">📝</span>
            <span>Logs</span>
          </button>
        </nav>
      </div>

      {/* Main Content */}
      <div className="gm-main-content">
        {renderToolContent()}
      </div>
    </div>
  );
};

export default GMPanelPage;
