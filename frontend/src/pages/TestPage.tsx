import React from 'react';
import '../styles/GameDashboard.css';

const TestPage: React.FC = () => {
  return (
    <div className="game-dashboard">
      <div className="dashboard-header">
        <h1>POLSIM - Test Dashboard</h1>
        <div className="header-info">
          <div className="info-item">
            <span className="label">Turn:</span>
            <span className="value">1</span>
          </div>
          <div className="info-item">
            <span className="label">Time Remaining:</span>
            <span className="value">23h 59m</span>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button className="tab-button active">Overview</button>
          <button className="tab-button">Markets</button>
          <button className="tab-button">Portfolio</button>
          <button className="tab-button">Population</button>
        </div>

        <div className="tab-content">
          {/* Overview Tab */}
          <div className="overview-section">
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Player Rank</h3>
                <div className="stat-value">#1</div>
                <div className="stat-label">of 1 players</div>
              </div>
              
              <div className="stat-card">
                <h3>Portfolio Value</h3>
                <div className="stat-value">$100,000</div>
                <div className="stat-label">Cash</div>
              </div>
              
              <div className="stat-card">
                <h3>Economic Index</h3>
                <div className="stat-value">100</div>
                <div className="stat-label">Neutral</div>
              </div>
              
              <div className="stat-card">
                <h3>Approval Rating</h3>
                <div className="stat-value">50%</div>
                <div className="stat-label">Overall</div>
              </div>
            </div>

            <div className="section-card">
              <h3>Your Portfolio</h3>
              <div className="portfolio-summary">
                <div className="portfolio-item">
                  <span>Cash:</span>
                  <span className="amount">$100,000</span>
                </div>
                <div className="portfolio-item">
                  <span>Stocks:</span>
                  <span className="amount">$0</span>
                </div>
                <div className="portfolio-item">
                  <span>Items:</span>
                  <span className="amount">$0</span>
                </div>
                <div className="portfolio-item total">
                  <span>Total Value:</span>
                  <span className="amount">$100,000</span>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3>Game State</h3>
              <div className="game-metrics">
                <div className="metric">
                  <div className="metric-header">
                    <span>Economic Index</span>
                    <span>100</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '50%'}}></div>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-header">
                    <span>Social Stability</span>
                    <span>100</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '50%'}}></div>
                  </div>
                </div>
                <div className="metric">
                  <div className="metric-header">
                    <span>Political Stability</span>
                    <span>100</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{width: '50%'}}></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3>Recent Events</h3>
              <div className="events-list">
                <div className="event-item">
                  <div className="event-type">System</div>
                  <div className="event-text">Game session started successfully</div>
                </div>
                <div className="event-item">
                  <div className="event-type">Info</div>
                  <div className="event-text">Welcome to POLSIM! You have 5 actions per turn.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
