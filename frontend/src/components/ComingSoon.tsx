import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/ComingSoon.css';

interface ComingSoonProps {
  pageName: string;
  description?: string;
}

export function ComingSoon({ pageName, description }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="coming-soon-page">
      <div className="coming-soon-content">
        <h1>{pageName}</h1>
        <div className="construction-icon">🚧</div>
        <h2>Coming Soon</h2>
        {description && <p className="description">{description}</p>}
        <p className="message">This feature is currently under development.</p>
        <button onClick={() => navigate('/')} className="btn-home">
          Return to Map
        </button>
      </div>
    </div>
  );
}
