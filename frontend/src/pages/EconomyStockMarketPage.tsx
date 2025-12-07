import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/StockMarketPage.css';

interface ETF {
  sector: string;
  ticker: string;
  price: number;
  change: number;
  volume: number;
}

const EconomyStockMarketPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedETF, setSelectedETF] = useState<ETF | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState<number>(0);
  const [menuOpen, setMenuOpen] = useState(false);

  // 1854 Zealandia Sector ETFs - Colonial industries in British Pounds Sterling
  const etfs: ETF[] = [
    { sector: 'Pastoral & Wool', ticker: 'WOOL', price: 42.50, change: 3.2, volume: 2800 },
    { sector: 'Whaling & Sealing', ticker: 'WHAL', price: 38.75, change: -1.5, volume: 1900 },
    { sector: 'Timber & Forestry', ticker: 'TIMB', price: 51.20, change: 2.8, volume: 3200 },
    { sector: 'Shipping & Trade', ticker: 'SHIP', price: 67.40, change: 1.2, volume: 2400 },
    { sector: 'Agriculture & Flax', ticker: 'AGRI', price: 29.90, change: 0.8, volume: 1500 },
    { sector: 'Mining & Quarrying', ticker: 'MINE', price: 35.30, change: -0.3, volume: 1100 },
    { sector: 'Manufacturing', ticker: 'MNFG', price: 48.15, change: 1.9, volume: 1800 },
    { sector: 'Land & Property', ticker: 'LAND', price: 73.80, change: 4.1, volume: 2100 }
  ];

  const formatCurrency = (num: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const formatVolume = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    return `${(num / 1000).toFixed(0)}K`;
  };

  const handleTrade = () => {
    if (!selectedETF || quantity <= 0) return;
    
    const totalCost = selectedETF.price * quantity;
    alert(`${tradeMode === 'buy' ? 'Buying' : 'Selling'} ${quantity} shares of ${selectedETF.ticker} for ${formatCurrency(totalCost)}`);
  };

  return (
    <div className="stock-market-page">
      <PageHeader title="Stock Market - Sector ETFs" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NavigationMenu isOpen={menuOpen} />

      <div className="page-content">
        <div className="stock-market-content">
        <div className="etf-list">
          <h2>Available ETFs</h2>
          <div className="etf-grid">
            {etfs.map(etf => (
              <div 
                key={etf.ticker}
                className={`etf-card ${selectedETF?.ticker === etf.ticker ? 'selected' : ''}`}
                onClick={() => setSelectedETF(etf)}
              >
                <div className="etf-header">
                  <div className="etf-sector">{etf.sector}</div>
                  <div className="etf-ticker">{etf.ticker}</div>
                </div>
                <div className="etf-price">{formatCurrency(etf.price)}</div>
                <div className={`etf-change ${etf.change >= 0 ? 'positive' : 'negative'}`}>
                  {etf.change >= 0 ? '▲' : '▼'} {Math.abs(etf.change).toFixed(2)}%
                </div>
                <div className="etf-volume">Vol: {formatVolume(etf.volume)}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="trade-panel">
          <h2>Trade Panel</h2>
          {selectedETF ? (
            <>
              <div className="selected-etf-info">
                <div className="info-row">
                  <span>ETF:</span>
                  <strong>{selectedETF.ticker} - {selectedETF.sector}</strong>
                </div>
                <div className="info-row">
                  <span>Price:</span>
                  <strong>{formatCurrency(selectedETF.price)}</strong>
                </div>
                <div className="info-row">
                  <span>24h Change:</span>
                  <strong className={selectedETF.change >= 0 ? 'positive' : 'negative'}>
                    {selectedETF.change >= 0 ? '+' : ''}{selectedETF.change.toFixed(2)}%
                  </strong>
                </div>
              </div>

              <div className="trade-mode-toggle">
                <button 
                  className={tradeMode === 'buy' ? 'mode-btn buy active' : 'mode-btn buy'}
                  onClick={() => setTradeMode('buy')}
                >
                  Buy
                </button>
                <button 
                  className={tradeMode === 'sell' ? 'mode-btn sell active' : 'mode-btn sell'}
                  onClick={() => setTradeMode('sell')}
                >
                  Sell
                </button>
              </div>

              <div className="quantity-input">
                <label>Quantity:</label>
                <input 
                  type="number" 
                  min="0" 
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  placeholder="Enter shares"
                />
              </div>

              <div className="trade-total">
                <span>Total:</span>
                <strong>{formatCurrency(selectedETF.price * quantity)}</strong>
              </div>

              <button 
                className={`execute-btn ${tradeMode}`}
                onClick={handleTrade}
                disabled={quantity <= 0}
              >
                {tradeMode === 'buy' ? 'Execute Buy' : 'Execute Sell'}
              </button>
            </>
          ) : (
            <div className="no-selection">
              <p>Select an ETF to start trading</p>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default EconomyStockMarketPage;
