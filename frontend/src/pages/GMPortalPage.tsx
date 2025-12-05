import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../styles/GMPortalPage.css';

/**
 * GM Portal Page
 * Allows players to request GM access and existing GMs to grant/revoke access
 */
const GMPortalPage: React.FC = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [requestReason, setRequestReason] = useState('');
  const [targetUsername, setTargetUsername] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      setLoading(true);
      const response = await api.get('/gm/portal/check-access');
      setHasAccess(response.data.hasAccess);
    } catch (err: any) {
      setError('Failed to check GM access');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const response = await api.post('/gm/portal/request-access', { reason: requestReason });
      setMessage(response.data.message);
      setRequestReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit request');
    }
  };

  const handleGrantAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!targetUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      // First, find the player by username
      const playersResponse = await api.get(`/sessions/players`);
      const targetPlayer = playersResponse.data.players?.find(
        (p: any) => p.username.toLowerCase() === targetUsername.toLowerCase()
      );

      if (!targetPlayer) {
        setError('Player not found');
        return;
      }

      const response = await api.post('/gm/portal/grant-access', { 
        targetPlayerId: targetPlayer.id 
      });
      setMessage(response.data.message);
      setTargetUsername('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to grant access');
    }
  };

  const handleRevokeAccess = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!targetUsername.trim()) {
      setError('Please enter a username');
      return;
    }

    try {
      // First, find the player by username
      const playersResponse = await api.get(`/sessions/players`);
      const targetPlayer = playersResponse.data.players?.find(
        (p: any) => p.username.toLowerCase() === targetUsername.toLowerCase()
      );

      if (!targetPlayer) {
        setError('Player not found');
        return;
      }

      const response = await api.post('/gm/portal/revoke-access', { 
        targetPlayerId: targetPlayer.id 
      });
      setMessage(response.data.message);
      setTargetUsername('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to revoke access');
    }
  };

  if (loading) {
    return <div className="gm-portal-loading">Checking GM access...</div>;
  }

  return (
    <div className="gm-portal-page">
      <div className="gm-portal-header">
        <h1>🎮 Game Master Portal</h1>
        <button className="back-button" onClick={() => navigate('/')}>
          ← Back to Game
        </button>
      </div>

      <div className="gm-portal-content">
        {/* Status Section */}
        <div className="gm-status-card">
          <h2>Access Status</h2>
          <div className={`status-badge ${hasAccess ? 'has-access' : 'no-access'}`}>
            {hasAccess ? '✓ Game Master' : '✗ Player'}
          </div>
          {hasAccess && (
            <button 
              className="dashboard-button"
              onClick={() => navigate('/gm-dashboard')}
            >
              Open GM Dashboard →
            </button>
          )}
        </div>

        {/* Request Access Section (for non-GMs) */}
        {!hasAccess && (
          <div className="gm-request-card">
            <h2>Request GM Access</h2>
            <p className="request-description">
              Game Masters have access to powerful tools for managing the game world, 
              creating events, and moderating gameplay. GM access is granted by existing 
              Game Masters.
            </p>
            <form onSubmit={handleRequestAccess}>
              <div className="form-group">
                <label htmlFor="reason">Why do you want GM access?</label>
                <textarea
                  id="reason"
                  value={requestReason}
                  onChange={(e) => setRequestReason(e.target.value)}
                  placeholder="Explain why you should be granted Game Master access..."
                  rows={4}
                  required
                />
              </div>
              <button type="submit" className="submit-button">
                Submit Request
              </button>
            </form>
          </div>
        )}

        {/* Grant/Revoke Access Section (for existing GMs) */}
        {hasAccess && (
          <div className="gm-management-card">
            <h2>Manage GM Access</h2>
            <p className="management-description">
              Grant or revoke Game Master access for other players.
            </p>

            <div className="management-forms">
              <form onSubmit={handleGrantAccess} className="grant-form">
                <h3>Grant Access</h3>
                <div className="form-group">
                  <label htmlFor="grantUsername">Player Username</label>
                  <input
                    id="grantUsername"
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <button type="submit" className="grant-button">
                  Grant GM Access
                </button>
              </form>

              <form onSubmit={handleRevokeAccess} className="revoke-form">
                <h3>Revoke Access</h3>
                <div className="form-group">
                  <label htmlFor="revokeUsername">Player Username</label>
                  <input
                    id="revokeUsername"
                    type="text"
                    value={targetUsername}
                    onChange={(e) => setTargetUsername(e.target.value)}
                    placeholder="Enter username"
                  />
                </div>
                <button type="submit" className="revoke-button">
                  Revoke GM Access
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className="message success-message">
            ✓ {message}
          </div>
        )}
        {error && (
          <div className="message error-message">
            ✗ {error}
          </div>
        )}

        {/* Information Section */}
        <div className="gm-info-card">
          <h2>About Game Master Role</h2>
          <div className="info-content">
            <div className="info-item">
              <h3>🌍 World Management</h3>
              <p>Create events, manage provinces, and shape the game world</p>
            </div>
            <div className="info-item">
              <h3>📊 Data Control</h3>
              <p>View and modify game statistics, resources, and economic data</p>
            </div>
            <div className="info-item">
              <h3>⚖️ Moderation</h3>
              <p>Manage player actions, resolve disputes, and ensure fair play</p>
            </div>
            <div className="info-item">
              <h3>📰 Narrative Control</h3>
              <p>Create news events, policy impacts, and story developments</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GMPortalPage;
