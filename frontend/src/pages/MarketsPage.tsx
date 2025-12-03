/**
 * MARKETS PAGE
 * 
 * Display and manage market interactions:
 * - View all markets and prices
 * - Buy/sell goods and stocks
 * - View ETFs
 * - Price history charts
 */

import React, { useState, useEffect } from "react";
import "../styles/MarketsPage.css";

interface Market {
  id: string;
  name: string;
  currentPrice: number;
  trend: string;
  affectedByPolicies: string[];
}

const MarketsPage: React.FC = () => {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMarkets = async () => {
      try {
        const response = await fetch(`/api/markets/session-123`);
        const data = await response.json();
        setMarkets(data.markets);
      } catch (error) {
        console.error("Failed to fetch markets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMarkets();
  }, []);

  return (
    <div className="markets-page">
      <header>
        <h1>Markets</h1>
        <p>Buy, sell, and invest in goods and securities</p>
      </header>

      {loading ? (
        <p>Loading markets...</p>
      ) : (
        <section className="markets-grid">
          {markets.map((market) => (
            <div key={market.id} className="market-card">
              <h3>{market.name}</h3>
              <div className="price">${market.currentPrice.toFixed(2)}</div>
              <div className={`trend ${market.trend}`}>{market.trend}</div>
              <button>Trade</button>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};

export default MarketsPage;
