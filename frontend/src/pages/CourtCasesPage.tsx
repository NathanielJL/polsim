import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/CourtCasesPage.css';

interface CourtCase {
  _id: string;
  type: 'civil' | 'criminal';
  title: string;
  plaintiff: string;
  defendant: string;
  summary: string;
  legalIssues: string[];
  culturalContext?: string;
  difficulty: number;
  potentialOutcomes: string[];
  rewardRange: { min: number; max: number };
  status: 'pending' | 'in_progress' | 'resolved';
  assignedLawyer?: string;
  outcome?: string;
  reward?: number;
  reputationChange?: { [key: string]: number };
  createdAt: Date;
}

interface Player {
  _id: string;
  username: string;
  actionPoints: number;
  cash: number;
  heldOffice?: {
    type: string;
  };
}

const CourtCasesPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [pendingCases, setPendingCases] = useState<CourtCase[]>([]);
  const [myCases, setMyCases] = useState<CourtCase[]>([]);
  const [resolvedCases, setResolvedCases] = useState<CourtCase[]>([]);
  const [player, setPlayer] = useState<Player | null>(null);
  const [selectedCase, setSelectedCase] = useState<CourtCase | null>(null);
  const [resolvingCase, setResolvingCase] = useState(false);
  const [strategy, setStrategy] = useState('');
  const [arguments, setArguments] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'my-cases' | 'resolved'>('my-cases');

  useEffect(() => {
    fetchPlayerData();
    fetchCases();
  }, [sessionId]);

  const fetchPlayerData = async () => {
    try {
      const response = await axios.get('/api/players/me');
      setPlayer(response.data.player);
    } catch (err) {
      console.error('Failed to load player data:', err);
    }
  };

  const fetchCases = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/legal/cases/${sessionId}`);
      const cases = response.data.cases;

      setPendingCases(cases.filter((c: CourtCase) => c.status === 'pending'));
      setMyCases(cases.filter((c: CourtCase) => c.status === 'in_progress' && c.assignedLawyer === player?._id));
      setResolvedCases(cases.filter((c: CourtCase) => c.status === 'resolved'));
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load cases');
      setLoading(false);
    }
  };

  const handleResolveCase = async () => {
    if (!selectedCase || !strategy || !arguments) {
      alert('Please provide a strategy and arguments');
      return;
    }

    if (!player || player.actionPoints < 1) {
      alert('Not enough action points!');
      return;
    }

    try {
      setResolvingCase(true);
      const response = await axios.post('/api/legal/resolve-case', {
        caseId: selectedCase._id,
        strategy,
        arguments,
      });

      alert(`Case resolved! Outcome: ${response.data.case.outcome}\nReward: £${response.data.case.reward}`);
      
      // Refresh data
      await fetchCases();
      await fetchPlayerData();
      
      setSelectedCase(null);
      setStrategy('');
      setArguments('');
      setResolvingCase(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resolve case');
      setResolvingCase(false);
    }
  };

  const getDifficultyColor = (difficulty: number): string => {
    if (difficulty <= 3) return '#4CAF50';
    if (difficulty <= 6) return '#FF9800';
    return '#f44336';
  };

  const getDifficultyLabel = (difficulty: number): string => {
    if (difficulty <= 3) return 'Easy';
    if (difficulty <= 6) return 'Medium';
    return 'Hard';
  };

  const isLawyer = player?.heldOffice?.type === 'lawyer';

  if (loading) {
    return (
      <div className="court-cases-page loading">
        <div className="spinner"></div>
        <p>Loading court cases...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="court-cases-page error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!isLawyer) {
    return (
      <div className="court-cases-page not-lawyer">
        <h2>Access Restricted</h2>
        <p>You must be a lawyer to view court cases.</p>
        <p>Apply for a lawyer position to access the legal system.</p>
      </div>
    );
  }

  return (
    <div className="court-cases-page">
      <div className="cases-header">
        <h1>Court Cases</h1>
        <p className="subtitle">Legal matters requiring professional representation</p>
        {player && (
          <div className="player-stats">
            <span className="stat">
              <label>Action Points:</label>
              <strong>{player.actionPoints}</strong>
            </span>
            <span className="stat">
              <label>Cash:</label>
              <strong>£{player.cash.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      <div className="cases-tabs">
        <button
          className={activeTab === 'my-cases' ? 'active' : ''}
          onClick={() => setActiveTab('my-cases')}
        >
          My Cases ({myCases.length})
        </button>
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          Available Cases ({pendingCases.length})
        </button>
        <button
          className={activeTab === 'resolved' ? 'active' : ''}
          onClick={() => setActiveTab('resolved')}
        >
          Resolved Cases ({resolvedCases.length})
        </button>
      </div>

      <div className="cases-content">
        {activeTab === 'my-cases' && (
          <div className="tab-panel">
            {myCases.length === 0 ? (
              <p className="empty-state">You have no active cases. Check Available Cases to take on new work.</p>
            ) : (
              <div className="cases-list">
                {myCases.map((caseItem) => (
                  <div key={caseItem._id} className="case-card" onClick={() => setSelectedCase(caseItem)}>
                    <div className="case-header">
                      <h3>{caseItem.title}</h3>
                      <div className="case-badges">
                        <span className={`case-type ${caseItem.type}`}>{caseItem.type}</span>
                        <span
                          className="difficulty-badge"
                          style={{ background: getDifficultyColor(caseItem.difficulty) }}
                        >
                          {getDifficultyLabel(caseItem.difficulty)}
                        </span>
                      </div>
                    </div>

                    <div className="case-parties">
                      <div className="party">
                        <label>Plaintiff:</label>
                        <span>{caseItem.plaintiff}</span>
                      </div>
                      <div className="party">
                        <label>Defendant:</label>
                        <span>{caseItem.defendant}</span>
                      </div>
                    </div>

                    <p className="case-summary">{caseItem.summary}</p>

                    <div className="case-footer">
                      <span className="reward">
                        Reward: £{caseItem.rewardRange.min} - £{caseItem.rewardRange.max}
                      </span>
                      <button className="resolve-button" onClick={(e) => { e.stopPropagation(); setSelectedCase(caseItem); }}>
                        Resolve Case
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'pending' && (
          <div className="tab-panel">
            <p className="info-message">
              New cases are generated automatically each turn. Select a case to review details.
            </p>
            {pendingCases.length === 0 ? (
              <p className="empty-state">No cases available at this time. Check back next turn.</p>
            ) : (
              <div className="cases-list">
                {pendingCases.map((caseItem) => (
                  <div key={caseItem._id} className="case-card" onClick={() => setSelectedCase(caseItem)}>
                    <div className="case-header">
                      <h3>{caseItem.title}</h3>
                      <div className="case-badges">
                        <span className={`case-type ${caseItem.type}`}>{caseItem.type}</span>
                        <span
                          className="difficulty-badge"
                          style={{ background: getDifficultyColor(caseItem.difficulty) }}
                        >
                          {getDifficultyLabel(caseItem.difficulty)}
                        </span>
                      </div>
                    </div>

                    <div className="case-parties">
                      <div className="party">
                        <label>Plaintiff:</label>
                        <span>{caseItem.plaintiff}</span>
                      </div>
                      <div className="party">
                        <label>Defendant:</label>
                        <span>{caseItem.defendant}</span>
                      </div>
                    </div>

                    <p className="case-summary">{caseItem.summary}</p>

                    <div className="case-footer">
                      <span className="reward">
                        Potential Reward: £{caseItem.rewardRange.min} - £{caseItem.rewardRange.max}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'resolved' && (
          <div className="tab-panel">
            {resolvedCases.length === 0 ? (
              <p className="empty-state">No cases have been resolved yet.</p>
            ) : (
              <div className="cases-list">
                {resolvedCases.map((caseItem) => (
                  <div key={caseItem._id} className="case-card resolved">
                    <div className="case-header">
                      <h3>{caseItem.title}</h3>
                      <div className="case-badges">
                        <span className={`case-type ${caseItem.type}`}>{caseItem.type}</span>
                        <span className="outcome-badge">Resolved</span>
                      </div>
                    </div>

                    <div className="case-parties">
                      <div className="party">
                        <label>Plaintiff:</label>
                        <span>{caseItem.plaintiff}</span>
                      </div>
                      <div className="party">
                        <label>Defendant:</label>
                        <span>{caseItem.defendant}</span>
                      </div>
                    </div>

                    <p className="case-summary">{caseItem.summary}</p>

                    {caseItem.outcome && (
                      <div className="case-outcome">
                        <label>Outcome:</label>
                        <p>{caseItem.outcome}</p>
                      </div>
                    )}

                    <div className="case-footer">
                      <span className="reward earned">Earned: £{caseItem.reward || 0}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Case Details Modal */}
      {selectedCase && (
        <div className="modal-overlay" onClick={() => setSelectedCase(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedCase.title}</h2>
              <button className="close-button" onClick={() => setSelectedCase(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="case-detail-section">
                <div className="detail-row">
                  <label>Type:</label>
                  <span className={`case-type ${selectedCase.type}`}>{selectedCase.type}</span>
                </div>
                <div className="detail-row">
                  <label>Difficulty:</label>
                  <span style={{ color: getDifficultyColor(selectedCase.difficulty) }}>
                    {getDifficultyLabel(selectedCase.difficulty)} ({selectedCase.difficulty}/10)
                  </span>
                </div>
              </div>

              <div className="case-detail-section">
                <h3>Parties</h3>
                <div className="detail-row">
                  <label>Plaintiff:</label>
                  <span>{selectedCase.plaintiff}</span>
                </div>
                <div className="detail-row">
                  <label>Defendant:</label>
                  <span>{selectedCase.defendant}</span>
                </div>
              </div>

              <div className="case-detail-section">
                <h3>Summary</h3>
                <p>{selectedCase.summary}</p>
              </div>

              {selectedCase.legalIssues && selectedCase.legalIssues.length > 0 && (
                <div className="case-detail-section">
                  <h3>Legal Issues</h3>
                  <ul className="legal-issues-list">
                    {selectedCase.legalIssues.map((issue, index) => (
                      <li key={index}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCase.culturalContext && (
                <div className="case-detail-section cultural-context">
                  <h3>Cultural Context</h3>
                  <p>{selectedCase.culturalContext}</p>
                </div>
              )}

              {selectedCase.potentialOutcomes && selectedCase.potentialOutcomes.length > 0 && (
                <div className="case-detail-section">
                  <h3>Potential Outcomes</h3>
                  <ul className="outcomes-list">
                    {selectedCase.potentialOutcomes.map((outcome, index) => (
                      <li key={index}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedCase.status === 'in_progress' && (
                <div className="resolve-section">
                  <h3>Resolve Case (1 AP)</h3>
                  
                  <div className="form-group">
                    <label>Legal Strategy:</label>
                    <select value={strategy} onChange={(e) => setStrategy(e.target.value)}>
                      <option value="">Select strategy...</option>
                      <option value="aggressive">Aggressive Prosecution</option>
                      <option value="defensive">Defensive Protection</option>
                      <option value="negotiation">Negotiation/Settlement</option>
                      <option value="procedural">Procedural Challenge</option>
                      <option value="cultural">Cultural Sensitivity Approach</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Legal Arguments:</label>
                    <textarea
                      value={arguments}
                      onChange={(e) => setArguments(e.target.value)}
                      placeholder="Outline your key legal arguments and evidence..."
                      rows={6}
                    />
                  </div>

                  <div className="resolve-actions">
                    <button
                      className="resolve-submit-button"
                      onClick={handleResolveCase}
                      disabled={resolvingCase || !strategy || !arguments || (player?.actionPoints || 0) < 1}
                    >
                      {resolvingCase ? 'Resolving...' : 'Submit Case Resolution'}
                    </button>
                    {player && player.actionPoints < 1 && (
                      <p className="warning">Not enough action points!</p>
                    )}
                  </div>
                </div>
              )}

              <div className="reward-info">
                <strong>Reward Range:</strong> £{selectedCase.rewardRange.min.toLocaleString()} - £{selectedCase.rewardRange.max.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourtCasesPage;
