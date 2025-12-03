/**
 * NEWS PAGE
 * 
 * Display news articles and outlets:
 * - Browse articles by outlet
 * - Filter by political alignment
 * - Submit articles (if player is press)
 * - View event coverage
 */

import React, { useState, useEffect } from "react";
import "../styles/NewsPage.css";

interface Article {
  id: string;
  title: string;
  content: string;
  outletName: string;
  turn: number;
  createdAt: string;
}

const NewsPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSubmitForm, setShowSubmitForm] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const response = await fetch(`/api/news/session-123`);
        const data = await response.json();
        setArticles(data.articles || []);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <div className="news-page">
      <header>
        <h1>News</h1>
        <button onClick={() => setShowSubmitForm(!showSubmitForm)}>
          {showSubmitForm ? "Cancel" : "Submit Article"}
        </button>
      </header>

      {showSubmitForm && <ArticleSubmitForm onSubmit={() => setShowSubmitForm(false)} />}

      {loading ? (
        <p>Loading articles...</p>
      ) : (
        <section className="articles-list">
          {articles.length === 0 ? (
            <p>No articles yet this turn.</p>
          ) : (
            articles.map((article) => (
              <article key={article.id} className="article-card">
                <h3>{article.title}</h3>
                <div className="meta">
                  <span className="outlet">{article.outletName}</span>
                  <span className="turn">Turn {article.turn}</span>
                </div>
                <p>{article.content.substring(0, 200)}...</p>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
};

interface ArticleSubmitFormProps {
  onSubmit: () => void;
}

const ArticleSubmitForm: React.FC<ArticleSubmitFormProps> = ({ onSubmit }) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [outletId, setOutletId] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await fetch(`/api/articles/session-123`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playerId: "player-123",
          title,
          content,
          outletId,
        }),
      });
      onSubmit();
    } catch (error) {
      console.error("Failed to submit article:", error);
    }
  };

  return (
    <form className="article-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Article Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
      />
      <textarea
        placeholder="Article Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <select value={outletId} onChange={(e) => setOutletId(e.target.value)} required>
        <option value="">Select News Outlet</option>
        <option value="outlet-1">Centrist Daily</option>
        <option value="outlet-2">Progressive Voice</option>
        <option value="outlet-3">Conservative Times</option>
      </select>
      <button type="submit">Submit Article</button>
    </form>
  );
};

export default NewsPage;
