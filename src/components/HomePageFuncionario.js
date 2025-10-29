import React from 'react';

function HomePageFuncionario({
    userData,
    onNavigateToVisualizarClientes,
    onNavigateToCadastrarProduto,
    // onNavigateToFuncionarioCadastroAdmin, // Removido para padronizar com o primeiro arquivo
    onNavigateToCadastroFuncionarioCompleto,
    onNavigateToGerenciarFuncionarios,
    onNavigateToVisualizarProdutos,
    onNavigateToVisualizarServicos,
    onNavigateToVisualizarPets,
    onNavigateToRegistrarVenda, // Prop mantida do segundo arquivo
    onLogout,
    // Novas props adicionadas do primeiro arquivo
    onNavigateToDashboard,
    onNavigateToGerenciarAgendamentos
}) {

    // Lógica de permissão robusta (do primeiro arquivo)
    const cargoLower = userData?.cargo?.toLowerCase();
    const cargoId = userData?.cargo_id;
    const isGestorOuAdmin = cargoId === 1 || cargoLower === 'gestor' || cargoLower === 'administrador';

    // Lista de serviços unificada
    const services = [
        {
            icon: '📊',
            title: "Meu Painel",
            description: "Visualize seu painel pessoal de atividades.",
            onClick: onNavigateToDashboard
        },
        {
            icon: '👥',
            title: "Visualizar Clientes",
            description: "Gerencie e visualize todos os clientes cadastrados no sistema.",
            onClick: onNavigateToVisualizarClientes
        },
        // Mantido do segundo arquivo
        {
            icon: '🛒',
            title: "Registrar Venda",
            description: "Registre uma nova venda de produtos ou serviços.",
            onClick: onNavigateToRegistrarVenda
        },
        ...(isGestorOuAdmin ? [{
            icon: '🛠',
            title: "Gerenciar Serviços",
            description: "Adicione, edite ou remova os serviços oferecidos.",
            onClick: onNavigateToVisualizarServicos
        }] : []),
        ...(isGestorOuAdmin ? [{
            icon: '👨‍💼',
            title: "Cadastrar Funcionário",
            description: "Adicione novos funcionários ao sistema.",
            onClick: onNavigateToCadastroFuncionarioCompleto
        }] : []),
        ...(isGestorOuAdmin ? [{
            icon: '👥',
            title: "Gerenciar Funcionários",
            description: "Visualize e gerencie todos os funcionários.",
            onClick: onNavigateToGerenciarFuncionarios
        }] : []),
        ...(isGestorOuAdmin ? [{
            icon: '🐾',
            title: "Gerenciar Pets",
            description: "Visualize e edite as informações de todos os pets.",
            onClick: onNavigateToVisualizarPets
        }] : []),
        {
            icon: '🛒',
            title: isGestorOuAdmin ? "Gerenciar Produtos" : "Consultar Produtos",
            description: isGestorOuAdmin
                ? "Cadastre e edite produtos do sistema."
                : "Consulte disponibilidade e preços de produtos.",
            onClick: onNavigateToVisualizarProdutos
        },
        // Adicionado do primeiro arquivo (substitui o 'alert' do segundo)
        {
            icon: '📅',
            title: "Gerenciar Agendamentos",
            description: "Visualize, cancele ou reagende os próximos serviços.",
            onClick: onNavigateToGerenciarAgendamentos
        }
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
                            : 'Gerencie os clientes e mantenha tudo organizado na PetLife.'}
                    </p>

                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarClientes}>
                            👥 Visualizar Clientes
                        </button>

                        {/* Botões padronizados (lógica do primeiro arquivo) */}
                        {isGestorOuAdmin && (
                            <button className="btn btn-outline-white hover-lift" onClick={onNavigateToCadastroFuncionarioCompleto}>
                                ➕ Cadastrar Funcionário
                            </button>
                        )}
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
                    <div className="services-grid">
                        {services.map((service, index) =>
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
                        )}
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