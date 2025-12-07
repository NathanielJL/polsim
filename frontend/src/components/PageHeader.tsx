import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageHeader.css';

interface PageHeaderProps {
  title: string;
  menuOpen: boolean;
  setMenuOpen: (open: boolean) => void;
  showBackButton?: boolean;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title, menuOpen, setMenuOpen, showBackButton = true }) => {
  const navigate = useNavigate();

  return (
    <div className="page-top-header">
      <button
        className="page-hamburger-btn"
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <h1 className="page-header-title">{title}</h1>
      {showBackButton && (
        <button onClick={() => navigate('/')} className="page-back-btn">Back to Map</button>
      )}
    </div>
  );
};

export default PageHeader;
