/**
 * GOVERNMENT PAGE
 * 
 * Display government structure and legislative activities:
 * - View federal and provincial laws
 * - Propose policies
 * - Vote on legislation
 * - Watch provincial debates
 * - Government stats (GDP, unemployment, approval)
 */

import React, { useState, useEffect } from "react";
import "../styles/GovernmentPage.css";

interface Policy {
  id: string;
  title: string;
  status: "proposed" | "active" | "repealed";
  proposedBy: string;
}

const GovernmentPage: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch government data
    setLoading(false);
  }, []);

  return (
    <div className="government-page">
      <header>
        <h1>Government</h1>
        <p>Federal and Provincial Legislation</p>
      </header>

      <section className="government-stats">
        <div className="stat">
          <label>GDP</label>
          <value>$1.2T</value>
        </div>
        <div className="stat">
          <label>Unemployment</label>
          <value>5.3%</value>
        </div>
        <div className="stat">
          <label>Approval Rating</label>
          <value>52%</value>
        </div>
      </section>

      <section className="laws-section">
        <h2>Active Legislation</h2>
        <button>Propose New Policy</button>
        <div className="laws-list">
          {policies.length === 0 ? (
            <p>No active policies.</p>
          ) : (
            policies.map((policy) => (
              <div key={policy.id} className="law-item">
                <h3>{policy.title}</h3>
                <p>Proposed by: {policy.proposedBy}</p>
                <span className={`status ${policy.status}`}>{policy.status}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="debates-section">
        <h2>Provincial Debates</h2>
        <p>[Debate list would appear here]</p>
      </section>
    </div>
  );
};

export default GovernmentPage;
