import React, { useState } from 'react';
import { AuthPage } from './components/AuthPage';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');

  const handleLogout = () => {
    setUserRole(null);
    setUserName('');
  };

  const handleLogin = (role: string, name: string) => {
    setUserRole(role);
    setUserName(name);
  };

  return (
    <>
      {!userRole ? (
        <AuthPage onLoginSuccess={handleLogin} />
      ) : (
        <Dashboard userRole={userRole} userName={userName} onLogout={handleLogout} />
      )}
    </>
  );
}