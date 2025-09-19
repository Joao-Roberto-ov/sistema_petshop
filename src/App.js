import React, { useState, useEffect } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import Dashboard from './components/Dashboard';
import HomePageFuncionario from './components/HomePageFuncionario';
import VisualizarClientes from "./components/VisualizarClientes";

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    // Verifica se já existe um login salvo no navegador
    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUserData = localStorage.getItem('userData');
        if (token && savedUserData) {
            const parsedUser = JSON.parse(savedUserData);
            setIsLoggedIn(true);
            setUserData(parsedUser);
            navigateToHome(parsedUser);
        }
    }, []);

    const navigateToHome = (user = userData, forced = false) => {
        if (!forced && user?.cargo) {
            // Se for funcionário (ou gestor) e não estiver forçando visitante
            setCurrentScreen('homeFuncionario');
        } else {
            // Se for cliente, visitante ou se estiver forçando
            setCurrentScreen('home');
        }
    };


    const handleLogin = (data) => {
        setIsLoggedIn(true);
        setUserData(data);
        navigateToHome(data);
    };

    // Logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        navigateToHome(null,true);
    };

    // Decide qual componente de tela renderizar
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
                            onNavigateToHome={navigateToHome}
                        />;
            case 'homeFuncionario':
                return <HomePageFuncionario
                    userData={userData}
                    onNavigateToVisualizarClientes={() => setCurrentScreen('visualizarClientes')}
                    onLogout={handleLogout}
                />;
            case 'visualizarClientes':
                return <VisualizarClientes onBack={() => navigateToHome()} />;
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
                onNavigateToHome={navigateToHome}
            />

            <main>
                {renderScreen()}
            </main>
        </div>
    );
}

export default App;
