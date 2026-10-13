import { useState } from 'react';
import { ApiService } from '../apiService.js'; 

const getErrorMessage = (error: unknown, fallback: string) => (
    error instanceof Error ? error.message : fallback
);

export default function AuthPage({ onLoginSuccess }: { onLoginSuccess: () => void }) {
    const [isLoginTab, setIsLoginTab] = useState(true);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [alertMsg, setAlertMsg] = useState<{ text: string, type: 'success' | 'danger' } | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const userData = await ApiService.loginUser(email, password);
            localStorage.setItem('classSpaceUserRole', userData.role);
            localStorage.setItem('classSpaceUserName', userData.name);
            
            setAlertMsg({ text: 'Logowanie udane. Przekierowywanie...', type: 'success' });
            
            setTimeout(() => {
                onLoginSuccess();
            }, 1000);
        } catch (error: unknown) {
            setAlertMsg({ text: getErrorMessage(error, 'Wystąpił błąd'), type: 'danger' });
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setAlertMsg({ text: 'Hasła nie są identyczne.', type: 'danger' });
            return;
        }

        try {
            const userData = await ApiService.registerUser(name, email, password);
            localStorage.setItem('classSpaceUserRole', userData.role);
            localStorage.setItem('classSpaceUserName', userData.name);
            setAlertMsg({ text: 'Konto utworzone. Logowanie...', type: 'success' });
            setTimeout(() => {
                onLoginSuccess();
            }, 500);
        } catch (error: unknown) {
            setAlertMsg({ text: getErrorMessage(error, 'Wystąpił błąd rejestracji.'), type: 'danger' });
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
                    <form className="auth-form active" onSubmit={handleRegister}>
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label>Imię i Nazwisko</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label>Adres E-mail</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: '15px' }}>
                            <label>Hasło</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                        </div>
                        <div className="input-group" style={{ marginBottom: '25px' }}>
                            <label>Powtórz hasło</label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                minLength={8}
                                required
                            />
                        </div>
                        <button type="submit" className="btn-submit">Utwórz konto</button>
                    </form>
                )}
            </div>
        </div>
    );
}