import React from 'react';

function HomePageFuncionario({ userData, onNavigateToVisualizarClientes, onNavigateToCadastrarCliente, onLogout }) {

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">
                        Bem-vindo, {userData?.nome ? userData.nome.split(' ')[0] : 'Funcionário'}!
                    </h1>
                    <p className="animate-fade-in-up">
                        Gerencie os clientes e mantenha tudo organizado na PetLife.
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToVisualizarClientes}>
                            👥 Visualizar Clientes
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToCadastrarCliente}>
                            ✏️ Cadastrar Cliente
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onLogout}>
                            🚪 Sair
                        </button>
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '3rem'}}>
                        <h2 className="section-title">Bem-vindo à área administrativa</h2>
                        <p className="section-description">
                            Use os botões acima para gerenciar clientes de forma rápida e segura.
                        </p>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePageFuncionario;
