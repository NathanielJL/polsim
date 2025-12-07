import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import PageHeader from '../components/PageHeader';
import NavigationMenu from '../components/NavigationMenu';
import '../styles/NewsCreateNewspaperPage.css';

const NewsCreateNewspaperPage: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    slogan: '',
    province: '',
    politicalLeaning: 'neutral',
    focus: 'general'
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const provinces = [
    'Southland',
    'New Zealand',
    'Cooksland',
    'Vulteralia',
    'Te Moana-a-Toir',
    'Tasminata',
    'New Caledonia'
  ];

  const politicalLeanings = [
    { value: 'conservative', label: 'Conservative' },
    { value: 'liberal', label: 'Liberal' },
    { value: 'neutral', label: 'Neutral' },
    { value: 'radical', label: 'Radical' }
  ];

  const focusAreas = [
    { value: 'general', label: 'General News' },
    { value: 'politics', label: 'Political Commentary' },
    { value: 'business', label: 'Business & Economy' },
    { value: 'society', label: 'Society & Culture' },
    { value: 'scandal', label: 'Scandal & Gossip' }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name || !formData.province) {
      setError('Please fill in all required fields');
      return;
    }

    setCreating(true);

    try {
      const response = await fetch('http://localhost:5000/api/news/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          playerId: player?.id,
          sessionId: player?.sessionId,
          name: formData.name,
          provinceId: formData.province,
          politicalStance: formData.politicalLeaning
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create newspaper');
      }

      const data = await response.json();
      console.log('Newspaper created:', data);
      
      // Redirect to manage newspaper page
      navigate('/news/manage');
    } catch (err) {
      console.error('Error creating newspaper:', err);
      setError(err instanceof Error ? err.message : 'Failed to create newspaper');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="news-create-page">
      <PageHeader 
        title="Create Newspaper" 
        menuOpen={menuOpen} 
        setMenuOpen={setMenuOpen}
      />
      <NavigationMenu isOpen={menuOpen} />

      <div className="create-content">
        <div className="create-container">
          <div className="create-header">
            <h2>Found Your Newspaper</h2>
            <p>Create your own newspaper to publish articles and influence public opinion</p>
          </div>

          {error && (
            <div className="error-banner">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="newspaper-form">
            <div className="form-group">
              <label htmlFor="name">Newspaper Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="The Zealandia Times"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="slogan">Slogan</label>
              <input
                type="text"
                id="slogan"
                name="slogan"
                value={formData.slogan}
                onChange={handleChange}
                placeholder="Truth, Justice, and Progress"
              />
            </div>

            <div className="form-group">
              <label htmlFor="province">Primary Province *</label>
              <select
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                required
              >
                <option value="">Select a province...</option>
                {provinces.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="politicalLeaning">Political Leaning</label>
              <select
                id="politicalLeaning"
                name="politicalLeaning"
                value={formData.politicalLeaning}
                onChange={handleChange}
              >
                {politicalLeanings.map(pl => (
                  <option key={pl.value} value={pl.value}>{pl.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="focus">Editorial Focus</label>
              <select
                id="focus"
                name="focus"
                value={formData.focus}
                onChange={handleChange}
              >
                {focusAreas.map(fa => (
                  <option key={fa.value} value={fa.value}>{fa.label}</option>
                ))}
              </select>
            </div>

            <div className="form-actions">
              <button 
                type="submit" 
                className="create-btn"
                disabled={creating}
              >
                {creating ? 'Creating...' : 'Create Newspaper'}
              </button>
              <button 
                type="button" 
                className="cancel-btn"
                onClick={() => navigate('/news/national')}
              >
                Cancel
              </button>
            </div>
          </form>

          <div className="info-box">
            <h3>📰 About Newspapers</h3>
            <ul>
              <li>Newspapers cost £700 to establish</li>
              <li>Maximum 5 newspapers per province</li>
              <li>You can publish articles to influence public opinion</li>
              <li>Political leaning affects reader demographics</li>
              <li>Higher readership increases your influence</li>
              <li>Manage staff and finances in the Manage Newspaper page</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCreateNewspaperPage;
