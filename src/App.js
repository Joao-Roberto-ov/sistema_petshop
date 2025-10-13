import React, { useEffect, useState } from 'react';
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
import VisualizarServicos from "./components/VisualizarServicos"; 
import PetCadastroScreen from './components/PetCadastroScreen';
import MeusPetsScreen from './components/MeusPetsScreen';
import MeuPerfilScreen from './components/MeuPerfilScreen';
import FuncionarioCadastroAdminScreen from './components/FuncionarioCadastroAdminScreen';
import CadastroFuncionarioCompleto from './components/CadastroFuncionarioCompleto';
import ListarFuncionarios from './components/ListarFuncionarios';
import GerenciarFuncionarios from './components/GerenciarFuncionarios';
import CadastrarProdutoScreen from './components/CadastrarProduto';
import VisualizarProdutosGestor from './components/VisualizarProdutosGestor';
import VisualizarProdutosFuncionario from './components/VisualizarProdutosFuncionario';
import VisualizarProdutosCliente from './components/VisualizarProdutosCliente';
import VisualizarPetsGestor from './components/VisualizarPetsGestor';
import RegistrarVenda from './components/RegistrarVenda';

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
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

        const handleNavigate = (event) => {
            setCurrentScreen(event.detail);
        };

        window.addEventListener('navigate', handleNavigate);
        
        return () => {
            window.removeEventListener('navigate', handleNavigate);
        };
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
                    onNavigateToForgotPassword={() => setCurrentScreen('forgot-password')}
                />;

            case 'homeFuncionario':
                return <HomePageFuncionario
                    userData={userData}
                    onNavigateToVisualizarClientes={() => setCurrentScreen("visualizarClientes")}
                    onNavigateToVisualizarServicos={() => setCurrentScreen('visualizarServicos')}
                    onNavigateToFuncionarioCadastroAdmin={() => setCurrentScreen("funcionario-cadastro-admin")}
                    onNavigateToCadastrarProduto={() => setCurrentScreen('cadastrarProduto')}
                    onNavigateToCadastroFuncionarioCompleto={() => setCurrentScreen('cadastro-funcionario-completo')}
                    onNavigateToGerenciarFuncionarios={() => setCurrentScreen('listar-funcionarios')}
                    onNavigateToVisualizarPets={() => setCurrentScreen('visualizar-pets-gestor')}
                    onNavigateToRegistrarVenda={() => setCurrentScreen('registrar-venda')}
                    onNavigateToVisualizarProdutos={() => {
                        const cargoLower = userData?.cargo?.toLowerCase();
                        if (cargoLower === 'gestor' || cargoLower === 'administrador') {
                            setCurrentScreen('visualizar-produtos-gestor');
                        } else {
                            setCurrentScreen('visualizar-produtos-funcionario');
                        }
                    }}
                    onLogout={handleLogout}
                />;

            case 'registrar-venda':
                return <RegistrarVenda
                    onBack={() => navigateToHome()}
                />;
            case 'visualizar-produtos-gestor':
                return <VisualizarProdutosGestor
                    onBack={() => navigateToHome()}
                />;

            case 'visualizar-produtos-funcionario':
                return <VisualizarProdutosFuncionario
                    onBack={() => navigateToHome()}
                />;

            case 'visualizar-produtos-cliente':
                return <VisualizarProdutosCliente
                    onBack={() => setCurrentScreen('home')}
                />;

            case 'visualizarClientes':
                return <VisualizarClientes onBack={() => navigateToHome()} />;
            
            case 'visualizar-pets-gestor':
                return <VisualizarPetsGestor onBack={() => navigateToHome()} />;
            case 'visualizarServicos':
                if (!userData?.cargo || userData.cargo.toLowerCase() !== 'gestor') {
                    return (
                        <div className="container" style={{ padding: '2rem' }}>
                            <h2>Acesso Negado</h2>
                            <p>Você não tem permissão para gerenciar serviços.</p>
                            <button className="btn btn-secondary" onClick={() => navigateToHome()}>Voltar</button>
                        </div>
                    );
                }
                return <VisualizarServicos onBack={() => navigateToHome()} />;

            case 'funcionario-cadastro-admin':
                return <FuncionarioCadastroAdminScreen
                />;

            case 'cadastro-funcionario-completo':
                return <CadastroFuncionarioCompleto
                    onNavigateToHome={() => navigateToHome()}
                />;

            case 'listar-funcionarios':
                return <GerenciarFuncionarios
                    onNavigateToHome={() => navigateToHome()}
                />;

            case 'cadastrarProduto':
                return <CadastrarProdutoScreen
                    onNavigateToHome={() => navigateToHome()}
                />;

            case 'home':
            default:
                return <HomePage
                    onNavigateToLogin={() => setCurrentScreen('login')}
                    onNavigateToSignup={() => setCurrentScreen('signup')}
                    onNavigateToDashboard={() => setCurrentScreen('dashboard')}
                    onNavigateToProdutos={() => setCurrentScreen('visualizar-produtos-cliente')}
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
                onNavigateToProdutos={(tipo) => {
                    if (tipo === 'gestor') setCurrentScreen('visualizar-produtos-gestor');
                    else if (tipo === 'funcionario') setCurrentScreen('visualizar-produtos-funcionario');
                    else setCurrentScreen('visualizar-produtos-cliente');
                }}
                onNavigateToCadastrarProduto={()=> setCurrentScreen('registrar-venda')}
            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;