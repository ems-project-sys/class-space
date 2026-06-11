import { useState, useEffect } from 'react';
import { ApiService } from '../apiService.js';

interface DashboardProps {
    onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
    // Pobieramy dane zalogowanego użytkownika z pamięci przeglądarki
    const [role, setRole] = useState(localStorage.getItem('classSpaceUserRole') || 'wykladowca');
    const [userName, setUserName] = useState(localStorage.getItem('classSpaceUserName') || 'Użytkownik');

    const handleLogout = async () => {
        // Zapisujemy wylogowanie w logach systemowych przez nasz serwis
        await ApiService.addSystemLog("SYSTEM", "SYSTEM", userName, "Wylogowanie z systemu.");
        localStorage.removeItem('classSpaceUserName');
        localStorage.removeItem('classSpaceUserRole');
        onLogout();
    };

    const toggleTheme = () => {
        const html = document.documentElement;
        const isLight = html.getAttribute('data-theme') === 'light';
        const newTheme = isLight ? 'dark' : 'light';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('classSpaceTheme', newTheme);
    };

    // Ustawienie zapisanego motywu po załadowaniu
    useEffect(() => {
        const savedTheme = localStorage.getItem('classSpaceTheme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }, []);

    return (
        <div id="app-page">
            <div className="container">
                <div className="top-actions">
                    <button className="theme-toggle" onClick={toggleTheme}>Alternatywny Motyw</button>
                    <button className="btn btn-return" onClick={handleLogout} style={{ padding: '6px 12px', fontSize: '13px' }}>
                        Wyloguj
                    </button>
                </div>

                <div className="header">
                    <div>
                        <h1>ClassSpace</h1>
                        <div className="subtitle">System Rezerwacji Zasobów</div>
                    </div>
                </div>

                {/* Sekcja tymczasowa - tutaj za moment wstawimy formularze i mapę */}
                <div style={{ padding: '30px', textAlign: 'center', backgroundColor: 'var(--input-bg)', borderRadius: 'var(--radius)', border: '1px solid var(--border)' }}>
                    <h2 style={{ margin: '0 0 10px 0', color: 'var(--primary)' }}>Zalogowano pomyślnie!</h2>
                    <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                        Witaj, <strong>{userName}</strong>. Twój poziom dostępu to: <span className="badge">{role.toUpperCase()}</span>
                    </p>
                </div>
                
            </div>
        </div>
    );
}