import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './NavigationMenu.css';

interface NavigationMenuProps {
  isOpen: boolean;
}

const NavigationMenu: React.FC<NavigationMenuProps> = ({ isOpen }) => {
  const navigate = useNavigate();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

  const toggleSubmenu = (menu: string) => {
    setExpandedMenus(prev => ({ ...prev, [menu]: !prev[menu] }));
  };

  return (
    <div className={`nav-menu ${isOpen ? 'open' : 'closed'}`}>
      <nav className="game-nav">
        <button onClick={() => toggleSubmenu('government')} className="nav-btn">
          <span className="icon">🏛️</span>
          <span>Government</span>
          <span className="expand-icon">{expandedMenus['government'] ? '▼' : '▶'}</span>
        </button>
        {expandedMenus['government'] && (
          <>
            <button onClick={() => navigate('/government/federal')} className="nav-btn-sub">
              <span>Federal</span>
            </button>
            <button onClick={() => navigate('/government/provincial')} className="nav-btn-sub">
              <span>Provincial</span>
            </button>
          </>
        )}
        
        <button onClick={() => toggleSubmenu('economy')} className="nav-btn">
          <span className="icon">💰</span>
          <span>Economy</span>
          <span className="expand-icon">{expandedMenus['economy'] ? '▼' : '▶'}</span>
        </button>
        {expandedMenus['economy'] && (
          <>
            <button onClick={() => navigate('/economy/stats')} className="nav-btn-sub">
              <span>Economic Stats</span>
            </button>
            <button onClick={() => navigate('/economy/stock-market')} className="nav-btn-sub">
              <span>Stock Market</span>
            </button>
            <button onClick={() => navigate('/economy/markets')} className="nav-btn-sub">
              <span>Markets</span>
            </button>
          </>
        )}
        
        <button onClick={() => toggleSubmenu('population')} className="nav-btn">
          <span className="icon">👥</span>
          <span>Population</span>
          <span className="expand-icon">{expandedMenus['population'] ? '▼' : '▶'}</span>
        </button>
        {expandedMenus['population'] && (
          <>
            <button onClick={() => navigate('/population/demographics')} className="nav-btn-sub">
              <span>Demographics</span>
            </button>
            <button onClick={() => navigate('/population/reputation')} className="nav-btn-sub">
              <span>Reputation</span>
            </button>
          </>
        )}
        
        <button onClick={() => navigate('/business')} className="nav-btn">
          <span className="icon">🏢</span>
          <span>Business</span>
        </button>
        
        <button onClick={() => toggleSubmenu('news')} className="nav-btn">
          <span className="icon">📰</span>
          <span>News</span>
          <span className="expand-icon">{expandedMenus['news'] ? '▼' : '▶'}</span>
        </button>
        {expandedMenus['news'] && (
          <>
            <button onClick={() => navigate('/news/national')} className="nav-btn-sub">
              <span>National Outlets</span>
            </button>
            <button onClick={() => navigate('/news/provincial')} className="nav-btn-sub">
              <span>Provincial News</span>
            </button>
            <button onClick={() => navigate('/news/create-newspaper')} className="nav-btn-sub">
              <span>Create Newspaper</span>
            </button>
            <button onClick={() => navigate('/news/manage')} className="nav-btn-sub">
              <span>Manage Newspaper</span>
            </button>
          </>
        )}
        
        <button onClick={() => toggleSubmenu('legal')} className="nav-btn">
          <span className="icon">⚖️</span>
          <span>Legal</span>
          <span className="expand-icon">{expandedMenus['legal'] ? '▼' : '▶'}</span>
        </button>
        {expandedMenus['legal'] && (
          <>
            <button onClick={() => navigate('/legal/bar-exam')} className="nav-btn-sub">
              <span>Bar Exam</span>
            </button>
            <button onClick={() => navigate('/legal/cases')} className="nav-btn-sub">
              <span>Cases</span>
            </button>
            <button onClick={() => navigate('/legal/rulings')} className="nav-btn-sub">
              <span>Rulings</span>
            </button>
          </>
        )}
        
        <button onClick={() => navigate('/elections')} className="nav-btn">
          <span className="icon">🗳️</span>
          <span>Elections</span>
        </button>
      </nav>
    </div>
  );
};

export default NavigationMenu;
