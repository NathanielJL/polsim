import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/MarketPage.css';

interface Industry {
  name: string;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

function MarketPage() {
  const navigate = useNavigate();

  // Mock industry data - replace with actual API calls
  const industries: Industry[] = [
    { name: 'Technology', growth: 8.5, trend: 'up', icon: '💻' },
    { name: 'Finance', growth: -2.3, trend: 'down', icon: '🏦' },
    { name: 'Healthcare', growth: 5.2, trend: 'up', icon: '🏥' },
    { name: 'Energy', growth: -3.8, trend: 'down', icon: '⚡' },
    { name: 'Agriculture', growth: 1.2, trend: 'stable', icon: '🌾' },
    { name: 'Manufacturing', growth: 4.7, trend: 'up', icon: '🏭' },
    { name: 'Retail', growth: -0.9, trend: 'down', icon: '🛒' },
    { name: 'Real Estate', growth: 2.1, trend: 'stable', icon: '🏘️' },
    { name: 'Transportation', growth: 3.4, trend: 'up', icon: '🚛' },
    { name: 'Tourism', growth: 6.8, trend: 'up', icon: '✈️' },
    { name: 'Construction', growth: 2.9, trend: 'stable', icon: '🏗️' },
    { name: 'Education', growth: 1.5, trend: 'stable', icon: '📚' },
  ];

  const getTrendIcon = (trend: string) => {
    switch(trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (growth: number) => {
    if (growth > 3) return 'strong-growth';
    if (growth > 0) return 'moderate-growth';
    if (growth > -3) return 'moderate-decline';
    return 'strong-decline';
  };

  return (
    <div className="market-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-btn">← Back</button>
        <h1>Market Overview</h1>
      </div>

      <div className="market-summary">
        <div className="summary-card">
          <div className="summary-label">Growing Industries</div>
          <div className="summary-value green">{industries.filter(i => i.growth > 0).length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Declining Industries</div>
          <div className="summary-value red">{industries.filter(i => i.growth < 0).length}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Average Growth</div>
          <div className="summary-value">
            {(industries.reduce((sum, i) => sum + i.growth, 0) / industries.length).toFixed(2)}%
          </div>
        </div>
      </div>

      <div className="industry-grid">
        {industries.map((industry, idx) => (
          <div key={idx} className={`industry-card ${getTrendColor(industry.growth)}`}>
            <div className="industry-header">
              <span className="industry-icon">{industry.icon}</span>
              <span className="trend-icon">{getTrendIcon(industry.trend)}</span>
            </div>
            <div className="industry-name">{industry.name}</div>
            <div className="industry-growth">
              <span className={industry.growth >= 0 ? 'positive' : 'negative'}>
                {industry.growth >= 0 ? '+' : ''}{industry.growth}%
              </span>
            </div>
            <div className="industry-status">
              {industry.trend === 'up' && 'Growing'}
              {industry.trend === 'down' && 'Declining'}
              {industry.trend === 'stable' && 'Stable'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default MarketPage;
