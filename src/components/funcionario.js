// JavaScript para o sistema de cadastro de funcionários

// Configurações da API
const API_BASE_URL = '/api/funcionarios';

// Elementos do DOM
let form, alertContainer, modalListaFuncionarios;

// Inicialização
document.addEventListener('DOMContentLoaded', function() {
    form = document.getElementById('formCadastroFuncionario');
    alertContainer = document.getElementById('alertContainer');
    modalListaFuncionarios = new bootstrap.Modal(document.getElementById('modalListaFuncionarios'));
    
    inicializarEventListeners();
    aplicarMascaras();
});

// Event Listeners
function inicializarEventListeners() {
    // Submit do formulário
    form.addEventListener('submit', handleSubmitForm);
    
    // Mudança no select de dias de trabalho
    document.getElementById('diasTrabalho').addEventListener('change', handleDiasTrabalhoChange);
    
    // Validação em tempo real
    const inputs = form.querySelectorAll('input, select');
    inputs.forEach(input => {
        input.addEventListener('blur', () => validarCampo(input));
        input.addEventListener('input', () => removerClasseInvalida(input));
    });
    
    // Checkboxes de dias personalizados
    const checkboxesDias = document.querySelectorAll('#diasPersonalizados input[type="checkbox"]');
    checkboxesDias.forEach(checkbox => {
        checkbox.addEventListener('change', atualizarDiasPersonalizados);
    });
}

// Aplicar máscaras nos campos
function aplicarMascaras() {
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    
    // Máscara para CPF
    cpfInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d)/, '$1.$2');
        value = value.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        e.target.value = value;
    });
    
    // Máscara para telefone
    telefoneInput.addEventListener('input', function(e) {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length <= 10) {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            value = value.replace(/(\d{2})(\d)/, '($1) $2');
            value = value.replace(/(\d{5})(\d)/, '$1-$2');
        }
        e.target.value = value;
    });
}

// Manipular mudança nos dias de trabalho
function handleDiasTrabalhoChange(e) {
    const diasPersonalizados = document.getElementById('diasPersonalizados');
    if (e.target.value === 'Personalizado') {
        diasPersonalizados.style.display = 'block';
        diasPersonalizados.classList.add('fade-in');
    } else {
        diasPersonalizados.style.display = 'none';
    }
}

// Atualizar dias personalizados
function atualizarDiasPersonalizados() {
    const checkboxes = document.querySelectorAll('#diasPersonalizados input[type="checkbox"]:checked');
    const diasSelecionados = Array.from(checkboxes).map(cb => cb.value);
    
    if (diasSelecionados.length > 0) {
        document.getElementById('diasTrabalho').value = diasSelecionados.join(', ');
    }
}

// Validar campo individual
function validarCampo(input) {
    const value = input.value.trim();
    let isValid = true;
    let mensagem = '';
    
    // Validações específicas por campo
    switch (input.name) {
        case 'nome_completo':
            isValid = value.length >= 2;
            mensagem = 'Nome completo deve ter pelo menos 2 caracteres.';
            break;
            
        case 'cargo_funcao':
            isValid = value.length >= 2;
            mensagem = 'Cargo/função deve ter pelo menos 2 caracteres.';
            break;
            
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            isValid = emailRegex.test(value);
            mensagem = 'Email deve ter um formato válido.';
            break;
            
        case 'telefone':
            const telefoneNumeros = value.replace(/\D/g, '');
            isValid = telefoneNumeros.length >= 10 && telefoneNumeros.length <= 11;
            mensagem = 'Telefone deve ter 10 ou 11 dígitos.';
            break;
            
        case 'cpf':
            if (value) {
                const cpfNumeros = value.replace(/\D/g, '');
                isValid = cpfNumeros.length === 11;
                mensagem = 'CPF deve ter 11 dígitos.';
            }
            break;
            
        case 'horario_inicio':
        case 'horario_fim':
            isValid = value !== '';
            mensagem = 'Horário é obrigatório.';
            break;
            
        case 'dias_trabalho':
            isValid = value !== '';
            mensagem = 'Dias de trabalho são obrigatórios.';
            break;
    }
    
    // Aplicar classes de validação
    if (input.hasAttribute('required') && !value) {
        isValid = false;
        mensagem = 'Este campo é obrigatório.';
    }
    
    if (isValid) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
    } else {
        input.classList.remove('is-valid');
        input.classList.add('is-invalid');
        const feedback = input.nextElementSibling;
        if (feedback && feedback.classList.contains('invalid-feedback')) {
            feedback.textContent = mensagem;
        }
    }
    
    return isValid;
}

// Remover classe inválida durante digitação
function removerClasseInvalida(input) {
    if (input.classList.contains('is-invalid')) {
        input.classList.remove('is-invalid');
    }
}

// Manipular submit do formulário
async function handleSubmitForm(e) {
    e.preventDefault();
    
    // Validar todos os campos
    const inputs = form.querySelectorAll('input[required], select[required]');
    let formValido = true;
    
    inputs.forEach(input => {
        if (!validarCampo(input)) {
            formValido = false;
        }
    });
    
    // Validação especial para horários
    const horarioInicio = document.getElementById('horarioInicio').value;
    const horarioFim = document.getElementById('horarioFim').value;
    
    if (horarioInicio && horarioFim && horarioInicio >= horarioFim) {
        mostrarAlerta('Horário de fim deve ser posterior ao horário de início.', 'danger');
        formValido = false;
    }
    
    if (!formValido) {
        mostrarAlerta('Por favor, corrija os erros no formulário antes de continuar.', 'danger');
        return;
    }
    
    // Preparar dados
    const formData = new FormData(form);
    const dados = Object.fromEntries(formData.entries());
    
    // Ajustar checkbox
    dados.is_ativo = document.getElementById('isAtivo').checked;
    
    // Limpar CPF se vazio
    if (!dados.cpf || dados.cpf.replace(/\D/g, '').length !== 11) {
        delete dados.cpf;
    }
    
    try {
        await cadastrarFuncionario(dados);
    } catch (error) {
        console.error('Erro ao cadastrar funcionário:', error);
        mostrarAlerta('Erro inesperado ao cadastrar funcionário. Tente novamente.', 'danger');
    }
}

// Cadastrar funcionário via API
async function cadastrarFuncionario(dados) {
    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    
    // Mostrar loading
    submitBtn.innerHTML = '<span class="loading"></span> Cadastrando...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/cadastrar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + getAuthToken() // Implementar conforme sistema de auth
            },
            body: JSON.stringify(dados)
        });
        
        const resultado = await response.json();
        
        if (response.ok) {
            mostrarAlerta(
                `Funcionário ${resultado.nome_completo} cadastrado com sucesso!`, 
                'success'
            );
            limparFormulario();
        } else {
            throw new Error(resultado.detail || 'Erro ao cadastrar funcionário');
        }
        
    } catch (error) {
        if (error.message.includes('email')) {
            mostrarAlerta('Este email já está sendo usado por outro funcionário.', 'danger');
        } else if (error.message.includes('403')) {
            mostrarAlerta('Você não tem permissão para cadastrar funcionários.', 'danger');
        } else if (error.message.includes('401')) {
            mostrarAlerta('Sessão expirada. Faça login novamente.', 'warning');
        } else {
            mostrarAlerta(error.message, 'danger');
        }
    } finally {
        // Restaurar botão
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Listar funcionários
async function listarFuncionarios() {
    try {
        const response = await fetch(`${API_BASE_URL}/listar`, {
            headers: {
                'Authorization': 'Bearer ' + getAuthToken()
            }
        });
        
        if (response.ok) {
            const funcionarios = await response.json();
            exibirListaFuncionarios(funcionarios);
            modalListaFuncionarios.show();
        } else {
            throw new Error('Erro ao carregar lista de funcionários');
        }
        
    } catch (error) {
        mostrarAlerta(error.message, 'danger');
    }
}

// Exibir lista de funcionários no modal
function exibirListaFuncionarios(funcionarios) {
    const container = document.getElementById('listaFuncionarios');
    
    if (funcionarios.length === 0) {
        container.innerHTML = '<p class="text-center text-muted">Nenhum funcionário cadastrado.</p>';
        return;
    }
    
    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Nome</th>
                        <th>Cargo</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Horário</th>
                        <th>Status</th>
                        <th>Cadastro</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    funcionarios.forEach(funcionario => {
        const dataCadastro = new Date(funcionario.data_cadastro).toLocaleDateString('pt-BR');
        const statusBadge = funcionario.is_ativo 
            ? '<span class="badge bg-success">Ativo</span>'
            : '<span class="badge bg-secondary">Inativo</span>';
            
        html += `
            <tr>
                <td><strong>${funcionario.nome_completo}</strong></td>
                <td>${funcionario.cargo_funcao}</td>
                <td>${funcionario.email}</td>
                <td>${funcionario.telefone}</td>
                <td>${funcionario.horario_inicio} - ${funcionario.horario_fim}</td>
                <td>${statusBadge}</td>
                <td>${dataCadastro}</td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
    `;
    
    container.innerHTML = html;
}

// Mostrar alerta
function mostrarAlerta(mensagem, tipo = 'info') {
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${tipo} alert-dismissible fade show" role="alert">
            <i class="fas fa-${getIconeAlerta(tipo)}"></i> ${mensagem}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    alertContainer.innerHTML = alertHtml;
    
    // Auto-remover após 5 segundos
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
    
    // Scroll para o topo
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Obter ícone para alerta
function getIconeAlerta(tipo) {
    const icones = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icones[tipo] || 'info-circle';
}

// Limpar formulário
function limparFormulario() {
    form.reset();
    
    // Remover classes de validação
    const inputs = form.querySelectorAll('.is-valid, .is-invalid');
    inputs.forEach(input => {
        input.classList.remove('is-valid', 'is-invalid');
    });
    
    // Ocultar dias personalizados
    document.getElementById('diasPersonalizados').style.display = 'none';
    
    // Marcar funcionário como ativo por padrão
    document.getElementById('isAtivo').checked = true;
    
    // Focar no primeiro campo
    document.getElementById('nomeCompleto').focus();
}

// Obter token de autenticação (implementar conforme sistema)
function getAuthToken() {
    // Por enquanto, retorna um token fictício
    // Em produção, implementar conforme sistema de autenticação
    return 'token_ficticio_admin';
}

// Utilitários
function formatarTelefone(telefone) {
    const numeros = telefone.replace(/\D/g, '');
    if (numeros.length === 11) {
        return numeros.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (numeros.length === 10) {
        return numeros.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
}

function formatarCPF(cpf) {
    const numeros = cpf.replace(/\D/g, '');
    return numeros.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}
