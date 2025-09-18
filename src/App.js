import React, { useState, useEffect } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import Dashboard from './components/Dashboard';

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    //verifica se já existe um login salvo no navegador
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUserData = localStorage.getItem('userData');
        if (token && savedUserData) {
            setIsLoggedIn(true);
            setUserData(JSON.parse(savedUserData));
            setCurrentScreen('home');
        }
    }, []);

    const handleLogin = (data) => {
        setIsLoggedIn(true);
        setUserData(data);
        setCurrentScreen('home');
    };

    //logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        setCurrentScreen('home');
    };

    //decide qual componente de tela renderizar
    const renderScreen = () => {
        switch (currentScreen) {
            case 'login':
                return <LoginScreen
                            onLogin={handleLogin}
                            onNavigateToSignup={() => setCurrentScreen('signup')}
                            setUserData={setUserData}
                        />;
            case 'signup':
                return <SignupScreen
                            onNavigateToLogin={() => setCurrentScreen('login')}
                        />;
            case 'dashboard':
                return <Dashboard
                            userData={userData}
                            onLogout={handleLogout}
                            onNavigateToHome={() => setCurrentScreen('home')}
                        />;
            case 'home':
            default:
                return <HomePage
                            onNavigateToLogin={() => setCurrentScreen('login')}
                            onNavigateToSignup={() => setCurrentScreen('signup')}
                            onNavigateToDashboard={() => setCurrentScreen('dashboard')}
                            isLoggedIn={isLoggedIn}
                            userData={userData}
                            onLogout={handleLogout}
                        />;
        }
    };

    return (
        <div className="App">
            <AppHeader
                isLoggedIn={isLoggedIn}
                userData={userData}
                onLogout={handleLogout}
                onNavigateToLogin={() => setCurrentScreen('login')}
                onNavigateToSignup={() => setCurrentScreen('signup')}
                onNavigateToDashboard={() => setCurrentScreen('dashboard')}
                onNavigateToHome={() => setCurrentScreen('home')}
            />

            <main>
                {renderScreen()}
            </main>
        </div>
    );
}

export default App;