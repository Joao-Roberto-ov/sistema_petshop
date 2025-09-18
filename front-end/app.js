const { useState, useEffect } = React;

// Configuração do Axios
const API_BASE = 'http://localhost:8000';
axios.defaults.baseURL = API_BASE;

// Função para extrair o primeiro nome de uma string de nome completo.
function getFirstName(fullName) {
    if (!fullName) {
        return 'Usuário';
    }
    const parts = fullName.trim().split(' ');
    return parts[0];
}

// **NOVO Componente de Header Centralizado**
function AppHeader({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard, onNavigateToHome }) {
    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
    };

    return (
        React.createElement('header', { className: "app-header" },
            React.createElement('nav', { className: "app-nav container" },
                // Brand e logo
                React.createElement('a', {
                    href: "#",
                    className: "nav-brand",
                    onClick: (e) => { e.preventDefault(); onNavigateToHome(); }
                },
                    React.createElement('div', { className: "icon" }, '🐾'),
                    "PetLife"
                ),
                
                // Menu de navegação (visível apenas para telas maiores)
                React.createElement('ul', { className: "nav-menu" },
                    React.createElement('li', null,
                        React.createElement('a', { href: "#", className: "nav-link", onClick: (e) => { e.preventDefault(); onNavigateToHome(); } }, "Início")
                    ),
                    React.createElement('li', null,
                        React.createElement('a', {
                            href: "#",
                            className: "nav-link",
                            onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Agendamento'); }
                        }, "Agendamento")
                    ),
                    React.createElement('li', null,
                        React.createElement('a', {
                            href: "#",
                            className: "nav-link",
                            onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Produtos'); }
                        }, "Produtos")
                    ),
                    // Menu adicional quando usuário está logado
                    isLoggedIn && React.createElement(React.Fragment, null,
                        React.createElement('li', null,
                            React.createElement('a', {
                                href: "#",
                                className: "nav-link",
                                onClick: (e) => { e.preventDefault(); onNavigateToDashboard(); }
                            }, "Dashboard")
                        ),
                        React.createElement('li', null,
                            React.createElement('a', {
                                href: "#",
                                className: "nav-link",
                                onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Agendamentos'); }
                            }, "Agendamentos")
                        )
                    )
                ),
                
                // Botões de ação (login/signup ou perfil/logout)
                React.createElement('div', { className: "nav-buttons" },
                    isLoggedIn ? (
                        React.createElement(React.Fragment, null,
                            React.createElement('span', {
                                className: "user-welcome"
                            }, `Olá, ${getFirstName(userData?.nome)}`),
                            React.createElement('button', {
                                className: "btn btn-outline",
                                onClick: onLogout
                            }, "Sair")
                        )
                    ) : (
                        React.createElement(React.Fragment, null,
                            React.createElement('a', {
                                href: "#",
                                className: "btn btn-secondary",
                                onClick: (e) => { e.preventDefault(); onNavigateToLogin(); }
                            }, "Entrar"),
                            React.createElement('button', {
                                className: "btn btn-primary",
                                onClick: onNavigateToSignup
                            }, "Cadastrar")
                        )
                    )
                )
            )
        )
    );
}

// Componente da página inicial
function HomePage({ onNavigateToLogin, onNavigateToSignup, isLoggedIn, userData, onLogout, onNavigateToDashboard }) {
    const handlePlaceholderClick = (feature) => {
        alert(`A funcionalidade "${feature}" será implementada em breve!`);
    };

    const services = [
        {
            icon: '👨‍⚕️',
            title: "Consultas Veterinárias",
            description: "Atendimento especializado com veterinários experientes para cuidar da saúde do seu pet."
        },
        {
            icon: '✂️',
            title: "Banho e Tosa",
            description: "Serviços de higiene e estética para manter seu pet sempre limpo e bonito."
        },
        {
            icon: '💉',
            title: "Vacinação",
            description: "Programa completo de vacinação para proteger seu pet contra doenças."
        },
        {
            icon: '🛍️',
            title: "Pet Shop",
            description: "Produtos de qualidade: ração, brinquedos, acessórios e muito mais."
        }
    ];

    return (
        React.createElement('div', { className: "min-h-screen", style: { backgroundColor: '#F9FAFB' } },
            // Header atualizado com menu completo quando logado
            React.createElement('header', { className: "header" },
                React.createElement('nav', { className: "nav container" },
                    React.createElement('a', { 
                        href: "#", 
                        className: "nav-brand",
                        onClick: (e) => { e.preventDefault(); window.location.reload(); }
                    },
                        React.createElement('div', { className: "icon" }, '🐾'),
                        "PetLife"
                    ),
                    
                    React.createElement('ul', { className: "nav-menu" },
                        React.createElement('li', null,
                            React.createElement('a', { href: "#", className: "nav-link" }, "Início")
                        ),
                        React.createElement('li', null,
                            React.createElement('a', { 
                                href: "#", 
                                className: "nav-link",
                                onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Agendamento'); }
                            }, "Agendamento")
                        ),
                        React.createElement('li', null,
                            React.createElement('a', { 
                                href: "#", 
                                className: "nav-link",
                                onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Produtos'); }
                            }, "Produtos")
                        ),
                        // Menu adicional quando usuário está logado
                        isLoggedIn && React.createElement(React.Fragment, null,
                            React.createElement('li', null,
                                React.createElement('a', { 
                                    href: "#", 
                                    className: "nav-link",
                                    onClick: (e) => { e.preventDefault(); onNavigateToDashboard(); }
                                }, "Dashboard")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { 
                                    href: "#", 
                                    className: "nav-link",
                                    onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Agendamentos'); }
                                }, "Agendamentos")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { 
                                    href: "#", 
                                    className: "nav-link",
                                    onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Pets'); }
                                }, "Pets")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { 
                                    href: "#", 
                                    className: "nav-link",
                                    onClick: (e) => { e.preventDefault(); handlePlaceholderClick('Perfil'); }
                                }, "Perfil")
                            )
                        )
                    ),
                    
                                React.createElement('div', { className: "nav-buttons" },
                isLoggedIn ? (
                    React.createElement(React.Fragment, null,
                        React.createElement('span', { 
                            className: "user-welcome",
                            style: { 
                                marginRight: '1rem', 
                                color: '#4a9b8e',
                                fontWeight: '500'
                            }
                        }, `Olá, ${userData?.nome ? userData.nome.split(' ')[0] : 'Usuário'}`),
                        React.createElement('button', { 
                            className: "btn-sair", 
                            onClick: onLogout 
                        }, "Sair")
                    )
                ) : (
                    React.createElement(React.Fragment, null,
                        React.createElement('button', { 
                            className: "btn-entrar",
                            onClick: (e) => { e.preventDefault(); onNavigateToLogin(); }
                        }, "Entrar"),
                        React.createElement('button', { 
                            className: "btn-cadastrar",
                            onClick: onNavigateToSignup
                        }, "Cadastrar")
                    )
                )
            )
                )
            ),

            // Hero Section
            React.createElement('section', { className: "hero" },
                React.createElement('div', { className: "container" },
                React.createElement('h1', { className: "animate-fade-in-up" },
                    isLoggedIn ? `Bem-vindo, ${userData?.nome ? userData.nome.split(' ')[0] : 'Usuário'}!` : "PetLife"
                ),
                    React.createElement('p', { className: "animate-fade-in-up" },
                        isLoggedIn ? 
                        "Continue aproveitando os melhores cuidados para seu pet!" :
                        "O melhor cuidado para seu pet está aqui. Oferecemos serviços completos " +
                        "de saúde, higiene e bem-estar para seu companheiro de quatro patas."
                    ),
                    React.createElement('div', { className: "hero-buttons" },
                        React.createElement('button', {
                            className: "btn btn-outline-white hover-lift",
                            onClick: () => handlePlaceholderClick('Agendamento')
                        },
                            "📅 Agendar Serviço"
                        ),
                        React.createElement('button', {
                            className: "btn btn-outline-white hover-lift",
                            onClick: () => handlePlaceholderClick('Produtos')
                        },
                            "🛒 Ver Produtos"
                        ),
                        isLoggedIn && React.createElement('button', {
                            className: "btn btn-outline-white hover-lift",
                            onClick: () => onNavigateToDashboard()
                        },
                            "📊 Meu Dashboard"
                        )
                    )
                )
            ),

            // Services Section (permanece igual)
            React.createElement('section', { className: "section" },
                React.createElement('div', { className: "container" },
                    React.createElement('div', { className: "text-center mb-12" },
                        React.createElement('h2', { className: "section-title" },
                            "Nossos Serviços"
                        ),
                        React.createElement('p', { className: "section-description" },
                            "Oferecemos uma gama completa de serviços para garantir a saúde, " +
                            "higiene e felicidade do seu pet."
                        )
                    ),
                    
                    React.createElement('div', { className: "grid grid-cols-1 grid-md-2 grid-lg-4 gap-6" },
                        services.map((service, index) =>
                            React.createElement('div', { 
                                key: index,
                                className: "card text-center hover-lift animate-fade-in-up",
                                style: { animationDelay: `${index * 0.1}s` }
                            },
                                React.createElement('div', { className: "card-header" },
                                    React.createElement('div', { className: "flex justify-center mb-4" },
                                        React.createElement('div', { 
                                            className: "service-icon",
                                            style: { fontSize: '3rem' }
                                        }, service.icon)
                                    ),
                                    React.createElement('h3', { className: "card-title" }, service.title)
                                ),
                                React.createElement('div', { className: "card-content" },
                                    React.createElement('p', { className: "card-description" }, service.description)
                                )
                            )
                        )
                    )
                )
            ),

            // About Section (permanece igual)
            React.createElement('section', { className: "section bg-white" },
                React.createElement('div', { className: "container" },
                    React.createElement('div', { 
                        className: "grid grid-cols-1 grid-lg-2 gap-12",
                        style: { alignItems: 'center' }
                    },
                        React.createElement('div', null,
                            React.createElement('h2', { 
                                className: "section-title",
                                style: { textAlign: 'left', marginBottom: '1.5rem' }
                            },
                                "Por que escolher o PetLife?"
                            ),
                            React.createElement('div', { 
                                style: { display: 'flex', flexDirection: 'column', gap: '1rem' }
                            },
                                React.createElement('div', { className: "feature" },
                                    React.createElement('span', { className: "feature-icon", style: { color: '#3B82F6' } }, '👥'),
                                    React.createElement('div', { className: "feature-content" },
                                        React.createElement('h3', null, "Equipe Especializada"),
                                        React.createElement('p', null, 
                                            "Veterinários e profissionais qualificados para o melhor atendimento.")
                                    )
                                ),
                                React.createElement('div', { className: "feature" },
                                    React.createElement('span', { className: "feature-icon", style: { color: '#EF4444' } }, '❤️'),
                                    React.createElement('div', { className: "feature-content" },
                                        React.createElement('h3', null, "Cuidado com Amor"),
                                        React.createElement('p', null, 
                                            "Tratamos cada pet com carinho e dedicação, como se fosse nosso.")
                                    )
                                ),
                                React.createElement('div', { className: "feature" },
                                    React.createElement('span', { className: "feature-icon", style: { color: '#10B981' } }, '📅'),
                                    React.createElement('div', { className: "feature-content" },
                                        React.createElement('h3', null, "Agendamento Fácil"),
                                        React.createElement('p', null, 
                                            "Sistema online para agendar consultas e serviços com praticidade.")
                                    )
                                )
                            )
                        ),
                        // React.createElement('div', { className: "image-placeholder" },
                        //     React.createElement('p', null, "Imagem do petshop")
                        // )
                    )
                )
            ),

            // CTA Section atualizada
            React.createElement('section', { className: "cta" },
                React.createElement('div', { className: "container" },
                    isLoggedIn ? (
                        React.createElement(React.Fragment, null,
                        React.createElement('h2', null,
                            `Continue cuidando do seu pet, ${userData?.nome ? userData.nome.split(' ')[0] : 'Usuário'}!`
                        ),
                            React.createElement('p', null,
                                "Aproveite todos os recursos exclusivos disponíveis para você."
                            ),
                            React.createElement('div', { className: "cta-buttons" },
                                React.createElement('button', {
                                    className: "btn btn-secondary btn-lg hover-lift",
                                    onClick: () => onNavigateToDashboard()
                                }, "Acessar Dashboard"),
                                React.createElement('button', {
                                    className: "btn btn-outline-white btn-lg hover-lift",
                                    onClick: () => handlePlaceholderClick('Agendar Novo Serviço')
                                }, "Novo Agendamento")
                            )
                        )
                    ) : (
                        React.createElement(React.Fragment, null,
                            React.createElement('h2', null,
                                "Pronto para cuidar do seu pet?"
                            ),
                            React.createElement('p', null,
                                "Cadastre-se agora e tenha acesso a todos os nossos serviços e produtos."
                            ),
                            React.createElement('div', { className: "cta-buttons" },
                                React.createElement('button', {
                                    className: "btn btn-secondary btn-lg hover-lift",
                                    onClick: onNavigateToSignup
                                }, "Cadastrar-se"),
                                React.createElement('button', {
                                    className: "btn btn-outline-white btn-lg hover-lift",
                                    onClick: () => handlePlaceholderClick('Conhecer Serviços')
                                }, "Conhecer Serviços")
                            )
                        )
                    )
                )
            )
        )
    );
}


// Componente de Login
function LoginScreen({ onLogin, onNavigateToSignup, onNavigateToHome, setUserData }) {
    const [formData, setFormData] = useState({ email: '', senha: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await axios.post('/login', formData);
            localStorage.setItem('token', response.data.access_token);
            
            // Criar objeto com dados do usuário baseado no que temos
            const userData = {
                nome: formData.email.split('@')[0], // Nome baseado no email
                email: formData.email
            };
            
            localStorage.setItem('userData', JSON.stringify(userData));
            setUserData(userData);
            onLogin(userData); // Passar dados do usuário para o onLogin
            
        } catch (err) {
            console.log('Erro login:', err.response);
            
            if (err.response?.status === 422) {
                const validationErrors = err.response.data;
                
                if (Array.isArray(validationErrors)) {
                    const errorMessages = validationErrors.map(error => {
                        return error.msg || 'Erro de validação';
                    }).join(', ');
                    setError(errorMessages);
                } else if (validationErrors && typeof validationErrors === 'object') {
                    setError(validationErrors.detail || 'Erro de validação');
                } else if (typeof validationErrors === 'string') {
                    setError(validationErrors);
                } else {
                    setError('Erro de validação nos dados');
                }
            } else {
                setError(err.response?.data?.detail || 'Erro ao fazer login');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        React.createElement('div', { className: "login-container" },
            React.createElement('div', { className: "login-card" },
                React.createElement('div', { className: "login-header" },
                    React.createElement('h1', null, "PetLife"),
                    React.createElement('p', null, "Entre na sua conta para continuar")
                ),

                error && React.createElement('div', { className: "error-message" }, error),
                
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" },
                            "E-mail ",
                            React.createElement('span', { className: "required" }, "*")
                        ),
                        React.createElement('input', {
                            type: "email",
                            className: "form-input",
                            placeholder: "seu@email.com",
                            value: formData.email,
                            onChange: (e) => setFormData({...formData, email: e.target.value}),
                            required: true
                        })
                    ),

                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" },
                            "Senha ",
                            React.createElement('span', { className: "required" }, "*")
                        ),
                        React.createElement('input', {
                            type: "password",
                            className: "form-input",
                            placeholder: "Sua senha",
                            value: formData.senha,
                            onChange: (e) => setFormData({...formData, senha: e.target.value}),
                            required: true
                        })
                    ),

                    React.createElement('button', { 
                        type: "submit", 
                        className: "btn-submit", 
                        disabled: loading 
                    }, loading ? 'Entrando...' : 'Entrar')
                ),

                React.createElement('div', { className: "forgot-password" },
                    React.createElement('a', { href: "#" }, "Esqueceu a senha?")
                ),

                React.createElement('div', { className: "login-footer" },
                    "Não tem uma conta? ",
                    React.createElement('a', { 
                        href: "#", 
                        onClick: (e) => { e.preventDefault(); onNavigateToSignup(); }
                    }, "Cadastre-se")
                )
            )
        )
    );
}

// Componente de Cadastro
function SignupScreen({ onSignup, onNavigateToLogin, setUserData }) {
    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        cpf: '',
        endereco: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setSuccess('');

        try {
            const dadosParaEnviar = {
                nome: formData.nome.trim(),
                email: formData.email.trim(),
                senha: formData.senha,
                telefone: formData.telefone.trim(),
                cpf: formData.cpf.trim() === '' ? null : formData.cpf.replace(/\D/g, ''),
                endereco: formData.endereco.trim() === '' ? null : formData.endereco.trim()
            };

            const response = await axios.post('/signup', dadosParaEnviar);
            
            // Salvar dados do usuário com o nome REAL
            const userDataToSave = {
                nome: formData.nome.trim(), // Aqui está o nome real do usuário
                email: formData.email.trim(),
                telefone: formData.telefone.trim()
            };
            
            localStorage.setItem('userData', JSON.stringify(userDataToSave));
            setUserData(userDataToSave);
            
            setSuccess('Conta criada com sucesso! Faça login para continuar.');
            setTimeout(() => onNavigateToLogin(), 2000);
        } catch (err) {
            // ... (tratamento de erro)
        } finally {
            setLoading(false);
        }
    };

    const handleCpfChange = (e) => {
        const value = e.target.value;
        const apenasNumeros = value.replace(/\D/g, '').slice(0, 11);
        setFormData({...formData, cpf: apenasNumeros});
    };

    const formatCpf = (cpf) => {
        if (!cpf) return '';
        return cpf
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
    };

    return (
        React.createElement('div', { className: "login-container" },
            React.createElement('div', { className: "login-card" },
                React.createElement('div', { className: "login-header" },
                    React.createElement('h1', null, "PetLife"),
                    React.createElement('p', null, "Crie sua conta para começar")
                ),

                error && React.createElement('div', { className: "error-message" }, error),
                success && React.createElement('div', { className: "success-message" }, success),
                
                React.createElement('form', { onSubmit: handleSubmit },
                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" }, "Nome completo *"),
                        React.createElement('input', {
                            type: "text",
                            className: "form-input",
                            value: formData.nome,
                            onChange: (e) => setFormData({...formData, nome: e.target.value}),
                            required: true,
                            minLength: "2"
                        })
                    ),

                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" }, "Email *"),
                        React.createElement('input', {
                            type: "email",
                            className: "form-input",
                            value: formData.email,
                            onChange: (e) => setFormData({...formData, email: e.target.value}),
                            required: true
                        })
                    ),

                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" }, "Senha *"),
                        React.createElement('input', {
                            type: "password",
                            className: "form-input",
                            value: formData.senha,
                            onChange: (e) => setFormData({...formData, senha: e.target.value}),
                            required: true,
                            minLength: "6"
                        })
                    ),

                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" }, "Telefone *"),
                        React.createElement('input', {
                            type: "tel",
                            className: "form-input",
                            value: formData.telefone,
                            onChange: (e) => setFormData({...formData, telefone: e.target.value}),
                            required: true
                        })
                    ),

                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" }, "CPF (opcional)"),
                        React.createElement('input', {
                            type: "text",
                            className: "form-input",
                            value: formatCpf(formData.cpf),
                            onChange: handleCpfChange,
                            placeholder: "000.000.000-00",
                            maxLength: "14"
                        }),
                        React.createElement('small', { className: "form-help" }, "Deixe em branco se não quiser informar")
                    ),

                    React.createElement('div', { className: "form-group" },
                        React.createElement('label', { className: "form-label" }, "Endereço (opcional)"),
                        React.createElement('input', {
                            type: "text",
                            className: "form-input",
                            value: formData.endereco,
                            onChange: (e) => setFormData({...formData, endereco: e.target.value}),
                            placeholder: "Rua, número, bairro, cidade"
                        })
                    ),

                    React.createElement('button', { 
                        type: "submit", 
                        className: "btn-submit", 
                        disabled: loading 
                    }, loading ? 'Criando conta...' : 'Criar conta')
                ),

                React.createElement('div', { className: "login-footer" },
                    "Já tem uma conta? ",
                    React.createElement('a', { 
                        href: "#", 
                        onClick: (e) => { e.preventDefault(); onNavigateToLogin(); }
                    }, "Entrar")
                )
            )
        )
    );
}

// Componente principal da aplicação
function App() {
    const [currentScreen, setCurrentScreen] = useState('home');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userData, setUserData] = useState(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const savedUserData = localStorage.getItem('userData');
        
        if (token && savedUserData) {
            setIsLoggedIn(true);
            setUserData(JSON.parse(savedUserData));
            setCurrentScreen('home'); // Mudamos para home em vez de dashboard
        }
    }, []);

    const handleLogin = (userData) => {
        setIsLoggedIn(true);
        setUserData(userData);
        setCurrentScreen('home');
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        setIsLoggedIn(false);
        setUserData(null);
        setCurrentScreen('home');
    };

    const handleNavigateToDashboard = () => {
        setCurrentScreen('dashboard');
    };

    // Dashboard (área logada) - atualizado
    function Dashboard({ userData, onLogout, onNavigateToHome }) {
        return (
            React.createElement('div', null,
                React.createElement('header', { className: "header" },
                    React.createElement('nav', { className: "nav" },
                        React.createElement('a', { 
                            href: "#", 
                            className: "nav-brand",
                            onClick: (e) => { e.preventDefault(); onNavigateToHome(); }
                        },
                            React.createElement('div', { className: "icon" }, '🐾'),
                            "PetLife"
                        ),
                        
                        React.createElement('ul', { className: "nav-menu" },
                            React.createElement('li', null,
                                React.createElement('a', { 
                                    href: "#", 
                                    className: "nav-link",
                                    onClick: (e) => { e.preventDefault(); onNavigateToHome(); }
                                }, "Início")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { href: "#", className: "nav-link" }, "Dashboard")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { href: "#", className: "nav-link" }, "Agendamentos")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { href: "#", className: "nav-link" }, "Pets")
                            ),
                            React.createElement('li', null,
                                React.createElement('a', { href: "#", className: "nav-link" }, "Perfil")
                            )
                        ),
                        
                        React.createElement('div', { className: "nav-buttons" },
                        userData && React.createElement('span', { 
                            className: "user-welcome",
                            style: { 
                                marginRight: '1rem', 
                                color: '#4a9b8e',
                                fontWeight: '500'
                            }
                        }, `Olá, ${userData.nome ? userData.nome.split(' ')[0] : 'Usuário'}`),
                            React.createElement('button', { 
                                className: "btn-sair", 
                                onClick: onLogout 
                            }, "Sair")
                        )
                    )
                ),

                React.createElement('main', { className: "main-content" },
                    React.createElement('div', { className: "text-center" },
                        React.createElement('h1', null, "Bem-vindo ao Dashboard!"),
                        React.createElement('p', null, "Área logada em desenvolvimento..."),
                        userData && React.createElement('div', { 
                            style: { 
                                marginTop: '2rem',
                                padding: '1rem',
                                background: '#f0f9f7',
                                borderRadius: '8px',
                                maxWidth: '400px',
                                margin: '2rem auto'
                            }
                        },
                            React.createElement('h3', null, "Seus dados:"),
                            React.createElement('p', null, `Nome: ${userData.nome}`),
                            React.createElement('p', null, `Email: ${userData.email}`),
                            userData.telefone && React.createElement('p', null, `Telefone: ${userData.telefone}`)
                        )
                    )
                )
            )
        );
    }

    // Renderização condicional
if (currentScreen === 'home') {
    return React.createElement(HomePage, { 
        onNavigateToLogin: () => setCurrentScreen('login'),
        onNavigateToSignup: () => setCurrentScreen('signup'),
        onNavigateToDashboard: handleNavigateToDashboard,
        isLoggedIn: isLoggedIn,
        userData: userData, // Agora passando userData corretamente
        onLogout: handleLogout
    });
}

    if (currentScreen === 'login') {
        return React.createElement(LoginScreen, { 
            onLogin: handleLogin,
            onNavigateToSignup: () => setCurrentScreen('signup'),
            onNavigateToHome: () => setCurrentScreen('home'),
            setUserData: setUserData
        });
    }

    if (currentScreen === 'signup') {
        return React.createElement(SignupScreen, { 
            onSignup: handleLogin,
            onNavigateToLogin: () => setCurrentScreen('login'),
            setUserData: setUserData
        });
    }

    if (currentScreen === 'dashboard') {
        return React.createElement(Dashboard, { 
            userData: userData,
            onLogout: handleLogout,
            onNavigateToHome: () => setCurrentScreen('home')
        });
    }

    return null;
}

// Renderiza a aplicação
const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);
root.render(React.createElement(App));