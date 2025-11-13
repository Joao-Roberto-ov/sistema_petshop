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
    import VisualizarPets from './components/VisualizarPets';
    import RegistrarVenda from './components/RegistrarVenda';
    import VisualizarServicosCliente from './components/VisualizarServicosCliente';
    import AgendarServicoScreen from './components/AgendarServicoScreen';
    import SelecionarHorarioScreen from './components/SelecionarHorarioScreen';
    import Checkout from './components/Checkout';
    import FluxoCaixaReport from './components/FluxoCaixaReport';
    import ConfigEmpresaScreen from './components/ConfigEmpresaScreen';
    import configEmpresaScreen from "./components/ConfigEmpresaScreen";

    const CARGO = { GESTOR: 1, FUNCIONARIO: 2, VETERINARIO: 3, ATENDENTE: 4 };
    const navigateTo = (screenName) => {
        window.dispatchEvent(new CustomEvent('navigate', { detail: screenName }));
    };

    // --- FUNÇÃO HELPER PARA PEGAR O CARRINHO DO LOCALSTORAGE ---
    const getCartFromStorage = (userId) => {
        if (!userId) return [];
        try {
            const savedCart = localStorage.getItem(`cart_${userId}`);
            return savedCart ? JSON.parse(savedCart) : [];
        } catch (e) {
            console.error("Erro ao ler carrinho do localStorage:", e);
            return [];
        }
    };

    function App() {
        const [currentScreen, setCurrentScreen] = useState('home');
        const [isLoggedIn, setIsLoggedIn] = useState(false);
        const [userData, setUserData] = useState(null);
        const [servicoParaAgendar, setServicoParaAgendar] = useState(null);
        const [agendamentoParaReagendar, setAgendamentoParaReagendar] = useState(null);

        // --- ESTADO DO CARRINHO AGORA VIVE AQUI ---
        const [carrinho, _setCarrinho] = useState([]); // Renomeado para _setCarrinho

        // --- WRAPPER PARA ATUALIZAR ESTADO E LOCALSTORAGE ---
        const setCarrinho = (novoCarrinho) => {
            // Se o novoCarrinho for uma função (como em setCarrinho(prev => ...)),
            // precisamos executá-la para obter o valor final.
            const valorFinal = typeof novoCarrinho === 'function'
                ? novoCarrinho(carrinho)
                : novoCarrinho;

            _setCarrinho(valorFinal);

            // Só salva no localStorage se o usuário estiver logado
            if (userData && userData.id) {
                try {
                    localStorage.setItem(`cart_${userData.id}`, JSON.stringify(valorFinal));
                } catch (e) {
                    console.error("Erro ao salvar carrinho no localStorage:", e);
                }
            }
        };


        useEffect(() => {
            const urlParams = new URLSearchParams(window.location.search);
            const token = urlParams.get('token');
            if (token && currentScreen !== 'reset-password') {
                navigateTo('reset-password');
                return;
            }

            const authToken = localStorage.getItem('token');
            const savedUserData = localStorage.getItem('userData');
            if (authToken && savedUserData && !isLoggedIn) {
                try {
                    const parsedUser = JSON.parse(savedUserData);
                    setIsLoggedIn(true);
                    setUserData(parsedUser);

                    // --- CARREGA O CARRINHO SALVO NO LOGIN ---
                    if (parsedUser.id) {
                        _setCarrinho(getCartFromStorage(parsedUser.id));
                    }

                    const targetHomeScreen = (parsedUser?.cargo_id || parsedUser?.cargo) ? 'homeFuncionario' : 'home';

                    if (currentScreen === 'home') {
                        setCurrentScreen(targetHomeScreen);
                    }
                } catch (e) {
                    console.error("Limpando dados de usuário inválidos:", e);
                    localStorage.removeItem('token');
                    localStorage.removeItem('userData');
                    setIsLoggedIn(false);
                    setUserData(null);
                    _setCarrinho([]); // Limpa o carrinho
                }
            }

            const handleNavigate = (event) => {
                setCurrentScreen(prevScreen => {
                    if (event.detail !== prevScreen) {
                        console.log(`Navegando de ${prevScreen} para ${event.detail}`);
                        return event.detail;
                    }
                    return prevScreen;
                });
            };
            window.addEventListener('navigate', handleNavigate);

            return () => {
                window.removeEventListener('navigate', handleNavigate);
            };
        }, []); // Dependência 'carrinho' removida para evitar re-render desnecessário

        const navigateToHome = (user = userData, forced = false) => {
            const targetScreen = (user?.cargo_id || user?.cargo) ? 'homeFuncionario' : 'home';
            navigateTo(targetScreen);
        };

        const navigateToDashboard = () => {
            if (!isLoggedIn) {
                navigateTo('login');
            } else {
                const cargoId = userData?.cargo_id;
                const cargoString = userData?.cargo?.toLowerCase();
                let targetScreen = 'dashboard';

                if (cargoId === CARGO.GESTOR || cargoString === 'gestor' || cargoString === 'administrador') {
                    targetScreen = 'dashboard-gestor';
                } else if (cargoId === CARGO.VETERINARIO || cargoString === 'veterinário' || cargoString === 'veterinario') {
                    targetScreen = 'dashboard-funcionario';
                } else if (cargoId || cargoString) {
                    targetScreen = 'dashboard-funcionario';
                }
                navigateTo(targetScreen);
            }
        };

        const handleLogin = (data) => {
            setIsLoggedIn(true);
            setUserData(data);
            // --- CARREGA O CARRINHO DO USUÁRIO QUE ACABOU DE LOGAR ---
            if (data.id) {
                _setCarrinho(getCartFromStorage(data.id));
            }
            navigateToHome(data);
        };

        const handleLogout = () => {
            // Não limpa o carrinho do localStorage, apenas do estado
            localStorage.removeItem('token');
            localStorage.removeItem('userData');
            setIsLoggedIn(false);
            setUserData(null);
            setServicoParaAgendar(null);
            setAgendamentoParaReagendar(null);
            _setCarrinho([]); // Limpa o carrinho do estado
            navigateToHome(null, true);
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
            // A função agora só navega, pois o carrinho já está no App.js
            navigateTo('checkout');
        };

        const renderScreen = () => {
            if (isLoggedIn && (currentScreen === 'login' || currentScreen === 'signup')) {
                navigateToHome();
                return null;
            }

            const cargoId = userData?.cargo_id;
            const cargoString = userData?.cargo?.toLowerCase();
            const isFuncionarioLogado = !!(cargoId || cargoString);
            const isClienteLogado = isLoggedIn && !isFuncionarioLogado;

            // Definições de permissões
            const isGestor = cargoId === CARGO.GESTOR || cargoString === 'gestor' || cargoString === 'administrador';
            const isVeterinario = cargoId === CARGO.VETERINARIO || cargoString === 'veterinário' || cargoString === 'veterinario';
            const isGestorOuVeterinario = isGestor || isVeterinario;

            // Telas que só gestores podem acessar
            const telasGestor = ['visualizarServicos', 'cadastro-funcionario-completo',
                                'listar-funcionarios', 'cadastrarProduto',
                                'visualizar-produtos-gestor', 'funcionario-cadastro-admin',
                                'gerenciar-agendamentos', 'config-empresa'];

            // Telas que gestores E veterinários podem acessar
            const telasGestorVeterinario = ['visualizar-pets', 'dashboard-gestor'];

            // Telas de funcionário (todos os funcionários)
            const telasFuncionario = ['homeFuncionario', 'dashboard-funcionario', 'dashboard-gestor',
                                    'visualizarClientes', 'registrar-venda',
                                    'visualizar-produtos-funcionario'];

            // Verificações de permissão
            if (isClienteLogado && telasFuncionario.includes(currentScreen)) {
                navigateToHome(null, true);
                return null;
            }

            if (isFuncionarioLogado) {
                // Telas exclusivas para gestores
                if (!isGestor && telasGestor.includes(currentScreen)) {
                    navigateToHome(userData, true);
                    return null;
                }

                // Telas para gestores e veterinários
                if (!isGestorOuVeterinario && telasGestorVeterinario.includes(currentScreen)) {
                    navigateToHome(userData, true);
                    return null;
                }
            }

            const telasCliente = ['dashboard', 'meu-perfil', 'agendar-servico',
                                'checkout', 'visualizar-produtos-cliente',
                                'pet-cadastro', 'meus-pets', 'visualizar-servicos-cliente'];

            if (isFuncionarioLogado && telasCliente.includes(currentScreen)) {
                navigateToHome(userData, true);
                return null;
            }

            switch (currentScreen) {
                case 'login':
                    return <LoginScreen
                        onLogin={handleLogin}
                        onNavigateToSignup={() => navigateTo('signup')}
                        onNavigateToForgotPassword={() => navigateTo('forgot-password')}
                        setUserData={setUserData}
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
                        onBack={() => navigateTo('meus-pets')}
                    />;

                case 'meus-pets':
                    return <MeusPetsScreen
                        onNavigateToPetCadastro={() => navigateTo('pet-cadastro')}
                        onNavigateToHome={() => navigateToHome(userData)}
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
                        onNavigateToDashboard={navigateToDashboard}
                        onNavigateToVisualizarClientes={() => navigateTo("visualizarClientes")}
                        onNavigateToVisualizarServicos={() => navigateTo('visualizarServicos')}
                        onNavigateToCadastrarProduto={() => navigateTo('cadastrarProduto')}
                        onNavigateToCadastroFuncionarioCompleto={() => navigateTo('cadastro-funcionario-completo')}
                        onNavigateToGerenciarFuncionarios={() => navigateTo('listar-funcionarios')}
                        onNavigateToVisualizarPets={() => navigateTo('visualizar-pets')}
                        onNavigateToRegistrarVenda={() => navigateTo('registrar-venda')}
                        onNavigateToGerenciarAgendamentos={() => navigateTo('gerenciar-agendamentos')}
                        onNavigateToVisualizarProdutos={() => {
                            if (isGestor) {
                                navigateTo('visualizar-produtos-gestor');
                            } else {
                                navigateTo('visualizar-produtos-funcionario');
                            }
                        }}
                        onLogout={handleLogout}
                    />;

                case 'fluxo-caixa-report':
                    return <FluxoCaixaReport onBack={() => navigateToHome(userData)} />;

                case 'checkout':
                    return <Checkout
                        carrinho={carrinho} // Passa o carrinho do App.js
                        setCarrinho={setCarrinho} // Passa o setter
                        onBack={() => navigateTo('visualizar-produtos-cliente')}
                    />;

                case 'registrar-venda':
                    return <RegistrarVenda onBack={() => navigateToHome(userData)} />;

                case 'visualizar-produtos-gestor':
                    return <VisualizarProdutosGestor onBack={() => navigateToHome(userData)} />;

                case 'visualizar-produtos-funcionario':
                    return <VisualizarProdutosFuncionario onBack={() => navigateToHome(userData)} />;

                case 'visualizar-produtos-cliente':
                    return (
                        <VisualizarProdutosCliente
                            onBack={() => navigateToHome(userData)}
                            onNavigateToCheckout={handleNavigateToCheckout}
                            // --- NOVAS PROPS PARA O CARRINHO E AUTENTICAÇÃO ---
                            carrinho={carrinho}
                            setCarrinho={setCarrinho}
                            isLoggedIn={isLoggedIn}
                            onNavigateToLogin={() => navigateTo('login')}
                        />
                    );

                case 'visualizarClientes':
                    return <VisualizarClientes userData={userData} onBack={() => navigateToHome(userData)}/>;

                case 'visualizar-pets':
                    return <VisualizarPets onBack={() => navigateToHome(userData)} />;

                case 'visualizarServicos':
                    if (!isGestor) {
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

                case 'cadastro-funcionario-completo':
                    return <CadastroFuncionarioCompleto onNavigateToHome={() => navigateToHome(userData)} />;

                case 'listar-funcionarios':
                    return <GerenciarFuncionarios onNavigateToHome={() => navigateToHome(userData)} />;

                case 'cadastrarProduto':
                    return <CadastrarProdutoScreen onNavigateToHome={() => navigateToHome(userData)} />;

                case 'agendar-servico':
                    return <AgendarServicoScreen
                        onBack={() => navigateToHome(userData)}
                        onNavigateToAgendamento={(servico) => {
                            setServicoParaAgendar(servico);
                            setAgendamentoParaReagendar(null);
                            navigateTo('selecionar-horario');
                        }}
                    />;

                case 'selecionar-horario':
                    const modoReagendamento = Boolean(agendamentoParaReagendar);
                    const isReagendamentoGestor = modoReagendamento && isGestor;

                    return isReagendamentoGestor ? (
                        <ReagendamentoGestorScreen
                            agendamentoParaReagendar={agendamentoParaReagendar}
                            onBack={() => navigateTo('gerenciar-agendamentos')}
                            onAgendamentoSuccess={() => {
                                setAgendamentoParaReagendar(null);
                                navigateTo('gerenciar-agendamentos');
                            }}
                        />
                    ) : (
                        <SelecionarHorarioScreen
                            servico={servicoParaAgendar}
                            agendamentoParaReagendar={agendamentoParaReagendar}
                            onBack={() => modoReagendamento ? navigateToDashboard() : navigateTo('agendar-servico')}
                            onAgendamentoSuccess={() => {
                                setServicoParaAgendar(null);
                                setAgendamentoParaReagendar(null);
                                navigateToDashboard();
                            }}
                        />
                    );

                case 'gerenciar-agendamentos':
                    return <GerenciarAgendamentosGestor
                        userData={userData}
                        onNavigateToHome={() => navigateToHome(userData)}
                        onIniciarReagendamento={iniciarReagendamento}
                    />;

                case 'config-empresa':
                    return <ConfigEmpresaScreen onBack={() => navigateToHome(userData)} />;

                case 'home':
                default:
                    return <HomePage
                        onNavigateToLogin={() => navigateTo('login')}
                        onNavigateToSignup={() => navigateTo('signup')}
                        onNavigateToProdutos={() => navigateTo('visualizar-produtos-cliente')}
                        onNavigateToServicos={() => navigateTo('visualizar-servicos-cliente')}
                        isLoggedIn={isLoggedIn}
                        userData={userData}
                        onLogout={handleLogout}
                        onNavigateToDashboard={navigateToDashboard}
                        onNavigateToAgendamento={iniciarNovoAgendamento}
                    />;
            }
        };

        return (
            <div className="App">
                <AppHeader
                    isLoggedIn={isLoggedIn}
                    userData={userData}
                    onLogout={handleLogout}
                    onNavigateToLogin={() => navigateTo('login')}
                    onNavigateToSignup={() => navigateTo('signup')}
                    onNavigateToDashboard={navigateToDashboard}
                    onNavigateToPetCadastro={() => navigateTo('pet-cadastro')}
                    onNavigateToMeusPets={() => navigateTo('meus-pets')}
                    onNavigateToMeuPerfil={() => navigateTo('meu-perfil')}
                    onNavigateToHome={() => navigateToHome(userData)}
                    onNavigateToServicosCliente={() => navigateTo('visualizar-servicos-cliente')}
                    onNavigateToProdutos={(tipo) => {
                        if (!isLoggedIn || !userData?.cargo) navigateTo('visualizar-produtos-cliente');
                        else if (['gestor', 'administrador'].includes(userData.cargo.toLowerCase())) navigateTo('visualizar-produtos-gestor');
                        else navigateTo('visualizar-produtos-funcionario');
                    }}
                    onNavigateToAgendarServico={iniciarNovoAgendamento}
                    onNavigateToCheckout={() => navigateTo('checkout')}
                />
                <main>
                    {renderScreen()}
                </main>
            </div>
        );
    }

    export default App;