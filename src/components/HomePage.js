import React from 'react';

function HomePage({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard }) {
    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
    };

    const services = [
        { icon: '👨‍⚕️', title: "Consultas Veterinárias", description: "Atendimento especializado para cuidar da saúde do seu pet." },
        { icon: '✂️', title: "Banho e Tosa", description: "Serviços de higiene e estética para manter seu pet limpo." },
        { icon: '💉', title: "Vacinação", description: "Programa completo de vacinação para proteger seu pet." },
        { icon: '🛍️', title: "Pet Shop", description: "Produtos de qualidade: ração, brinquedos e acessórios." }
    ];

    const features = [
        { icon: '👥', title: "Equipe Especializada", description: "Veterinários e profissionais qualificados para o melhor atendimento." },
        { icon: '❤️', title: "Cuidado com Amor", description: "Tratamos cada pet com carinho e dedicação, como se fosse nosso." },
        { icon: '📅', title: "Agendamento Fácil", description: "Sistema online para agendar consultas e serviços com praticidade." }
    ];

    return (
        <>
            <section className="hero">
                <div className="container">
                    <h1 className="animate-fade-in-up">
                        {isLoggedIn ? `Bem-vindo, ${userData?.nome ? userData.nome.split(' ')[0] : 'Usuário'}!` : "PetLife"}
                    </h1>
                    <p className="animate-fade-in-up">
                        {isLoggedIn ?
                        "Continue aproveitando os melhores cuidados para seu pet!" :
                        "O melhor cuidado para seu pet está aqui. Oferecemos serviços completos de saúde, higiene e bem-estar para seu companheiro de quatro patas."}
                    </p>
                    <div className="hero-buttons">
                        <button className="btn btn-outline-white hover-lift" onClick={() => handlePlaceholderClick('Agendamento')}>📅 Agendar Serviço</button>
                        <button className="btn btn-outline-white hover-lift" onClick={() => handlePlaceholderClick('Produtos')}>🛒 Ver Produtos</button>
                        {isLoggedIn && <button className="btn btn-outline-white hover-lift" onClick={onNavigateToDashboard}>📊 Meu Dashboard</button>}
                    </div>
                </div>
            </section>

            <section className="section">
                <div className="container">
                    <div className="text-center" style={{marginBottom: '3rem'}}>
                        <h2 className="section-title">Nossos Serviços</h2>
                        <p className="section-description">Oferecemos uma gama completa de serviços para garantir a saúde, higiene e felicidade do seu pet.</p>
                    </div>
                    <div className="services-grid">
                        {services.map((service, index) =>
                            <div key={index} className="service-card hover-lift animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                <div className="icon">{service.icon}</div>
                                <h3>{service.title}</h3>
                                <p>{service.description}</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <section className="section" style={{backgroundColor: '#FFFFFF'}}>
                <div className="container" style={{maxWidth: '800px'}}>
                    <div className="text-center" style={{marginBottom: '3rem'}}>
                         <h2 className="section-title">Por que escolher o PetLife?</h2>
                    </div>
                    {}
                    <div className="features-list">
                        {features.map((feature, index) => (
                            <div key={index} className="feature">
                                <span className="feature-icon">{feature.icon}</span>
                                <div className="feature-content">
                                    <h3>{feature.title}</h3>
                                    <p>{feature.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <h2>Pronto para cuidar do seu pet?</h2>
                    <p>Cadastre-se agora e tenha acesso a todos os nossos serviços e produtos.</p>
                    <div className="cta-buttons">
                        <button className="btn btn-secondary btn-lg hover-lift" onClick={onNavigateToSignup}>Cadastrar-se</button>
                        <button className="btn btn-outline-white btn-lg hover-lift" onClick={() => handlePlaceholderClick('Conhecer Serviços')}>Conhecer Serviços</button>
                    </div>
                </div>
            </section>
        </>
    );
}

export default HomePage;