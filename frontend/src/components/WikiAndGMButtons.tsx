import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/HomePage.css';

const WIKI_URL = "https://special-digit-4d0.notion.site/ebd//70285e221d7741c9a65282f8dd2c518c";

const WikiAndGMButtons: React.FC = () => {
  const navigate = useNavigate();
  const { player } = useAuth();
  const [wikiOpen, setWikiOpen] = useState(false);

  return (
    <>
      {/* Wiki Button (rightmost) */}
      <button 
        className="wiki-btn"
        onClick={() => setWikiOpen(!wikiOpen)}
        title="Game Wiki & Documentation"
      >
        📚
      </button>

      {/* GM Access Button (left of Wiki) */}
      <button 
        className={`gm-access-btn ${player?.isGameMaster ? '' : 'gm-login-btn'}`}
        onClick={() => player?.isGameMaster ? navigate('/gm-panel') : navigate('/auth')}
        title={player?.isGameMaster ? "Game Master Panel" : "GM Login"}
      >
        🔒
      </button>

      {/* Wiki Modal */}
      {wikiOpen && (
        <div className="wiki-modal" onClick={() => setWikiOpen(false)}>
          <div className="wiki-modal-content" onClick={e => e.stopPropagation()}>
            <button className="wiki-close-btn" onClick={() => setWikiOpen(false)}>✕</button>
            <iframe 
              src={WIKI_URL}
              width="100%"
              height="100%"
              style={{border: 'none'}}
              title="Game Wiki"
            />
          </div>
        </div>
      )}
    </>
  );
};

export default WikiAndGMButtons;
