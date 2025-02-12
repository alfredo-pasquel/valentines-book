// index.jsx
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { Login, Register } from './Auth';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function Root() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [view, setView] = useState('login'); // "login" or "register"

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);
  }, []);

  const logout = () => {
    // Remove the token and update state
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    // Optionally update the URL hash to show the login view
    window.location.hash = 'login';
  };

  // Use simple hash routing for demo purposes for login/register.
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash === 'register' || hash === 'login') {
        setView(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (!isAuthenticated) {
    if (view === 'register') {
      return <Register onRegister={() => setIsAuthenticated(true)} />;
    }
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  // If authenticated, we render our App within our routes.
  return <App onLogout={logout} />;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* 
         Define routes for your dynamic pages.
         For example, both the Journal and Calendar views can accept an optional ":date" parameter.
      */}
      <Route path="/login" element={<Root />} />
      <Route path="/register" element={<Root />} />
      <Route path="/journal/:date?" element={<Root />} />
      <Route path="/calendar/:date?" element={<Root />} />
      {/* Fallback route */}
      <Route path="/*" element={<Root />} />
    </Routes>
  </BrowserRouter>
);
