import { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Sprawdzamy, czy w pamięci przeglądarki istnieje już sesja
        const user = localStorage.getItem('classSpaceUserName');
        if (user) {
            setIsAuthenticated(true);
        }
    }, []);

    // Jeśli nie ma sesji, pokazujemy nowo stworzony AuthPage
    if (!isAuthenticated) {
        return <AuthPage onLoginSuccess={() => setIsAuthenticated(true)} />;
    }

    // Jeśli zalogowano, pokazujemy panel główny
    return (
        <div id="app-page">
            <div className="container">
                <h1>Witaj w głównym panelu ClassSpace!</h1>
                <button 
                    className="btn btn-return" 
                    onClick={() => {
                        localStorage.removeItem('classSpaceUserName');
                        setIsAuthenticated(false);
                    }}
                >
                    Wyloguj się
                </button>
                {/* W kolejnych krokach zaimportujemy tutaj panel Wykładowcy, Mapę i Portiernię */}
            </div>
        </div>
    );
}

export default App;