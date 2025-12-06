import React from 'react';
import { ComingSoon } from '../components/ComingSoon';

const ElectionsPage: React.FC = () => {
  return (
    <ComingSoon 
      pageName='Elections' 
      description='View election results, campaign for office, and track voting patterns.'
    />
  );
};

export default ElectionsPage;
