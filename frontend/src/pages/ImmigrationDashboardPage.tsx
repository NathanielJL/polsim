import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/ImmigrationDashboardPage.css';

interface ImmigrationStats {
  totalPopulation: number;
  annualImmigration: number;
  baselineRate: number;
  policyModifiers: number;
  forecastNextYear: number;
  culturalTrends: {
    [key: string]: {
      current: number;
      trend: string; // 'increasing' | 'decreasing' | 'stable'
    };
  };
}

interface ImmigrationEvent {
  _id: string;
  title: string;
  immigrants: number;
  culturalMakeup: {
    [key: string]: number;
  };
  targetProvinces?: string[];
  arrivedAt: Date;
}

interface Province {
  _id: string;
  name: string;
  population: number;
  culturalComposition?: {
    [key: string]: number;
  };
}

const ImmigrationDashboardPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [stats, setStats] = useState<ImmigrationStats | null>(null);
  const [events, setEvents] = useState<ImmigrationEvent[]>([]);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<Province | null>(null);

  useEffect(() => {
    fetchImmigrationData();
    fetchProvinces();
  }, [sessionId]);

  const fetchImmigrationData = async () => {
    try {
      setLoading(true);
      const [statsRes, eventsRes] = await Promise.all([
        axios.get(`/api/immigration/stats/${sessionId}`),
        axios.get(`/api/immigration/events/${sessionId}`),
      ]);

      setStats(statsRes.data.stats);
      setEvents(eventsRes.data.events);
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load immigration data');
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const response = await axios.get(`/api/map/${sessionId}/provinces`);
      setProvinces(response.data.provinces);
    } catch (err) {
      console.error('Failed to load provinces:', err);
    }
  };

  const formatPercentage = (value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  };

  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'increasing': return '📈';
      case 'decreasing': return '📉';
      default: return '➡️';
    }
  };

  const getCultureColor = (culture: string): string => {
    const colors: { [key: string]: string } = {
      English: '#C41E3A',
      Irish: '#4CAF50',
      Scottish: '#0066CC',
      Dutch: '#FF6600',
      French: '#002395',
      German: '#000000',
      Scandinavian: '#0066CC',
      Māori: '#8B4513',
      Mixed: '#9C27B0',
      Other: '#888888',
    };
    return colors[culture] || '#888888';
  };

  if (loading) {
    return (
      <div className="immigration-page loading">
        <div className="spinner"></div>
        <p>Loading immigration data...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="immigration-page error">
        <h2>Error</h2>
        <p>{error || 'Failed to load data'}</p>
      </div>
    );
  }

  return (
    <div className="immigration-page">
      <div className="immigration-header">
        <h1>Immigration Dashboard</h1>
        <p className="subtitle">Track population growth and cultural trends across Zealandia</p>
      </div>

      <div className="stats-overview">
        <div className="stat-card">
          <label>Total Population</label>
          <span className="stat-value">{stats.totalPopulation.toLocaleString()}</span>
        </div>

        <div className="stat-card">
          <label>Annual Immigration</label>
          <span className="stat-value">{stats.annualImmigration.toLocaleString()}</span>
          <span className="stat-subtext">{formatPercentage(stats.annualImmigration / stats.totalPopulation)} growth</span>
        </div>

        <div className="stat-card">
          <label>Baseline Rate</label>
          <span className="stat-value">{formatPercentage(stats.baselineRate)}</span>
          <span className="stat-subtext">2% per year (January)</span>
        </div>

        <div className="stat-card">
          <label>Policy Modifiers</label>
          <span className={`stat-value ${stats.policyModifiers >= 0 ? 'positive' : 'negative'}`}>
            {stats.policyModifiers >= 0 ? '+' : ''}{formatPercentage(stats.policyModifiers)}
          </span>
          <span className="stat-subtext">From active policies</span>
        </div>

        <div className="stat-card forecast">
          <label>Next Year Forecast</label>
          <span className="stat-value">{stats.forecastNextYear.toLocaleString()}</span>
          <span className="stat-subtext">Expected arrivals</span>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="cultural-trends-panel">
          <h2>Cultural Trends</h2>
          <p className="panel-description">
            Long-term immigration patterns affecting Zealandia's cultural composition
          </p>

          <div className="trends-list">
            {Object.entries(stats.culturalTrends).map(([culture, data]) => (
              <div key={culture} className="trend-item">
                <div className="trend-header">
                  <span className="culture-name" style={{ color: getCultureColor(culture) }}>
                    {culture}
                  </span>
                  <span className="trend-icon">{getTrendIcon(data.trend)}</span>
                </div>
                <div className="trend-bar">
                  <div
                    className="trend-fill"
                    style={{
                      width: `${data.current * 100}%`,
                      background: getCultureColor(culture),
                    }}
                  ></div>
                </div>
                <div className="trend-footer">
                  <span className="trend-percentage">{formatPercentage(data.current)}</span>
                  <span className="trend-status">{data.trend}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="events-panel">
          <h2>Recent Immigration Events</h2>
          <p className="panel-description">
            Event-driven immigration waves beyond annual baseline
          </p>

          {events.length === 0 ? (
            <p className="empty-state">No immigration events recorded yet</p>
          ) : (
            <div className="events-list">
              {events.map((event) => (
                <div key={event._id} className="event-card">
                  <div className="event-header">
                    <h3>{event.title}</h3>
                    <span className="event-date">
                      {new Date(event.arrivedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="event-stat">
                    <label>Immigrants:</label>
                    <strong>{event.immigrants.toLocaleString()}</strong>
                  </div>

                  <div className="cultural-makeup">
                    <label>Cultural Makeup:</label>
                    <div className="makeup-list">
                      {Object.entries(event.culturalMakeup).map(([culture, percentage]) => (
                        <div key={culture} className="makeup-item">
                          <span
                            className="makeup-dot"
                            style={{ background: getCultureColor(culture) }}
                          ></span>
                          <span className="makeup-text">
                            {culture}: {formatPercentage(percentage)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {event.targetProvinces && event.targetProvinces.length > 0 && (
                    <div className="event-provinces">
                      <label>Target Provinces:</label>
                      <div className="provinces-tags">
                        {event.targetProvinces.map((provinceId) => {
                          const province = provinces.find((p) => p._id === provinceId);
                          return province ? (
                            <span key={provinceId} className="province-tag">
                              {province.name}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="provincial-distribution">
        <h2>Provincial Distribution</h2>
        <p className="panel-description">
          Immigration distributed by GDP, unemployment, and development level
        </p>

        <div className="provinces-grid">
          {provinces.map((province) => (
            <div
              key={province._id}
              className="province-card"
              onClick={() => setSelectedProvince(province)}
            >
              <h3>{province.name}</h3>
              <div className="province-pop">
                Population: <strong>{province.population.toLocaleString()}</strong>
              </div>

              {province.culturalComposition && (
                <div className="mini-composition">
                  {Object.entries(province.culturalComposition)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 3)
                    .map(([culture, percentage]) => (
                      <div key={culture} className="mini-bar">
                        <div
                          className="mini-fill"
                          style={{
                            width: `${percentage * 100}%`,
                            background: getCultureColor(culture),
                          }}
                        ></div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Province Details Modal */}
      {selectedProvince && (
        <div className="modal-overlay" onClick={() => setSelectedProvince(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedProvince.name}</h2>
              <button className="close-button" onClick={() => setSelectedProvince(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-stat">
                <label>Total Population:</label>
                <span>{selectedProvince.population.toLocaleString()}</span>
              </div>

              {selectedProvince.culturalComposition && (
                <div className="composition-section">
                  <h3>Cultural Composition</h3>
                  {Object.entries(selectedProvince.culturalComposition)
                    .sort((a, b) => b[1] - a[1])
                    .map(([culture, percentage]) => (
                      <div key={culture} className="composition-row">
                        <div className="composition-label">
                          <span style={{ color: getCultureColor(culture) }}>{culture}</span>
                          <span>{formatPercentage(percentage)}</span>
                        </div>
                        <div className="composition-bar">
                          <div
                            className="composition-fill"
                            style={{
                              width: `${percentage * 100}%`,
                              background: getCultureColor(culture),
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImmigrationDashboardPage;
