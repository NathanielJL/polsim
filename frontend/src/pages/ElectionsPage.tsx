/**
 * Elections Page Component
 * Declare candidacy, view elections, vote, see results
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/ElectionsPage.css';

interface Candidate {
  playerId: string;
  platform: string;
  ideology: { economic: number; social: number; personal: number };
  endorsements: string[];
  fundingRaised: number;
}

interface Election {
  _id: string;
  id: string;
  officeType: string;
  provinceId?: string;
  candidates: Candidate[];
  votingOpen: boolean;
  votingCloses?: Date;
  results?: {
    winner: string;
    voteBreakdown: Map<string, number>;
    turnout: number;
  };
  status: 'announced' | 'campaigning' | 'voting' | 'completed';
}

const ElectionsPage: React.FC = () => {
  const { user } = useAuth();
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [loading, setLoading] = useState(true);
  const [candidacyModal, setCandidacyModal] = useState(false);
  const [platform, setPlatform] = useState('');

  useEffect(() => {
    loadElections();
  }, []);

  const loadElections = async () => {
    try {
      const response = await api.get(`/elections/${user?.sessionId}`);
      setElections(response.data.elections);
    } catch (error) {
      console.error('Failed to load elections:', error);
    } finally {
      setLoading(false);
    }
  };

  const declareCandidacy = async () => {
    if (!selectedElection || !platform) return;

    try {
      await api.post('/elections/declare-candidacy', {
        playerId: user?.id,
        electionId: selectedElection._id,
        platform,
      });
      
      alert('Candidacy declared!');
      setCandidacyModal(false);
      setPlatform('');
      loadElections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to declare candidacy');
    }
  };

  const castVote = async (electionId: string, candidateId: string) => {
    try {
      await api.post('/elections/vote', {
        voterId: user?.id,
        electionId,
        candidateId,
        sessionId: user?.sessionId,
      });
      
      alert('Vote cast!');
      loadElections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to vote');
    }
  };

  const donateToCandidate = async (electionId: string, candidateId: string) => {
    const amount = prompt('Enter donation amount (£):');
    if (!amount) return;

    try {
      await api.post('/elections/donate-to-campaign', {
        donorId: user?.id,
        electionId,
        candidateId,
        amount: parseInt(amount),
      });
      
      alert(`Donated £${amount}!`);
      loadElections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to donate');
    }
  };

  const endorseCandidate = async (electionId: string, candidateId: string) => {
    try {
      await api.post('/elections/endorse', {
        endorserId: user?.id,
        electionId,
        candidateId,
      });
      
      alert('Endorsement sent!');
      loadElections();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to endorse');
    }
  };

  const getOfficeLabel = (officeType: string) => {
    const labels: any = {
      primeMinister: 'Prime Minister',
      parliament: 'Parliament Member',
      governor: 'Provincial Governor',
      mayor: 'Mayor',
    };
    return labels[officeType] || officeType;
  };

  const getStatusBadge = (status: string) => {
    const badges: any = {
      announced: { text: 'Announced', class: 'status-announced' },
      campaigning: { text: 'Campaigning', class: 'status-campaigning' },
      voting: { text: 'Voting Open', class: 'status-voting' },
      completed: { text: 'Completed', class: 'status-completed' },
    };
    return badges[status] || { text: status, class: '' };
  };

  if (loading) return <div className="loading">Loading elections...</div>;

  return (
    <div className="elections-page">
      <header className="page-header">
        <h1>🗳️ Elections & Voting</h1>
        <p>Run for office, campaign, and vote in democratic elections</p>
      </header>

      <div className="elections-grid">
        {/* Active Elections List */}
        <div className="elections-list">
          <h2>Active Elections</h2>
          {elections.filter(e => e.status !== 'completed').length === 0 ? (
            <p className="no-elections">No active elections</p>
          ) : (
            elections
              .filter(e => e.status !== 'completed')
              .map(election => {
                const badge = getStatusBadge(election.status);
                return (
                  <div
                    key={election._id}
                    className={`election-card ${selectedElection?._id === election._id ? 'selected' : ''}`}
                    onClick={() => setSelectedElection(election)}
                  >
                    <div className="election-header">
                      <h3>{getOfficeLabel(election.officeType)}</h3>
                      <span className={`status-badge ${badge.class}`}>{badge.text}</span>
                    </div>
                    <p className="candidate-count">{election.candidates.length} candidates</p>
                    {election.votingOpen && election.votingCloses && (
                      <p className="voting-closes">
                        Voting closes: {new Date(election.votingCloses).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                );
              })
          )}
        </div>

        {/* Election Details */}
        {selectedElection && (
          <div className="election-details">
            <h2>{getOfficeLabel(selectedElection.officeType)}</h2>
            
            {/* Declare Candidacy Button */}
            {selectedElection.status !== 'completed' && selectedElection.status !== 'voting' && (
              <button
                className="btn-primary"
                onClick={() => setCandidacyModal(true)}
              >
                Declare Candidacy
              </button>
            )}

            {/* Candidates */}
            <div className="candidates-section">
              <h3>Candidates ({selectedElection.candidates.length})</h3>
              {selectedElection.candidates.map((candidate, idx) => (
                <div key={idx} className="candidate-card">
                  <div className="candidate-info">
                    <h4>Candidate #{idx + 1}</h4>
                    <p className="platform"><strong>Platform:</strong> {candidate.platform}</p>
                    <div className="candidate-stats">
                      <span className="funding">💰 £{candidate.fundingRaised.toLocaleString()} raised</span>
                      <span className="endorsements">👥 {candidate.endorsements.length} endorsements</span>
                    </div>
                    <div className="ideology">
                      <span>Economic: {candidate.ideology.economic > 0 ? '+' : ''}{candidate.ideology.economic}</span>
                      <span>Social: {candidate.ideology.social > 0 ? '+' : ''}{candidate.ideology.social}</span>
                      <span>Personal: {candidate.ideology.personal > 0 ? '+' : ''}{candidate.ideology.personal}</span>
                    </div>
                  </div>
                  <div className="candidate-actions">
                    {selectedElection.votingOpen && (
                      <button
                        className="btn-vote"
                        onClick={() => castVote(selectedElection._id, candidate.playerId)}
                      >
                        Vote
                      </button>
                    )}
                    <button
                      className="btn-donate"
                      onClick={() => donateToCandidate(selectedElection._id, candidate.playerId)}
                    >
                      Donate
                    </button>
                    <button
                      className="btn-endorse"
                      onClick={() => endorseCandidate(selectedElection._id, candidate.playerId)}
                    >
                      Endorse
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Results */}
            {selectedElection.results && (
              <div className="results-section">
                <h3>🏆 Election Results</h3>
                <p className="turnout">Turnout: {selectedElection.results.turnout}%</p>
                <div className="vote-breakdown">
                  {/* Results would be rendered here */}
                  <p>Winner declared!</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Past Elections */}
        <div className="past-elections">
          <h2>Past Elections</h2>
          {elections.filter(e => e.status === 'completed').map(election => (
            <div key={election._id} className="past-election-card">
              <h4>{getOfficeLabel(election.officeType)}</h4>
              <p>{election.candidates.length} candidates competed</p>
            </div>
          ))}
        </div>
      </div>

      {/* Candidacy Modal */}
      {candidacyModal && (
        <div className="modal-overlay" onClick={() => setCandidacyModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Declare Candidacy</h2>
            <p>Running for: {selectedElection && getOfficeLabel(selectedElection.officeType)}</p>
            
            <label>
              Campaign Platform:
              <textarea
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                placeholder="What will you do in office? What are your priorities?"
                rows={6}
              />
            </label>

            <div className="modal-actions">
              <button className="btn-primary" onClick={declareCandidacy}>
                Declare Candidacy
              </button>
              <button className="btn-secondary" onClick={() => setCandidacyModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ElectionsPage;
