import React, { useState, useEffect } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import Dashboard from './components/Dashboard';
import HomePageFuncionario from './components/HomePageFuncionario';
import VisualizarClientes from "./components/VisualizarClientes";
import PetCadastroScreen from './components/PetCadastroScreen';
import MeusPetsScreen from './components/MeusPetsScreen';
import MeuPerfilScreen from './components/MeuPerfilScreen';

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        // Verificar se é uma página de redefinição de senha
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token) {
            setCurrentScreen('reset-password');
            return;
        }

        const authToken = localStorage.getItem('token');
        const savedUserData = localStorage.getItem('userData');
        if (authToken && savedUserData) {
            const parsedUser = JSON.parse(savedUserData);
            setIsLoggedIn(true);
            setUserData(parsedUser);
            navigateToHome(parsedUser);
        }
    }, []);

    const navigateToHome = (user = userData, forced = false) => {
        if (!forced && user?.cargo) {
            setCurrentScreen('homeFuncionario');
        } else {
            setCurrentScreen('home');
        }
    };

    const handleLogin = (data) => {
        setIsLoggedIn(true);
        setUserData(data);
        navigateToHome(data);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        navigateToHome(null, true);
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
                            onNavigateToForgotPassword={() => setCurrentScreen('forgot-password')}
                            setUserData={setUserData}
                        />;
            case 'signup':
                return <SignupScreen
                            onNavigateToLogin={() => setCurrentScreen('login')}
                        />;
            case 'forgot-password':
                return <ForgotPasswordScreen
                            onNavigateToLogin={() => setCurrentScreen('login')}
                        />;
            case 'reset-password':
                return <ResetPasswordScreen
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
                            onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                            onNavigateToHome={() => setCurrentScreen('home')}
                        />;
            case 'meu-perfil':
                return <MeuPerfilScreen
                            onNavigateToHome={() => setCurrentScreen('home')}
                            onNavigateToForgotPassword={() => setCurrentScreen('forgot-password')} // CORREÇÃO: Adicionei esta linha
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
                onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                onNavigateToMeusPets={() => setCurrentScreen('meus-pets')}
                onNavigateToMeuPerfil={() => setCurrentScreen('meu-perfil')}
                onNavigateToHome={navigateToHome}
            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;