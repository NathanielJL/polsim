import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/ResourceExplorationPage.css';

interface Province {
  _id: string;
  name: string;
  resources: {
    [key: string]: number;
  };
  hiddenResources?: string[];
  explorationHistory?: {
    playerId: string;
    explorationType: string;
    success: boolean;
    discoveredResource?: string;
    exploredAt: Date;
  }[];
}

interface Player {
  _id: string;
  username: string;
  actionPoints: number;
  cash: number;
}

const ResourceExplorationPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);
  const [exploring, setExploring] = useState(false);
  const [explorationResult, setExplorationResult] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProvinces();
    fetchPlayerData();
  }, [sessionId]);

  const fetchProvinces = async () => {
    try {
      const response = await axios.get(`/api/map/${sessionId}/provinces`);
      setProvinces(response.data.provinces);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load provinces');
      setLoading(false);
    }
  };

  const fetchPlayerData = async () => {
    try {
      const response = await axios.get('/api/players/me');
      setPlayer(response.data.player);
    } catch (err) {
      console.error('Failed to load player data:', err);
    }
  };

  const handleExplore = async () => {
    if (!selectedProvince || !player) return;

    if (player.actionPoints < 1) {
      alert('Not enough action points! You need 1 AP to explore.');
      return;
    }

    try {
      setExploring(true);
      const response = await axios.post('/api/resources/explore', {
        sessionId,
        provinceId: selectedProvince._id,
      });

      setExplorationResult(response.data);
      
      // Refresh data
      await fetchProvinces();
      await fetchPlayerData();
      
      setExploring(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Exploration failed');
      setExploring(false);
    }
  };

  const closeResultModal = () => {
    setExplorationResult(null);
  };

  const getResourceIcon = (resource: string): string => {
    const icons: { [key: string]: string } = {
      timber: '🌲',
      agriculture: '🌾',
      fishing: '🐟',
      whaling: '🐋',
      livestock: '🐑',
      mining: '⛏️',
      gold: '🏆',
      silver: '💎',
      coal: '⚫',
      iron: '⚙️',
      copper: '🟠',
      platinum: '✨',
      gemstones: '💠',
    };
    return icons[resource] || '📦';
  };

  const getProbabilityText = (province: Province): string => {
    // Base 5% chance
    // Higher in mountains (mining resources)
    // Higher in forests (timber)
    // TODO: Add tech modifiers
    return '5% base chance';
  };

  if (loading) {
    return (
      <div className="exploration-page loading">
        <div className="spinner"></div>
        <p>Loading provinces...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="exploration-page error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="exploration-page">
      <div className="exploration-header">
        <h1>Resource Exploration</h1>
        <p className="subtitle">Search provinces for hidden resources</p>
        {player && (
          <div className="player-stats">
            <span className="stat">
              <label>Action Points:</label>
              <strong>{player.actionPoints}</strong>
            </span>
            <span className="stat">
              <label>Cash:</label>
              <strong>£{player.cash.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="exploration-content">
        <div className="provinces-panel">
          <h2>Select Province to Explore</h2>
          <div className="provinces-list">
            {provinces.map((province) => (
              <div
                key={province._id}
                className={`province-card ${selectedProvince?._id === province._id ? 'selected' : ''}`}
                onClick={() => setSelectedProvince(province)}
              >
                <h3>{province.name}</h3>
                
                <div className="known-resources">
                  <label>Known Resources:</label>
                  <div className="resources">
                    {Object.entries(province.resources).map(([resource, value]) => {
                      if (!value || value === 0) return null;
                      return (
                        <span key={resource} className="resource-tag">
                          {getResourceIcon(resource)} {resource}
                        </span>
                      );
                    })}
                    {Object.values(province.resources).every(v => !v || v === 0) && (
                      <span className="no-resources">None discovered</span>
                    )}
                  </div>
                </div>

                {province.explorationHistory && province.explorationHistory.length > 0 && (
                  <div className="exploration-count">
                    Explored {province.explorationHistory.length} times
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {selectedProvince && (
          <div className="exploration-panel">
            <h2>{selectedProvince.name}</h2>
            
            <div className="exploration-info">
              <div className="info-card">
                <label>Discovery Probability:</label>
                <span className="probability">{getProbabilityText(selectedProvince)}</span>
              </div>

              <div className="info-card">
                <label>Cost:</label>
                <span className="cost">1 Action Point</span>
              </div>

              <div className="info-card">
                <label>Potential Resources:</label>
                <div className="potential-resources">
                  <span className="resource-tag">🏆 Gold</span>
                  <span className="resource-tag">💎 Silver</span>
                  <span className="resource-tag">⚫ Coal</span>
                  <span className="resource-tag">⚙️ Iron</span>
                  <span className="resource-tag">🟠 Copper</span>
                  <span className="resource-tag">✨ Platinum</span>
                  <span className="resource-tag">💠 Gemstones</span>
                </div>
              </div>
            </div>

            <button
              className="explore-button"
              onClick={handleExplore}
              disabled={exploring || !player || player.actionPoints < 1}
            >
              {exploring ? 'Exploring...' : 'Explore Province (1 AP)'}
            </button>

            {player && player.actionPoints < 1 && (
              <p className="warning">Not enough action points!</p>
            )}

            {selectedProvince.explorationHistory && selectedProvince.explorationHistory.length > 0 && (
              <div className="history-section">
                <h3>Exploration History</h3>
                <div className="history-list">
                  {selectedProvince.explorationHistory.slice(0, 5).map((history, index) => (
                    <div key={index} className="history-item">
                      <span className="history-date">
                        {new Date(history.exploredAt).toLocaleDateString()}
                      </span>
                      <span className={`history-result ${history.success ? 'success' : 'failure'}`}>
                        {history.success
                          ? `✓ Discovered ${history.discoveredResource}`
                          : '✗ Nothing found'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Exploration Result Modal */}
      {explorationResult && (
        <div className="modal-overlay" onClick={closeResultModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className={`result-modal ${explorationResult.success ? 'success' : 'failure'}`}>
              {explorationResult.success ? (
                <>
                  <div className="result-icon">🎉</div>
                  <h2>Discovery!</h2>
                  <p className="result-message">
                    You discovered <strong>{explorationResult.discoveredResource}</strong> in {selectedProvince?.name}!
                  </p>
                  <p className="result-detail">
                    {getResourceIcon(explorationResult.discoveredResource)} 
                    A new GM event has been created to announce the discovery.
                  </p>
                  {explorationResult.marketImpact && (
                    <div className="market-impact">
                      <h3>Market Impact</h3>
                      <p>Resource prices will be affected by this discovery.</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="result-icon">😔</div>
                  <h2>No Discovery</h2>
                  <p className="result-message">
                    You searched {selectedProvince?.name} but found no new resources.
                  </p>
                  <p className="result-detail">
                    Better luck next time! Each exploration has a 5% base chance of success.
                  </p>
                </>
              )}
              <button className="close-modal-button" onClick={closeResultModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResourceExplorationPage;
