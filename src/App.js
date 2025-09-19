import React, { useState, useEffect } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import Dashboard from './components/Dashboard';
import HomePageFuncionario from './components/HomePageFuncionario';
import VisualizarClientes from "./components/VisualizarClientes";
import PetCadastroScreen from './components/PetCadastroScreen';
import MeusPetsScreen from './components/MeusPetsScreen';

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

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

    //logout
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        navigateToHome(null,true);
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
                            onNavigateToHome={navigateToHome}
                        />;
            case 'pet-cadastro':
                return <PetCadastroScreen
                            onNavigateToHome={() => setCurrentScreen('home')}
                        />;
            case 'meus-pets':
                return <MeusPetsScreen
                            onNavigateToHome={() => setCurrentScreen('home')}
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
                onNavigateToHome={() => setCurrentScreen('home')}
                onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                onNavigateToMeusPets={() => setCurrentScreen('meus-pets')}
                onNavigateToHome={navigateToHome}
            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;