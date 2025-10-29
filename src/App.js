import React, { useEffect, useState } from 'react';
import './App.css';
import AppHeader from './components/AppHeader';
import HomePage from './components/HomePage';
import LoginScreen from './components/LoginScreen';
import SignupScreen from './components/SignupScreen';
import ForgotPasswordScreen from './components/ForgotPasswordScreen';
import ResetPasswordScreen from './components/ResetPasswordScreen';
import Dashboard from './components/Dashboard';
import ReagendamentoGestorScreen from './components/ReagendamentoGestorScreen';
import DashboardFuncionario from './components/DashboardFuncionario';
import DashboardGestor from './components/DashboardGestor';
import GerenciarAgendamentosGestor from './components/GerenciarAgendamentosGestor';
import HomePageFuncionario from './components/HomePageFuncionario';
import VisualizarClientes from "./components/VisualizarClientes";
import VisualizarServicos from "./components/VisualizarServicos";
import PetCadastroScreen from './components/PetCadastroScreen';
import MeusPetsScreen from './components/MeusPetsScreen';
import MeuPerfilScreen from './components/MeuPerfilScreen';
import FuncionarioCadastroAdminScreen from './components/FuncionarioCadastroAdminScreen';
import CadastroFuncionarioCompleto from './components/CadastroFuncionarioCompleto';
import GerenciarFuncionarios from './components/GerenciarFuncionarios'; // Trocado Listar por Gerenciar
import CadastrarProdutoScreen from './components/CadastrarProduto';
import VisualizarProdutosGestor from './components/VisualizarProdutosGestor';
import VisualizarProdutosFuncionario from './components/VisualizarProdutosFuncionario';
import VisualizarProdutosCliente from './components/VisualizarProdutosCliente';
import VisualizarPetsGestor from './components/VisualizarPetsGestor';
import RegistrarVenda from './components/RegistrarVenda';
import VisualizarServicosCliente from './components/VisualizarServicosCliente';
import AgendarServicoScreen from './components/AgendarServicoScreen';
import SelecionarHorarioScreen from './components/SelecionarHorarioScreen';
import Checkout from './components/Checkout';

const CARGO = { GESTOR: 1, FUNCIONARIO: 2, VETERINARIO: 3, ATENDENTE: 4 };

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [servicoParaAgendar, setServicoParaAgendar] = useState(null);
    const [agendamentoParaReagendar, setAgendamentoParaReagendar] = useState(null);
    const [checkoutCarrinho, setCheckoutCarrinho] = useState([]);

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
            try {
                const parsedUser = JSON.parse(savedUserData);
                setIsLoggedIn(true);
                setUserData(parsedUser);
                navigateToHome(parsedUser, true);
            } catch (e) {
                 console.error("Limpando dados de usuário inválidos:", e);
                 localStorage.removeItem('token');
                 localStorage.removeItem('userData');
            }
        }

        const handleNavigate = (event) => {

             if (event.detail !== currentScreen) {
                setCurrentScreen(event.detail);
             }
        };
        window.addEventListener('navigate', handleNavigate);
        return () => {
            window.removeEventListener('navigate', handleNavigate);
        };
    }, [currentScreen]);

    const navigateToHome = (user = userData, forced = false) => {
        const targetScreen = (user?.cargo_id || user?.cargo) ? 'homeFuncionario' : 'home';
        if (forced || currentScreen !== targetScreen) {
            setCurrentScreen(targetScreen);
        }
    };


    const navigateToDashboard = () => {
        if (!isLoggedIn) {
            setCurrentScreen('login');
        } else {
            const cargoId = userData?.cargo_id;
            const cargoString = userData?.cargo?.toUpperCase();
            let targetScreen = 'dashboard'; // Padrão Cliente

            if (cargoId === CARGO.GESTOR || cargoString === 'GESTOR' || cargoString === 'ADMINISTRADOR') {
                targetScreen = 'dashboard-gestor';
            } else if (cargoId || cargoString) {
                targetScreen = 'dashboard-funcionario';
            }
            setCurrentScreen(targetScreen);
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
        setServicoParaAgendar(null);
        setAgendamentoParaReagendar(null);
        setCheckoutCarrinho([]);
        navigateToHome(null, true);
    };

    const iniciarNovoAgendamento = () => {
        setAgendamentoParaReagendar(null);
        setCurrentScreen('agendar-servico');
    };
    const iniciarReagendamento = (agendamento) => {
        setServicoParaAgendar(null);
        setAgendamentoParaReagendar(agendamento);
        setCurrentScreen('selecionar-horario');
    };

    const handleNavigateToCheckout = (carrinho) => {
        setCheckoutCarrinho(carrinho);
        setCurrentScreen('checkout');
    };

    const renderScreen = () => {
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'signup')) {
            navigateToHome();
            return null;
        }

        const cargoId = userData?.cargo_id;
        const cargoString = userData?.cargo;
        const isFuncionarioLogado = !!(cargoId || cargoString);
        const isClienteLogado = isLoggedIn && !isFuncionarioLogado;

        const telasFuncionario = ['homeFuncionario', 'dashboard-funcionario', 'dashboard-gestor',
                                  'visualizarClientes', 'visualizarServicos', 'cadastro-funcionario-completo',
                                  'listar-funcionarios',
                                  'visualizar-pets-gestor', 'cadastrarProduto',
                                  'visualizar-produtos-gestor', 'visualizar-produtos-funcionario', 'registrar-venda',
                                  'funcionario-cadastro-admin', 'gerenciar-agendamentos'];
        if (isClienteLogado && telasFuncionario.includes(currentScreen)) {
            console.warn("Acesso negado: Cliente tentando acessar área de funcionário. Redirecionando para home.");
            navigateToHome(null, true); return null;
        }

        const telasCliente = ['dashboard', 'meus-pets', 'meu-perfil', 'agendar-servico',
                              'visualizar-servicos-cliente', 'checkout', 'visualizar-produtos-cliente'];
        if (isFuncionarioLogado && telasCliente.includes(currentScreen)) {
            console.warn("Acesso negado: Funcionário tentando acessar área de cliente. Redirecionando para home.");
            navigateToHome(userData, true); return null;
        }

        const isGestor = (cargoId === CARGO.GESTOR || cargoString === 'GESTOR' || cargoString === 'ADMINISTRADOR' || cargoString === 'gestor');
        const telasGestor = ['dashboard-gestor', 'visualizarServicos', 'cadastro-funcionario-completo',
                             'listar-funcionarios',
                             'visualizar-pets-gestor', 'cadastrarProduto',
                             'visualizar-produtos-gestor', 'funcionario-cadastro-admin', 'gerenciar-agendamentos'];
        if (isFuncionarioLogado && !isGestor && telasGestor.includes(currentScreen)) {
            console.warn("Acesso negado: Funcionário não-gestor tentando acessar área de gestor.");
            navigateToHome(userData, true); return null;
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
                    onNavigateToHome={() => navigateToHome(null, true)}
                    onIniciarReagendamento={iniciarReagendamento}
                    onNavigateToAgendarServico={iniciarNovoAgendamento}
                />;

            case 'dashboard-funcionario':
                return <DashboardFuncionario
                           userData={userData}
                           onLogout={handleLogout}
                           onNavigateToHome={() => navigateToHome(userData, true)}
                       />;

            case 'dashboard-gestor':
                 return <DashboardGestor
                            userData={userData}
                            onLogout={handleLogout}
                            onNavigateToHome={() => navigateToHome(userData, true)}
                        />;

            case 'pet-cadastro':
                return <PetCadastroScreen
                    onNavigateToHome={() => navigateToHome(userData)}
                />;

            case 'meus-pets':
                return <MeusPetsScreen
                    onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                    onNavigateToHome={() => navigateToHome(userData)}
                />;

            case 'meu-perfil':
                return <MeuPerfilScreen
                    onNavigateToHome={() => navigateToHome(userData)}
                    onNavigateToForgotPassword={() => setCurrentScreen('forgot-password')}
                />;

            case 'visualizar-servicos-cliente':
                return <VisualizarServicosCliente
                    onBack={() => navigateToHome(userData)}
                />;

            case 'homeFuncionario':
                return <HomePageFuncionario
                    userData={userData}
                    onNavigateToDashboard={navigateToDashboard}
                    onNavigateToVisualizarClientes={() => setCurrentScreen("visualizarClientes")}
                    onNavigateToVisualizarServicos={() => setCurrentScreen('visualizarServicos')}
                    onNavigateToCadastrarProduto={() => setCurrentScreen('cadastrarProduto')}
                    onNavigateToCadastroFuncionarioCompleto={() => setCurrentScreen('cadastro-funcionario-completo')}
                    onNavigateToGerenciarFuncionarios={() => setCurrentScreen('listar-funcionarios')} // Mantido 'listar-funcionarios'
                    onNavigateToVisualizarPets={() => setCurrentScreen('visualizar-pets-gestor')}
                    onNavigateToRegistrarVenda={() => setCurrentScreen('registrar-venda')}
                    onNavigateToGerenciarAgendamentos={() => setCurrentScreen('gerenciar-agendamentos')}
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

            case 'checkout':
                return <Checkout
                    carrinho={checkoutCarrinho}
                    onBack={() => setCurrentScreen('visualizar-produtos-cliente')}
                />;

            case 'registrar-venda': return <RegistrarVenda onBack={() => navigateToHome(userData)} />;
            case 'visualizar-produtos-gestor': return <VisualizarProdutosGestor onBack={() => navigateToHome(userData)} />;
            case 'visualizar-produtos-funcionario': return <VisualizarProdutosFuncionario onBack={() => navigateToHome(userData)} />;
            case 'visualizar-produtos-cliente':
                return (
                    <VisualizarProdutosCliente
                        onBack={() => navigateToHome(userData)}
                        onNavigateToCheckout={handleNavigateToCheckout} // Adicionado
                    />
                );

            case 'visualizarClientes': return <VisualizarClientes onBack={() => navigateToHome(userData)} />;
            case 'visualizar-pets-gestor': return <VisualizarPetsGestor onBack={() => navigateToHome(userData)} />;
            case 'visualizarServicos':
                if (!userData?.cargo || !['gestor', 'administrador'].includes(userData.cargo.toLowerCase())) {
                    return (
                        <div className="container" style={{ padding: '2rem' }}>
                            <h2>Acesso Negado</h2>
                            <p>Você não tem permissão para gerenciar serviços.</p>
                            <button className="btn btn-secondary" onClick={() => navigateToHome(userData)}>Voltar</button>
                        </div>
                    );
                }
                return <VisualizarServicos onBack={() => navigateToHome(userData)} />;

            case 'funcionario-cadastro-admin':
                 return <FuncionarioCadastroAdminScreen onNavigateToHome={() => navigateToHome(userData)} />;

            case 'cadastro-funcionario-completo': return <CadastroFuncionarioCompleto onNavigateToHome={() => navigateToHome(userData)} />;
            case 'listar-funcionarios': return <GerenciarFuncionarios onNavigateToHome={() => navigateToHome(userData)} />;
            case 'cadastrarProduto': return <CadastrarProdutoScreen onNavigateToHome={() => navigateToHome(userData)} />;

            case 'agendar-servico':
                return <AgendarServicoScreen
                            onBack={() => navigateToHome(userData)} // Ajustado
                            onNavigateToAgendamento={(servico) => {
                                setServicoParaAgendar(servico);
                                setAgendamentoParaReagendar(null);
                                setCurrentScreen('selecionar-horario');
                            }}
                        />;
            case 'selecionar-horario':
                 if (agendamentoParaReagendar && isFuncionarioLogado) {
                    return <ReagendamentoGestorScreen/>;
                 }
                 return <SelecionarHorarioScreen/>;


            case 'home':
            default:
                return <HomePage
                    onNavigateToLogin={() => setCurrentScreen('login')}
                    onNavigateToSignup={() => setCurrentScreen('signup')}
                    onNavigateToDashboard={navigateToDashboard}
                    onNavigateToProdutos={() => setCurrentScreen('visualizar-produtos-cliente')}
                    onNavigateToServicos={() => setCurrentScreen('visualizar-servicos-cliente')}
                    onNavigateToAgendamento={iniciarNovoAgendamento}
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
                onNavigateToDashboard={navigateToDashboard}
                onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                onNavigateToMeusPets={() => setCurrentScreen('meus-pets')}
                onNavigateToMeuPerfil={() => setCurrentScreen('meu-perfil')}
                onNavigateToHome={() => navigateToHome(userData)}
                onNavigateToServicosCliente={() => setCurrentScreen('visualizar-servicos-cliente')}
                onNavigateToProdutos={(tipo) => {

                    if (tipo === 'gestor' || ['gestor', 'administrador'].includes(userData?.cargo?.toLowerCase())) setCurrentScreen('visualizar-produtos-gestor');
                    else if (tipo === 'funcionario' || userData?.cargo) setCurrentScreen('visualizar-produtos-funcionario');
                    else setCurrentScreen('visualizar-produtos-cliente');
                }}
                onNavigateToAgendarServico={iniciarNovoAgendamento}
                onNavigateToCheckout={()=> setCurrentScreen('checkout')}

            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;