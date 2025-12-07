import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StockMarketPage.css';

interface ETF {
  sector: string;
  ticker: string;
  price: number;
  change: number;
  volume: number;
}

function StockMarketPage() {
  const navigate = useNavigate();
  const [selectedETF, setSelectedETF] = useState<ETF | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'buy' | 'sell'>('buy');

  // Mock ETF data - replace with actual API calls
  const etfs: ETF[] = [
    { sector: 'Technology', ticker: 'TECH', price: 125.50, change: 2.3, volume: 1500000 },
    { sector: 'Finance', ticker: 'FIN', price: 98.25, change: -0.8, volume: 980000 },
    { sector: 'Healthcare', ticker: 'HLTH', price: 142.75, change: 1.5, volume: 750000 },
    { sector: 'Energy', ticker: 'ENRG', price: 87.50, change: -1.2, volume: 1200000 },
    { sector: 'Agriculture', ticker: 'AGRI', price: 65.30, change: 0.5, volume: 450000 },
    { sector: 'Manufacturing', ticker: 'MNFG', price: 112.80, change: 1.8, volume: 890000 },
    { sector: 'Retail', ticker: 'RETL', price: 76.90, change: -0.3, volume: 620000 },
    { sector: 'Real Estate', ticker: 'REAL', price: 134.20, change: 0.9, volume: 540000 },
  ];

  const handleTrade = () => {
    if (!selectedETF) return;
    
    const total = selectedETF.price * quantity;
    const message = action === 'buy' 
      ? `Buy ${quantity} shares of ${selectedETF.ticker} for $${total.toFixed(2)}?`
      : `Sell ${quantity} shares of ${selectedETF.ticker} for $${total.toFixed(2)}?`;
    
    if (confirm(message)) {
      alert(`Trade executed: ${action.toUpperCase()} ${quantity} ${selectedETF.ticker}`);
      setSelectedETF(null);
      setQuantity(1);
    }
  };

  return (
    <div className="stock-market-page">
      <div className="page-header">
        <button onClick={() => navigate('/')} className="back-btn">← Back</button>
        <h1>Stock Market - Sector ETFs</h1>
      </div>

      <div className="market-container">
        <div className="etf-list">
          <h2>Available ETFs</h2>
          <div className="etf-cards">
            {etfs.map((etf) => (
              <div 
                key={etf.ticker} 
                className={`etf-card ${selectedETF?.ticker === etf.ticker ? 'selected' : ''}`}
                onClick={() => setSelectedETF(etf)}
              >
                <div className="etf-header">
                  <div className="etf-sector">{etf.sector}</div>
                  <div className="etf-ticker">{etf.ticker}</div>
                </div>
                <div className="etf-price">${etf.price.toFixed(2)}</div>
                <div className={`etf-change ${etf.change >= 0 ? 'positive' : 'negative'}`}>
                  {etf.change >= 0 ? '+' : ''}{etf.change}%
                </div>
                <div className="etf-volume">
                  Vol: {(etf.volume / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedETF && (
          <div className="trade-panel">
            <h2>Trade {selectedETF.sector}</h2>
            <div className="trade-info">
              <div className="info-row">
                <span>Ticker:</span>
                <span className="value">{selectedETF.ticker}</span>
              </div>
              <div className="info-row">
                <span>Current Price:</span>
                <span className="value">${selectedETF.price.toFixed(2)}</span>
              </div>
              <div className="info-row">
                <span>24h Change:</span>
                <span className={`value ${selectedETF.change >= 0 ? 'positive' : 'negative'}`}>
                  {selectedETF.change >= 0 ? '+' : ''}{selectedETF.change}%
                </span>
              </div>
            </div>

            <div className="trade-controls">
              <div className="action-selector">
                <button 
                  className={`action-btn ${action === 'buy' ? 'active buy' : ''}`}
                  onClick={() => setAction('buy')}
                >
                  Buy
                </button>
                <button 
                  className={`action-btn ${action === 'sell' ? 'active sell' : ''}`}
                  onClick={() => setAction('sell')}
                >
                  Sell
                </button>
              </div>

              <div className="quantity-input">
                <label>Quantity:</label>
                <input 
                  type="number" 
                  min="1" 
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
              </div>

              <div className="trade-summary">
                <div className="summary-row">
                  <span>Total:</span>
                  <span className="total-value">${(selectedETF.price * quantity).toFixed(2)}</span>
                </div>
              </div>

              <button className={`execute-btn ${action}`} onClick={handleTrade}>
                {action === 'buy' ? 'Execute Buy Order' : 'Execute Sell Order'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StockMarketPage;
