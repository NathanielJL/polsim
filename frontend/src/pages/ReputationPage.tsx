/**
 * REPUTATION PAGE
 * 
 * Show player's reputation breakdown by population group:
 * - Overall reputation score
 * - Approval by political archetype
 * - Approval by class
 * - Recent actions that affected reputation
 * - Trend visualization
 */

import React, { useState, useEffect } from "react";
import "../styles/ReputationPage.css";

interface ReputationData {
  overallReputation: number;
  byGroup: Record<string, number>;
}

const ReputationPage: React.FC = () => {
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReputation = async () => {
      try {
        const response = await fetch(`/api/players/player-123/reputation`);
        const data = await response.json();
        setReputation(data);
      } catch (error) {
        console.error("Failed to fetch reputation:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchReputation();
  }, []);

  return (
    <div className="reputation-page">
      <header>
        <h1>Your Reputation</h1>
      </header>

      {loading ? (
        <p>Loading reputation data...</p>
      ) : reputation ? (
        <main>
          <section className="overall-reputation">
            <h2>Overall Reputation Score</h2>
            <div className="score-display">{reputation.overallReputation}</div>
          </section>

          <section className="group-breakdown">
            <h2>Approval by Population Group</h2>
            <div className="group-grid">
              {Object.entries(reputation.byGroup).map(([group, score]) => (
                <div key={group} className="group-card">
                  <h3>{group}</h3>
                  <div className="approval-bar">
                    <div
                      className="approval-fill"
                      style={{
                        width: `${Math.max(0, score + 100) / 2}%`,
                        backgroundColor: score > 0 ? "green" : "red",
                      }}
                    />
                  </div>
                  <div className="approval-value">{score > 0 ? "+" : ""}{score}</div>
                </div>
              ))}
            </div>
          </section>
        </main>
      ) : (
        <p>Error loading reputation data</p>
      )}
    </div>
  );
};

export default ReputationPage;
