import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/NewsManageNewspaperPage.css';

interface Newspaper {
  _id: string;
  name: string;
  slogan: string;
  province: string;
  politicalLeaning: string;
  focus: string;
  readership: number;
  cash: number;
  reputation: number;
  staff: number;
  established: string;
}

const NewsManageNewspaperPage: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [newspaper, setNewspaper] = useState<Newspaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadNewspaper();
  }, []);

  const loadNewspaper = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5000/api/news/my-newspaper/${player?.id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load newspaper');
      }
      
      const data = await response.json();
      setNewspaper(data.newspaper);
    } catch (err) {
      console.error('Error loading newspaper:', err);
      setError(err instanceof Error ? err.message : 'Failed to load newspaper');
    } finally {
      setLoading(false);
    }
  };

  const handleHireStaff = async () => {
    if (!newspaper) return;
    // TODO: Implement hiring staff
    alert('Hiring staff feature coming soon!');
  };

  const handlePublishArticle = () => {
    navigate('/news/publish');
  };

  if (loading) {
    return (
      <div className="news-manage-page">
        <PageHeader title="Manage Newspaper" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <NavigationMenu isOpen={menuOpen} />
        <div className="manage-content">
          <div className="loading">Loading newspaper...</div>
        </div>
      </div>
    );
  }

  if (!newspaper) {
    return (
      <div className="news-manage-page">
        <PageHeader title="Manage Newspaper" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
        <NavigationMenu isOpen={menuOpen} />
        <div className="manage-content">
          <div className="no-newspaper">
            <h2>📰 No Newspaper Found</h2>
            <p>You don't own a newspaper yet.</p>
            <button 
              onClick={() => navigate('/news/create-newspaper')}
              className="create-btn"
            >
              Create a Newspaper
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="news-manage-page">
      <PageHeader title="Manage Newspaper" menuOpen={menuOpen} setMenuOpen={setMenuOpen} />
      <NavigationMenu isOpen={menuOpen} />

      <div className="manage-content">
        <div className="newspaper-header">
          <h1>{newspaper.name}</h1>
          {newspaper.slogan && <p className="slogan">"{newspaper.slogan}"</p>}
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <div className="stat-label">Readership</div>
              <div className="stat-value">{newspaper.readership.toLocaleString()}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">💰</div>
            <div className="stat-info">
              <div className="stat-label">Cash</div>
              <div className="stat-value">£{newspaper.cash.toLocaleString()}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-info">
              <div className="stat-label">Reputation</div>
              <div className="stat-value">{newspaper.reputation}</div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">👔</div>
            <div className="stat-info">
              <div className="stat-label">Staff</div>
              <div className="stat-value">{newspaper.staff}</div>
            </div>
          </div>
        </div>

        <div className="info-grid">
          <div className="info-card">
            <h3>Newspaper Details</h3>
            <div className="info-row">
              <span className="info-label">Province:</span>
              <span className="info-value">{newspaper.province}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Political Leaning:</span>
              <span className="info-value">{newspaper.politicalLeaning}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Editorial Focus:</span>
              <span className="info-value">{newspaper.focus}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Established:</span>
              <span className="info-value">{new Date(newspaper.established).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="actions-section">
          <h3>Management Actions</h3>
          <div className="action-buttons">
            <button className="action-btn primary" onClick={handlePublishArticle}>
              <span className="btn-icon">📝</span>
              <span>Publish Article</span>
            </button>
            <button className="action-btn" onClick={handleHireStaff}>
              <span className="btn-icon">👔</span>
              <span>Hire Staff</span>
            </button>
            <button className="action-btn">
              <span className="btn-icon">📊</span>
              <span>View Analytics</span>
            </button>
            <button className="action-btn">
              <span className="btn-icon">⚙️</span>
              <span>Edit Settings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsManageNewspaperPage;
