import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useGameStore } from '../store/gameStore';
import api from '../services/api';
import '../styles/GameMasterDashboard.css';

/**
 * Game Dashboard - Main gameplay interface
 * Shows markets, population sentiment, portfolio, and turn status
 */
export const GameDashboardPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { dashboard, loading, error, loadDashboard } = useGameStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'markets' | 'portfolio' | 'population'>('overview');
  const [tradingLoading, setTradingLoading] = useState(false);

  useEffect(() => {
    if (sessionId) {
      loadDashboard(sessionId);
    }
  }, [sessionId, loadDashboard]);

  if (loading) return <div className="dashboard-loading">Loading dashboard...</div>;
  if (error) return <div className="dashboard-error">Error: {error}</div>;
  if (!dashboard) return <div className="dashboard-empty">No dashboard data available</div>;

  const {
    session,
    gameState,
    playerStats,
    portfolio,
    returns,
    markets,
    populationSentiment,
    recentEvents,
  } = dashboard;

  const handleBuyStock = async (stockMarketId: string, shares: number) => {
    setTradingLoading(true);
    try {
      await api.buyStock(sessionId!, stockMarketId, shares);
      loadDashboard(sessionId!);
    } catch (err) {
      alert(`Failed to buy stock: ${(err as any).response?.data?.error || 'Unknown error'}`);
    } finally {
      setTradingLoading(false);
    }
  };

  const handleSellStock = async (stockMarketId: string, shares: number) => {
    setTradingLoading(true);
    try {
      await api.sellStock(sessionId!, stockMarketId, shares);
      loadDashboard(sessionId!);
    } catch (err) {
      alert(`Failed to sell stock: ${(err as any).response?.data?.error || 'Unknown error'}`);
    } finally {
      setTradingLoading(false);
    }
  };

  return (
    <div className="game-dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <h1>{session.name}</h1>
          <div className="game-status">
            <span className="turn-indicator">Turn {session.currentTurn}</span>
            <span className="status-badge">{session.status}</span>
            <span className="players-info">{session.players.length} Players</span>
          </div>
        </div>

        {/* Game State Overview */}
        <div className="game-state-overview">
          <div className="state-item">
            <label>Economic Index</label>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${gameState.economicIndex}%` }}
              ></div>
            </div>
            <span>{gameState.economicIndex}</span>
          </div>
          <div className="state-item">
            <label>Social Stability</label>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${gameState.socialStability}%` }}
              ></div>
            </div>
            <span>{gameState.socialStability}</span>
          </div>
          <div className="state-item">
            <label>Political Stability</label>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${gameState.politicalStability}%` }}
              ></div>
            </div>
            <span>{gameState.politicalStability}</span>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <nav className="dashboard-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'markets' ? 'active' : ''}`}
          onClick={() => setActiveTab('markets')}
        >
          Markets
        </button>
        <button
          className={`tab ${activeTab === 'portfolio' ? 'active' : ''}`}
          onClick={() => setActiveTab('portfolio')}
        >
          Portfolio
        </button>
        <button
          className={`tab ${activeTab === 'population' ? 'active' : ''}`}
          onClick={() => setActiveTab('population')}
        >
          Population
        </button>
      </nav>

      {/* Tab Content */}
      <main className="dashboard-content">
        {activeTab === 'overview' && (
          <section className="overview-section">
            <div className="overview-grid">
              {/* Player Stats */}
              <div className="card player-stats">
                <h2>Your Stats</h2>
                <div className="stat-item">
                  <span className="stat-label">Rank</span>
                  <span className="stat-value">
                    #{playerStats.rank} of {playerStats.totalRanked}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Portfolio Value</span>
                  <span className="stat-value">${playerStats.totalPortfolioValue.toLocaleString()}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Cash</span>
                  <span className="stat-value">${playerStats.cash.toLocaleString()}</span>
                </div>
              </div>

              {/* Portfolio Summary */}
              <div className="card portfolio-summary">
                <h2>Portfolio</h2>
                <div className="portfolio-breakdown">
                  <div className="breakdown-item">
                    <span>Cash</span>
                    <span>${portfolio.cash.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Stocks</span>
                    <span>${portfolio.stockValue.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item">
                    <span>Items</span>
                    <span>${portfolio.itemValue.toLocaleString()}</span>
                  </div>
                  <div className="breakdown-item total">
                    <span>Total</span>
                    <span>${portfolio.value.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Returns */}
              <div className="card returns-summary">
                <h2>Returns</h2>
                <div className="return-item">
                  <span className="label">Total Gain/Loss</span>
                  <span className={`value ${returns.totalGain >= 0 ? 'positive' : 'negative'}`}>
                    ${Math.abs(returns.totalGain).toLocaleString()}
                  </span>
                </div>
                <div className="return-item">
                  <span className="label">Return %</span>
                  <span className={`value ${parseFloat(returns.gainPercent) >= 0 ? 'positive' : 'negative'}`}>
                    {returns.gainPercent}%
                  </span>
                </div>
              </div>

              {/* Recent Events */}
              <div className="card recent-events">
                <h2>Recent Events</h2>
                <div className="events-list">
                  {recentEvents.approved.slice(0, 3).map((event: any) => (
                    <div key={event.id} className="event-item approved">
                      <span className="event-title">{event.title}</span>
                      <span className="event-severity">Severity: {event.severity}</span>
                    </div>
                  ))}
                  {recentEvents.pending.slice(0, 2).map((event: any) => (
                    <div key={event.id} className="event-item pending">
                      <span className="event-title">{event.title}</span>
                      <span className="event-badge">Pending Approval</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'markets' && (
          <section className="markets-section">
            <div className="markets-grid">
              {/* Stock Markets */}
              <div className="card">
                <h2>Stock Markets (Sector ETFs)</h2>
                <div className="market-list">
                  {markets.stocks.map((stock: any) => (
                    <div key={stock.id} className="market-item">
                      <div className="market-header">
                        <span className="market-name">{stock.sector}</span>
                        <span className={`market-price ${stock.change >= 0 ? 'up' : 'down'}`}>
                          ${stock.currentPrice.toFixed(2)} ({stock.change > 0 ? '+' : ''}{stock.change}%)
                        </span>
                      </div>
                      <div className="market-info">
                        <span>Supply: {stock.supply}</span>
                        <span>Demand: {stock.demand}</span>
                        <span>Shares Available: {stock.sharesAvailable}</span>
                      </div>
                      <div className="market-actions">
                        <input
                          type="number"
                          placeholder="Shares"
                          min="1"
                          id={`buy-shares-${stock.id}`}
                        />
                        <button
                          className="btn-buy"
                          onClick={() => {
                            const input = document.getElementById(
                              `buy-shares-${stock.id}`
                            ) as HTMLInputElement;
                            handleBuyStock(stock.id, parseInt(input.value));
                          }}
                          disabled={tradingLoading}
                        >
                          Buy
                        </button>
                        <button
                          className="btn-sell"
                          onClick={() => {
                            const input = document.getElementById(
                              `buy-shares-${stock.id}`
                            ) as HTMLInputElement;
                            handleSellStock(stock.id, parseInt(input.value));
                          }}
                          disabled={tradingLoading}
                        >
                          Sell
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Items */}
              <div className="card">
                <h2>Market Items (Homes, Weapons, etc.)</h2>
                <div className="items-list">
                  {markets.items.map((item: any) => (
                    <div key={item.id} className="item-row">
                      <span className="item-name">
                        {item.name} <span className="item-category">{item.category}</span>
                      </span>
                      <span className={`item-price ${item.change >= 0 ? 'up' : 'down'}`}>
                        ${item.currentPrice.toFixed(2)}
                      </span>
                      <span className="item-quantity">Stock: {item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'portfolio' && (
          <section className="portfolio-section">
            <div className="portfolio-grid">
              <div className="card">
                <h2>Stock Holdings</h2>
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>Sector</th>
                      <th>Shares</th>
                      <th>Avg Cost</th>
                      <th>Current Price</th>
                      <th>Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.holdings
                      .filter((h: any) => h.type === 'stock')
                      .map((holding: any, idx: number) => (
                        <tr key={idx}>
                          <td>{holding.sector}</td>
                          <td>
                            {Math.round(
                              holding.cost / (markets.stocks.find((s: any) => s.sector === holding.sector)?.currentPrice || 1)
                            )}
                          </td>
                          <td>${(holding.cost / (Math.round(holding.cost / 1) || 1)).toFixed(2)}</td>
                          <td>${(holding.current / (Math.round(holding.cost / 1) || 1)).toFixed(2)}</td>
                          <td className={holding.gain >= 0 ? 'positive' : 'negative'}>
                            ${holding.gain.toFixed(2)} ({holding.percent}%)
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h2>Item Holdings</h2>
                <table className="holdings-table">
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Quantity</th>
                      <th>Avg Cost</th>
                      <th>Current Price</th>
                      <th>Gain/Loss</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.holdings
                      .filter((h: any) => h.type === 'item')
                      .map((holding: any, idx: number) => (
                        <tr key={idx}>
                          <td>{holding.name}</td>
                          <td>{Math.round(holding.cost / (holding.cost / Math.round(holding.cost / 1) || 1))}</td>
                          <td>${(holding.cost / (Math.round(holding.cost / 1) || 1)).toFixed(2)}</td>
                          <td>${(holding.current / (Math.round(holding.cost / 1) || 1)).toFixed(2)}</td>
                          <td className={holding.gain >= 0 ? 'positive' : 'negative'}>
                            ${holding.gain.toFixed(2)} ({holding.percent}%)
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

        {activeTab === 'population' && (
          <section className="population-section">
            <div className="card">
              <h2>Population Sentiment by Archetype</h2>
              <div className="sentiment-list">
                {populationSentiment.map((group: any, idx: number) => (
                  <div key={idx} className="sentiment-item">
                    <div className="sentiment-header">
                      <span className="archetype-name">{group.archetype}</span>
                      <span className="population-size">Population: {group.size.toLocaleString()}</span>
                    </div>
                    <div className="approval-bar">
                      <div
                        className={`approval-fill ${group.approval >= 0 ? 'positive' : 'negative'}`}
                        style={{
                          width: `${Math.abs(group.approval) * 0.5}%`,
                        }}
                      ></div>
                    </div>
                    <span className="approval-value">{group.approval > 0 ? '+' : ''}{group.approval}% approval</span>
                    <div className="groups-breakdown">
                      {group.groups.map((g: any, gidx: number) => (
                        <span key={gidx} className="group-badge">
                          {g.class}: {g.approval}%
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default GameDashboardPage;
