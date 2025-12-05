import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/GmArchivalDashboard.css';

interface ArchivablePolicy {
  _id: string;
  title: string;
  description: string;
  proposedBy: string;
  turnProposed: number;
  turnPassed?: number;
  status: string;
  supersededBy?: string;
}

interface ArchivableEvent {
  _id: string;
  title: string;
  description: string;
  type: string;
  createdAt: string;
  turnNumber: number;
  status: string;
}

interface ArchivableNews {
  _id: string;
  headline: string;
  content: string;
  outlet: string;
  publishedAt: string;
  turnNumber: number;
}

interface ArchivedRecord {
  _id: string;
  itemType: string;
  itemId: string;
  title: string;
  externalUrl: string;
  archivedAt: string;
  archivedBy: string;
}

const GmArchivalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'policies' | 'events' | 'news' | 'history'>('policies');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [policies, setPolicies] = useState<ArchivablePolicy[]>([]);
  const [events, setEvents] = useState<ArchivableEvent[]>([]);
  const [news, setNews] = useState<ArchivableNews[]>([]);
  const [history, setHistory] = useState<ArchivedRecord[]>([]);

  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [archiveUrl, setArchiveUrl] = useState('');
  const [archiveNotes, setArchiveNotes] = useState('');

  const sessionId = localStorage.getItem('sessionId');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      switch (activeTab) {
        case 'policies':
          const policiesRes = await axios.get(`/api/archive/policies/${sessionId}`, config);
          setPolicies(policiesRes.data);
          break;
        case 'events':
          const eventsRes = await axios.get(`/api/archive/events/${sessionId}`, config);
          setEvents(eventsRes.data);
          break;
        case 'news':
          const newsRes = await axios.get(`/api/archive/news/${sessionId}`, config);
          setNews(newsRes.data);
          break;
        case 'history':
          const historyRes = await axios.get(`/api/archive/history/${sessionId}`, config);
          setHistory(historyRes.data);
          break;
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch archival data');
      setLoading(false);
    }
  };

  const generateJson = (item: any, type: string): string => {
    const exportData: any = {
      id: item._id,
      type,
      exportedAt: new Date().toISOString(),
    };

    if (type === 'policy') {
      exportData.title = item.title;
      exportData.description = item.description;
      exportData.proposedBy = item.proposedBy;
      exportData.turnProposed = item.turnProposed;
      exportData.turnPassed = item.turnPassed;
      exportData.status = item.status;
      exportData.supersededBy = item.supersededBy;
    } else if (type === 'event') {
      exportData.title = item.title;
      exportData.description = item.description;
      exportData.eventType = item.type;
      exportData.createdAt = item.createdAt;
      exportData.turnNumber = item.turnNumber;
      exportData.status = item.status;
    } else if (type === 'news') {
      exportData.headline = item.headline;
      exportData.content = item.content;
      exportData.outlet = item.outlet;
      exportData.publishedAt = item.publishedAt;
      exportData.turnNumber = item.turnNumber;
    }

    return JSON.stringify(exportData, null, 2);
  };

  const handlePreview = (item: any, type: string) => {
    setSelectedItem({ ...item, itemType: type });
    setShowPreview(true);
    setArchiveUrl('');
    setArchiveNotes('');
  };

  const handleMarkAsArchived = async () => {
    if (!archiveUrl.trim()) {
      alert('Please enter the external URL where this item was archived.');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(
        `/api/archive/mark-archived`,
        {
          sessionId,
          itemType: selectedItem.itemType,
          itemId: selectedItem._id,
          externalUrl: archiveUrl,
          notes: archiveNotes,
        },
        config
      );

      alert('Item marked as archived successfully!');
      setShowPreview(false);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark item as archived');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('JSON data copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="gm-archival-dashboard loading">
        <div className="spinner"></div>
        <p>Loading archival data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gm-archival-dashboard error">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="gm-archival-dashboard">
      <div className="archival-header">
        <h1>📦 GM Archival Dashboard</h1>
        <p className="subtitle">Export and archive completed policies, events, and news articles</p>
        <div className="info-banner">
          <p><strong>Purpose:</strong> Export old game content to external wiki/documentation</p>
          <p><strong>Workflow:</strong> Preview → Export JSON → Manually create wiki entry → Mark as archived</p>
        </div>
      </div>

      <div className="archival-tabs">
        <button
          className={activeTab === 'policies' ? 'active' : ''}
          onClick={() => setActiveTab('policies')}
        >
          📜 Archivable Policies
        </button>
        <button
          className={activeTab === 'events' ? 'active' : ''}
          onClick={() => setActiveTab('events')}
        >
          🎭 Archivable Events
        </button>
        <button
          className={activeTab === 'news' ? 'active' : ''}
          onClick={() => setActiveTab('news')}
        >
          📰 Archivable News
        </button>
        <button
          className={activeTab === 'history' ? 'active' : ''}
          onClick={() => setActiveTab('history')}
        >
          📚 Archive History
        </button>
      </div>

      <div className="archival-content">
        {/* Policies Tab */}
        {activeTab === 'policies' && (
          <div className="tab-panel">
            <div className="tab-header">
              <h2>Archivable Policies</h2>
              <p className="criteria">Policies that are superseded or older than 24 turns</p>
            </div>
            {policies.length === 0 ? (
              <p className="empty-state">No archivable policies at this time.</p>
            ) : (
              <div className="items-list">
                {policies.map((policy) => (
                  <div key={policy._id} className="item-card policy-card">
                    <div className="item-header">
                      <h3>{policy.title}</h3>
                      <span className={`status-badge ${policy.status}`}>{policy.status}</span>
                    </div>
                    <p className="item-description">{policy.description}</p>
                    <div className="item-meta">
                      <span>Proposed by: <strong>{policy.proposedBy}</strong></span>
                      <span>Turn: <strong>{policy.turnProposed}</strong></span>
                      {policy.turnPassed && <span>Passed: Turn {policy.turnPassed}</span>}
                    </div>
                    {policy.supersededBy && (
                      <p className="superseded-notice">
                        ⚠️ Superseded by: {policy.supersededBy}
                      </p>
                    )}
                    <button
                      className="preview-button"
                      onClick={() => handlePreview(policy, 'policy')}
                    >
                      Preview & Export
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="tab-panel">
            <div className="tab-header">
              <h2>Archivable Events</h2>
              <p className="criteria">Events that are completed or older than 24 turns</p>
            </div>
            {events.length === 0 ? (
              <p className="empty-state">No archivable events at this time.</p>
            ) : (
              <div className="items-list">
                {events.map((event) => (
                  <div key={event._id} className="item-card event-card">
                    <div className="item-header">
                      <h3>{event.title}</h3>
                      <span className={`type-badge ${event.type}`}>{event.type}</span>
                    </div>
                    <p className="item-description">{event.description}</p>
                    <div className="item-meta">
                      <span>Turn: <strong>{event.turnNumber}</strong></span>
                      <span>Created: <strong>{new Date(event.createdAt).toLocaleDateString()}</strong></span>
                      <span>Status: <strong>{event.status}</strong></span>
                    </div>
                    <button
                      className="preview-button"
                      onClick={() => handlePreview(event, 'event')}
                    >
                      Preview & Export
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* News Tab */}
        {activeTab === 'news' && (
          <div className="tab-panel">
            <div className="tab-header">
              <h2>Archivable News Articles</h2>
              <p className="criteria">News articles older than 24 turns</p>
            </div>
            {news.length === 0 ? (
              <p className="empty-state">No archivable news articles at this time.</p>
            ) : (
              <div className="items-list">
                {news.map((article) => (
                  <div key={article._id} className="item-card news-card">
                    <div className="item-header">
                      <h3>{article.headline}</h3>
                      <span className="outlet-badge">{article.outlet}</span>
                    </div>
                    <p className="item-description">{article.content.substring(0, 200)}...</p>
                    <div className="item-meta">
                      <span>Turn: <strong>{article.turnNumber}</strong></span>
                      <span>Published: <strong>{new Date(article.publishedAt).toLocaleDateString()}</strong></span>
                    </div>
                    <button
                      className="preview-button"
                      onClick={() => handlePreview(article, 'news')}
                    >
                      Preview & Export
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="tab-panel">
            <div className="tab-header">
              <h2>Archive History</h2>
              <p className="criteria">Previously archived items with external links</p>
            </div>
            {history.length === 0 ? (
              <p className="empty-state">No items have been archived yet.</p>
            ) : (
              <div className="items-list">
                {history.map((record) => (
                  <div key={record._id} className="item-card history-card">
                    <div className="item-header">
                      <h3>{record.title}</h3>
                      <span className={`type-badge ${record.itemType}`}>{record.itemType}</span>
                    </div>
                    <div className="item-meta">
                      <span>Archived: <strong>{new Date(record.archivedAt).toLocaleDateString()}</strong></span>
                      <span>By: <strong>{record.archivedBy}</strong></span>
                    </div>
                    <a
                      href={record.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="external-link"
                    >
                      🔗 View in Wiki
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && selectedItem && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Export Preview</h2>
              <button className="close-button" onClick={() => setShowPreview(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="export-section">
                <h3>JSON Export Data</h3>
                <p className="export-note">
                  Copy this JSON to manually create a wiki entry, then return here to mark as archived.
                </p>
                <div className="json-preview">
                  <pre>{generateJson(selectedItem, selectedItem.itemType)}</pre>
                </div>
                <button
                  className="copy-button"
                  onClick={() => copyToClipboard(generateJson(selectedItem, selectedItem.itemType))}
                >
                  📋 Copy JSON to Clipboard
                </button>
              </div>

              <div className="archive-section">
                <h3>Mark as Archived</h3>
                <p className="archive-note">
                  After creating the wiki entry, enter the URL and mark this item as archived.
                </p>
                <div className="form-group">
                  <label>External URL (Required):</label>
                  <input
                    type="url"
                    value={archiveUrl}
                    onChange={(e) => setArchiveUrl(e.target.value)}
                    placeholder="https://your-wiki.com/page-name"
                  />
                </div>
                <div className="form-group">
                  <label>Notes (Optional):</label>
                  <textarea
                    value={archiveNotes}
                    onChange={(e) => setArchiveNotes(e.target.value)}
                    placeholder="Any additional notes about this archive..."
                    rows={3}
                  />
                </div>
                <button
                  className="archive-button"
                  onClick={handleMarkAsArchived}
                  disabled={!archiveUrl.trim()}
                >
                  ✓ Mark as Archived
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GmArchivalDashboard;
