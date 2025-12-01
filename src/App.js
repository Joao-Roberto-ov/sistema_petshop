import React, { useEffect, useState } from 'react';
import './App.css';
import AppHeader from './components/BaseTemplate/AppHeader';
import HomePage from './components/BaseTemplate/HomePage';
import LoginScreen from './components/BaseTemplate/LoginScreen';
import SignupScreen from './components/BaseTemplate/SignupScreen';
import ForgotPasswordScreen from './components/BaseTemplate/ForgotPasswordScreen';
import ResetPasswordScreen from './components/BaseTemplate/ResetPasswordScreen';
import Dashboard from './components/Dashboards/Dashboard';
import ReagendamentoGestorScreen from './components/Agendamentos/ReagendamentoGestorScreen';
import DashboardFuncionario from './components/Dashboards/DashboardFuncionario';
import DashboardGestor from './components/Dashboards/DashboardGestor';
import GerenciarAgendamentosGestor from './components/Agendamentos/GerenciarAgendamentosGestor';
import HomePageFuncionario from './components/BaseTemplate/HomePageFuncionario';
import VisualizarClientes from "./components/Usuarios/VisualizarClientes";
import VisualizarServicos from "./components/Servicos/VisualizarServicos";
import PetCadastroScreen from './components/Pets/PetCadastroScreen';
import MeusPetsScreen from './components/Pets/MeusPetsScreen';
import MeuPerfilScreen from './components/BaseTemplate/MeuPerfilScreen';
import FuncionarioCadastroAdminScreen from './components/Usuarios/FuncionarioCadastroAdminScreen';
import CadastroFuncionarioCompleto from './components/Usuarios/CadastroFuncionarioCompleto';
import GerenciarFuncionarios from './components/Usuarios/GerenciarFuncionarios';
import CadastrarProdutoScreen from './components/Produtos/CadastrarProduto';
import VisualizarProdutosGestor from './components/Produtos/VisualizarProdutosGestor';
import VisualizarProdutosFuncionario from './components/Produtos/VisualizarProdutosFuncionario';
import VisualizarProdutosCliente from './components/Produtos/VisualizarProdutosCliente';
import VisualizarPets from './components/Pets/VisualizarPets';
import VisualizarPetsGestor from './components/Pets/VisualizarPetsGestor';
import RegistrarVenda from './components/Vendas/RegistrarVenda';
import VisualizarServicosCliente from './components/Servicos/VisualizarServicosCliente';
import AgendarServicoScreen from './components/Agendamentos/AgendarServicoScreen';
import SelecionarHorarioScreen from './components/Agendamentos/SelecionarHorarioScreen';
import Checkout from './components/Vendas/Checkout';
import FluxoCaixaReport from './components/Vendas/FluxoCaixaReport';
import ConfigEmpresaScreen from './components/ConfigSistema/ConfigEmpresaScreen';
import AtualizarEstoque from './components/Produtos/AtualizarEstoque';
import DashboardAtendente from './components/Dashboards/DashboardAtendente';
import GerenciarVendasPendentes from './components/Vendas/GerenciarVendasPendentes';
import ConfirmacaoAgendamento from "./components/Agendamentos/ConfirmacaoAgendamento";
import NotificacoesScreen from "./components/Notificacoes/NotificacoesScreen";

// --- Importação das Novas Telas do Prontuário (AC1) ---
import SelecaoPetProntuario from './components/Prontuario/SelecaoPetProntuario';
import ProntuarioPet from './components/Prontuario/ProntuarioPet';

const CARGO = { GESTOR: 1, FUNCIONARIO: 2, VETERINARIO: 3, ATENDENTE: 4 };
const navigateTo = (screenName) => {
    window.dispatchEvent(new CustomEvent('navigate', { detail: screenName }));
};

//funçao helper para pegar o carrinho do localstorage
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

    // Novo Estado para a seleção de pet no prontuário
    const [petProntuarioSelecionado, setPetProntuarioSelecionado] = useState(null);

    //estado do carrinho
    const [carrinho, _setCarrinho] = useState([]);

    //wrapper para atualizar o estado e o localstorage
    const setCarrinho = (novoCarrinho) => {

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

        const path = window.location.pathname;

        if (path.includes('/confirmacao-agendamento')) {
            setCurrentScreen('confirmacao-agendamento');
            return;
        }

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
                _setCarrinho([]);
            }
        }

        const handleNavigate = (event) => {
            setCurrentScreen(prevScreen => {
                if (event.detail !== prevScreen) {
                    return event.detail;
                }
                return prevScreen;
            });
        };
        window.addEventListener('navigate', handleNavigate);

        return () => {
            window.removeEventListener('navigate', handleNavigate);
        };
    }, []);

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
            } else if (cargoId === CARGO.ATENDENTE || cargoString === 'atendente') {
                targetScreen = 'dashboard-atendente';
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
        if (data.id) {
            _setCarrinho(getCartFromStorage(data.id));
        }
        navigateToHome(data);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        setServicoParaAgendar(null);
        setAgendamentoParaReagendar(null);
        setPetProntuarioSelecionado(null); // Limpa seleção
        _setCarrinho([]);
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
        navigateTo('checkout');
    };

    const renderScreen = () => {
        // Verificação de autenticação para telas protegidas
        const protectedScreens = [
            'dashboard', 'dashboard-funcionario', 'dashboard-gestor', 'dashboard-atendente',
            'meu-perfil', 'pet-cadastro', 'meus-pets', 'visualizar-produtos-cliente',
            'homeFuncionario', 'visualizarClientes', 'visualizarServicos', 'visualizar-pets',
            'funcionario-cadastro-admin', 'cadastro-funcionario-completo', 'listar-funcionarios',
            'cadastrarProduto', 'visualizar-produtos-gestor', 'visualizar-produtos-funcionario',
            'registrar-venda', 'agendar-servico', 'selecionar-horario', 'checkout',
            'gerenciar-agendamentos', 'fluxo-caixa-report', 'config-empresa', 'atualizar-estoque',
            'gerenciar-vendas-pendentes', 'notificacoes', 'prontuario-selecao', 'prontuario-detalhe'
        ];

        if (protectedScreens.includes(currentScreen) && !isLoggedIn) {
            navigateTo('login');
            return null;
        }

        const cargoId = userData?.cargo_id;
        const cargoString = userData?.cargo?.toLowerCase();
        const isFuncionarioLogado = !!(cargoId || cargoString);
        const isClienteLogado = isLoggedIn && !isFuncionarioLogado;

        // Definições de permissões
        const isGestor = cargoId === CARGO.GESTOR || cargoString === 'gestor' || cargoString === 'administrador';
        const isVeterinario = cargoId === CARGO.VETERINARIO || cargoString === 'veterinário' || cargoString === 'veterinario';
        const isAtendente = cargoId === CARGO.ATENDENTE || cargoString === 'atendente';

        const isGestorOuVeterinario = isGestor || isVeterinario;
        const podeVerCaixa = isGestor || isAtendente;

        // Telas que só gestores podem acessar
        const telasGestor = ['visualizarServicos', 'cadastro-funcionario-completo',
                            'listar-funcionarios', 'cadastrarProduto',
                            'visualizar-produtos-gestor', 'funcionario-cadastro-admin',
                            'gerenciar-agendamentos', 'config-empresa', 'atualizar-estoque'];

        // Telas que gestores E veterinários podem acessar
        const telasGestorVeterinario = ['visualizar-pets', 'dashboard-gestor'];

        // Telas que gestores E veterinários E atendentes podem acessar (dependendo da lógica)
        // Prontuário normalmente é Gestor e Veterinário
        if ((currentScreen === 'prontuario-selecao' || currentScreen === 'prontuario-detalhe') && !isGestorOuVeterinario) {
             navigateToHome(userData, true);
             return null;
        }

        // Telas de funcionário (todos os funcionários)
        const telasFuncionario = ['homeFuncionario', 'dashboard-funcionario', 'dashboard-gestor',
                                'visualizarClientes', 'registrar-venda',
                                'visualizar-produtos-funcionario', 'dashboard-atendente',
                                'gerenciar-vendas-pendentes', 'notificacoes', 'prontuario-selecao', 'prontuario-detalhe'];

        if (isClienteLogado && telasFuncionario.includes(currentScreen)) {
            navigateToHome(null, true);
            return null;
        }

        if (isFuncionarioLogado) {
            if (!isGestor && telasGestor.includes(currentScreen)) {
                navigateToHome(userData, true);
                return null;
            }
            if (!isGestorOuVeterinario && telasGestorVeterinario.includes(currentScreen)) {
                navigateToHome(userData, true);
                return null;
            }
            if (!podeVerCaixa && currentScreen === 'gerenciar-vendas-pendentes') {
                navigateToHome(userData, true);
                return null;
            }
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

            case 'notificacoes':
                return <NotificacoesScreen
                    onBack={() => navigateToHome(userData)} />;

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

            case 'dashboard-atendente':
                return <DashboardAtendente
                    userData={userData}
                    onLogout={handleLogout}
                    onNavigateToHome={() => navigateToHome(userData, true)}
                />;

            case 'gerenciar-vendas-pendentes':
                return <GerenciarVendasPendentes
                    onBack={navigateToDashboard}
                />;

            case 'confirmacao-agendamento':
                return <ConfirmacaoAgendamento />;

            // --- NOVAS ROTAS DE PRONTUÁRIO ---
            case 'prontuario-selecao':
                return <SelecaoPetProntuario
                    onBack={() => navigateToHome(userData)}
                    onPetSelected={(pet) => {
                        setPetProntuarioSelecionado(pet);
                        navigateTo('prontuario-detalhe');
                    }}
                />;

            case 'prontuario-detalhe':
                if (!petProntuarioSelecionado) {
                    navigateTo('prontuario-selecao');
                    return null;
                }
                return <ProntuarioPet
                    pet={petProntuarioSelecionado}
                    onBack={() => navigateTo('prontuario-selecao')}
                />;
            // ----------------------------------

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
                    onNavigateToGerenciarVendasPendentes={podeVerCaixa ? () => navigateTo('gerenciar-vendas-pendentes') : null}
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
                    carrinho={carrinho}
                    setCarrinho={setCarrinho}
                    onBack={() => navigateTo('visualizar-produtos-cliente')}
                />;

            case 'registrar-venda':
                return <RegistrarVenda onBack={() => navigateToHome(userData)} />;

            case 'visualizar-produtos-gestor':
                return <VisualizarProdutosGestor onBack={() => navigateToHome(userData)}
                    onNavigateToAtualizarEstoque={() => navigateTo('atualizar-estoque')}
                />;

            case 'atualizar-estoque':
                return <AtualizarEstoque
                    onBack={() => navigateTo('visualizar-produtos-gestor')}
                />;

            case 'visualizar-produtos-funcionario':
                return <VisualizarProdutosFuncionario onBack={() => navigateToHome(userData)} />;

            case 'visualizar-produtos-cliente':
                return (
                    <VisualizarProdutosCliente
                        onBack={() => navigateToHome(userData)}
                        onNavigateToCheckout={handleNavigateToCheckout}
                        carrinho={carrinho}
                        setCarrinho={setCarrinho}
                        isLoggedIn={isLoggedIn}
                        onNavigateToLogin={() => navigateTo('login')}
                    />
                );

            case 'visualizarClientes':
                return <VisualizarClientes userData={userData} onBack={() => navigateToHome(userData)}/>;

            case 'visualizar-pets':
                return <VisualizarPetsGestor onBack={() => navigateToHome(userData)} />;

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