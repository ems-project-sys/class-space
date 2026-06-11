import { useState, useEffect } from 'react';
import { ApiService } from '../apiService.js';
import LecturerView from './LecturerView';
import ReceptionView from './ReceptionView';

interface DashboardProps {
    onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
    const [role, setRole] = useState(localStorage.getItem('classSpaceUserRole') || 'wykladowca');
    const [userName] = useState(localStorage.getItem('classSpaceUserName') || 'Użytkownik');

    const handleLogout = async () => {
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

                {/* --- NAWIGACJA RÓL --- */}
                <div className="role-selector">
                    {(role === 'wykladowca' || role === 'admin') && (
                        <button 
                            className={`btn-role ${role === 'wykladowca' ? 'active' : ''}`}
                            onClick={() => setRole('wykladowca')}
                        >
                            Wykładowca
                        </button>
                    )}
                    {(role === 'portiernia' || role === 'admin') && (
                        <button 
                            className={`btn-role ${role === 'portiernia' ? 'active' : ''}`}
                            onClick={() => setRole('portiernia')}
                        >
                            Portiernia
                        </button>
                    )}
                </div>

                {/* --- GŁÓWNY WIDOK --- */}
                {(role === 'wykladowca' || role === 'admin') && (
                    <LecturerView />
                )}
                
                {(role === 'portiernia' || role === 'admin') && (
                    <ReceptionView />
                )}
                
            </div>
        </div>
    );
}