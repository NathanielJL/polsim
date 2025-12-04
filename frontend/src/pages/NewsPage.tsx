/**
 * News Page - Display AI-Generated + Player-Created News Articles
 * Shows all news from 3 AI National outlets + player provincial newspapers
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import '../styles/NewsPage.css';

interface NewsArticle {
  _id: string;
  id: string;
  sessionId: string;
  title: string;
  content: string;
  authorId?: { username: string };
  outletId: string;
  provinceId?: string;
  tone?: string;
  eventId?: string;
  aiGenerated: boolean;
  createdAt: string;
}

interface NewsOutlet {
  _id: string;
  id: string;
  name: string;
  type: 'national' | 'provincial';
  politicalStance?: string;
  bias: number;
  ownerId?: { username: string };
}

const NewsPage: React.FC = () => {
  const { user } = useAuth();
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [outlets, setOutlets] = useState<NewsOutlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOutletName, setNewOutletName] = useState('');
  const [newOutletStance, setNewOutletStance] = useState('moderate');
  
  const [showWriteForm, setShowWriteForm] = useState(false);
  const [selectedOutletForArticle, setSelectedOutletForArticle] = useState('');
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');

  useEffect(() => {
    fetchNewsData();
  }, [user]);

  const fetchNewsData = async () => {
    if (!user?.sessionId) return;
    
    try {
      setLoading(true);
      const [articlesRes, outletsRes] = await Promise.all([
        api.get(`/api/news/${user.sessionId}`),
        api.get(`/api/news/outlets/${user.sessionId}`)
      ]);
      
      setArticles(articlesRes.data.articles);
      setOutlets(outletsRes.data.outlets);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load news');
    } finally {
      setLoading(false);
    }
  };

  const createNewspaper = async () => {
    if (!newOutletName.trim()) {
      alert('Please enter a newspaper name');
      return;
    }
    
    try {
      await api.post('/api/news/outlet/create', {
        playerId: user?._id,
        sessionId: user?.sessionId,
        name: newOutletName,
        provinceId: user?.provinceId,
        politicalStance: newOutletStance
      });
      
      alert(`${newOutletName} created! Cost: £5,000`);
      setShowCreateForm(false);
      setNewOutletName('');
      fetchNewsData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to create newspaper');
    }
  };

  const submitArticle = async () => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      alert('Please fill in both title and content');
      return;
    }
    
    if (!selectedOutletForArticle) {
      alert('Please select a newspaper to publish in');
      return;
    }
    
    try {
      await api.post('/api/news/submit', {
        playerId: user?._id,
        sessionId: user?.sessionId,
        outletId: selectedOutletForArticle,
        title: articleTitle,
        content: articleContent,
        provinceId: user?.provinceId
      });
      
      alert('Article published!');
      setShowWriteForm(false);
      setArticleTitle('');
      setArticleContent('');
      setSelectedOutletForArticle('');
      fetchNewsData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to publish article');
    }
  };

  const getOutletName = (outletId: string): string => {
    const outlet = outlets.find(o => o.id === outletId);
    return outlet?.name || outletId;
  };

  const getOutletBadge = (outletId: string): { color: string; stance: string } => {
    const outlet = outlets.find(o => o.id === outletId);
    if (!outlet) return { color: '#666', stance: 'Unknown' };
    
    if (outlet.type === 'national') {
      if (outletId.includes('gazette')) return { color: '#3498db', stance: 'Moderate' };
      if (outletId.includes('progressive')) return { color: '#27ae60', stance: 'Progressive' };
      if (outletId.includes('economist')) return { color: '#e67e22', stance: 'Conservative' };
    }
    
    return { color: '#9b59b6', stance: outlet.politicalStance || 'Provincial' };
  };

  const filteredArticles = selectedOutlet === 'all'
    ? articles
    : articles.filter(a => a.outletId === selectedOutlet);

  const playerOwnedOutlets = outlets.filter(o => 
    o.ownerId && o.ownerId.toString() === user?._id
  );

  if (loading) {
    return <div className="news-page loading">Loading news...</div>;
  }

  return (
    <div className="news-page">
      <header className="news-header">
        <h1>📰 Zealandia News</h1>
        <div className="news-actions">
          <button onClick={() => setShowCreateForm(true)} className="btn-create-outlet">
            Create Newspaper (£5,000)
          </button>
          <button 
            onClick={() => setShowWriteForm(true)} 
            className="btn-write-article"
            disabled={playerOwnedOutlets.length === 0}
            title={playerOwnedOutlets.length === 0 ? 'You must own a newspaper to write articles' : ''}
          >
            Write Article
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Create Provincial Newspaper</h2>
            <input
              type="text"
              placeholder="Newspaper Name"
              value={newOutletName}
              onChange={e => setNewOutletName(e.target.value)}
              className="input-full"
            />
            <select 
              value={newOutletStance} 
              onChange={e => setNewOutletStance(e.target.value)}
              className="input-full"
            >
              <option value="moderate">Moderate</option>
              <option value="progressive">Progressive</option>
              <option value="conservative">Conservative</option>
              <option value="populist">Populist</option>
            </select>
            <p className="help-text">Cost: £5,000</p>
            <div className="modal-actions">
              <button onClick={createNewspaper} className="btn-primary">Create</button>
              <button onClick={() => setShowCreateForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showWriteForm && (
        <div className="modal-overlay" onClick={() => setShowWriteForm(false)}>
          <div className="modal-content large" onClick={e => e.stopPropagation()}>
            <h2>Write News Article</h2>
            <select
              value={selectedOutletForArticle}
              onChange={e => setSelectedOutletForArticle(e.target.value)}
              className="input-full"
            >
              <option value="">Select Newspaper</option>
              {playerOwnedOutlets.map(outlet => (
                <option key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              placeholder="Article Headline"
              value={articleTitle}
              onChange={e => setArticleTitle(e.target.value)}
              className="input-full"
            />
            <textarea
              placeholder="Article content (1854 newspaper style)"
              value={articleContent}
              onChange={e => setArticleContent(e.target.value)}
              className="textarea-large"
              rows={12}
            />
            <div className="modal-actions">
              <button onClick={submitArticle} className="btn-primary">Publish</button>
              <button onClick={() => setShowWriteForm(false)} className="btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}

      <div className="outlet-filter">
        <button
          className={selectedOutlet === 'all' ? 'active' : ''}
          onClick={() => setSelectedOutlet('all')}
        >
          All News
        </button>
        {outlets.map(outlet => {
          const badge = getOutletBadge(outlet.id);
          return (
            <button
              key={outlet.id}
              className={selectedOutlet === outlet.id ? 'active' : ''}
              onClick={() => setSelectedOutlet(outlet.id)}
              style={{ borderLeft: `4px solid ${badge.color}` }}
            >
              {outlet.name}
              {outlet.type === 'national' && <span className="badge-national">National</span>}
            </button>
          );
        })}
      </div>

      <div className="news-feed">
        {filteredArticles.length === 0 ? (
          <div className="no-news">
            <p>No news articles yet.</p>
            <p className="help-text">
              News articles are auto-generated when GM creates events.
            </p>
          </div>
        ) : (
          filteredArticles.map(article => {
            const badge = getOutletBadge(article.outletId);
            return (
              <article key={article._id} className="news-article">
                <div className="article-header">
                  <div 
                    className="outlet-badge" 
                    style={{ backgroundColor: badge.color }}
                  >
                    {getOutletName(article.outletId)}
                  </div>
                  <div className="article-meta">
                    {article.aiGenerated ? (
                      <span className="ai-badge">🤖 AI Generated</span>
                    ) : (
                      <span className="player-author">
                        By {article.authorId?.username || 'Anonymous'}
                      </span>
                    )}
                    <span className="article-date">
                      {new Date(article.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <h2 className="article-title">{article.title}</h2>
                <div className="article-content">
                  {article.content.split('\n\n').map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
                {article.tone && (
                  <div className="article-tone">
                    Tone: {article.tone}
                  </div>
                )}
              </article>
            );
          })
        )}
      </div>
    </div>
  );
};

export default NewsPage;
