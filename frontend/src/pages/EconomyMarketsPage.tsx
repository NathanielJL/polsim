import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/MarketPage.css';

interface Industry {
  name: string;
  growth: number;
  trend: 'up' | 'down' | 'stable';
  icon: string;
}

const EconomyMarketsPage: React.FC = () => {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  // 1854 Zealandia colonial industries - growth reflects frontier economy dynamics
  const industries: Industry[] = [
    { name: 'Pastoral (Sheep/Wool)', growth: 12.5, trend: 'up', icon: '�양' },
    { name: 'Whaling & Sealing', growth: -4.2, trend: 'down', icon: '🐋' },
    { name: 'Timber & Kauri Gum', growth: 8.7, trend: 'up', icon: '🌲' },
    { name: 'Flax & Hemp', growth: 3.4, trend: 'up', icon: '🌾' },
    { name: 'Grain & Agriculture', growth: 5.8, trend: 'up', icon: '🌽' },
    { name: 'Shipping & Coastal Trade', growth: 6.2, trend: 'up', icon: '⛵' },
    { name: 'Gold Mining', growth: -0.5, trend: 'stable', icon: '⛏️' },
    { name: 'Coal & Quarrying', growth: 2.1, trend: 'up', icon: '⚒️' },
    { name: 'Land Speculation', growth: 15.3, trend: 'up', icon: '📜' },
    { name: 'Retail & Provisions', growth: 4.5, trend: 'up', icon: '🏪' },
    { name: 'Shipbuilding', growth: 1.8, trend: 'up', icon: '🔨' },
    { name: 'Brewing & Distilling', growth: -1.2, trend: 'down', icon: '🍺' }
  ];

  const getGrowthCategory = (growth: number): string => {
    if (growth >= 5) return 'strong-growth';
    if (growth >= 1) return 'moderate-growth';
    if (growth >= -2) return 'moderate-decline';
    return 'strong-decline';
  };

  const getTrendIcon = (trend: 'up' | 'down' | 'stable'): string => {
    if (trend === 'up') return '📈';
    if (trend === 'down') return '📉';
    return '➡️';
  };

  const growingIndustries = industries.filter(i => i.growth > 0).length;
  const decliningIndustries = industries.filter(i => i.growth < 0).length;
  const averageGrowth = industries.reduce((sum, i) => sum + i.growth, 0) / industries.length;

  return (
    <div className="market-page">
      <PageHeader title="Industry Markets" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NavigationMenu isOpen={menuOpen} />

      <div className="page-content">

      <div className="market-summary">
        <div className="summary-card">
          <div className="summary-label">Growing Industries</div>
          <div className="summary-value green">{growingIndustries}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Declining Industries</div>
          <div className="summary-value red">{decliningIndustries}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Average Growth</div>
          <div className={`summary-value ${averageGrowth >= 0 ? 'green' : 'red'}`}>
            {averageGrowth.toFixed(1)}%
          </div>
        </div>
      </div>

      <div className="industry-grid">
        {industries.map(industry => (
          <div 
            key={industry.name}
            className={`industry-card ${getGrowthCategory(industry.growth)}`}
          >
            <div className="industry-header">
              <div className="industry-icon">{industry.icon}</div>
              <div className="trend-icon">{getTrendIcon(industry.trend)}</div>
            </div>
            <div className="industry-name">{industry.name}</div>
            <div className="industry-growth">
              <span className={industry.growth >= 0 ? 'positive' : 'negative'}>
                {industry.growth >= 0 ? '+' : ''}{industry.growth.toFixed(1)}%
              </span>
            </div>
            <div className="industry-status">
              {industry.growth >= 5 ? 'Strong Growth' : 
               industry.growth >= 1 ? 'Growing' :
               industry.growth >= -2 ? 'Declining' : 'Strong Decline'}
            </div>
          </div>
        ))}
      </div>
      </div>
    </div>
  );
};

export default EconomyMarketsPage;
