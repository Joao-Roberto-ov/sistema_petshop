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
import GerenciarFuncionarios from './components/GerenciarFuncionarios';
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

// Helper function to dispatch navigation events
const navigateTo = (screenName) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: screenName }));
};

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);
    const [servicoParaAgendar, setServicoParaAgendar] = useState(null);
    const [agendamentoParaReagendar, setAgendamentoParaReagendar] = useState(null);
    const [checkoutCarrinho, setCheckoutCarrinho] = useState([]);

    useEffect(() => {
        // Handle URL params for reset password
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        if (token && currentScreen !== 'reset-password') {
            // Use navigateTo to ensure the state update goes through the listener
            navigateTo('reset-password');
            return; // Prevent further processing in this effect run
        }

        // Check for saved login state
        const authToken = localStorage.getItem('token');
        const savedUserData = localStorage.getItem('userData');
        if (authToken && savedUserData && !isLoggedIn) { // Check !isLoggedIn to avoid loop
            try {
                const parsedUser = JSON.parse(savedUserData);
                setIsLoggedIn(true);
                setUserData(parsedUser);
                // Determine home screen based on user type but don't navigate yet,
                // let the 'navigate' event listener handle the initial screen setting if needed
                const targetHomeScreen = (parsedUser?.cargo_id || parsedUser?.cargo) ? 'homeFuncionario' : 'home';
                // If the current screen is still the default 'home', update it, otherwise let the listener manage.
                 if (currentScreen === 'home') {
                    setCurrentScreen(targetHomeScreen);
                 }
            } catch (e) {
                 console.error("Limpando dados de usuário inválidos:", e);
                 localStorage.removeItem('token');
                 localStorage.removeItem('userData');
                 setIsLoggedIn(false); // Ensure state reflects logout
                 setUserData(null);
            }
        }

        // Setup navigation event listener
        const handleNavigate = (event) => {
            // Use functional update to compare against the latest state
            setCurrentScreen(prevScreen => {
                if (event.detail !== prevScreen) {
                    console.log(`Navegando de ${prevScreen} para ${event.detail}`); // Debug log
                    return event.detail; // Update state
                }
                return prevScreen; // Keep state if it's the same
            });
        };
        window.addEventListener('navigate', handleNavigate);

        // Cleanup function runs only on component unmount
        return () => {
            window.removeEventListener('navigate', handleNavigate);
        };
    }, []); // <-- EMPTY dependency array, runs only once on mount

    const navigateToHome = (user = userData, forced = false) => {
        const targetScreen = (user?.cargo_id || user?.cargo) ? 'homeFuncionario' : 'home';
        // Always use the dispatch event for navigation
        navigateTo(targetScreen);
    };

    const navigateToDashboard = () => {
        if (!isLoggedIn) {
            navigateTo('login');
        } else {
            const cargoId = userData?.cargo_id;
            const cargoString = userData?.cargo?.toUpperCase();
            let targetScreen = 'dashboard'; // Default Client

            if (cargoId === CARGO.GESTOR || cargoString === 'GESTOR' || cargoString === 'ADMINISTRADOR') {
                targetScreen = 'dashboard-gestor';
            } else if (cargoId || cargoString) {
                targetScreen = 'dashboard-funcionario';
            }
            navigateTo(targetScreen);
        }
    };

    const handleLogin = (data) => {
        setIsLoggedIn(true);
        setUserData(data);
        navigateToHome(data); // Navigate after setting state
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        setServicoParaAgendar(null);
        setAgendamentoParaReagendar(null);
        setCheckoutCarrinho([]);
        navigateToHome(null, true); // Use navigateToHome which dispatches event
    };

    const iniciarNovoAgendamento = () => {
        setAgendamentoParaReagendar(null);
        navigateTo('agendar-servico');
    };

    const iniciarReagendamento = (agendamento) => {
        setServicoParaAgendar(null);
        setAgendamentoParaReagendar(agendamento);
        navigateTo('selecionar-horario');
    };

    const handleNavigateToCheckout = (carrinho) => {
        setCheckoutCarrinho(carrinho);
        navigateTo('checkout');
    };

    const renderScreen = () => {
        // Redirect logged-in users away from login/signup
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'signup')) {
            // Use navigateToHome to dispatch event instead of direct state set
            navigateToHome();
            return null; // Return null while redirecting
        }

        const cargoId = userData?.cargo_id;
        const cargoString = userData?.cargo;
        const isFuncionarioLogado = !!(cargoId || cargoString);
        const isClienteLogado = isLoggedIn && !isFuncionarioLogado;

        // --- Screen Access Control (Keep as is) ---
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
                              'visualizar-servicos-cliente', 'checkout', 'visualizar-produtos-cliente',
                              'pet-cadastro', 'selecionar-horario']; // Added missing client screens
        if (isFuncionarioLogado && telasCliente.includes(currentScreen)) {
            console.warn("Acesso negado: Funcionário tentando acessar área de cliente. Redirecionando para home.");
            navigateToHome(userData, true); return null;
        }

        const isGestor = (cargoId === CARGO.GESTOR || cargoString === 'GESTOR' || cargoString === 'ADMINISTRADOR' || cargoString === 'gestor');
        const telasGestor = ['dashboard-gestor', 'visualizarServicos', 'cadastro-funcionario-completo',
                             'listar-funcionarios',
                             'visualizar-pets-gestor', 'cadastrarProduto',
                             'visualizar-produtos-gestor', 'funcionario-cadastro-admin', 'gerenciar-agendamentos',
                             'gerenciar-pets']; // Added GerenciarPets
        if (isFuncionarioLogado && !isGestor && telasGestor.includes(currentScreen)) {
            console.warn("Acesso negado: Funcionário não-gestor tentando acessar área de gestor.");
            navigateToHome(userData, true); return null;
        }
        // --- End Screen Access Control ---


        switch (currentScreen) {
            case 'login':
                return <LoginScreen
                    onLogin={handleLogin}
                    // Use navigateTo for all navigation triggers
                    onNavigateToSignup={() => navigateTo('signup')}
                    onNavigateToForgotPassword={() => navigateTo('forgot-password')}
                    setUserData={setUserData} // Keep setUserData for login process
                />;

            case 'signup':
                return <SignupScreen
                    onNavigateToLogin={() => navigateTo('login')}
                />;

            case 'forgot-password':
                return <ForgotPasswordScreen
                    onNavigateToLogin={() => navigateTo('login')}
                />;

            case 'reset-password':
                return <ResetPasswordScreen
                    onNavigateToLogin={() => navigateTo('login')}
                />;

            case 'dashboard':
                return <Dashboard
                    userData={userData}
                    onLogout={handleLogout}
                    onNavigateToHome={() => navigateToHome(null, true)}
                    onIniciarReagendamento={iniciarReagendamento} // Keep as is, it triggers state change + navigation
                    onNavigateToAgendarServico={iniciarNovoAgendamento} // Keep as is
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
                    // Add onBack prop if needed, pointing to navigateTo('meus-pets')
                    onBack={() => navigateTo('meus-pets')}
                />;

            case 'meus-pets':
                return <MeusPetsScreen
                    onNavigateToPetCadastro={() => navigateTo('pet-cadastro')}
                    onNavigateToHome={() => navigateToHome(userData)} // Navigate home
                />;

            case 'meu-perfil':
                return <MeuPerfilScreen
                    onNavigateToHome={() => navigateToHome(userData)}
                    onNavigateToForgotPassword={() => navigateTo('forgot-password')}
                />;

            case 'visualizar-servicos-cliente':
                return <VisualizarServicosCliente
                    onBack={() => navigateToHome(userData)}
                />;

             case 'homeFuncionario':
                 return <HomePageFuncionario
                     userData={userData}
                     onNavigateToDashboard={navigateToDashboard} // Use central function
                     onNavigateToVisualizarClientes={() => navigateTo("visualizarClientes")}
                     onNavigateToVisualizarServicos={() => navigateTo('visualizarServicos')}
                     onNavigateToCadastrarProduto={() => navigateTo('cadastrarProduto')}
                     onNavigateToCadastroFuncionarioCompleto={() => navigateTo('cadastro-funcionario-completo')}
                     onNavigateToGerenciarFuncionarios={() => navigateTo('listar-funcionarios')}
                     onNavigateToVisualizarPets={() => navigateTo('visualizar-pets-gestor')}
                     onNavigateToRegistrarVenda={() => navigateTo('registrar-venda')}
                     onNavigateToGerenciarAgendamentos={() => navigateTo('gerenciar-agendamentos')}
                     onNavigateToVisualizarProdutos={() => {
                         const cargoLower = userData?.cargo?.toLowerCase();
                         if (cargoLower === 'gestor' || cargoLower === 'administrador') {
                             navigateTo('visualizar-produtos-gestor');
                         } else {
                             navigateTo('visualizar-produtos-funcionario');
                         }
                     }}
                     onLogout={handleLogout}
                 />;

            case 'checkout':
                return <Checkout
                    carrinho={checkoutCarrinho}
                    onBack={() => navigateTo('visualizar-produtos-cliente')}
                />;

            // --- Other cases using navigateTo ---
            case 'registrar-venda': return <RegistrarVenda onBack={() => navigateToHome(userData)} />;
            case 'visualizar-produtos-gestor': return <VisualizarProdutosGestor onBack={() => navigateToHome(userData)} />;
            case 'visualizar-produtos-funcionario': return <VisualizarProdutosFuncionario onBack={() => navigateToHome(userData)} />;
            case 'visualizar-produtos-cliente':
                return (
                    <VisualizarProdutosCliente
                        onBack={() => navigateToHome(userData)}
                        onNavigateToCheckout={handleNavigateToCheckout} // Keep as is
                    />
                );

            case 'visualizarClientes':return <VisualizarClientes userData={userData} onBack={() => navigateToHome(userData)}/>;
            case 'visualizar-pets-gestor': return <VisualizarPetsGestor onBack={() => navigateToHome(userData)} />;
            case 'visualizarServicos':
                 if (!isGestor) { // Simplified check using isGestor
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
                             onBack={() => navigateToHome(userData)} // Navigate home
                             onNavigateToAgendamento={(servico) => {
                                 setServicoParaAgendar(servico);
                                 setAgendamentoParaReagendar(null);
                                 navigateTo('selecionar-horario'); // Navigate via dispatch
                             }}
                         />;
             case 'selecionar-horario':
                  // Determine which screen based on context (Reagendamento Gestor or normal)
                  const isReagendamentoGestor = modoReagendamento && isGestor; // Check if Gestor is reagendando

                  return isReagendamentoGestor ? (
                     <ReagendamentoGestorScreen
                        agendamentoParaReagendar={agendamentoParaReagendar}
                        onBack={() => navigateTo('gerenciar-agendamentos')} // Go back to management screen
                        onAgendamentoSuccess={() => {
                            setAgendamentoParaReagendar(null); // Clear state
                            navigateTo('gerenciar-agendamentos'); // Go back after success
                        }}
                     />
                  ) : (
                     <SelecionarHorarioScreen
                        servico={servicoParaAgendar}
                        agendamentoParaReagendar={agendamentoParaReagendar} // Could be null for new, or set for client reagendamento
                        onBack={() => modoReagendamento ? navigateToDashboard() : navigateTo('agendar-servico')} // Go back appropriately
                        onAgendamentoSuccess={() => {
                            setServicoParaAgendar(null);
                            setAgendamentoParaReagendar(null);
                            navigateToDashboard(); // Go to dashboard after success
                        }}
                     />
                  );
            case 'gerenciar-agendamentos': // Added case for Gestor management
                    return <GerenciarAgendamentosGestor
                        userData={userData}
                        onNavigateToHome={() => navigateToHome(userData)}
                        onIniciarReagendamento={iniciarReagendamento} // Pass the function to start reagendamento flow
                    />;


            case 'home':
            default:
                return <HomePage
                    onNavigateToLogin={() => navigateTo('login')}
                    onNavigateToSignup={() => navigateTo('signup')}
                    onNavigateToProdutos={() => navigateTo('visualizar-produtos-cliente')}
                    onNavigateToServicos={() => navigateTo('visualizar-servicos-cliente')} // Standardized
                    isLoggedIn={isLoggedIn}
                    userData={userData}
                    onLogout={handleLogout}
                    onNavigateToDashboard={navigateToDashboard}
                    onNavigateToAgendamento={iniciarNovoAgendamento} // Use central function
                />;
        }
    };

    // Determine if the user is currently in a reagendamento flow
    const modoReagendamento = Boolean(agendamentoParaReagendar);

    return (
        <div className="App">
            <AppHeader
                isLoggedIn={isLoggedIn}
                userData={userData}
                onLogout={handleLogout}
                // Pass navigateTo functions directly
                onNavigateToLogin={() => navigateTo('login')}
                onNavigateToSignup={() => navigateTo('signup')}
                onNavigateToDashboard={navigateToDashboard}
                onNavigateToPetCadastro={() => navigateTo('pet-cadastro')}
                onNavigateToMeusPets={() => navigateTo('meus-pets')}
                onNavigateToMeuPerfil={() => navigateTo('meu-perfil')}
                onNavigateToHome={() => navigateToHome(userData)}
                onNavigateToServicosCliente={() => navigateTo('visualizar-servicos-cliente')}
                onNavigateToProdutos={(tipo) => {
                    // Logic to determine product screen based on user type
                    if (!isLoggedIn || !userData?.cargo) navigateTo('visualizar-produtos-cliente');
                    else if (['gestor', 'administrador'].includes(userData.cargo.toLowerCase())) navigateTo('visualizar-produtos-gestor');
                    else navigateTo('visualizar-produtos-funcionario');
                }}
                onNavigateToAgendarServico={iniciarNovoAgendamento} // Use central function
                onNavigateToCheckout={() => navigateTo('checkout')} // Added checkout nav
            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;