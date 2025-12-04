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
import ElectionsPage from "./pages/ElectionsPage";
import BusinessPage from "./pages/BusinessPage";
import LegalPage from "./pages/LegalPage";
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

function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Test route - bypass everything */}
          <Route path="/test" element={<TestPage />} />
          
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
            path="/gm-dashboard"
            element={
              <ProtectedRoute>
                <GameMasterDashboard />
              </ProtectedRoute>
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

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
