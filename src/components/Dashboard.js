import React from 'react';

function Dashboard({ userData, onLogout, onNavigateToHome }) {
    return (
        <div>
            <header className="header">
                <nav className="nav">
                    <a href="#" className="nav-brand" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>
                        <div className="icon">🐾</div>
                        PetLife
                    </a>
                    <ul className="nav-menu">
                        <li><a href="#" className="nav-link" onClick={(e) => { e.preventDefault(); onNavigateToHome(); }}>Início</a></li>
                        <li><a href="#" className="nav-link">Dashboard</a></li>
                        <li><a href="#" className="nav-link">Agendamentos</a></li>
                        <li><a href="#" className="nav-link">Pets</a></li>
                        <li><a href="#" className="nav-link">Perfil</a></li>
                    </ul>
                    <div className="nav-buttons">
                        {userData && <span className="user-welcome" style={{ marginRight: '1rem', color: '#4a9b8e', fontWeight: '500' }}>{`Olá, ${userData.nome ? userData.nome.split(' ')[0] : 'Usuário'}`}</span>}
                        <button className="btn-sair" onClick={onLogout}>Sair</button>
                    </div>
                </nav>
            </header>
            <main className="main-content">
                <div className="text-center">
                    <h1>Bem-vindo ao Dashboard!</h1>
                    <p>Área logada em desenvolvimento...</p>
                    {userData && (
                        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f9f7', borderRadius: '8px', maxWidth: '400px', margin: '2rem auto' }}>
                            <h3>Seus dados:</h3>
                            <p>{`Nome: ${userData.nome}`}</p>
                            <p>{`Email: ${userData.email}`}</p>
                            {userData.telefone && <p>{`Telefone: ${userData.telefone}`}</p>}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default Dashboard;