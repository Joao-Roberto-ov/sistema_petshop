import React, { useState, useEffect } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import Dashboard from './components/Dashboard';
import PetCadastroScreen from './components/PetCadastroScreen';
import MeusPetsScreen from './components/MeusPetsScreen';
import MeuPerfilScreen from './components/MeuPerfilScreen'; 

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

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

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        setCurrentScreen('home');
    };

    const renderScreen = () => {
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'signup')) {
            return <HomePage
                        onNavigateToLogin={() => setCurrentScreen('login')}
                        onNavigateToSignup={() => setCurrentScreen('signup')}
                        onNavigateToDashboard={() => setCurrentScreen('dashboard')}
                        isLoggedIn={isLoggedIn}
                        userData={userData}
                        onLogout={handleLogout}
                    />;
        }
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
            case 'pet-cadastro':
                return <PetCadastroScreen
                            onNavigateToHome={() => setCurrentScreen('home')}
                        />;
            case 'meus-pets':
                return <MeusPetsScreen
                            onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                            onNavigateToHome={() => setCurrentScreen('home')}
                        />;
            case 'meu-perfil':
                return <MeuPerfilScreen
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
                onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                onNavigateToMeusPets={() => setCurrentScreen('meus-pets')}
                onNavigateToMeuPerfil={() => setCurrentScreen('meu-perfil')} 
            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;
