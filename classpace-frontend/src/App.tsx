import { useState } from 'react';
import AuthPage from './components/AuthPage';
import Dashboard from './components/Dashboard';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(() => Boolean(
        localStorage.getItem('classSpaceUserName') &&
        localStorage.getItem('classSpaceAccessToken'),
    ));

    if (!isAuthenticated) {
        return <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    return <Dashboard onLogout={() => setIsAuthenticated(false)} />;
}

export default App;