import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import './App.css';
import './output.css';
import Login from './Pages/Login';
import Dashboard from './Pages/Dashboard';
import UsersPage from './Pages/Users';
import apiClient, { authAPI } from './Intercepter/APiClient';
import LogsTable from './Pages/ApiRequest';

// Protected Route wrapper component
const ProtectedRoute = ({ children }) => {
  const [isVerifying, setIsVerifying] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Function to verify token with the server
    const verifyToken = async () => {
      setIsVerifying(true);
      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          // No token found, redirect to login
          setIsAuthenticated(false);
          navigate('/', { replace: true });
          return;
        }

        // Call API to verify token
        // You'll need to create this endpoint on your server
        const response = await apiClient.get('/api/admin/verify-token');
        
        if (response.data.success) {
          setIsAuthenticated(true);
        } else {
          // Invalid token, clear localStorage and redirect
          authAPI.logout();
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error('Token verification error:', error);
        // Any error means we should clear localStorage and redirect
        authAPI.logout();
        navigate('/', { replace: true });
      } finally {
        setIsVerifying(false);
      }
    };

    // Only verify token if not on login page
    if (location.pathname !== '/') {
      verifyToken();
    } else {
      setIsVerifying(false);
      setIsAuthenticated(true); // No verification needed for login page
    }
  }, [navigate, location.pathname]);

  // Show loading state while verifying
  if (isVerifying) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Render children only if authenticated or on login page
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Login page doesn't need protection */}
          <Route path="/" element={<Login />} />
          
          {/* Protected routes */}
          <Route 
            path="/console" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/api-requests" 
            element={
              <ProtectedRoute>
                <LogsTable />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/users" 
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Redirect all other routes to login */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;