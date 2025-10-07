
import React, { useState, useEffect } from 'react';
import { Administrador } from './types';
import LoginComponent from './components/Login';
import Dashboard from './components/Dashboard';
import { supabase } from './services/supabase';
import Layout from './components/Layout';

const App: React.FC = () => {
  const [loggedInAdmin, setLoggedInAdmin] = useState<Administrador | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // This is a simplified session check. In a real app, you'd use Supabase Auth.
    const sessionAdmin = sessionStorage.getItem('loggedInAdmin');
    if (sessionAdmin) {
      setLoggedInAdmin(JSON.parse(sessionAdmin));
    }
    setLoading(false);
  }, []);

  const handleLogin = (admin: Administrador) => {
    setLoggedInAdmin(admin);
    sessionStorage.setItem('loggedInAdmin', JSON.stringify(admin));
  };

  const handleLogout = () => {
    setLoggedInAdmin(null);
    sessionStorage.removeItem('loggedInAdmin');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-white text-2xl">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200">
      {loggedInAdmin ? (
        <Layout>
          <Dashboard admin={loggedInAdmin} onLogout={handleLogout} />
        </Layout>
      ) : (
        <LoginComponent onLogin={handleLogin} />
      )}
    </div>
  );
};

export default App;
