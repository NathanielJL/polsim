/**
 * Business Page Component
 * Found companies, hire employees, manage operations
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/BusinessPage.css';

interface Company {
  _id: string;
  id: string;
  ownerId: string;
  name: string;
  type: string;
  cash: number;
  employees: number;
  marketInfluence: Map<string, number>;
  monthlyProfit: number;
  createdAt: Date;
}

const COMPANY_TYPES = [
  { value: 'Hotel', label: '🏨 Hotel', description: 'Hospitality and accommodation services' },
  { value: 'Construction', label: '🏗️ Construction', description: 'Building and infrastructure' },
  { value: 'Medicine', label: '⚕️ Medicine', description: 'Healthcare and pharmaceuticals' },
  { value: 'Finance', label: '💰 Finance', description: 'Banking and investment services' },
  { value: 'Technology', label: '⚙️ Technology', description: 'Industrial machinery and innovation' },
  { value: 'Agriculture', label: '🌾 Agriculture', description: 'Farming and food production' },
  { value: 'Manufacturing', label: '🏭 Manufacturing', description: 'Goods production and assembly' },
  { value: 'Transport', label: '🚂 Transport', description: 'Shipping and logistics' },
  { value: 'Mining', label: '⛏️ Mining', description: 'Resource extraction' },
  { value: 'Retail', label: '🏪 Retail', description: 'Trade and commerce' },
];

const BusinessPage: React.FC = () => {
  const { user } = useAuth();
  const [myCompany, setMyCompany] = useState<Company | null>(null);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [foundingModal, setFoundingModal] = useState(false);
  
  // Founding form state
  const [companyName, setCompanyName] = useState('');
  const [companyType, setCompanyType] = useState('');
  const [initialCapital, setInitialCapital] = useState(10000);

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      const response = await api.get(`/business/session/${user?.sessionId}`);
      const companies = response.data.companies;
      
      setAllCompanies(companies);
      
      // Find user's company
      const userCompany = companies.find((c: Company) => c.ownerId === user?.id);
      setMyCompany(userCompany || null);
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const foundCompany = async () => {
    if (!companyName || !companyType) {
      alert('Please fill in all fields');
      return;
    }

    try {
      await api.post('/business/found', {
        playerId: user?.id,
        sessionId: user?.sessionId,
        name: companyName,
        type: companyType,
        initialCapital,
      });
      
      alert(`Founded ${companyName}!`);
      setFoundingModal(false);
      setCompanyName('');
      setCompanyType('');
      setInitialCapital(10000);
      loadCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to found company');
    }
  };

  const investInCompany = async () => {
    if (!myCompany) return;
    
    const amount = prompt('Investment amount (£):');
    if (!amount) return;

    try {
      await api.post('/business/invest', {
        playerId: user?.id,
        companyId: myCompany.id,
        amount: parseInt(amount),
      });
      
      alert(`Invested £${amount}!`);
      loadCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to invest');
    }
  };

  const hireEmployees = async () => {
    if (!myCompany) return;
    
    const count = prompt('Number of employees to hire:');
    if (!count) return;

    const hireCount = parseInt(count);
    const cost = hireCount * 1000;

    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Hire ${hireCount} employees for £${cost.toLocaleString()}?`)) return;

    try {
      await api.post('/business/hire', {
        companyId: myCompany.id,
        count: hireCount,
      });
      
      alert(`Hired ${hireCount} employees!`);
      loadCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to hire');
    }
  };

  const closeCompany = async () => {
    if (!myCompany) return;
    
    // eslint-disable-next-line no-restricted-globals
    if (!confirm(`Close ${myCompany.name}? Remaining cash will be returned to you.`)) return;

    try {
      await api.delete(`/business/close/${myCompany.id}`, {
        data: { playerId: user?.id }
      });
      
      alert('Company closed');
      loadCompanies();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to close company');
    }
  };

  if (loading) return <div className="loading">Loading businesses...</div>;

  return (
    <div className="business-page">
      <header className="page-header">
        <h1>💼 Business & Commerce</h1>
        <p>Found companies, hire employees, and build economic empire</p>
      </header>

      {!myCompany ? (
        /* No Company - Founding Screen */
        <div className="no-company-section">
          <div className="founding-prompt">
            <h2>Start Your Business Empire</h2>
            <p>Found a company to generate income and influence markets</p>
            <button className="btn-primary btn-large" onClick={() => setFoundingModal(true)}>
              Found a Company
            </button>
          </div>

          {/* Company Type Preview */}
          <div className="company-types-grid">
            {COMPANY_TYPES.map(type => (
              <div key={type.value} className="company-type-card">
                <h3>{type.label}</h3>
                <p>{type.description}</p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Has Company - Management Screen */
        <div className="company-management">
          {/* Company Dashboard */}
          <div className="company-dashboard">
            <div className="company-header">
              <div>
                <h2>{myCompany.name}</h2>
                <p className="company-type">
                  {COMPANY_TYPES.find(t => t.value === myCompany.type)?.label || myCompany.type}
                </p>
              </div>
              <button className="btn-danger" onClick={closeCompany}>
                Close Company
              </button>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-info">
                  <div className="stat-label">Company Cash</div>
                  <div className="stat-value">£{myCompany.cash.toLocaleString()}</div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <div className="stat-label">Employees</div>
                  <div className="stat-value">{myCompany.employees}</div>
                </div>
              </div>

              <div className="stat-card profit">
                <div className="stat-icon">📈</div>
                <div className="stat-info">
                  <div className="stat-label">Monthly Profit</div>
                  <div className="stat-value">
                    £{myCompany.monthlyProfit.toLocaleString()}
                  </div>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🎂</div>
                <div className="stat-info">
                  <div className="stat-label">Founded</div>
                  <div className="stat-value">
                    {new Date(myCompany.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Management Actions */}
            <div className="management-actions">
              <button className="action-btn invest" onClick={investInCompany}>
                💵 Invest Capital
              </button>
              <button className="action-btn hire" onClick={hireEmployees}>
                👔 Hire Employees (£1,000 each)
              </button>
            </div>

            {/* Profit Explanation */}
            <div className="profit-explanation">
              <h3>Profit Calculation</h3>
              <div className="formula">
                <div className="formula-line">
                  <span>Base Return:</span>
                  <span>£{(myCompany.cash * 0.05).toLocaleString()}</span>
                  <span className="formula-detail">(5% of capital)</span>
                </div>
                <div className="formula-line">
                  <span>Employee Bonus:</span>
                  <span>£{Math.round(Math.log(myCompany.employees + 1) * 100).toLocaleString()}</span>
                  <span className="formula-detail">(productivity)</span>
                </div>
                <div className="formula-line total">
                  <span>Monthly Profit:</span>
                  <span>£{myCompany.monthlyProfit.toLocaleString()}</span>
                </div>
                <div className="formula-note">
                  Owner receives 50% as dividends each month
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* All Companies in Session */}
      <div className="all-companies-section">
        <h2>All Companies in Session ({allCompanies.length})</h2>
        <div className="companies-grid">
          {allCompanies.map(company => (
            <div key={company._id} className="company-card">
              <h3>{company.name}</h3>
              <p className="company-type">
                {COMPANY_TYPES.find(t => t.value === company.type)?.label}
              </p>
              <div className="company-stats">
                <span>👥 {company.employees} employees</span>
                <span>💰 £{company.cash.toLocaleString()}</span>
              </div>
              {company.monthlyProfit > 0 && (
                <div className="company-profit">
                  📈 £{company.monthlyProfit.toLocaleString()}/month
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Founding Modal */}
      {foundingModal && (
        <div className="modal-overlay" onClick={() => setFoundingModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Found a Company</h2>
            
            <label>
              Company Name:
              <input
                type="text"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="Enter company name..."
              />
            </label>

            <label>
              Company Type:
              <select value={companyType} onChange={e => setCompanyType(e.target.value)}>
                <option value="">Select type...</option>
                {COMPANY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Initial Capital:
              <input
                type="number"
                value={initialCapital}
                onChange={e => setInitialCapital(parseInt(e.target.value))}
                min={5000}
                step={1000}
              />
              <span className="input-hint">Minimum £5,000. More capital = higher starting profits.</span>
            </label>

            <div className="cost-breakdown">
              <strong>Founding Cost:</strong> £{initialCapital.toLocaleString()}
            </div>

            <div className="modal-actions">
              <button className="btn-primary" onClick={foundCompany}>
                Found Company
              </button>
              <button className="btn-secondary" onClick={() => setFoundingModal(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BusinessPage;
