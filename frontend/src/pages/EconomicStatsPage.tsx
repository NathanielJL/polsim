import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/EconomicStatsPage.css';
import WikiAndGMButtons from '../components/WikiAndGMButtons';

function EconomicStatsPage() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<'total' | 'province'>('total');

  // Mock data - replace with actual API calls
  const totalStats = {
    gdp: 450000000000,
    resources: 85,
    unemployment: 4.2,
    debt: 120000000000,
    inflation: 2.1,
    productivity: 92,
    imports: 45000000000,
    exports: 52000000000,
    income: 180000000000,
    taxes: 54000000000,
    housing: 78,
    investments: 95000000000
  };

  const provinceStats = [
    { name: 'Auckland', gdp: 120000000000, unemployment: 3.8, debt: 30000000000 },
    { name: 'Wellington', gdp: 85000000000, unemployment: 4.1, debt: 22000000000 },
    { name: 'Canterbury', gdp: 75000000000, unemployment: 4.5, debt: 18000000000 },
    // Add more provinces as needed
  ];

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const formatPercent = (num: number) => `${num}%`;

  return (
    <div className="economic-stats-page">
      <WikiAndGMButtons />
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-btn">← Back</button>
        <h1>Economic Statistics</h1>
      </div>

      <div className="view-toggle">
        <button 
          className={`toggle-btn ${viewMode === 'total' ? 'active' : ''}`}
          onClick={() => setViewMode('total')}
        >
          Total
        </button>
        <button 
          className={`toggle-btn ${viewMode === 'province' ? 'active' : ''}`}
          onClick={() => setViewMode('province')}
        >
          By Province
        </button>
      </div>

      {viewMode === 'total' ? (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-label">GDP</div>
            <div className="stat-value">{formatCurrency(totalStats.gdp)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⛏️</div>
            <div className="stat-label">Resources</div>
            <div className="stat-value">{totalStats.resources}/100</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📉</div>
            <div className="stat-label">Unemployment</div>
            <div className="stat-value">{formatPercent(totalStats.unemployment)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💳</div>
            <div className="stat-label">National Debt</div>
            <div className="stat-value">{formatCurrency(totalStats.debt)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-label">Inflation</div>
            <div className="stat-value">{formatPercent(totalStats.inflation)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⚙️</div>
            <div className="stat-label">Productivity</div>
            <div className="stat-value">{totalStats.productivity}/100</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📥</div>
            <div className="stat-label">Imports</div>
            <div className="stat-value">{formatCurrency(totalStats.imports)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📤</div>
            <div className="stat-label">Exports</div>
            <div className="stat-value">{formatCurrency(totalStats.exports)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💵</div>
            <div className="stat-label">Income</div>
            <div className="stat-value">{formatCurrency(totalStats.income)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏛️</div>
            <div className="stat-label">Taxes</div>
            <div className="stat-value">{formatCurrency(totalStats.taxes)}</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🏘️</div>
            <div className="stat-label">Housing Index</div>
            <div className="stat-value">{totalStats.housing}/100</div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">📈</div>
            <div className="stat-label">Investments</div>
            <div className="stat-value">{formatCurrency(totalStats.investments)}</div>
          </div>
        </div>
      ) : (
        <div className="province-table">
          <table>
            <thead>
              <tr>
                <th>Province</th>
                <th>GDP</th>
                <th>Unemployment</th>
                <th>Debt</th>
              </tr>
            </thead>
            <tbody>
              {provinceStats.map((province, idx) => (
                <tr key={idx}>
                  <td>{province.name}</td>
                  <td>{formatCurrency(province.gdp)}</td>
                  <td>{formatPercent(province.unemployment)}</td>
                  <td>{formatCurrency(province.debt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EconomicStatsPage;
