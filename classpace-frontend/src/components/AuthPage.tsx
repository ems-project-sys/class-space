import React, { useState } from 'react';

export const AuthPage = ({ onLoginSuccess }: { onLoginSuccess: (role: string, name: string) => void }) => {
  const [isAdminGranted, setIsAdminGranted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const role = email.toLowerCase().includes('admin') ? 'admin' : 'user';
    
    // Dynamiczne wyciąganie imienia z maila (np. kacper@... -> Kacper)
    const namePart = email.split('@')[0];
    const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1).toLowerCase();

    if (role === 'admin') {
      setIsAdminGranted(true);
      setTimeout(() => {
        onLoginSuccess('admin', formattedName);
      }, 4000);
    } else {
      onLoginSuccess('user', formattedName);
    }
  };

  return (
    <>
      <div className="container" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <form onSubmit={handleLogin} style={{ background: 'var(--bg-card)', padding: '2.5rem', borderRadius: '16px', width: '100%', maxWidth: '420px', border: '1px solid var(--border)', boxShadow: '0 10px 25px rgba(0,0,0,0.05)' }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>ClassSpace Login</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Zaloguj się, aby uzyskać dostęp do systemu uczelni.</p>
          </div>
          
          <div className="form-group">
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Adres Email</label>
            <input type="email" placeholder="np. imie.nazwisko@student.merito.pl" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          
          <div className="form-group" style={{ marginBottom: '2rem' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>Hasło</label>
            <input type="password" placeholder="••••••••" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          
          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.85rem', fontSize: '1.1rem' }}>
            Wejdź do systemu
          </button>
        </form>
      </div>

      {isAdminGranted && (
        <div className="admin-overlay">
          <h1 className="admin-title">Admin Access Granted</h1>
          <p style={{ color: '#9ca3af', fontSize: '1.2rem' }}>Ładowanie zaszyfrowanego modułu zarządzania...</p>
          <div className="progress-bar-container"><div className="progress-bar"></div></div>
        </div>
      )}
    </>
  );
};