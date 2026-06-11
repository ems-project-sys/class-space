import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const user = localStorage.getItem('classSpaceUserName');
        if (user) {
            setIsAuthenticated(true);
        }
    }, []);

    if (!isAuthenticated) {
        return <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}

export default App;