import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import WikiAndGMButtons from '../components/WikiAndGMButtons';
import '../styles/BusinessPage.css';

interface Business {
  _id: string;
  name: string;
  type: string;
  owner: string;
  province: string;
  cash: number;
  employees: number;
  profitPerTurn: number;
  established: string;
}

const businessTypes = [
  { type: 'farm', name: 'Farm', icon: '🌾', cost: 350, description: 'Produce food and agricultural goods' },
  { type: 'mine', name: 'Mine', icon: '⛏️', cost: 500, description: 'Extract minerals and resources' },
  { type: 'factory', name: 'Factory', icon: '🏭', cost: 1100, description: 'Manufacture goods and products' },
  { type: 'shop', name: 'Shop', icon: '🏪', cost: 150, description: 'Retail trade and commerce' },
  { type: 'tavern', name: 'Tavern', icon: '🍺', cost: 200, description: 'Food, drink, and lodging' },
  { type: 'shipping', name: 'Shipping Company', icon: '⛵', cost: 1500, description: 'Maritime trade and transport' },
  { type: 'bank', name: 'Bank', icon: '🏦', cost: 2000, description: 'Financial services and lending' }
];

const BusinessPage: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [view, setView] = useState<'overview' | 'manage'>('overview');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    province: ''
  });
  const [loading, setLoading] = useState(true);

  const provinces = [
    'Southland', 'New Zealand', 'Cooksland', 'Vulteralia',
    'Te Moana-a-Toir', 'Tasminata', 'New Caledonia'
  ];

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/business/my-business/${player?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBusinesses(data.business ? [data.business] : []);
      }
    } catch (error) {
      console.error('Failed to load businesses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBusiness = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const businessType = businessTypes.find(bt => bt.type === selectedType);
    if (!businessType) return;

    try {
      const response = await fetch('http://localhost:5000/api/business/found', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          playerId: player?.id,
          sessionId: player?.sessionId,
          name: formData.name,
          type: selectedType,
          provinceId: formData.province
        })
      });

      if (response.ok) {
        setView('manage');
        setSelectedType('');
        setFormData({ name: '', province: '' });
        loadBusinesses();
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Failed to create business');
      }
    } catch (error) {
      console.error('Failed to create business:', error);
      alert('Failed to create business');
    }
  };

  return (
    <>
      <WikiAndGMButtons />
      <div className="business-page">
        <PageHeader title="Business" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <NavigationMenu isOpen={menuOpen} />

        <div className="business-content">
          <div className="business-nav">
            <button 
              className={`nav-tab ${view === 'overview' ? 'active' : ''}`}
              onClick={() => setView('overview')}
            >
              📊 Types of Business
            </button>
            <button 
              className={`nav-tab ${view === 'manage' ? 'active' : ''}`}
              onClick={() => setView('manage')}
            >
              ⚙️ My Business
            </button>
          </div>

          {view === 'overview' && (
            <div className="overview-section">
              <h2>Types of Businesses</h2>
              <p className="section-description">
                Establish a business to generate income and increase your economic influence in Zealandia. You may only own one business at a time.
              </p>

              {businesses.length > 0 ? (
                <div className="already-owns-notice">
                  <p>⚠️ You already own a business. You must sell or close your current business before starting a new one.</p>
                  <button onClick={() => setView('manage')} className="view-business-btn">
                    View My Business
                  </button>
                </div>
              ) : (
                <div className="business-types-grid">
                  {businessTypes.map(bt => (
                    <div key={bt.type} className="business-type-card">
                      <div className="type-icon">{bt.icon}</div>
                      <h3>{bt.name}</h3>
                      <p className="type-description">{bt.description}</p>
                      <div className="type-cost">
                        <strong>Cost:</strong> £{bt.cost.toLocaleString()}
                      </div>
                      <button 
                        onClick={() => setSelectedType(bt.type)}
                        className="start-btn"
                      >
                        Start {bt.name}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {selectedType && (
                <div className="create-modal">
                  <div className="modal-content">
                    <button onClick={() => setSelectedType('')} className="modal-close">×</button>
                    <div className="selected-type-info">
                      {businessTypes.find(bt => bt.type === selectedType) && (
                        <>
                          <div className="type-icon-large">
                            {businessTypes.find(bt => bt.type === selectedType)!.icon}
                          </div>
                          <div>
                            <h3>{businessTypes.find(bt => bt.type === selectedType)!.name}</h3>
                            <p>{businessTypes.find(bt => bt.type === selectedType)!.description}</p>
                            <div className="cost-display">
                              Initial Cost: £{businessTypes.find(bt => bt.type === selectedType)!.cost.toLocaleString()}
                            </div>
                          </div>
                        </>
                      )}
                    </div>

                    <form onSubmit={handleCreateBusiness} className="business-form">
                      <div className="form-group">
                        <label htmlFor="name">Business Name *</label>
                        <input
                          type="text"
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Enter a name for your business"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="province">Province *</label>
                        <select
                          id="province"
                          value={formData.province}
                          onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                          required
                        >
                          <option value="">Select province...</option>
                          {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>

                      <div className="form-actions">
                        <button type="submit" className="create-btn">
                          Establish Business
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setSelectedType('')}
                          className="cancel-btn"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {view === 'create' && (
            <div className="create-section">
              <h2>Create a New Business</h2>

              {!selectedType ? (
                <div className="select-type-prompt">
                  <p>Please select a business type from the "Types of Business" tab.</p>
                  <button onClick={() => setView('overview')} className="back-btn">
                    View Business Types
                  </button>
                </div>
              ) : (
                <div className="create-form-container">
                  <div className="selected-type-info">
                    {businessTypes.find(bt => bt.type === selectedType) && (
                      <>
                        <div className="type-icon-large">
                          {businessTypes.find(bt => bt.type === selectedType)!.icon}
                        </div>
                        <div>
                          <h3>{businessTypes.find(bt => bt.type === selectedType)!.name}</h3>
                          <p>{businessTypes.find(bt => bt.type === selectedType)!.description}</p>
                          <div className="cost-display">
                            Initial Cost: £{businessTypes.find(bt => bt.type === selectedType)!.cost.toLocaleString()}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <form onSubmit={handleCreateBusiness} className="business-form">
                    <div className="form-group">
                      <label htmlFor="name">Business Name *</label>
                      <input
                        type="text"
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter a name for your business"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="province">Province *</label>
                      <select
                        id="province"
                        value={formData.province}
                        onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                        required
                      >
                        <option value="">Select province...</option>
                        {provinces.map(p => <option key={p} value={p}>{p}</option>)}
                      </select>
                    </div>

                    <div className="form-actions">
                      <button type="submit" className="create-btn">
                        Establish Business
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setSelectedType('')}
                        className="cancel-btn"
                      >
                        Change Type
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {view === 'manage' && (
            <div className="manage-section">
              <h2>My Business</h2>

              {loading ? (
                <div className="loading">Loading business...</div>
              ) : businesses.length === 0 ? (
                <div className="no-businesses">
                  <p>You don't own a business yet.</p>
                  <button onClick={() => setView('overview')} className="create-first-btn">
                    View Business Types
                  </button>
                </div>
              ) : (
                <div className="business-display">
                  {businesses.map(business => {
                    const type = businessTypes.find(bt => bt.type === business.type);
                    return (
                      <div key={business._id} className="business-card-large">
                        <div className="business-icon-large">{type?.icon || '🏢'}</div>
                        <h3>{business.name}</h3>
                        <div className="business-type">{type?.name || business.type}</div>

                        <div className="business-stats">
                          <div className="stat-item">
                            <span className="stat-label">Location:</span>
                            <span className="stat-value">{business.province}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Cash:</span>
                            <span className="stat-value">£{business.cash?.toLocaleString() || 0}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Employees:</span>
                            <span className="stat-value">{business.employees || 0}</span>
                          </div>
                          <div className="stat-item">
                            <span className="stat-label">Profit/Turn:</span>
                            <span className="stat-value profit">+£{business.profitPerTurn?.toLocaleString() || 0}</span>
                          </div>
                        </div>

                        <div className="business-actions">
                          <button className="action-btn">📊 View Details</button>
                          <button className="action-btn">💼 Hire Staff</button>
                          <button className="action-btn">💰 Invest</button>
                          <button className="action-btn danger">🚪 Sell Business</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default BusinessPage;
