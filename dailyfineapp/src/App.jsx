import { useState, useEffect } from 'react';
import Login from './components/login';
import LandingPage from './components/LandingPage';
import './App.css';

// ADDED
const API_BASE = 'http://localhost:5000';

// ADDED: helper
const getUserId = () => {
  try {
    const raw = localStorage.getItem('userData');
    if (raw) {
      const u = JSON.parse(raw);
      return u.id || u._id || u.data?.id || null;
    }
    const tok = localStorage.getItem('authToken');
    if (tok && tok.split('.').length === 3) {
      const payload = JSON.parse(atob(tok.split('.')[1]));
      return payload.userId || null;
    }
  } catch { /* ignore */ }
  return null;
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // ADDED: fetch & store settings
  const fetchAndStoreUserSettings = async () => {
    const uid = getUserId();
    if (!uid) return;
    try {
      const res = await fetch(`${API_BASE}/api/users/${uid}/settings`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });
      if (!res.ok) return;
      const data = await res.json().catch(()=>null);
      if (!data) return;

      // UPDATED: support shape { success, settings: { currency, language, theme, notifications } }
      const raw = data.settings ? data.settings : data;
      const settingsPayload = {
        currency: raw.currency || '$',
        language: raw.language || 'English',
        theme: raw.theme || 'light',
        notifications: raw.notifications || {
          budgetAlerts: true,
          emailNotifications: true,
          pushNotifications: false
        }
      };

      localStorage.setItem('selectedCurrency', settingsPayload.currency);
      localStorage.setItem('userSettings', JSON.stringify(settingsPayload));
      window.dispatchEvent(new CustomEvent('app:settings-updated', { detail: settingsPayload }));
    } catch (e) {
      console.warn('Failed to fetch user settings:', e);
    }
  };

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    const userData = localStorage.getItem('userData');
    
    if (token && userData) {
      setIsAuthenticated(true);
    }
    
    setIsLoading(false);
  }, []);

  // ADDED: fetch settings whenever authenticated becomes true
  useEffect(() => {
    if (isAuthenticated) {
      fetchAndStoreUserSettings();
    }
  }, [isAuthenticated]);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-violet-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-violet-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {isAuthenticated ? (
        <LandingPage onLogout={handleLogout} />
      ) : (
        <Login onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
