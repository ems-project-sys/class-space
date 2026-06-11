import { useState } from 'react';
import { ApiService } from '../apiService.js'; 

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [isLoginTab, setIsLoginTab] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [alertMsg, setAlertMsg] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Wywołujemy serwis dokładnie tak samo jak w starym pliku
            const userData = await ApiService.loginUser(email, password);
            localStorage.setItem('classSpaceUserRole', userData.role);
            localStorage.setItem('classSpaceUserName', userData.name);
            
            setAlertMsg({ text: 'Logowanie udane. Przekierowywanie...', type: 'success' });
            await ApiService.addSystemLog("SYSTEM", "SYSTEM", userData.name, "Pomyślne logowanie do systemu.");
            
            setTimeout(() => {
                onLoginSuccess();
            }, 1000);
        } catch (error: any) {
            setAlertMsg({ text: error.message || 'Wystąpił błąd', type: 'danger' });
        }
    };

    return (
        <div id="login-page">
            <div className="auth-card">
                <div className="header auth-header">
                    <h1>ClassSpace</h1>
                    <p>Zaloguj się do systemu</p>
                </div>

                <div className="auth-tabs">
                    <button 
                        className={`tab-btn ${isLoginTab ? 'active' : ''}`} 
                        onClick={() => setIsLoginTab(true)}
                    >
                        Logowanie
                    </button>
                    <button 
                        className={`tab-btn ${!isLoginTab ? 'active' : ''}`} 
                        onClick={() => setIsLoginTab(false)}
                    >
                        Rejestracja
                    </button>
                </div>

                {alertMsg && (
                    <div className={`alert alert-${alertMsg.type}`} style={{ display: 'block' }}>
                        {alertMsg.text}
                    </div>
                )}

                {isLoginTab ? (
                    <form className="auth-form active" onSubmit={handleLogin}>
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label>Adres E-mail</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label>Hasło</label>
                            <input 
                                type="password" 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required 
                            />
                        </div>
                        <button type="submit" className="btn-submit">Zaloguj się</button>
                    </form>
                ) : (
                    <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                        Rejestracja w przygotowaniu. Przełącz na logowanie.
                    </div>
                )}
            </div>
        </div>
    );
}