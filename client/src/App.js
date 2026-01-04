import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useIsMobile } from './hooks/useWindowSize';
import './App.css';
import Navbar from './components/Navbar';
import BottomNav from './components/BottomNav';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Dashboard from './components/Dashboard';
import Expenses from './components/Expenses';
import Investments from './components/Investments';
import MonthlySummary from './components/MonthlySummary';
import ExpensesHistory from './components/ExpensesHistory';
import Rooms from './components/Rooms';
import RoomDetail from './components/RoomDetail';

function AppContent() {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'light';
  });
  const { isAuthenticated, loading } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <div className="App">
        {isAuthenticated && !isMobile && <Navbar theme={theme} toggleTheme={toggleTheme} />}
        {isAuthenticated && isMobile && <BottomNav />}
        <main className="main-content">
          <Routes>
            {/* Public route */}
            <Route 
              path="/login" 
              element={isAuthenticated ? <Navigate to="/" replace /> : <Login />} 
            />
            
            {/* Protected routes */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/expenses"
              element={
                <PrivateRoute>
                  <Expenses />
                </PrivateRoute>
              }
            />
            <Route
              path="/investments"
              element={
                <PrivateRoute>
                  <Investments />
                </PrivateRoute>
              }
            />
            <Route
              path="/summary"
              element={
                <PrivateRoute>
                  <MonthlySummary />
                </PrivateRoute>
              }
            />
            <Route
              path="/history"
              element={
                <PrivateRoute>
                  <ExpensesHistory />
                </PrivateRoute>
              }
            />
            <Route
              path="/rooms"
              element={
                <PrivateRoute>
                  <Rooms />
                </PrivateRoute>
              }
            />
            <Route
              path="/rooms/:id"
              element={
                <PrivateRoute>
                  <RoomDetail />
                </PrivateRoute>
              }
            />
            
            {/* Catch all - redirect to login if not authenticated, dashboard if authenticated */}
            <Route 
              path="*" 
              element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} 
            />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

