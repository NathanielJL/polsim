/**
 * Legal Services Page
 * Become a lawyer, provide legal services, specialize
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/LegalPage.css';

interface Lawyer {
  _id: string;
  username: string;
  cash: number;
  reputation: number;
  professionalCredentials: {
    barAdmitted: boolean;
    cases: number;
    licenses: string[];
  };
}

const SPECIALIZATIONS = [
  { value: 'Corporate Law', icon: '🏢', description: 'Business and company legal services' },
  { value: 'Criminal Defense', icon: '⚖️', description: 'Defend clients in criminal cases' },
  { value: 'Constitutional Law', icon: '📜', description: 'Government and constitutional matters' },
  { value: 'Contract Law', icon: '📝', description: 'Draft and review contracts' },
  { value: 'Property Law', icon: '🏡', description: 'Land and property transactions' },
  { value: 'Tax Law', icon: '💰', description: 'Taxation and revenue matters' },
];

const LegalPage: React.FC = () => {
  const { user } = useAuth();
  const [lawyers, setLawyers] = useState<Lawyer[]>([]);
  const [myProfile, setMyProfile] = useState<Lawyer | null>(null);
  const [loading, setLoading] = useState(true);
  const [serviceModal, setServiceModal] = useState(false);
  const [specializationModal, setSpecializationModal] = useState(false);

  const isLawyer = user?.profession === 'lawyer' && user?.professionalCredentials?.barAdmitted;

  useEffect(() => {
    loadLawyers();
    if (isLawyer) {
      loadMyProfile();
    }
  }, []);

  const loadLawyers = async () => {
    try {
      const response = await api.get(`/legal/lawyers/${user?.sessionId}`);
      setLawyers(response.data.lawyers);
    } catch (error) {
      console.error('Failed to load lawyers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMyProfile = async () => {
    try {
      const response = await api.get(`/legal/lawyer/${user?.id}`);
      setMyProfile(response.data.lawyer);
    } catch (error) {
      console.error('Failed to load profile:', error);
    }
  };

  const admitToBar = async () => {
    if (!window.confirm('Become a lawyer? Cost: £5,000')) return;

    try {
      await api.post('/legal/admit-to-bar', {
        playerId: user?.id,
      });
      
      alert('Admitted to the bar! You are now a lawyer.');
      window.location.reload(); // Refresh to update user state
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to admit to bar');
    }
  };

  const addSpecialization = async (specialization: string) => {
    try {
      await api.post('/legal/specialize', {
        playerId: user?.id,
        specialization,
      });
      
      alert(`Specialized in ${specialization}!`);
      setSpecializationModal(false);
      loadMyProfile();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to specialize');
    }
  };

  const provideService = async (serviceType: string) => {
    const clientId = prompt('Enter client Player ID:');
    if (!clientId) return;

    const fee = prompt('Enter service fee (£):');
    if (!fee) return;

    try {
      let endpoint = '';
      let data: any = {
        lawyerId: user?.id,
        fee: parseInt(fee),
      };

      if (serviceType === 'contract') {
        endpoint = '/legal/service/contract';
        data.clientId = clientId;
        data.contractType = prompt('Contract type:') || 'General Contract';
      } else if (serviceType === 'corporate') {
        endpoint = '/legal/service/corporate';
        data.companyId = clientId; // Using as company ID
        data.serviceType = prompt('Service type:') || 'General Corporate Service';
      } else if (serviceType === 'court') {
        endpoint = '/legal/service/court-representation';
        data.clientId = clientId;
        data.caseType = prompt('Case type:') || 'General Case';
      }

      await api.post(endpoint, data);
      
      alert('Service provided successfully!');
      loadMyProfile();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to provide service');
    }
  };

  if (loading) return <div className="loading">Loading legal services...</div>;

  return (
    <div className="legal-page">
      <header className="page-header">
        <h1>⚖️ Legal Services</h1>
        <p>Practice law, provide legal services, and build your reputation</p>
      </header>

      {!isLawyer ? (
        /* Not a Lawyer - Admission Screen */
        <div className="admission-section">
          <div className="admission-prompt">
            <h2>Join the Legal Profession</h2>
            <p>Become a licensed lawyer and provide legal services to players and companies</p>
            
            <div className="admission-benefits">
              <div className="benefit">
                <div className="benefit-icon">💼</div>
                <h3>Earn Legal Fees</h3>
                <p>Charge clients for contracts, policy reviews, and court representation</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">🎓</div>
                <h3>Specialize</h3>
                <p>Gain expertise in Corporate, Criminal, Constitutional, and other areas</p>
              </div>
              <div className="benefit">
                <div className="benefit-icon">⭐</div>
                <h3>Build Reputation</h3>
                <p>Track cases won and build your legal career</p>
              </div>
            </div>

            <div className="admission-cost">
              <strong>Bar Admission Fee:</strong> £5,000
            </div>

            <button className="btn-primary btn-large" onClick={admitToBar}>
              Admit to the Bar
            </button>
          </div>
        </div>
      ) : (
        /* Is Lawyer - Practice Screen */
        <div className="lawyer-practice">
          {/* My Profile */}
          {myProfile && (
            <div className="my-profile">
              <h2>Your Legal Practice</h2>
              
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon">📊</div>
                  <div className="stat-info">
                    <div className="stat-label">Cases Handled</div>
                    <div className="stat-value">{myProfile.professionalCredentials.cases || 0}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">⭐</div>
                  <div className="stat-info">
                    <div className="stat-label">Reputation</div>
                    <div className="stat-value">{myProfile.reputation}/100</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">💰</div>
                  <div className="stat-info">
                    <div className="stat-label">Cash</div>
                    <div className="stat-value">£{myProfile.cash.toLocaleString()}</div>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon">🎓</div>
                  <div className="stat-info">
                    <div className="stat-label">Specializations</div>
                    <div className="stat-value">
                      {myProfile.professionalCredentials.licenses?.length || 1}
                    </div>
                  </div>
                </div>
              </div>

              {/* Specializations */}
              <div className="specializations-section">
                <h3>Your Specializations</h3>
                <div className="specializations-list">
                  {myProfile.professionalCredentials.licenses?.map((license, idx) => (
                    <span key={idx} className="specialization-badge">
                      {SPECIALIZATIONS.find(s => s.value === license)?.icon || '⚖️'} {license}
                    </span>
                  ))}
                </div>
                <button className="btn-secondary" onClick={() => setSpecializationModal(true)}>
                  Add Specialization (£2,000)
                </button>
              </div>

              {/* Services */}
              <div className="services-section">
                <h3>Provide Legal Services</h3>
                <div className="services-grid">
                  <button className="service-btn" onClick={() => provideService('contract')}>
                    📝 Draft Contract
                  </button>
                  <button className="service-btn" onClick={() => provideService('corporate')}>
                    🏢 Corporate Service
                  </button>
                  <button className="service-btn" onClick={() => provideService('court')}>
                    ⚖️ Court Representation
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* All Lawyers Directory */}
      <div className="lawyers-directory">
        <h2>Licensed Lawyers ({lawyers.length})</h2>
        <div className="lawyers-grid">
          {lawyers.map(lawyer => (
            <div key={lawyer._id} className="lawyer-card">
              <h3>{lawyer.username}</h3>
              <div className="lawyer-stats">
                <span>📊 {lawyer.professionalCredentials.cases || 0} cases</span>
                <span>⭐ {lawyer.reputation}/100</span>
              </div>
              <div className="lawyer-licenses">
                {lawyer.professionalCredentials.licenses?.slice(0, 3).map((license, idx) => (
                  <span key={idx} className="license-badge">{license}</span>
                ))}
                {lawyer.professionalCredentials.licenses?.length > 3 && (
                  <span className="license-badge">+{lawyer.professionalCredentials.licenses.length - 3} more</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Specialization Modal */}
      {specializationModal && (
        <div className="modal-overlay" onClick={() => setSpecializationModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Add Specialization</h2>
            <p>Cost: £2,000 per specialization</p>
            
            <div className="specializations-options">
              {SPECIALIZATIONS.map(spec => (
                <div
                  key={spec.value}
                  className="specialization-option"
                  onClick={() => addSpecialization(spec.value)}
                >
                  <div className="spec-icon">{spec.icon}</div>
                  <div className="spec-info">
                    <h4>{spec.value}</h4>
                    <p>{spec.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <button className="btn-secondary" onClick={() => setSpecializationModal(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LegalPage;
