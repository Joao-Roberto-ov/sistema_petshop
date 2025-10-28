import React from 'react';
function HomePage({
    onNavigateToLogin,
    onNavigateToSignup,
    onNavigateToProdutos,
    isLoggedIn,
    userData,
    onLogout,
    onNavigateToDashboard,
    onNavigateToAgendamento // <-- Adicionada aqui
}) {
    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
    };

    const services = [
        { icon: '🩺', title: "Consultas Veterinárias", description: "Atendimento especializado para cuidar da saúde do seu pet." },
        { icon: '🛁', title: "Banho e Tosa", description: "Serviços de higiene e estética para manter seu pet limpo e cheiroso." },
        { icon: '💉', title: "Vacinação Completa", description: "Programa de imunização para proteger seu companheiro de doenças." },
        { icon: '🛍️', title: "Pet Shop & Farmácia", description: "Produtos de qualidade: ração, brinquedos, acessórios e medicamentos." }
    ];

    const differentials = [
        { icon: '🏆', title: "Qualidade Superior", description: "Equipamentos de ponta e profissionais qualificados para garantir o melhor para seu pet." },
        { icon: '❤️', title: "Cuidado com Amor", description: "Tratamos cada pet com o carinho e a dedicação que ele merece, como se fosse nosso." },
        { icon: '📅', title: "Conveniência Total", description: "Agende serviços, acompanhe históricos e gerencie tudo online, de forma fácil e rápida." }
    ];

    const testimonials = [
        { name: "Ana P.", pet: "Toby, Golden Retriever", text: "O atendimento na PetLife é incrível! O Dr. Ricardo foi super atencioso com o Toby e o banho ficou impecável. Recomendo de olhos fechos!" },
        { name: "Carlos S.", pet: "Mimi, Gata SRD", text: "Levei a Mimi para vacinar e a equipe foi muito paciente e carinhosa. O sistema de agendamento online facilitou muito minha vida." },
        { name: "Juliana M.", pet: "Fred, Bulldog Francês", text: "A melhor pet shop da cidade! Encontro tudo que preciso para o Fred, e a equipe está sempre pronta para ajudar com as melhores indicações." }
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
                        <button
                            className="btn btn-outline-white hover-lift"
                            onClick={isLoggedIn && !userData?.cargo ? onNavigateToAgendamento : onNavigateToLogin} // Chama onNavigateToAgendamento se for cliente logado, senão login
                        >
                            📅 Agendar Serviço
                        </button>
                        <button className="btn btn-outline-white hover-lift" onClick={onNavigateToProdutos}>🛒 Ver Produtos</button>
                        {isLoggedIn && !userData?.cargo && /*mostra dashboard apenas para cliente logado na home do cliente */
                           <button className="btn btn-outline-white hover-lift" onClick={onNavigateToDashboard}>📊 Meu Dashboard</button>}
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

            <section className="section bg-light">
                <div className="container text-center">
                    <h2 className="section-title">Por que escolher a PetLife?</h2>
                    <p className="section-description">Entendemos que seu pet é parte da família. Por isso, nosso compromisso vai além do serviço.</p>
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

            <section className="section">
                <div className="container text-center">
                    <h2 className="section-title">O que nossos clientes dizem</h2>
                    <p className="section-description">A confiança de quem já conhece nosso trabalho é nossa maior recompensa.</p>
                    <div className="testimonials-grid">
                        {testimonials.map((testimonial, index) => (
                            <div key={index} className="testimonial-card animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                                <p className="testimonial-text">"{testimonial.text}"</p>
                                <div className="testimonial-author">
                                    <strong>{testimonial.name}</strong>
                                    <span>, tutor(a) de {testimonial.pet}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="cta">
                <div className="container">
                    <h2>Pronto para cuidar do seu pet?</h2>
                    <p>Explore nossos serviços e descubra como podemos ajudar seu companheiro.</p>
                    <div className="cta-buttons">
                        <button className="btn btn-outline-white btn-lg hover-lift" onClick={() => handlePlaceholderClick('Conhecer Serviços')}>Conhecer Serviços</button>
                    </div>
                </div>
            </section>
        </>
    );
}
export default HomePage;