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

const CARGO = { GESTOR: 1, FUNCIONARIO: 2, VETERINARIO: 3, ATENDENTE: 4 };

function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    // --- ESTADOS DE AGENDAMENTO (REQ 3) ---
    // (servicoParaAgendar já existia no seu código)
    const [servicoParaAgendar, setServicoParaAgendar] = useState(null);
    // Adiciona o estado para reagendamento
    const [agendamentoParaReagendar, setAgendamentoParaReagendar] = useState(null);
    // --- FIM DOS ESTADOS ---

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
            try { // Adicionado try/catch para segurança
                const parsedUser = JSON.parse(savedUserData);
                setIsLoggedIn(true);
                setUserData(parsedUser);
                navigateToHome(parsedUser, true); // Força navegação na carga
            } catch (e) {
                 console.error("Limpando dados de usuário inválidos:", e);
                 localStorage.removeItem('token');
                 localStorage.removeItem('userData');
            }
        }
    }, []);

    // --- FUNÇÃO navigateToHome MODIFICADA ---
    // (Usa a sua lógica original de 'user.cargo' (string) E 'user.cargo_id')
    const navigateToHome = (user = userData, forced = false) => {
        if (!forced && (user?.cargo_id || user?.cargo)) { // Verifica ID ou string
            setCurrentScreen('homeFuncionario');
        } else {
            setCurrentScreen('home');
        }
    };
    // --- FIM DA MODIFICAÇÃO ---

    // --- NOVA FUNÇÃO DE ROTEAMENTO PARA DASHBOARD (REQ 1) ---
    const navigateToDashboard = () => {
        if (!isLoggedIn) {
            setCurrentScreen('login');
        } else {
            const cargoId = userData?.cargo_id;
            // Usa a string 'cargo' do seu 'userData' original
            const cargoString = userData?.cargo?.toUpperCase();

            if (cargoId === CARGO.GESTOR || cargoString === 'GESTOR' || cargoString === 'ADMINISTRADOR') {
                setCurrentScreen('dashboard-gestor');
            } else if (cargoId || cargoString) { // Qualquer outro funcionário
                setCurrentScreen('dashboard-funcionario');
            } else { // Cliente
                setCurrentScreen('dashboard');
            }
        }
    };
    // --- FIM DA NOVA FUNÇÃO ---

    const handleLogin = (data) => {
        setIsLoggedIn(true);
        setUserData(data);
        navigateToHome(data); //usa a função ajustada
    };

    // --- handleLogout MODIFICADO (REQ 3) ---
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        setServicoParaAgendar(null); // Limpa estado de agendamento
        setAgendamentoParaReagendar(null); // Limpa estado de reagendamento
        navigateToHome(null, true);
    };
    // --- FIM DA MODIFICAÇÃO ---

    // --- NOVAS FUNÇÕES DE NAVEGAÇÃO (REQ 3) ---
    const iniciarNovoAgendamento = () => {
        setAgendamentoParaReagendar(null);
        setCurrentScreen('agendar-servico');
    };
    const iniciarReagendamento = (agendamento) => {
        setServicoParaAgendar(null);
        setAgendamentoParaReagendar(agendamento);
        setCurrentScreen('selecionar-horario');
    };
    // --- FIM DAS NOVAS FUNÇÕES ---


    const renderScreen = () => {
        // --- BLOCO if (isLoggedIn...) MODIFICADO ---
        if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'signup')) {
            // Modificado para chamar a função de navegação correta
            navigateToHome();
            return null;
        }
        // --- FIM DA MODIFICAÇÃO ---

        // --- LÓGICA DE PROTEÇÃO DE ROTA (REQ 1) ---
        const cargoId = userData?.cargo_id;
        const cargoString = userData?.cargo;
        const isFuncionarioLogado = !!(cargoId || cargoString);
        const isClienteLogado = isLoggedIn && !isFuncionarioLogado;

        const telasFuncionario = ['homeFuncionario', 'dashboard-funcionario', 'dashboard-gestor',
                                  'visualizarClientes', 'visualizarServicos', 'cadastro-funcionario-completo',
                                  'listar-funcionarios', 'visualizar-pets-gestor', 'cadastrarProduto',
                                  'visualizar-produtos-gestor', 'visualizar-produtos-funcionario', 'registrar-venda',
                                  'funcionario-cadastro-admin', 'gerenciar-agendamentos']; // Adicionado 'gerenciar-agendamentos'
        if (isClienteLogado && telasFuncionario.includes(currentScreen)) {
            console.warn("Acesso negado: Cliente tentando acessar área de funcionário. Redirecionando para home.");
            setCurrentScreen('home'); return null;
        }
        const telasCliente = ['dashboard', 'meus-pets', 'meu-perfil', 'agendar-servico', 'visualizar-servicos-cliente'];
        if (isFuncionarioLogado && telasCliente.includes(currentScreen)) {
            console.warn("Acesso negado: Funcionário tentando acessar área de cliente. Redirecionando para home.");
            setCurrentScreen('homeFuncionario'); return null;
        }
        // Proteção extra para dashboard/telas de gestor
        const isGestor = (cargoId === CARGO.GESTOR || cargoString === 'GESTOR' || cargoString === 'ADMINISTRADOR' || cargoString === 'gestor');
        const telasGestor = ['dashboard-gestor', 'visualizarServicos', 'cadastro-funcionario-completo', 'listar-funcionarios', 'visualizar-pets-gestor', 'cadastrarProduto', 'visualizar-produtos-gestor', 'funcionario-cadastro-admin', 'gerenciar-agendamentos'];
        if (isFuncionarioLogado && !isGestor && telasGestor.includes(currentScreen)) {
            console.warn("Acesso negado: Funcionário não-gestor tentando acessar área de gestor.");
            setCurrentScreen('homeFuncionario'); return null;
        }
        // --- FIM DA PROTEÇÃO ---


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

            case 'dashboard': // Dashboard do CLIENTE (protegido acima)
                return <Dashboard
                    userData={userData}
                    onLogout={handleLogout}
                    onNavigateToHome={navigateToHome}
                    // *** MODIFICADO (REQ 3) ***
                    onIniciarReagendamento={iniciarReagendamento}
                    onNavigateToAgendarServico={iniciarNovoAgendamento}
                />;

            // --- NOVOS CASES (REQ 1) ---
            case 'dashboard-funcionario': // Dashboard do FUNCIONÁRIO (protegido acima)
                return <DashboardFuncionario
                           userData={userData}
                           onLogout={handleLogout}
                           onNavigateToHome={navigateToHome}
                       />;

            case 'dashboard-gestor': // Dashboard do GESTOR (protegido acima)
                 return <DashboardGestor
                            userData={userData}
                            onLogout={handleLogout}
                            onNavigateToHome={navigateToHome}
                        />;
            // --- FIM DOS NOVOS CASES ---

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

            case 'visualizar-servicos-cliente':
                return <VisualizarServicosCliente
                    onBack={() => navigateToHome()}
                />;

            case 'homeFuncionario': // Home de Funcionário (protegida acima)
                return <HomePageFuncionario
                    userData={userData}
                    onNavigateToDashboard={navigateToDashboard} // *** MODIFICADO (REQ 1) ***
                    onNavigateToVisualizarClientes={() => setCurrentScreen("visualizarClientes")}
                    onNavigateToVisualizarServicos={() => setCurrentScreen('visualizarServicos')}
                    onNavigateToFuncionarioCadastroAdmin={() => setCurrentScreen("funcionario-cadastro-admin")}
                    onNavigateToCadastrarProduto={() => setCurrentScreen('cadastrarProduto')}
                    onNavigateToCadastroFuncionarioCompleto={() => setCurrentScreen('cadastro-funcionario-completo')}
                    onNavigateToGerenciarFuncionarios={() => setCurrentScreen('listar-funcionarios')}
                    onNavigateToVisualizarPets={() => setCurrentScreen('visualizar-pets-gestor')}
                    onNavigateToRegistrarVenda={() => setCurrentScreen('registrar-venda')}
                    // *** ADICIONADO (REQ 6) ***
                    onNavigateToGerenciarAgendamentos={() => setCurrentScreen('gerenciar-agendamentos')}
                    // ---
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

            // Cases de Funcionário/Gestor (protegidos acima)
            case 'registrar-venda': return <RegistrarVenda onBack={() => navigateToHome()} />;
            case 'visualizar-produtos-gestor': return <VisualizarProdutosGestor onBack={() => navigateToHome()} />;
            case 'visualizar-produtos-funcionario': return <VisualizarProdutosFuncionario onBack={() => navigateToHome()} />;
            case 'visualizar-produtos-cliente': return <VisualizarProdutosCliente onBack={() => setCurrentScreen('home')} />;
            case 'visualizarClientes': return <VisualizarClientes onBack={() => navigateToHome()} />;
            case 'visualizar-pets-gestor': return <VisualizarPetsGestor onBack={() => navigateToHome()} />;
            case 'visualizarServicos': return <VisualizarServicos onBack={() => navigateToHome()} />; // Proteção já aplicada
            case 'funcionario-cadastro-admin': return <FuncionarioCadastroAdminScreen onNavigateToHome={navigateToHome} />; // Adicionado onNavigateToHome
            case 'cadastro-funcionario-completo': return <CadastroFuncionarioCompleto onNavigateToHome={navigateToHome} />;
            case 'listar-funcionarios': return <GerenciarFuncionarios onNavigateToHome={navigateToHome} />;
            case 'cadastrarProduto': return <CadastrarProdutoScreen onNavigateToHome={navigateToHome} />;

            case 'gerenciar-agendamentos':
                return <GerenciarAgendamentosGestor
                           userData={userData}
                           onNavigateToHome={navigateToHome}
                           onIniciarReagendamento={iniciarReagendamento} // Passa a função (Req 3)
                       />;

            case 'agendar-servico': // Tela 1: Escolher Serviço (protegida acima)
                return <AgendarServicoScreen
                            onBack={navigateToHome}
                            onNavigateToAgendamento={(servico) => {
                                setServicoParaAgendar(servico);
                                setAgendamentoParaReagendar(null);
                                setCurrentScreen('selecionar-horario');
                            }}
                        />;
            case 'selecionar-horario':
                // Se estamos reagendando E o usuário é um funcionário (Gestor)
                if (agendamentoParaReagendar && isFuncionarioLogado) {
                    return <ReagendamentoGestorScreen
                        agendamentoParaReagendar={agendamentoParaReagendar}
                        onBack={() => {
                            setAgendamentoParaReagendar(null);
                            // Volta para a tela de gerenciamento do gestor
                            setCurrentScreen('gerenciar-agendamentos');
                        }}
                        onAgendamentoSuccess={() => {
                            setAgendamentoParaReagendar(null);
                            // Volta para a tela de gerenciamento do gestor
                            setCurrentScreen('gerenciar-agendamentos');
                        }}
                    />;
                }

                return <SelecionarHorarioScreen
                            servico={servicoParaAgendar}
                            agendamentoParaReagendar={agendamentoParaReagendar}
                            onBack={() => {
                                setServicoParaAgendar(null);
                                setAgendamentoParaReagendar(null);
                                setCurrentScreen(agendamentoParaReagendar ? 'dashboard' : 'agendar-servico');
                            }}
                            onAgendamentoSuccess={() => {
                                setServicoParaAgendar(null);
                                setAgendamentoParaReagendar(null);
                                setCurrentScreen('dashboard');
                            }}
                        />;

            case 'home':
            default: // Home do CLIENTE ou DESLOGADO (protegida acima)
                return <HomePage
                    onNavigateToLogin={() => setCurrentScreen('login')}
                    onNavigateToSignup={() => setCurrentScreen('signup')}
                    onNavigateToDashboard={navigateToDashboard} // *** MODIFICADO (REQ 1) ***
                    onNavigateToProdutos={() => setCurrentScreen('visualizar-produtos-cliente')}
                    onNavigateToServicos={() => setCurrentScreen('visualizar-servicos-cliente')} // Prop original mantida
                    onNavigateToAgendamento={iniciarNovoAgendamento} // *** MODIFICADO (REQ 3) ***
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
                onNavigateToDashboard={navigateToDashboard} // *** MODIFICADO (REQ 1) ***
                onNavigateToPetCadastro={() => setCurrentScreen('pet-cadastro')}
                onNavigateToMeusPets={() => setCurrentScreen('meus-pets')}
                onNavigateToMeuPerfil={() => setCurrentScreen('meu-perfil')}
                onNavigateToHome={navigateToHome}
                onNavigateToServicosCliente={() => setCurrentScreen('visualizar-servicos-cliente')} // Prop original mantida
                onNavigateToProdutos={(tipo) => {
                    if (tipo === 'gestor' || userData?.cargo === 'GESTOR') setCurrentScreen('visualizar-produtos-gestor');
                    else if (tipo === 'funcionario' || userData?.cargo === 'FUNCIONARIO') setCurrentScreen('visualizar-produtos-funcionario');
                    else setCurrentScreen('visualizar-produtos-cliente');
                }}

                // Esta prop é necessária para a função 'handleServicosClick' no AppHeader
                onNavigateToAgendarServico={iniciarNovoAgendamento}
            />
            <main>
                {renderScreen()}
            </main>
        </div>
    );
}
export default App;