import React from "react";
import { ComingSoon } from "../components/ComingSoon";

const GovernmentPage: React.FC = () => {
  return (
    <ComingSoon 
      pageName="Government" 
      description="View federal and provincial legislation, propose policies, and vote on laws."
    />
  );
};

export default GovernmentPage;
