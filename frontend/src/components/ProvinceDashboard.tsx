import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/ProvinceDashboard.css';

interface Province {
  _id: string;
  name: string;
  population: number;
  gdp: number;
  area: number;
  currentSuperintendent?: {
    _id: string;
    username: string;
  };
  ltGovernor?: {
    _id: string;
    username: string;
  };
  resources: {
    [key: string]: number;
  };
  culturalComposition?: {
    [key: string]: number;
  };
  religiousComposition?: {
    [key: string]: number;
  };
}

interface Policy {
  _id: string;
  title: string;
  status: string;
  enactedAt?: Date;
  provinceId?: string;
}

interface Props {
  provinceId: string;
  sessionId: string;
  onClose?: () => void;
}

const ProvinceDashboard: React.FC<Props> = ({ provinceId, sessionId, onClose }) => {
  const [province, setProvince] = useState<Province | null>(null);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'economy' | 'demographics' | 'policies'>('overview');

  useEffect(() => {
    fetchProvinceData();
    fetchProvincePolicies();
  }, [provinceId, sessionId]);

  const fetchProvinceData = async () => {
    try {
      const response = await axios.get(`/api/map/${sessionId}/provinces/${provinceId}`);
      setProvince(response.data.province);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load province data');
      setLoading(false);
    }
  };

  const fetchProvincePolicies = async () => {
    try {
      const response = await axios.get(`/api/policies/${sessionId}`);
      const provincePolicies = response.data.policies.filter(
        (p: Policy) => p.provinceId === provinceId && p.status === 'enacted'
      );
      setPolicies(provincePolicies);
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  };

  const formatCurrency = (amount: number): string => {
    if (amount >= 1000000) return `£${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `£${(amount / 1000).toFixed(1)}k`;
    return `£${amount}`;
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="province-dashboard loading">
        <div className="spinner"></div>
        <p>Loading province data...</p>
      </div>
    );
  }

  if (error || !province) {
    return (
      <div className="province-dashboard error">
        <h2>Error</h2>
        <p>{error || 'Province not found'}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );
  }

  return (
    <div className="province-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <h1>{province.name}</h1>
          <p className="subtitle">Provincial Dashboard</p>
        </div>
        {onClose && (
          <button className="close-button" onClick={onClose}>×</button>
        )}
      </div>

      <div className="dashboard-tabs">
        <button
          className={activeTab === 'overview' ? 'active' : ''}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={activeTab === 'economy' ? 'active' : ''}
          onClick={() => setActiveTab('economy')}
        >
          Economy
        </button>
        <button
          className={activeTab === 'demographics' ? 'active' : ''}
          onClick={() => setActiveTab('demographics')}
        >
          Demographics
        </button>
        <button
          className={activeTab === 'policies' ? 'active' : ''}
          onClick={() => setActiveTab('policies')}
        >
          Policies
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'overview' && (
          <div className="tab-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <label>Superintendent</label>
                <span className="stat-value">{province.currentSuperintendent?.username || 'Vacant'}</span>
              </div>

              <div className="stat-card">
                <label>Lt. Governor</label>
                <span className="stat-value">{province.ltGovernor?.username || 'Vacant'}</span>
              </div>

              <div className="stat-card">
                <label>Population</label>
                <span className="stat-value">{province.population.toLocaleString()}</span>
              </div>

              <div className="stat-card">
                <label>Area</label>
                <span className="stat-value">{province.area.toLocaleString()} km²</span>
              </div>

              <div className="stat-card">
                <label>GDP</label>
                <span className="stat-value">{formatCurrency(province.gdp)}</span>
              </div>

              <div className="stat-card">
                <label>GDP per Capita</label>
                <span className="stat-value">£{(province.gdp / province.population).toFixed(0)}</span>
              </div>
            </div>

            <div className="section">
              <h3>Resources</h3>
              <div className="resources-grid">
                {Object.entries(province.resources).map(([resource, value]) => {
                  if (!value || value === 0) return null;
                  return (
                    <div key={resource} className="resource-card">
                      <span className="resource-icon">{getResourceIcon(resource)}</span>
                      <div className="resource-info">
                        <span className="resource-name">
                          {resource.charAt(0).toUpperCase() + resource.slice(1)}
                        </span>
                        <span className="resource-value">{value} units</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'economy' && (
          <div className="tab-panel">
            <div className="stats-grid">
              <div className="stat-card">
                <label>Total GDP</label>
                <span className="stat-value">{formatCurrency(province.gdp)}</span>
              </div>

              <div className="stat-card">
                <label>GDP per Capita</label>
                <span className="stat-value">£{(province.gdp / province.population).toFixed(0)}</span>
              </div>

              <div className="stat-card">
                <label>Population Density</label>
                <span className="stat-value">{(province.population / province.area).toFixed(1)} /km²</span>
              </div>
            </div>

            <div className="section">
              <h3>Resource Production</h3>
              <div className="resource-breakdown">
                {Object.entries(province.resources).map(([resource, value]) => {
                  if (!value || value === 0) return null;
                  const total = Object.values(province.resources).reduce((sum, v) => sum + (v || 0), 0);
                  const percentage = (value / total) * 100;

                  return (
                    <div key={resource} className="resource-bar">
                      <div className="resource-label">
                        <span>{resource.charAt(0).toUpperCase() + resource.slice(1)}</span>
                        <span>{value} units ({percentage.toFixed(1)}%)</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${percentage}%`, background: getResourceColor(resource) }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'demographics' && (
          <div className="tab-panel">
            {province.culturalComposition && (
              <div className="section">
                <h3>Cultural Composition</h3>
                <div className="composition-list">
                  {Object.entries(province.culturalComposition)
                    .sort((a, b) => b[1] - a[1])
                    .map(([culture, percentage]) => (
                      <div key={culture} className="composition-item">
                        <div className="composition-label">
                          <span>{culture}</span>
                          <span>{formatPercentage(percentage)}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage * 100}%`, background: '#4287f5' }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {province.religiousComposition && (
              <div className="section">
                <h3>Religious Composition</h3>
                <div className="composition-list">
                  {Object.entries(province.religiousComposition)
                    .sort((a, b) => b[1] - a[1])
                    .map(([religion, percentage]) => (
                      <div key={religion} className="composition-item">
                        <div className="composition-label">
                          <span>{religion}</span>
                          <span>{formatPercentage(percentage)}</span>
                        </div>
                        <div className="progress-bar">
                          <div
                            className="progress-fill"
                            style={{ width: `${percentage * 100}%`, background: '#9c27b0' }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="section">
              <h3>Population Statistics</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <label>Total Population</label>
                  <span className="stat-value">{province.population.toLocaleString()}</span>
                </div>
                <div className="stat-card">
                  <label>Density</label>
                  <span className="stat-value">{(province.population / province.area).toFixed(1)} /km²</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'policies' && (
          <div className="tab-panel">
            <div className="section">
              <h3>Active Policies</h3>
              {policies.length === 0 ? (
                <p className="empty-state">No active policies affecting this province</p>
              ) : (
                <div className="policies-list">
                  {policies.map((policy) => (
                    <div key={policy._id} className="policy-card">
                      <h4>{policy.title}</h4>
                      <div className="policy-meta">
                        <span className="policy-status">{policy.status}</span>
                        {policy.enactedAt && (
                          <span className="policy-date">
                            Enacted: {new Date(policy.enactedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper functions
function getResourceIcon(resource: string): string {
  const icons: { [key: string]: string } = {
    timber: '🌲',
    agriculture: '🌾',
    fishing: '🐟',
    whaling: '🐋',
    livestock: '🐑',
    mining: '⛏️',
    gold: '🏆',
    coal: '⚫',
    iron: '⚙️',
  };
  return icons[resource] || '📦';
}

function getResourceColor(resource: string): string {
  const colors: { [key: string]: string } = {
    timber: '#4CAF50',
    agriculture: '#8BC34A',
    fishing: '#2196F3',
    whaling: '#03A9F4',
    livestock: '#FF9800',
    mining: '#795548',
    gold: '#FFD700',
    coal: '#424242',
    iron: '#607D8B',
  };
  return colors[resource] || '#9E9E9E';
}

export default ProvinceDashboard;
