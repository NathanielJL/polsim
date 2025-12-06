import React from 'react';
import { ComingSoon } from '../components/ComingSoon';

const NewsPage: React.FC = () => {
  return (
    <ComingSoon 
      pageName='News' 
      description='Read latest articles, political commentary, and colony announcements.'
    />
  );
};

export default NewsPage;
