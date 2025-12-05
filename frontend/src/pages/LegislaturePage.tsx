import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import '../styles/LegislaturePage.css';

interface Office {
  _id: string;
  type: 'lower-house' | 'upper-house' | 'governor' | 'superintendent' | 'lt-governor';
  provinceId?: string;
  provinceName?: string;
  holderId?: {
    _id: string;
    username: string;
    faction?: string;
  };
  electedAt?: Date;
  appointedAt?: Date;
  term?: number;
}

interface Policy {
  _id: string;
  title: string;
  description: string;
  status: 'proposed' | 'voting' | 'passed' | 'rejected' | 'enacted';
  proposer: {
    _id: string;
    username: string;
  };
  votes: {
    playerId: string;
    vote: 'yes' | 'no' | 'abstain';
    votedAt: Date;
  }[];
  economicImpact?: any;
  createdAt: Date;
}

const LegislaturePage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [lowerHouse, setLowerHouse] = useState<Office[]>([]);
  const [upperHouse, setUpperHouse] = useState<Office[]>([]);
  const [governor, setGovernor] = useState<Office | null>(null);
  const [superintendents, setSuperintendents] = useState<Office[]>([]);
  const [activePolicies, setActivePolicies] = useState<Policy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lower' | 'upper' | 'executive' | 'bills'>('lower');

  useEffect(() => {
    fetchLegislatureData();
    fetchActivePolicies();
  }, [sessionId]);

  const fetchLegislatureData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/legislature/seats/${sessionId}`);
      const seats = response.data.seats;

      setLowerHouse(seats.filter((s: Office) => s.type === 'lower-house'));
      setUpperHouse(seats.filter((s: Office) => s.type === 'upper-house'));
      setGovernor(seats.find((s: Office) => s.type === 'governor') || null);
      setSuperintendents(seats.filter((s: Office) => s.type === 'superintendent'));

      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load legislature data');
      setLoading(false);
    }
  };

  const fetchActivePolicies = async () => {
    try {
      const response = await axios.get(`/api/policies/${sessionId}`);
      const active = response.data.policies.filter(
        (p: Policy) => p.status === 'proposed' || p.status === 'voting'
      );
      setActivePolicies(active);
    } catch (err) {
      console.error('Failed to load policies:', err);
    }
  };

  const handleVote = async (policyId: string, vote: 'yes' | 'no' | 'abstain') => {
    try {
      await axios.post(`/api/legislature/vote`, {
        sessionId,
        policyId,
        vote,
      });

      alert(`Vote recorded: ${vote.toUpperCase()}`);
      fetchActivePolicies();
      fetchLegislatureData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to record vote');
    }
  };

  const getFactionColor = (faction?: string): string => {
    const colors: { [key: string]: string } = {
      loyalist: '#C41E3A',
      reformist: '#4287f5',
      autonomist: '#4CAF50',
    };
    return colors[faction?.toLowerCase() || ''] || '#888888';
  };

  const getVoteCount = (policy: Policy): { yes: number; no: number; abstain: number } => {
    const votes = { yes: 0, no: 0, abstain: 0 };
    policy.votes.forEach((v) => {
      votes[v.vote]++;
    });
    return votes;
  };

  const getVotePercentage = (policy: Policy): number => {
    const totalSeats = lowerHouse.length + upperHouse.length;
    const totalVotes = policy.votes.length;
    return (totalVotes / totalSeats) * 100;
  };

  if (loading) {
    return (
      <div className="legislature-page loading">
        <div className="spinner"></div>
        <p>Loading General Assembly data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="legislature-page error">
        <h2>Error Loading General Assembly</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="legislature-page">
      <div className="legislature-header">
        <h1>General Assembly of Zealandia</h1>
        <p className="subtitle">Established by the Constitution Act of 1852</p>
      </div>

      <div className="legislature-tabs">
        <button
          className={activeTab === 'lower' ? 'active' : ''}
          onClick={() => setActiveTab('lower')}
        >
          House of Representatives ({lowerHouse.length})
        </button>
        <button
          className={activeTab === 'upper' ? 'active' : ''}
          onClick={() => setActiveTab('upper')}
        >
          Legislative Council ({upperHouse.length})
        </button>
        <button
          className={activeTab === 'executive' ? 'active' : ''}
          onClick={() => setActiveTab('executive')}
        >
          Executive Officers
        </button>
        <button
          className={activeTab === 'bills' ? 'active' : ''}
          onClick={() => setActiveTab('bills')}
        >
          Active Bills ({activePolicies.length})
        </button>
      </div>

      <div className="legislature-content">
        {activeTab === 'lower' && (
          <div className="tab-panel">
            <h2>House of Representatives (Lower House)</h2>
            <p className="house-description">
              Elected members representing the colonists, with representation distributed across the provinces.
            </p>

            <div className="seats-grid">
              {lowerHouse.map((seat) => (
                <div key={seat._id} className="seat-card">
                  <div className="seat-header">
                    <span className="seat-province">{seat.provinceName || 'Unknown Province'}</span>
                    {seat.holderId && seat.holderId.faction && (
                      <span
                        className="seat-faction"
                        style={{ background: getFactionColor(seat.holderId.faction) }}
                      >
                        {seat.holderId.faction}
                      </span>
                    )}
                  </div>
                  <div className="seat-holder">
                    {seat.holderId ? (
                      <>
                        <strong>{seat.holderId.username}</strong>
                        {seat.electedAt && (
                          <span className="seat-date">
                            Elected: {new Date(seat.electedAt).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="vacant">Vacant</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'upper' && (
          <div className="tab-panel">
            <h2>Legislative Council (Upper House)</h2>
            <p className="house-description">
              Members appointed for life by the Governor, advising on legislation and representing the wisdom and stability of the colonial gentry.
            </p>

            <div className="seats-grid">
              {upperHouse.map((seat) => (
                <div key={seat._id} className="seat-card upper-house">
                  <div className="seat-header">
                    <span className="seat-province">Appointed</span>
                    {seat.holderId && seat.holderId.faction && (
                      <span
                        className="seat-faction"
                        style={{ background: getFactionColor(seat.holderId.faction) }}
                      >
                        {seat.holderId.faction}
                      </span>
                    )}
                  </div>
                  <div className="seat-holder">
                    {seat.holderId ? (
                      <>
                        <strong>{seat.holderId.username}</strong>
                        {seat.appointedAt && (
                          <span className="seat-date">
                            Appointed: {new Date(seat.appointedAt).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="vacant">Vacant</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'executive' && (
          <div className="tab-panel">
            <h2>Executive Officers</h2>

            <div className="executive-section">
              <h3>Federal Government</h3>
              {governor && (
                <div className="executive-card governor">
                  <div className="executive-title">Governor of Zealandia</div>
                  <div className="executive-name">
                    {governor.holderId?.username || 'Vacant (Crown Appointment Pending)'}
                  </div>
                  <p className="executive-description">
                    Appointed by the Crown, holding the prerogative powers and authority over the General Assembly.
                  </p>
                  {governor.appointedAt && (
                    <div className="executive-date">
                      Appointed: {new Date(governor.appointedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="executive-section">
              <h3>Provincial Superintendents</h3>
              <div className="superintendents-grid">
                {superintendents.map((superintendent) => (
                  <div key={superintendent._id} className="executive-card superintendent">
                    <div className="executive-title">{superintendent.provinceName}</div>
                    <div className="executive-name">
                      {superintendent.holderId?.username || 'Vacant'}
                    </div>
                    {superintendent.electedAt && (
                      <div className="executive-date">
                        Elected: {new Date(superintendent.electedAt).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'bills' && (
          <div className="tab-panel">
            <h2>Bills Before the Assembly</h2>

            {activePolicies.length === 0 ? (
              <p className="empty-state">No bills currently under consideration</p>
            ) : (
              <div className="bills-list">
                {activePolicies.map((policy) => {
                  const votes = getVoteCount(policy);
                  const votePercentage = getVotePercentage(policy);

                  return (
                    <div key={policy._id} className="bill-card">
                      <div className="bill-header">
                        <h3>{policy.title}</h3>
                        <span className={`bill-status ${policy.status}`}>{policy.status}</span>
                      </div>

                      <p className="bill-description">{policy.description}</p>

                      <div className="bill-meta">
                        <span>Proposed by: <strong>{policy.proposer.username}</strong></span>
                        <span>Date: {new Date(policy.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div className="vote-progress">
                        <div className="vote-bar">
                          <div className="vote-segment yes" style={{ width: `${(votes.yes / (lowerHouse.length + upperHouse.length)) * 100}%` }}></div>
                          <div className="vote-segment no" style={{ width: `${(votes.no / (lowerHouse.length + upperHouse.length)) * 100}%` }}></div>
                        </div>
                        <div className="vote-counts">
                          <span className="vote-count yes">Yes: {votes.yes}</span>
                          <span className="vote-count no">No: {votes.no}</span>
                          <span className="vote-count abstain">Abstain: {votes.abstain}</span>
                          <span className="vote-percentage">{votePercentage.toFixed(0)}% voted</span>
                        </div>
                      </div>

                      <div className="bill-actions">
                        <button className="vote-button yes" onClick={() => handleVote(policy._id, 'yes')}>
                          Vote Yes
                        </button>
                        <button className="vote-button no" onClick={() => handleVote(policy._id, 'no')}>
                          Vote No
                        </button>
                        <button className="vote-button abstain" onClick={() => handleVote(policy._id, 'abstain')}>
                          Abstain
                        </button>
                        <button className="details-button" onClick={() => setSelectedPolicy(policy)}>
                          View Details
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Policy Details Modal */}
      {selectedPolicy && (
        <div className="modal-overlay" onClick={() => setSelectedPolicy(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{selectedPolicy.title}</h2>
              <button className="close-button" onClick={() => setSelectedPolicy(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>{selectedPolicy.description}</p>
              {selectedPolicy.economicImpact && (
                <div className="economic-impact">
                  <h3>Economic Impact</h3>
                  <pre>{JSON.stringify(selectedPolicy.economicImpact, null, 2)}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegislaturePage;
