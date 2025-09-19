import React from 'react';

function Dashboard({ userData, onLogout, onNavigateToHome }) {
    return (
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
    );
}

export default Dashboard;
