import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AuthPage from "./pages/AuthPage";
import HomePage from "./pages/HomePage";
import TestPage from "./pages/TestPage";
import MarketsPage from "./pages/MarketsPage";
import NewsPage from "./pages/NewsPage";
import GovernmentPage from "./pages/GovernmentPage";
import ReputationPage from "./pages/ReputationPage";
import GameMasterDashboard from "./pages/GameMasterDashboard";
import GMPortalPage from "./pages/GMPortalPage";
import ElectionsPage from "./pages/ElectionsPage";
import BusinessPage from "./pages/BusinessPage";
import LegalPage from "./pages/LegalPage";
import LegalCasesPage from "./pages/LegalCasesPage";
import GovernmentFederalPage from "./pages/GovernmentFederalPage";
import GovernmentProvincialPage from "./pages/GovernmentProvincialPage";
import EconomyStatsPage from "./pages/EconomyStatsPage";
import EconomyFederalResourcesPage from "./pages/EconomyFederalResourcesPage";
import EconomyProvincialResourcesPage from "./pages/EconomyProvincialResourcesPage";
import EconomyStockMarketPage from "./pages/EconomyStockMarketPage";
import EconomyMarketsPage from "./pages/EconomyMarketsPage";
import PopulationDemographicsPage from "./pages/PopulationDemographicsPage";
import NewsNationalPage from "./pages/NewsNationalPage";
import NewsProvincialPage from "./pages/NewsProvincialPage";
import NewsCreateNewspaperPage from "./pages/NewsCreateNewspaperPage";
import NewsManageNewspaperPage from "./pages/NewsManageNewspaperPage";
import LegalBarExamPage from "./pages/LegalBarExamPage";
import LegalRulingsPage from "./pages/LegalRulingsPage";
import GMPanelPage from "./pages/GMPanelPage";
import ChatButton from "./components/ChatButton";
import "./App.css";

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

// GM-only route wrapper
function GMRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, player, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (!player?.isGameMaster) {
    return <Navigate to="/gm-portal" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Auth route */}
          <Route
            path="/auth"
            element={isAuthenticated ? <Navigate to="/" replace /> : <AuthPage />}
          />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/markets"
            element={
              <ProtectedRoute>
                <MarketsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news"
            element={
              <ProtectedRoute>
                <NewsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government"
            element={
              <ProtectedRoute>
                <GovernmentPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reputation"
            element={
              <ProtectedRoute>
                <ReputationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gm-portal"
            element={
              <ProtectedRoute>
                <GMPortalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/gm-panel"
            element={
              <GMRoute>
                <GMPanelPage />
              </GMRoute>
            }
          />
          <Route
            path="/gm-dashboard"
            element={
              <GMRoute>
                <GameMasterDashboard />
              </GMRoute>
            }
          />
          <Route
            path="/elections"
            element={
              <ProtectedRoute>
                <ElectionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/business"
            element={
              <ProtectedRoute>
                <BusinessPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/legal"
            element={
              <ProtectedRoute>
                <LegalPage />
              </ProtectedRoute>
            }
          />

          {/* Government routes */}
          <Route
            path="/government/federal"
            element={
              <ProtectedRoute>
                <GovernmentFederalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/government/provincial"
            element={
              <ProtectedRoute>
                <GovernmentProvincialPage />
              </ProtectedRoute>
            }
          />

          {/* Economy routes */}
          <Route
            path="/economy/stats"
            element={
              <ProtectedRoute>
                <EconomyStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/economy/federal"
            element={
              <ProtectedRoute>
                <EconomyFederalResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/economy/provincial"
            element={
              <ProtectedRoute>
                <EconomyProvincialResourcesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/economy/stock-market"
            element={
              <ProtectedRoute>
                <EconomyStockMarketPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/economy/markets"
            element={
              <ProtectedRoute>
                <EconomyMarketsPage />
              </ProtectedRoute>
            }
          />

          {/* Population routes */}
          <Route
            path="/population/demographics"
            element={
              <ProtectedRoute>
                <PopulationDemographicsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/population/reputation"
            element={
              <ProtectedRoute>
                <ReputationPage />
              </ProtectedRoute>
            }
          />

          {/* News routes */}
          <Route
            path="/news/national"
            element={
              <ProtectedRoute>
                <NewsNationalPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news/provincial"
            element={
              <ProtectedRoute>
                <NewsProvincialPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news/create-newspaper"
            element={
              <ProtectedRoute>
                <NewsCreateNewspaperPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/news/manage"
            element={
              <ProtectedRoute>
                <NewsManageNewspaperPage />
              </ProtectedRoute>
            }
          />

          {/* Legal routes */}
          <Route
            path="/legal/bar-exam"
            element={
              <ProtectedRoute>
                <LegalBarExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/legal/cases"
            element={
              <ProtectedRoute>
                <LegalCasesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/legal/rulings"
            element={
              <ProtectedRoute>
                <LegalRulingsPage />
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        
        {/* Chat Button - Available on all protected routes */}
        {isAuthenticated && <ChatButton />}
      </div>
    </Router>
  );
}

export default App;
