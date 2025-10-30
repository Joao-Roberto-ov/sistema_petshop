import React from 'react';

function HomePageFuncionario({
    userData,
    onNavigateToVisualizarClientes,
    onNavigateToCadastrarProduto,
    onNavigateToCadastroFuncionarioCompleto,
    onNavigateToGerenciarFuncionarios,
    onNavigateToVisualizarProdutos,
    onNavigateToVisualizarServicos,
    onNavigateToVisualizarPets,
    onNavigateToRegistrarVenda,
    onLogout,
    onNavigateToDashboard,
    onNavigateToGerenciarAgendamentos
}) {

    const cargoLower = userData?.cargo?.toLowerCase();
    const cargoId = userData?.cargo_id;
    
    // Lógica corrigida para funcionar com cargo_id numérico E cargo string
    const isGestorOuAdmin = cargoId === 1 || 
                           cargoLower === 'gestor' || 
                           cargoLower === 'administrador' ||
                           cargoLower?.includes('gestor') ||
                           cargoLower?.includes('admin');
    
    const isVeterinario = cargoId === 3 || 
                         cargoLower === 'veterinario' || 
                         cargoLower === 'veterinário' ||
                         cargoLower?.includes('veterin');
    
    // Nova variável para verificar permissão de visualizar pets
    const podeVisualizarPets = isGestorOuAdmin || isVeterinario;

    // Debug - dentro da função
    console.log('Dados do usuário (CORRIGIDO):', {
        userData,
        cargoId: userData?.cargo_id,
        cargo: userData?.cargo,
        cargoLower: cargoLower,
        isGestorOuAdmin: isGestorOuAdmin,
        isVeterinario: isVeterinario,
        podeVisualizarPets: podeVisualizarPets
    });

    const services = [
        {
            icon: '📊',
            title: "Meu Dashboard",
            description: "Visualize seu painel pessoal de atividades.",
            onClick: onNavigateToDashboard
        },
        {
            icon: '👥',
            title: "Visualizar Clientes",
            description: "Gerencie e visualize todos os clientes cadastrados no sistema.",
            onClick: onNavigateToVisualizarClientes
        },
        {
            icon: '🛒',
            title: "Registrar Venda",
            description: "Registre uma nova venda de produtos ou serviços.",
            onClick: onNavigateToRegistrarVenda
        },
        // Itens que só aparecem para Gestor/Admin
        ...(isGestorOuAdmin ? [
            {
                icon: '🛠',
                title: "Gerenciar Serviços",
                description: "Adicione, edite ou remova os serviços oferecidos.",
                onClick: onNavigateToVisualizarServicos
            },
            {
                icon: '👨‍💼',
                title: "Cadastrar Funcionário",
                description: "Adicione novos funcionários ao sistema.",
                onClick: onNavigateToCadastroFuncionarioCompleto
            },
            {
                icon: '👥',
                title: "Gerenciar Funcionários",
                description: "Visualize e gerencie todos os funcionários.",
                onClick: onNavigateToGerenciarFuncionarios
            },
            {
                icon: '📅',
                title: "Gerenciar Agendamentos",
                description: "Visualize, cancele ou reagende os próximos serviços.",
                onClick: onNavigateToGerenciarAgendamentos
            }
        ] : []), // Fim do bloco condicional para Gestor/Admin
        
        // Item que aparece para Veterinário E Gestor
        ...(podeVisualizarPets ? [
            {
                icon: '🐾',
                title: "Visualizar Pets",
                description: "Visualize as informações de todos os pets cadastrados.",
                onClick: onNavigateToVisualizarPets
            }
        ] : []),
        
        // Item que aparece para todos os funcionários
        {
            icon: '🔍',
            title: isGestorOuAdmin ? "Gerenciar Produtos" : "Consultar Produtos",
            description: isGestorOuAdmin
                ? "Cadastre e edite produtos do sistema."
                : "Consulte disponibilidade e preços de produtos.",
            onClick: onNavigateToVisualizarProdutos
        },
    ];

    const differentials = [
        {
            icon: '🔒',
            title: "Segurança",
            description: "Sistema seguro com controle de acesso baseado em funções e cargos."
        },
        {
            icon: '⚡',
            title: "Eficiência",
            description: "Interface intuitiva para gerenciar clientes e funcionários de forma rápida."
        },
        {
            icon: '📱',
            title: "Acessibilidade",
            description: "Acesse o sistema de qualquer dispositivo, a qualquer hora."
        }
    ];

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">
                        Bem-vindo, {userData?.nome ? userData.nome.split(' ')[0] : 'Funcionário'}!
                    </h1>
                    <p className="animate-fade-in-up">
                        {isGestorOuAdmin
                            ? 'Gerencie clientes, funcionários e mantenha tudo organizado na PetLife.'
                            : isVeterinario
                            ? 'Acesse informações dos pets e gerencie seus atendimentos na PetLife.'
                            : 'Gerencie os clientes e mantenha tudo organizado na PetLife.'}
                    </p>

                    {/* Botões do Hero */}
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarClientes}>
                            👥 Visualizar Clientes
                        </button>
                        
                        {/* Botão Cadastrar Funcionário - apenas para gestores */}
                        {isGestorOuAdmin && (
                            <button className="btn btn-outline-white hover-lift" onClick={onNavigateToCadastroFuncionarioCompleto}>
                                ➕ Cadastrar Funcionário
                            </button>
                        )}
                        
                        {/* Botões de Produtos */}
                        {isGestorOuAdmin ? (
                            <>
                                <button className="btn btn-outline-white hover-lift" onClick={onNavigateToCadastrarProduto}>
                                    📦 Cadastrar Produto
                                </button>
                                <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarProdutos}>
                                    🛒 Gerenciar Produtos
                                </button>
                                <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarServicos}>
                                    🛠 Gerenciar Serviços
                                </button>
                            </>
                        ) : (
                            <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarProdutos}>
                                🛒 Consultar Produtos
                            </button>
                        )}
                        
                        {/* Botão Visualizar Pets para Veterinários e Gestores */}
                        {podeVisualizarPets && (
                            <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarPets}>
                                🐾 Visualizar Pets
                            </button>
                        )}
                        
                        <button className="btn btn-outline-white hover-lift" onClick={onLogout}>
                            🚪 Sair
                        </button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '3rem'}}>
                        <h2 className="section-title">Área Administrativa</h2>
                        <p className="section-description">
                            Acesse as ferramentas necessárias para gerenciar o sistema de forma eficiente.
                        </p>
                    </div>
                    
                    {/* Cards de Serviços */}
                    <div className="services-grid">
                        {services.map((service, index) => (
                            <div
                                key={index}
                                className="service-card hover-lift animate-fade-in-up"
                                style={{ animationDelay: `${index * 0.1}s`, cursor: 'pointer' }}
                                onClick={service.onClick}
                            >
                                <div className="icon">{service.icon}</div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="section bg-light">
                <div className="container text-center">
                    <h2 className="section-title">Por que usar o sistema PetLife?</h2>
                    <p className="section-description">
                        Um sistema completo e seguro para gerenciar seu negócio de forma profissional.
                    </p>
                    <div className="grid-3">
                        {differentials.map((item, index) => (
                            <div key={index} className="feature-card animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="feature-icon">{item.icon}</div>
                                <h3>{item.title}</h3>
                                <p>{item.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <h2>Pronto para gerenciar?</h2>
                    <p>Use as ferramentas acima para manter tudo organizado e eficiente.</p>
                    <div className="cta-buttons">
                        <button className="btn btn-outline-white btn-lg hover-lift" onClick={onNavigateToVisualizarClientes}>
                            Começar Agora
                        </button>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePageFuncionario;