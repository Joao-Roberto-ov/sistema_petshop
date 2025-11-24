import React, { useState, useEffect, useRef } from 'react';
import axios from '../api/axios';

function getFirstName(fullName) {
    if (!fullName) return 'Usuário';
    return fullName.trim().split(' ')[0];
}

function AppHeader({
    onNavigateToLogin,
    onNavigateToSignup,
    isLoggedIn,
    userData,
    onLogout,
    onNavigateToDashboard,
    onNavigateToHome,
    onNavigateToPetCadastro,
    onNavigateToMeusPets,
    onNavigateToMeuPerfil,
    onNavigateToProdutos,
    onNavigateToServicosCliente
}) {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [estoqueBaixo, setEstoqueBaixo] = useState(false);
    const [itensCriticos, setItensCriticos] = useState([]);

    // ----------- CORREÇÃO IMPORTANTE: mover para cima -----------
    const cargoLower = userData?.cargo?.toLowerCase();
    const isAdmin = userData?.cargo === 'GESTOR' ||
                    userData?.cargo === 'ADMINISTRADOR' ||
                    cargoLower === 'gestor' ||
                    cargoLower === 'administrador';

    const isFuncionarioOuAdmin = userData?.cargo &&
        (userData.cargo === 'FUNCIONARIO' || userData.cargo === 'GESTOR');
    // ------------------------------------------------------------

    const nomeEmpresa = 'PetLife';
    const dropdownRef = useRef(null);

    const handleServicosClick = (e) => {
        e.preventDefault();
        if (onNavigateToServicosCliente) {
            onNavigateToServicosCliente();
        } else {
            console.warn("onNavigateToServicosCliente não foi fornecida ao AppHeader");
            alert('Erro: Função de navegação para serviços não definida.');
        }
    };

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    // ----------- ESTOQUE MÍNIMO (com isAdmin agora correto) -----------
    useEffect(() => {
        if (!isLoggedIn || !isAdmin) return;

        async function verificarEstoque() {
            try {
                const token = localStorage.getItem('token');

                const produtos = await axios.get('/produtos/listar', {
                    headers: { Authorization: `Bearer ${token}` }
                });

                const criticos = [];

                for (const p of produtos.data) {
                    try {
                        const resMin = await axios.get(`/admin/config/estoque-minimo/${p.id}`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                        const minimo = resMin.data.estoque_minimo;

                        if (p.estoque !== undefined && p.estoque <= minimo) {
                            criticos.push({
                                nome: p.nome,
                                estoque: p.estoque,
                                minimo
                            });
                        }
                    } catch (err) {
                        // Sem configuração → ignora
                    }
                }

                setItensCriticos(criticos);
                setEstoqueBaixo(criticos.length > 0);

            } catch (err) {
                console.error("Erro ao verificar estoque mínimo:", err);
            }
        }

        verificarEstoque();
    }, [isLoggedIn, isAdmin]);
    // ---------------------------------------------------------------

    const handleProdutosClick = (e) => {
        e.preventDefault();

        if (!isLoggedIn) {
            onNavigateToProdutos('cliente');
        } else if (userData?.cargo === 'GESTOR') {
            onNavigateToProdutos('gestor');
        } else if (userData?.cargo === 'FUNCIONARIO') {
            onNavigateToProdutos('funcionario');
        } else {
            onNavigateToProdutos('cliente');
        }
    };

    return (
        <header className="header">
            <nav className="nav container">
                <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                    <div className="icon">🐾</div>
                    {nomeEmpresa}
                </a>

                <ul className="nav-menu">
                    <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Início</a></li>

                    {isLoggedIn && !isFuncionarioOuAdmin && (
                        <>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToDashboard(); }}>Dashboard</a></li>
                            <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToMeusPets(); }}>Meus Pets</a></li>
                            <li><a href="#" className="nav-link" onClick={handleServicosClick}>Serviços</a></li>
                        </>
                    )}

                    {isLoggedIn && isFuncionarioOuAdmin && (
                        <>
                            <li>
                                <a
                                    href="#"
                                    className="nav-link"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        window.dispatchEvent(new CustomEvent('navigate', { detail: 'visualizarClientes' }));
                                    }}
                                >
                                    Clientes
                                </a>
                            </li>

                            {isAdmin && (
                                <>
                                    <li>
                                        <a
                                            href="#"
                                            className="nav-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'cadastro-funcionario-completo' }));
                                            }}
                                        >
                                            Cadastrar Funcionário
                                        </a>
                                    </li>

                                    <li>
                                        <a
                                            href="#"
                                            className="nav-link"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: 'listar-funcionarios' }));
                                            }}
                                        >
                                            Gerenciar Funcionários
                                        </a>
                                    </li>
                                </>
                            )}

                            <li><a href="#" className="nav-link" onClick={handleServicosClick}>Serviços</a></li>
                        </>
                    )}

                    <li>
                        <a
                            href="#"
                            className="nav-link"
                            onClick={handleProdutosClick}
                        >
                            Produtos
                        </a>
                    </li>

                    {!isLoggedIn && (
                        <li><a href="#" className="nav-link" onClick={handleServicosClick}>Serviços</a></li>
                    )}
                </ul>

                <div className="nav-buttons">
                    {isLoggedIn ? (
                        <div className="user-menu" ref={dropdownRef} style={{ position: 'relative' }}>
    <button className="user-menu-button" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
        {`Olá, ${getFirstName(userData?.nome)}`}
        {isFuncionarioOuAdmin && (
            <span style={{
                marginLeft: '0.5rem',
                fontSize: '0.75rem',
                padding: '0.2rem 0.5rem',
                backgroundColor: '#4a9b8e',
                borderRadius: '12px',
                color: 'white'
            }}>
                {userData.cargo}
            </span>
        )}
    </button>

                            <div className="nav-buttons">

                            {isAdmin && estoqueBaixo && (
                                <div
                                    onClick={() => alert(
                                        itensCriticos.map(i =>
                                            `${i.nome} — atual: ${i.estoque}, mínimo: ${i.minimo}`
                                        ).join("\n")
                                    )}
                                    style={{
                                        position: 'absolute',  // faz o badge flutuar
                                        top: '-5px',           // ajuste vertical
                                        right: '-5px',         // ajuste horizontal
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '50%',
                                        backgroundColor: '#e74c3c',
                                        color: 'white',
                                        fontSize: '0.75rem',
                                        fontWeight: 'bold',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        zIndex: 10
                                    }}
                                    title="Produtos com estoque baixo"
                                >
                                    {itensCriticos.length}
                                </div>
                            )}


                                {isDropdownOpen && (
                                    <ul className="dropdown-menu">
                                        {!isFuncionarioOuAdmin && (
                                            <>
                                                <li>
                                                    <a href="#" onClick={(e) => { e.preventDefault(); onNavigateToMeuPerfil(); setIsDropdownOpen(false); }}>
                                                        <span className="icon">👤</span> Meu Perfil
                                                    </a>
                                                </li>

                                                <li className="dropdown-divider"></li>
                                            </>
                                        )}

                                        {isFuncionarioOuAdmin && (
                                            <>
                                                <li>
                                                    <a href="#" onClick={(e) => {
                                                        e.preventDefault();
                                                        window.dispatchEvent(new CustomEvent('navigate', { detail: 'visualizarClientes' }));
                                                        setIsDropdownOpen(false);
                                                    }}>
                                                        <span className="icon">👤</span> Gerenciar Clientes
                                                    </a>
                                                </li>

                                                {isAdmin && (
                                                    <li>
                                                        <a href="#" onClick={(e) => {
                                                            e.preventDefault();
                                                            window.dispatchEvent(new CustomEvent('navigate', { detail: 'funcionario-cadastro-admin' }));
                                                            setIsDropdownOpen(false);
                                                        }}>
                                                            <span className="icon">➕</span> Cadastrar Funcionário
                                                        </a>
                                                    </li>
                                                )}

                                                <li className="dropdown-divider"></li>
                                            </>
                                        )}

                                        <li>
                                            <a href="#" onClick={(e) => { e.preventDefault(); onLogout(); setIsDropdownOpen(false); }}>
                                                <span className="icon">↪</span> Sair
                                            </a>
                                        </li>
                                    </ul>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <a href="#" className="btn-entrar" onClick={(e) => { e.preventDefault(); onNavigateToLogin(); }}>Entrar</a>
                            <a href="#" className="btn-cadastrar" onClick={(e) => { e.preventDefault(); onNavigateToSignup(); }}>Cadastrar</a>
                        </>
                    )}
                </div>
            </nav>
        </header>
    );
}

export default AppHeader;
