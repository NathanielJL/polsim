import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/LegalCasesPage.css';

interface LegalCase {
  _id: string;
  caseNumber: string;
  title: string;
  description: string;
  plaintiff: string;
  defendant: string;
  status: 'open' | 'in-progress' | 'closed';
  plaintiffLawyer?: string;
  defendantLawyer?: string;
  dateOpened: string;
  province?: string;
  aiGenerated?: boolean;
}

function LegalCasesPage() {
  const navigate = useNavigate();
  const { player } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [selectedCase, setSelectedCase] = useState<LegalCase | null>(null);
  const [showSubmitForm, setShowSubmitForm] = useState(false);
  const [isLawyer, setIsLawyer] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    defendant: '',
    province: ''
  });

  const provinces = [
    'Southland', 'New Zealand', 'Cooksland', 'Vulteralia',
    'Te Moana-a-Toir', 'Tasminata', 'New Caledonia'
  ];

  useEffect(() => {
    loadCases();
    checkLawyerStatus();
  }, []);

  const loadCases = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/legal/cases/${player?.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCases(data.cases || []);
      }
    } catch (error) {
      console.error('Failed to load cases:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkLawyerStatus = async () => {
    // Check if player has lawyer certification
    try {
      const response = await fetch(`http://localhost:5000/api/players/${player?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsLawyer(data.isLawyer || false);
      }
    } catch (error) {
      console.error('Failed to check lawyer status:', error);
    }
  };

  const handleSubmitCase = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('http://localhost:5000/api/legal/submit-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          playerId: player?.id,
          sessionId: player?.sessionId,
          title: formData.title,
          defendant: formData.defendant,
          provinceId: formData.province,
          description: formData.description
        })
      });

      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Case submitted successfully');
        setShowSubmitForm(false);
        setFormData({ title: '', description: '', defendant: '', province: '' });
        loadCases();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to submit case');
      }
    } catch (error) {
      console.error('Failed to submit case:', error);
      alert('Failed to submit case');
    }
  };

  const handlePickCase = async (caseId: string, side: 'plaintiff' | 'defendant') => {
    if (!isLawyer) {
      alert('You must pass the Bar Exam to represent clients');
      return;
    }

    try {
      const response = await fetch('http://localhost:5000/api/legal/take-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          playerId: player?.id,
          caseId,
          side
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        alert(data.message || 'Successfully took case');
        if (data.chatroomCreated) {
          alert('Both lawyers assigned! Chatroom created for case discussion.');
        }
        loadCases();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to take case');
      }
    } catch (error) {
      console.error('Failed to assign case:', error);
      alert('Failed to assign case');
    }
  };

  return (
    <div className="legal-cases-page">
      <PageHeader title="Legal Cases" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NavigationMenu isOpen={menuOpen} />

      <div className="cases-content">
        <div className="cases-header">
          <div className="header-actions">
            <button onClick={() => setShowSubmitForm(!showSubmitForm)} className="submit-case-btn">
              📝 Submit New Case
            </button>
            {!isLawyer && (
              <button onClick={() => navigate('/legal/bar-exam')} className="bar-exam-btn">
                ⚖️ Take Bar Exam
              </button>
            )}
          </div>
        </div>

        {showSubmitForm && (
          <div className="submit-form-panel">
            <h3>Submit a Legal Case</h3>
            <form onSubmit={handleSubmitCase}>
              <div className="form-group">
                <label>Case Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Brief description of the case"
                  required
                />
              </div>

              <div className="form-group">
                <label>Defendant *</label>
                <input
                  type="text"
                  value={formData.defendant}
                  onChange={(e) => setFormData({ ...formData, defendant: e.target.value })}
                  placeholder="Who are you filing against?"
                  required
                />
              </div>

              <div className="form-group">
                <label>Province *</label>
                <select
                  value={formData.province}
                  onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  required
                >
                  <option value="">Select province...</option>
                  {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label>Case Description *</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Detailed description of the dispute..."
                  rows={6}
                  required
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="primary-btn">Submit Case</button>
                <button type="button" onClick={() => setShowSubmitForm(false)} className="cancel-btn">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="cases-grid">
          {loading ? (
            <div className="loading">Loading cases...</div>
          ) : cases.length === 0 ? (
            <div className="no-cases">
              <p>No active cases. Submit a case or check back later.</p>
            </div>
          ) : (
            cases.map(legalCase => (
              <div key={legalCase._id} className={`case-card ${legalCase.status}`}>
                <div className="case-header">
                  <div className="case-number">{legalCase.caseNumber}</div>
                  <span className={`status-badge ${legalCase.status}`}>
                    {legalCase.status}
                  </span>
                </div>

                <h3 className="case-title">{legalCase.title}</h3>
                <p className="case-description">{legalCase.description}</p>

                <div className="case-parties">
                  <div className="party">
                    <strong>Plaintiff:</strong> {legalCase.plaintiff}
                    {legalCase.plaintiffLawyer && (
                      <div className="lawyer-assigned">
                        Lawyer: {legalCase.plaintiffLawyer}
                      </div>
                    )}
                    {isLawyer && !legalCase.plaintiffLawyer && legalCase.status === 'open' && (
                      <button
                        onClick={() => handlePickCase(legalCase._id, 'plaintiff')}
                        className="pick-btn plaintiff"
                      >
                        Represent Plaintiff
                      </button>
                    )}
                  </div>

                  <div className="vs">VS</div>

                  <div className="party">
                    <strong>Defendant:</strong> {legalCase.defendant}
                    {legalCase.defendantLawyer && (
                      <div className="lawyer-assigned">
                        Lawyer: {legalCase.defendantLawyer}
                      </div>
                    )}
                    {isLawyer && !legalCase.defendantLawyer && legalCase.status === 'open' && (
                      <button
                        onClick={() => handlePickCase(legalCase._id, 'defendant')}
                        className="pick-btn defendant"
                      >
                        Represent Defendant
                      </button>
                    )}
                  </div>
                </div>

                <div className="case-meta">
                  <span>📍 {legalCase.province}</span>
                  <span>📅 {new Date(legalCase.dateOpened).toLocaleDateString()}</span>
                  {legalCase.aiGenerated && <span className="ai-badge">🤖 AI Generated</span>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default LegalCasesPage;
