import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/BlankPage.css';

const EconomyProvincialResourcesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="blank-page">
      <h1>Provincial Resources</h1>
      <p>This page is under development.</p>
      <button onClick={() => navigate('/')} className="back-btn">Back to Map</button>
    </div>
  );
};

export default EconomyProvincialResourcesPage;
